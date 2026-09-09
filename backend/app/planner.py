"""Planner Agent (Controller) - risk-aware orchestration.

The Planner decides what happens next. It does not parse packets, classify
flows, compute similarity, run specialist queries, calculate XAI, apply firewall
rules or measure outcomes. It owns routing, memory usage, specialist selection,
explanation depth and the case lifecycle - nothing else.

It is implemented as an explicit state machine, and every transition is
committed to the incident log *before* the next agent is invoked. That is what
makes a crash recoverable: a restarted Planner replays the last committed state
rather than starting over or, worse, re-executing an action.

Failure policy
--------------
* An agent that fails, times out or returns a malformed object is retried once,
  then routed around, with the evidence gap recorded.
* The Planner itself is supervised. After `planner_max_restarts` failed
  restarts the pipeline enters SAFE_HOLD: detection and alerting continue, but
  no autonomous action executes without a human.
* No action executes without passing the deterministic policy gate, and no case
  is written to memory without a measured outcome - under every failure mode.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from . import agents, policy
from .config import settings
from .llm import LLMClient
from .memory import MemoryAgent
from .monitor import GATEWAY, AvailabilityMonitor
from .schemas import (
    CaseRecord,
    ControllerState,
    DetectorEvent,
    Outcome,
    OutcomeReport,
    PolicyVerdict,
    RetrievedCase,
    RiskPath,
    SimEvent,
    SimilarityBand,
)


#: (in-progress, done, failed) node labels for each specialist worker
SPECIALIST_LABELS = {
    "log": ("Correlating logs", "Logs correlated", "Log query timed out"),
    "threat": ("Checking indicators", "Indicators checked", "Feed unreachable"),
    "device": ("Resolving clinical role", "Device class resolved", "Device context unavailable"),
    "traffic": ("Profiling the flood", "Flood profiled", "Traffic profile unavailable"),
    "history": ("Checking recurrence", "Recurrence checked", "Incident log unavailable"),
}


@dataclass
class Faults:
    """Injectable failures, used by the simulation UI and the eval harness."""

    llm_down: bool = False
    planner_crash: bool = False
    memory_down: bool = False
    sub_agent_timeout: bool = False
    policy_conflict: bool = False

    @classmethod
    def from_dict(cls, d: dict[str, bool]) -> "Faults":
        return cls(
            llm_down=d.get("llmDown", False),
            planner_crash=d.get("plannerCrash", False),
            memory_down=d.get("memoryDown", False),
            sub_agent_timeout=d.get("subAgentTimeout", False),
            policy_conflict=d.get("policyConflict", False),
        )


@dataclass
class IncidentLog:
    """Durable append-only record. In production this is a DB table; the point
    is that it is written before the next agent runs, so it is replayable."""

    incident_id: str
    entries: list[dict[str, Any]] = field(default_factory=list)
    last_state: ControllerState | None = None

    def commit(self, state: ControllerState, data: dict[str, Any] | None = None) -> None:
        self.last_state = state
        self.entries.append({"state": state.value, "at": time.time(), "data": data or {}})


class Planner:
    def __init__(self, memory: MemoryAgent, llm: LLMClient, faults: Faults) -> None:
        self.memory = memory
        self.llm = llm
        self.faults = faults
        self.restarts = 0

    # ------------------------------------------------------------------ #
    def route(self, event: DetectorEvent, band: SimilarityBand) -> tuple[RiskPath, str]:
        """Risk-aware depth selection.

        Risk routing and similarity routing are related but not identical: a
        highly similar incident is still high-risk if the target device is more
        critical than the one in the prior case.
        """
        t = settings.thresholds
        if event.device_criticality == "Critical" or event.confidence < t.fast_path_confidence:
            return RiskPath.HIGH, (
                f"Detector confidence {event.confidence:.3f} is below the {t.fast_path_confidence} fast-path "
                f"floor and/or the target is a {event.device_criticality}-criticality device. "
                "High impact plus uncertainty forces the full chain."
            )
        if band is SimilarityBand.HIGH and event.device_criticality in ("Low", "Medium"):
            return RiskPath.LOW, (
                "High-confidence detection, low clinical impact, and a validated near-identical prior case "
                "on a compatible device class. Deep reasoning would add latency without adding decision value."
            )
        return RiskPath.MEDIUM, (
            "Known attack family and confident detection, but context may have changed since the prior case, "
            "so reuse must be verified before it is trusted."
        )

    def select_specialists(self, path: RiskPath, band: SimilarityBand) -> list[str]:
        """Invoke only the specialists whose evidence can still change the decision.

        A critical device or an unusable memory hit always gets the full set -
        there is nothing to safely assume. Otherwise the prior case already
        establishes the signature and the device constraints, so only the
        changed evidence is re-analysed.
        """
        if path is RiskPath.HIGH or band is SimilarityBand.NONE:
            return ["log", "threat", "device", "traffic", "history"]
        if band is SimilarityBand.HIGH:
            # verify-and-adapt: nothing at all on the fast path, and only the
            # facts most likely to have changed on the medium path
            return [] if path is RiskPath.LOW else ["traffic", "history"]
        return ["log", "traffic", "history"]  # PARTIAL - the delta

    def explanation_depth(self, path: RiskPath) -> str:
        return {"LOW": "none", "MEDIUM": "one-line", "HIGH": "detailed"}[path.value]

    # ------------------------------------------------------------------ #
    async def run(
        self,
        event: DetectorEvent,
        scenario: str = "custom",
        windows: list | None = None,
        detector_payload: dict[str, Any] | None = None,
    ) -> AsyncIterator[SimEvent]:
        """Execute one incident, yielding SSE events as it goes.

        `windows` is the scored capture timeline from the Detector Agent. It is
        streamed before the agent chain starts so the UI can show detection
        actually happening on real traffic rather than jumping to a verdict.
        """
        run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"
        log = IncidentLog(incident_id=event.incident_id)
        t0 = time.time()

        def ev(**kw: Any) -> SimEvent:
            return SimEvent(ts=round(time.time() - t0, 3), **kw)

        # Start probing the gateway before anything else: we need a healthy
        # baseline to compare against, and the probe must be independent of the
        # detection pipeline for its verdict to mean anything.
        GATEWAY.reset()
        monitor = AvailabilityMonitor()
        monitor.start()
        yield ev(type="log", level="info", agent="monitor",
                 msg=f"Availability probe started: GET {monitor.url} at {1 / monitor.interval_s:.0f} req/s")

        yield ev(type="run.start", runId=run_id, scenario=scenario)

        # -- CAPTURED / DETECTED ---------------------------------------------
        log.commit(ControllerState.CAPTURED)
        yield ev(type="state", state=ControllerState.CAPTURED)
        yield ev(type="node.enter", node="gateway", label="Reading capture windows")
        yield ev(type="node.enter", node="detector", label="Scoring flows")

        # Stream the real timeline: benign baseline first, then attack onset.
        detected = False
        attack_started_at: float | None = None
        for w in windows or []:
            # Pace the replay so the availability probe can actually observe the
            # baseline. At 2 req/s a window loop that runs in microseconds would
            # give it nothing to measure before the attack starts.
            await asyncio.sleep(0.35)
            yield ev(type="window", window=w.to_json())
            for p in monitor.drain():
                yield ev(type="probe", probe=p.to_json())
            if w.is_detection and not detected:
                detected = True
                # the flood is now saturating the gateway; the probe will see it
                GATEWAY.mark_saturated()
                attack_started_at = time.time()
                yield ev(type="node.exit", node="gateway", status="ok", ms=0)
                yield ev(type="log", level="alert", agent="detector",
                         msg=(f"Detection at window {w.index} (t+{w.t_offset_s}s): "
                              f"{w.predicted_attack_rows}/{w.rows} flows classified TCP_Flood, "
                              f"mean p={w.p_mean:.3f}"))
            elif not detected:
                yield ev(type="log", level="info", agent="detector",
                         msg=(f"Window {w.index} (t+{w.t_offset_s}s): baseline, "
                              f"mean p={w.p_mean:.3f}"))

        if not detected:
            yield ev(type="node.exit", node="gateway", status="ok", ms=0)
            yield ev(type="node.exit", node="detector", status="ok", ms=0)
            await monitor.stop()
            yield ev(type="run.end", outcome=Outcome.UNVALIDATED,
                     summary="No window crossed the detection threshold. Nothing to respond to.")
            return

        log.commit(ControllerState.DETECTED, event.model_dump(mode="json"))
        yield ev(type="state", state=ControllerState.DETECTED)
        yield ev(type="node.exit", node="detector", status="ok", ms=0)
        yield ev(type="artifact", node="detector", title="Detector evidence",
                 payload=detector_payload or event.model_dump(mode="json"))

        # -- MEMORY ----------------------------------------------------------
        from .incidents import source_cardinality

        cardinality = source_cardinality(event)
        yield ev(type="node.enter", node="memory", label="Checking secondary cache")
        recall = self.memory.recall(event, cardinality)
        retrieved: list[RetrievedCase] = recall["retrieved"]
        band, best = self.memory.classify(retrieved)
        log.commit(ControllerState.SIMILARITY_CLASSIFIED,
                   {"band": band.value, "tier": recall["tier"]})

        if not self.memory.available:
            yield ev(type="node.exit", node="memory", status="failed", ms=0)
            yield ev(type="artifact", node="memory", title="Retrieved cases + reuse gate",
                     payload={"band": "NONE", "candidates": [], "note": "vector store unreachable"})
            yield ev(type="fallback", node="memory", degraded=True,
                     trigger="Vector store unreachable",
                     action=("Memory is treated as empty. No prior case may influence this decision. The Planner "
                             "re-routes to full investigation and queues the write-back for replay."))
        else:
            # --- which tier answered, and what it cost ---------------------
            if recall["tier"] == "cache":
                yield ev(type="log", level="ok", agent="memory",
                         msg=(f"SECONDARY (cache) HIT on {recall['cache_hit']} in "
                              f"{recall['cache_us']}us - primary scan of "
                              f"{recall['primary_scan_skipped']} cases skipped"))
            else:
                yield ev(type="log", level="info", agent="memory",
                         msg=(f"Secondary cache miss ({recall['cache_us']}us over "
                              f"{len(recall['cache_considered'])} entries) - falling through to "
                              f"primary scan of {recall.get('primary_cases_scanned', 0)} cases "
                              f"({recall['primary_us']}us)"))
            if recall["promotion"]:
                pr = recall["promotion"]
                yield ev(type="log", level="info", agent="memory",
                         msg=(f"Promoted {pr['promoted']} to secondary cache "
                              f"({pr['action']}, ttl {pr['ttl']} attacks)"
                              + (f", evicted {pr['evicted_for_capacity']} for capacity"
                                 if pr.get("evicted_for_capacity") else "")))
            for expired_id in recall["expired"]:
                yield ev(type="log", level="warn", agent="memory",
                         msg=f"{expired_id} aged out of the cache: 5 attacks without a match")

            yield ev(type="artifact", node="memory", title="Memory tiers",
                     payload={
                         "answered_by": recall["tier"],
                         # what the cache actually scored at lookup time, before
                         # any promotion from this incident changed its size
                         "cache_entries_scored": len(recall["cache_considered"]),
                         "cache_lookup_us": recall["cache_us"],
                         "primary_lookup_us": recall["primary_us"],
                         "primary_cases_scanned": recall.get("primary_cases_scanned"),
                         "primary_scan_skipped": recall.get("primary_scan_skipped"),
                         "promotion": recall["promotion"],
                         "expired_this_incident": recall["expired"],
                         "cache": self.memory.cache.stats(),
                     })
            yield ev(type="artifact", node="memory", title="Retrieved cases + reuse gate",
                     payload={
                         "band": band.value,
                         "answered_by": recall["tier"],
                         "thresholds": settings.thresholds.__dict__,
                         "source_cardinality": cardinality,
                         "compared_fields": self.memory.compared_fields(cardinality),
                         "candidates": [
                             {
                                 "case_id": r.case.case_id,
                                 "similarity": r.similarity,
                                 "prior_outcome": r.case.outcome.value,
                                 "reliability": r.case.reliability,
                                 "reuse_count": r.case.reuse_count,
                                 "device_type": r.case.device_type,
                                 "device_criticality": r.case.device_criticality,
                                 "executed_response": r.case.executed_response,
                                 "gate": "ALLOW" if r.context_compatible else "BLOCK",
                                 "reason": r.incompatibility_reason or "context compatible",
                             }
                             for r in retrieved
                         ],
                     })
            yield ev(type="node.exit", node="memory", status="ok", ms=0)
        yield ev(type="state", state=ControllerState.SIMILARITY_CLASSIFIED)

        # -- planner crash / supervised restart ------------------------------
        if self.faults.planner_crash:
            async for e in self._simulate_crash(log, ev):
                yield e
            if log.last_state is ControllerState.SAFE_HOLD:
                yield ev(type="run.end", outcome=Outcome.UNVALIDATED,
                         summary="Planner could not be restarted. Pipeline held in SAFE_HOLD: alerting continues, no autonomous action executed.")
                return

        # -- ROUTE -----------------------------------------------------------
        path, rationale = self.route(event, band)
        log.commit(ControllerState.RISK_ASSESSED, {"path": path.value})
        yield ev(type="state", state=ControllerState.RISK_ASSESSED)
        yield ev(type="decision", node="planner",
                 question="How much reasoning does this incident justify?",
                 choice=f"{path.value} path", rationale=rationale)

        specialists = self.select_specialists(path, band)
        mode = "verify" if not specialists else ("full" if band is SimilarityBand.NONE or path is RiskPath.HIGH else "delta")

        # -- INVESTIGATE -----------------------------------------------------
        results = []
        if specialists:
            yield ev(type="decision", node="planner",
                     question="Which specialist evidence is actually needed?",
                     choice=" + ".join(specialists),
                     rationale=("The prior case already establishes the signature and device constraints, so only the "
                                "changed evidence is re-analysed."
                                if mode == "delta" else
                                "No prior case cleared the reuse gate, so nothing can be assumed."))
            yield ev(type="node.enter", node="investigator", label=f"Running {len(specialists)} specialists concurrently")
            for name in specialists:
                yield ev(type="node.enter", node=f"sub.{name}",  # type: ignore[arg-type]
                         label=SPECIALIST_LABELS[name][0])
            from .specialists import run_specialists

            # stall the first selected worker, whichever it is
            stall = {specialists[0]} if self.faults.sub_agent_timeout else set()
            window_stats = next((w.stats for w in (windows or []) if w.stats), {})
            results = await run_specialists(event, specialists, window_stats, stall=stall)
            for r in results:
                yield ev(type="node.enter", node=f"sub.{r.name}",  # type: ignore[arg-type]
                         label=SPECIALIST_LABELS[r.name][1 if r.status == "ok" else 2])
                yield ev(type="node.exit", node=f"sub.{r.name}",  # type: ignore[arg-type]
                         status="ok" if r.status == "ok" else "failed", ms=r.latency_ms)
                yield ev(type="artifact", node=f"sub.{r.name}",  # type: ignore[arg-type]
                         title=f"{r.name} findings", payload=r.model_dump(mode="json"))
                if r.status != "ok":
                    yield ev(type="fallback", node=f"sub.{r.name}", degraded=True,  # type: ignore[arg-type]
                             trigger=r.summary,
                             action="No finding is fabricated. The Investigator records an evidence gap and lowers investigation confidence.")
            log.commit(ControllerState.FULL_INV if mode == "full" else ControllerState.DELTA_INV)
        else:
            log.commit(ControllerState.VERIFY)
            yield ev(type="state", state=ControllerState.VERIFY)
            yield ev(type="node.exit", node="investigator", status="skipped", ms=0)

        if mode != "verify":
            yield ev(type="node.enter", node="investigator",
                     label="Deterministic evidence fusion" if self.faults.llm_down else "Fusing evidence")
        investigation = await agents.investigate(
            self.llm, event, results, best, mode, use_llm=(mode != "verify")
        )
        if mode != "verify" and investigation.confidence_source == "rules" and self.llm.cfg.configured:
            yield ev(type="fallback", node="investigator", degraded=True,
                     trigger="LLM unavailable during contextual investigation",
                     action=("Rule-based fusion produced the same object shape with confidence_source='rules'. "
                             "Every downstream agent still works; only narrative quality drops."))
        yield ev(type="artifact", node="investigator", title="Structured investigation result",
                 payload=investigation.model_dump(mode="json"))
        if mode != "verify":
            yield ev(type="node.exit", node="investigator",
                     status="degraded" if investigation.confidence_source == "rules" else "ok", ms=0)

        # -- EXPLAIN ---------------------------------------------------------
        depth = self.explanation_depth(path)
        if depth != "none":
            yield ev(type="node.enter", node="explainer", label=f"Generating {depth} explanation")
        explanation = await agents.explain(self.llm, depth, event, investigation, best)
        yield ev(type="node.exit", node="explainer",
                 status="skipped" if depth == "none" else ("degraded" if explanation.generated_by == "template" else "ok"), ms=0)
        if depth != "none":
            yield ev(type="artifact", node="explainer", title=f"Explanation ({depth})",
                     payload=explanation.model_dump(mode="json"))

        # -- RESPOND ---------------------------------------------------------
        yield ev(type="node.enter", node="response", label="Recommending bounded action")
        rec = await agents.recommend(self.llm, event, investigation, explanation, best)
        if self.faults.policy_conflict:
            # force the unsafe-recommendation branch so the gate can be demonstrated
            rec.action, rec.duration_s, rec.reversible = "device_isolate(600s)", 600, False
            rec.rationale = "Model proposed full quarantine to guarantee suppression."
        log.commit(ControllerState.RESPONSE_READY, {"action": rec.action})
        yield ev(type="state", state=ControllerState.RESPONSE_READY)
        yield ev(type="artifact", node="response", title="Response recommendation", payload=rec.model_dump(mode="json"))
        yield ev(type="node.exit", node="response",
                 status="degraded" if rec.selector == "deterministic_table" and self.llm.cfg.configured else "ok", ms=0)

        # -- POLICY ----------------------------------------------------------
        device_ctx_ok = any(r.name == "device" and r.status == "ok" for r in results) or not specialists
        yield ev(type="node.enter", node="policy", label="Deterministic safety validation")
        decision = policy.evaluate(event, rec, device_context_available=device_ctx_ok)
        log.commit(ControllerState.POLICY_CHECKED, {"verdict": decision.verdict.value})
        yield ev(type="state", state=ControllerState.POLICY_CHECKED)
        yield ev(type="decision", node="policy",
                 question="Is the recommended action permitted in this context?",
                 choice=decision.verdict.value, rationale=decision.rationale)
        yield ev(type="artifact", node="policy", title="Policy check results", payload=decision.model_dump(mode="json"))
        yield ev(type="node.exit", node="policy",
                 status="ok" if decision.verdict is PolicyVerdict.PASS else "degraded", ms=0)

        if decision.verdict is PolicyVerdict.ESCALATE:
            log.commit(ControllerState.ESCALATED)
            yield ev(type="state", state=ControllerState.ESCALATED)
            yield ev(type="run.end", outcome=Outcome.UNVALIDATED,
                     summary="Policy gate escalated to a human. No autonomous action was executed and no case was stored.")
            return

        # -- EXECUTE + VALIDATE ----------------------------------------------
        yield ev(type="node.enter", node="actuator", label="Applying action, then measuring")
        # An advisory worker being unavailable is recorded as an evidence gap but
        # does not degrade the outcome - nothing was allowed to depend on it.
        from .specialists import ADVISORY

        blocking_gaps = [r for r in results if r.status != "ok" and r.name not in ADVISORY]

        # Apply the action, then let the independent probe decide whether it
        # worked. We do not tell the monitor the answer - we wait and watch.
        GATEWAY.mark_contained()
        action_applied_at = time.time()
        yield ev(type="log", level="info", agent="actuator",
                 msg=f"Applied {decision.executed_action} - waiting on the availability probe to confirm recovery")

        recovered_at: float | None = None
        # Watch for recovery, then keep probing ~2s past it so the post-recovery
        # figure is measured over real samples rather than the recovery lag.
        for _ in range(40):  # up to ~10s of observation at 2 req/s
            await asyncio.sleep(0.25)
            for p in monitor.drain():
                yield ev(type="probe", probe=p.to_json())
                if p.ok and recovered_at is None:
                    recovered_at = time.time()
                    yield ev(type="log", level="ok", agent="monitor",
                             msg=f"Gateway answering HTTP 200 again at t+{p.t_offset_s:.1f}s")
            if recovered_at is not None and (time.time() - recovered_at) >= 2.0:
                break

        await monitor.stop()
        for p in monitor.drain():
            yield ev(type="probe", probe=p.to_json())

        availability = monitor.report(action_applied_at, attack_started_at)
        report = self._build_outcome(
            availability,
            degraded=bool(blocking_gaps) or decision.verdict is PolicyVerdict.DOWNGRADE,
        )

        log.commit(ControllerState.VALIDATED, report.model_dump(mode="json"))
        yield ev(type="state", state=ControllerState.VALIDATED)
        for k, v in (
            ("Availability · baseline", f"{availability.get('baseline_availability_pct', '—')}%"),
            ("Availability · under attack", f"{availability.get('during_attack_availability_pct', '—')}%"),
            ("Time to recovery", f"{availability.get('time_to_recovery_s')}s"
                if availability.get("time_to_recovery_s") is not None else "not observed"),
            ("Probe requests", f"{availability.get('requests_sent', 0)} @ {availability.get('probe_rate_hz', 2)}/s"),
        ):
            yield ev(type="metric", key=k, value=v)
        yield ev(type="artifact", node="actuator", title="Outcome validation", payload=report.model_dump(mode="json"))
        yield ev(type="artifact", node="actuator", title="Availability probe (measured)", payload=availability)
        yield ev(type="node.exit", node="actuator", status="ok", ms=0)

        # -- MEMORY WRITE-BACK -----------------------------------------------
        case = self._build_case(event, investigation, decision.executed_action or "", report, cardinality, specialists)
        result = self.memory.write_back(case, best)
        log.commit(ControllerState.CASE_STORED, result)
        yield ev(type="state", state=ControllerState.CASE_STORED)
        yield ev(type="edge", node="actuator", to="memory", kind="writeback", label="validated case write-back",
                 **{"from": "actuator"})
        yield ev(type="artifact", node="memory", title="Memory write-back", payload=result)
        yield ev(type="node.exit", node="memory", status="ok" if result.get("stored") else "degraded", ms=0)

        yield ev(type="run.end", outcome=report.outcome, summary=self._summary(mode, len(specialists), report))

    # ------------------------------------------------------------------ #
    async def _simulate_crash(self, log: IncidentLog, ev: Any) -> AsyncIterator[SimEvent]:
        crashed_at = log.last_state
        yield ev(type="log", level="error", agent="supervisor",
                 msg=f"planner-agent exited unexpectedly (SIGKILL) in state {crashed_at.value if crashed_at else '?'}")
        yield ev(type="log", level="warn", agent="supervisor", msg="No action had been executed - nothing to roll back")
        yield ev(type="node.exit", node="planner", status="failed", ms=0)

        while self.restarts < settings.planner_max_restarts:
            self.restarts += 1
            yield ev(type="log", level="info", agent="supervisor",
                     msg=f"Restarting planner-agent (attempt {self.restarts}/{settings.planner_max_restarts})")
            await asyncio.sleep(0.05)
            yield ev(type="log", level="ok", agent="planner",
                     msg=f"Resumed from durable checkpoint {crashed_at.value if crashed_at else '?'}")
            yield ev(type="fallback", node="planner", degraded=True,
                     trigger="Planner (Controller) process died mid-incident",
                     action=("Every state transition is committed to the incident log before the next agent is "
                             "invoked, so the Planner is restartable. The supervisor replays the last committed "
                             f"state. After {settings.planner_max_restarts} failed restarts the pipeline enters "
                             "SAFE_HOLD: detection and alerting continue, but no autonomous action executes "
                             "without a human."))
            return

        log.commit(ControllerState.SAFE_HOLD)
        yield ev(type="state", state=ControllerState.SAFE_HOLD)

    @staticmethod
    def _build_outcome(availability: dict[str, Any], degraded: bool) -> OutcomeReport:
        """Label the outcome from what the availability probe actually observed.

        The pipeline document requires an outcome that is *measured*, not
        assumed. Availability and time-to-recovery here come straight from the
        probe's HTTP responses. Attack suppression does not: measuring how much
        malicious traffic the action dropped needs a gateway counter that this
        PoC has no source for, so it is reported as unmeasured rather than
        estimated - and an unmeasured outcome is never written to memory as
        SUCCESS on the strength of a number we invented.
        """
        if not availability.get("measured"):
            return OutcomeReport(
                outcome=Outcome.UNVALIDATED,
                malicious_traffic_drop_pct=-1.0,
                legitimate_availability_pct=-1.0,
                latency_recovered_s=-1.0,
                collateral_disruption=False,
                rollback_required=False,
                containment_latency_s=-1.0,
                basis="Availability probe collected no samples; outcome could not be validated.",
            )

        avail_pct = float(availability.get("post_recovery_availability_pct") or 0.0)
        ttr = availability.get("time_to_recovery_s")

        if ttr is None:
            outcome = Outcome.FAILURE
            basis = (
                "The probe never saw HTTP 200 again after the action was applied: the service did "
                "not recover within the observation window."
            )
        elif degraded:
            outcome = Outcome.PARTIAL
            basis = (
                f"Service recovered {ttr}s after the action, but the run was degraded "
                "(policy downgrade or missing decision-relevant evidence)."
            )
        else:
            outcome = Outcome.SUCCESS
            basis = (
                f"The gateway returned HTTP 200 again {ttr}s after the action was applied, measured by "
                f"{availability['requests_sent']} independent probes at "
                f"{availability['probe_rate_hz']} req/s."
            )

        return OutcomeReport(
            outcome=outcome,
            # -1 is the explicit "not measured" sentinel, surfaced as such in the UI
            malicious_traffic_drop_pct=-1.0,
            legitimate_availability_pct=avail_pct,
            latency_recovered_s=float(ttr) if ttr is not None else -1.0,
            collateral_disruption=False,
            rollback_required=False,
            containment_latency_s=float(availability.get("outage_duration_s") or -1.0),
            basis=basis,
        )

    def _build_case(self, event, investigation, action, report, cardinality, specialists) -> CaseRecord:
        now = datetime.now(timezone.utc).isoformat()
        return CaseRecord(
            case_id=f"CASE-{uuid.uuid4().hex[:6].upper()}",
            attack_family=event.attack_family,
            attack_subtype=event.attack_subtype,
            device_type=event.device_type,
            device_criticality=event.device_criticality,
            behavioral_signature=investigation.narrative[:240],
            source_cardinality=cardinality,
            peak_rate=f"{event.packets_per_sec / 1000:.1f}k pkt/s",
            investigation_summary=investigation.narrative,
            specialists_used=specialists,
            recommended_response=action,
            executed_response=action,
            outcome=report.outcome,
            containment_latency_s=report.containment_latency_s,
            reuse_count=0,
            # A new case starts unproven. One success does not make it trusted;
            # it has to survive re-validation before it can drive a fast path.
            reliability=0.5 if report.outcome is Outcome.SUCCESS else 0.35,
            confidence=event.confidence,
            created=now,
            last_validated=now,
        )

    @staticmethod
    def _summary(mode: str, n_specialists: int, report: OutcomeReport) -> str:
        if mode == "verify":
            return f"Fast path: contained in {report.containment_latency_s}s using a verified prior case. Investigator and Explainer were never invoked."
        if mode == "delta":
            return f"Delta path: only the changed evidence was re-investigated ({n_specialists} of 5 specialists). Contained in {report.containment_latency_s}s."
        return f"Full path: no prior case cleared the reuse gate, so all {n_specialists} specialists ran and a detailed explanation was generated. Contained in {report.containment_latency_s}s."
