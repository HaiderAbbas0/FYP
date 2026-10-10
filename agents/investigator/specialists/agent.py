"""Investigator sub-agents (specialist evidence workers).

Each specialist is an independent, individually-timeoutable worker. They run
concurrently because they have no dependency on each other (pipeline doc §22),
but concurrency is a latency optimisation only - the Investigator still waits at
the fusion barrier before any decision is made.

**Evidence provenance is enforced here.** Every finding carries a `provenance`
tag, and a worker that cannot compute something from a real source declares
itself `unavailable` rather than producing a plausible number:

  capture     - aggregated from the scored CICIoMT2024 flow window
  registry    - testbed device metadata (device class, allowed actions)
  case-store  - counted from the real case store
  unavailable - no source wired up in this PoC

That last category is deliberate. The CICIoMT2024 feature schema is
post-extraction: it has no addresses, no host identifiers and no service logs,
so a Threat Intelligence worker has nothing real to look up and source
cardinality cannot be derived. Reporting that honestly makes the Policy Gate
fail safe (see `agents._constraints`), which is the correct behaviour - a
fabricated finding would instead have silently unlocked single-IP blocking.
"""

from __future__ import annotations

import asyncio
import os
import math
import time
import weakref
from typing import Any, Awaitable, Callable

from app.config import settings
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult

# Shared by runs in this event loop, so several incident joins cannot each
# exhaust the machine with their own full worker allocation.
_WORKER_LIMITS: weakref.WeakKeyDictionary = weakref.WeakKeyDictionary()


def _stat(stats: dict[str, Any], col: str, key: str = "mean") -> float:
    entry = stats.get(col) or {}
    v = entry.get(key)
    return float(v) if v is not None else 0.0


def _ratio(stats: dict[str, Any], col: str) -> float | None:
    entry = stats.get(col) or {}
    r = entry.get("ratio_vs_baseline")
    return float(r) if r is not None else None


def _missing_stats(stats: dict[str, Any], required: tuple[str, ...]) -> list[str]:
    missing = []
    for column in required:
        try:
            value = stats[column]["mean"]
            if value is None or not math.isfinite(float(value)):
                missing.append(column)
        except (KeyError, TypeError, ValueError):
            missing.append(column)
    return missing


async def _timed(
    name: str,
    fn: Callable[[], Awaitable[SpecialistResult]],
    timeout_s: float,
    *,
    run_id: str,
    run_started_at: float,
    synthetic: bool = False,
) -> SpecialistResult:
    started = time.perf_counter()
    common = {
        "name": name,
        "run_id": run_id,
        "worker_id": f"{run_id}:{name}",
        "started_offset_ms": max(0, int((started - run_started_at) * 1000)),
    }
    try:
        result = await asyncio.wait_for(fn(), timeout=timeout_s)
    except asyncio.TimeoutError:
        return SpecialistResult(
            status="unavailable",
            provenance="unavailable",
            summary=f"{name} exceeded its {timeout_s:.1f}s budget; no finding returned",
            latency_ms=int(timeout_s * 1000),
            **common,
        )
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return SpecialistResult(
            status="unavailable", provenance="unavailable",
            summary=f"{name} failed: {str(exc)[:300]}", latency_ms=elapsed_ms, **common,
        )

    # Treat malformed worker output as an evidence gap. In particular, never
    # let one malformed result fail the join or masquerade as another worker.
    try:
        result = SpecialistResult.model_validate(result)
        if result.name != name:
            raise ValueError(f"worker returned name {result.name!r}, expected {name!r}")
        if len(result.model_dump_json().encode("utf-8")) > 24_000:
            raise ValueError("worker output exceeded the 24 KB finding limit")
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return SpecialistResult(
            status="unavailable", provenance="unavailable",
            summary=f"{name} returned malformed evidence: {str(exc)[:300]}",
            latency_ms=elapsed_ms, **common,
        )

    provenance = result.findings.get("provenance", "unavailable")
    if result.status != "ok" or provenance not in ("capture", "fixture", "registry", "case-store", "unavailable"):
        provenance = "unavailable"
    if synthetic and name in ("log", "traffic") and result.status == "ok":
        provenance = "fixture"
        result.findings["provenance"] = "fixture"
    result.latency_ms = int((time.perf_counter() - started) * 1000)
    result.run_id = run_id
    result.worker_id = f"{run_id}:{name}"
    result.provenance = provenance
    result.started_offset_ms = common["started_offset_ms"]
    return result


# --------------------------------------------------------------------------- #
# individual workers
# --------------------------------------------------------------------------- #
async def log_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Connection-state evidence, read from the capture's own TCP counters.

    The feature schema carries no service or authentication logs, so this worker
    reports what the capture genuinely contains: TCP flag counts and connection
    reset behaviour, each against the benign baseline.
    """
    await asyncio.sleep(0.05)
    missing = _missing_stats(stats, ("rst_count", "syn_count", "ack_count", "fin_count"))
    if missing:
        return SpecialistResult(name="log", status="unavailable", provenance="unavailable",
                                findings={"provenance": "unavailable", "missing_features": missing},
                                summary="Connection-state counters unavailable: " + ", ".join(missing))
    rst, syn, ack, fin = (_stat(stats, c) for c in ("rst_count", "syn_count", "ack_count", "fin_count"))
    rst_ratio = _ratio(stats, "rst_count")

    # Report the direction the data actually shows. During this flood resets
    # fall well below baseline, which is the opposite of the "connection
    # failures spike" story one might expect - the flood is not completing
    # handshakes at all rather than having them torn down.
    if rst_ratio is not None and rst_ratio < 0.5:
        finding = (
            f"Connection resets are at {rst_ratio:.2f}x the benign baseline - below normal, not above. "
            "Combined with zero SYN/ACK/FIN counts, the flood is not completing or tearing down "
            "handshakes; it is one-directional traffic that never reaches connection state."
        )
    elif rst_ratio is not None and rst_ratio > 1.5:
        finding = f"Connection resets are at {rst_ratio:.2f}x the benign baseline, consistent with mass connection teardown."
    else:
        finding = "Connection-state counters are within normal range for this device."

    return SpecialistResult(
        name="log",
        status="ok",
        findings={
            "provenance": "capture",
            "rst_count_mean": round(rst, 3),
            "rst_count_ratio_vs_baseline": rst_ratio,
            "syn_count_mean": round(syn, 3),
            "ack_count_mean": round(ack, 3),
            "fin_count_mean": round(fin, 3),
            "ack_flag_ratio": _ratio(stats, "ack_flag_number"),
            "not_available": [
                "authentication events", "service/broker logs", "process and CPU telemetry",
            ],
            "reason_unavailable": "CICIoMT2024 features are post-extraction network flows; no host or service logs are in scope",
        },
        summary=finding,
    )


async def threat_intel(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Advisory only - and, in this PoC, genuinely unavailable.

    Indicator lookup needs source addresses and a reputation feed. The capture
    feature schema contains neither, and no feed is wired up, so this worker
    returns no finding. It is advisory by design, so losing it never blocks
    containment.
    """
    await asyncio.sleep(0.03)
    return SpecialistResult(
        name="threat",
        status="unavailable",
        findings={
            "provenance": "unavailable",
            "reason": (
                "No threat-intelligence feed is configured, and the CICIoMT2024 feature schema carries "
                "no source addresses or host identifiers to look up."
            ),
        },
        summary="No indicator lookup possible: no feed configured and no addresses in the feature schema. Advisory worker, so the run continues.",
    )


async def device_context(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Clinical role and the hard operational limits for this device class.

    Sourced from the testbed device registry, not from the capture - the feature
    schema has no device identity. Labelled as such.
    """
    await asyncio.sleep(0.04)
    life_critical = event.device_type in LIFE_CRITICAL_CLASSES or event.device_criticality == "Critical"
    return SpecialistResult(
        name="device",
        status="ok",
        findings={
            "provenance": "registry",
            "device_type": event.device_type,
            "criticality": event.device_criticality,
            "life_critical": life_critical,
            "allowed_actions": ["upstream_rate_limit", "temp_source_block", "connection_cap", "alert_escalate"],
            "denied_actions": ["device_isolate", "vlan_quarantine", "port_shutdown"] if life_critical else [],
            "note": "Device identity is testbed metadata; the capture features carry no addresses.",
        },
        summary=(
            f"{event.device_id} is life-critical; isolation is not a permitted action for this class."
            if life_critical
            else f"{event.device_id} is non-critical; the full bounded action set is available."
        ),
    )


async def traffic_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Flow-rate and packet-shape profile, computed from the scored window.

    Source cardinality is the one thing it cannot answer: the feature schema has
    no addresses. It says so, and the Policy Gate then refuses single-source
    blocking rather than assuming it would work.
    """
    await asyncio.sleep(0.06)
    missing = _missing_stats(stats, ("Rate", "Tot size"))
    if missing:
        return SpecialistResult(name="traffic", status="unavailable", provenance="unavailable",
                                findings={"provenance": "unavailable", "missing_features": missing},
                                summary="Traffic measurements unavailable: " + ", ".join(missing))
    rate, rate_r = _stat(stats, "Rate"), _ratio(stats, "Rate")
    size, size_r = _stat(stats, "Tot size"), _ratio(stats, "Tot size")
    hdr_r = _ratio(stats, "Header_Length")

    return SpecialistResult(
        name="traffic",
        status="ok",
        findings={
            "provenance": "capture",
            "flow_rate_mean": round(rate, 2),
            "flow_rate_max": round(_stat(stats, "Rate", "max"), 2),
            "flow_rate_ratio_vs_baseline": rate_r,
            "mean_packet_size": round(size, 2),
            "packet_size_ratio_vs_baseline": size_r,
            "header_length_ratio_vs_baseline": hdr_r,
            "protocol_mix": {
                "TCP": round(_stat(stats, "TCP"), 3),
                "UDP": round(_stat(stats, "UDP"), 3),
                "ICMP": round(_stat(stats, "ICMP"), 3),
                "ARP": round(_stat(stats, "ARP"), 3),
            },
            "source_cardinality": "unknown",
            "source_cardinality_reason": "no source addresses in the CICIoMT2024 feature schema",
        },
        summary=(
            f"Flow rate is {rate_r:.2f}x the benign baseline with mean packet size at {size_r:.2f}x - "
            f"a high-rate flood of undersized packets. Source cardinality is unknown (no addresses in "
            f"the feature schema), so per-source blocking cannot be shown to be effective."
            if rate_r and size_r else
            "Rate profile computed from the scored window; source cardinality unavailable."
        ),
    )


async def history_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Recurrence, counted from the real case store.

    Distinct from the Memory Agent: memory asks "have we solved something like
    this before"; this asks "how often has this device seen this family recently".
    Recurrence changes the containment duration, not the action.
    """
    await asyncio.sleep(0.04)
    from app.schemas import CaseRecord
    if "_history_snapshot" in stats:
        cases = [CaseRecord.model_validate(case) for case in stats["_history_snapshot"]]
    else:
        from app.memory import MemoryAgent
        cases = MemoryAgent().cases
    same_device = [c for c in cases if c.device_type == event.device_type]
    same_family = [c for c in same_device if c.attack_subtype == event.attack_subtype]
    harmful = [c for c in same_device if c.outcome.value == "HARMFUL"]

    return SpecialistResult(
        name="history",
        status="ok",
        findings={
            "provenance": "case-store",
            "prior_cases_this_device_class": len(same_device),
            "prior_cases_same_attack_subtype": len(same_family),
            "prior_harmful_outcomes_this_device_class": len(harmful),
            "harmful_case_ids": [c.case_id for c in harmful],
            "suggested_duration_multiplier": 2 if len(same_family) >= 3 else 1,
            "not_available": ["per-source recurrence"],
            "reason_unavailable": "no source addresses in the feature schema, so repeat-offender tracking is out of scope",
        },
        summary=(
            f"{len(same_family)} prior case(s) of {event.attack_subtype} against a {event.device_type}, "
            f"{len(harmful)} of which ended HARMFUL"
            + (f" ({', '.join(c.case_id for c in harmful)})." if harmful else ".")
        ),
    )


# --------------------------------------------------------------------------- #
#: Advisory workers can never be the sole basis for a response decision, so
#: losing one records an evidence gap but must NOT degrade the measured outcome.
#: Everything else is decision-relevant: its absence really does mean the
#: Investigator reasoned with less than it should have.
ADVISORY = {"threat"}

REGISTRY: dict[str, Callable[[DetectorEvent, dict[str, Any]], Awaitable[SpecialistResult]]] = {
    "log": log_analysis,
    "threat": threat_intel,
    "device": device_context,
    "traffic": traffic_analysis,
    "history": history_analysis,
}


async def run_specialists(
    event: DetectorEvent,
    names: list[str],
    stats: dict[str, Any] | None = None,
    *,
    stall: set[str] | None = None,
    run_id: str = "standalone",
    run_started_at: float | None = None,
    cancel_event: asyncio.Event | None = None,
) -> list[SpecialistResult]:
    """Fan out to the selected specialists concurrently, then join.

    The join is the synchronisation barrier: parallelism reduces latency but
    never lets a decision be made on incomplete evidence without that gap being
    recorded.
    """
    stall = stall or set()
    if len(names) > 32 or len(set(names)) != len(names):
        raise ValueError("specialist selection must contain at most 32 unique names")
    window_stats = stats or {}
    history_stats = window_stats
    if "history" in names and "_history_snapshot" not in window_stats:
        def snapshot_history():
            from app.memory import MemoryAgent
            return [c.model_dump(mode="json") for c in MemoryAgent().cases]
        history_stats = {**window_stats, "_history_snapshot": await asyncio.to_thread(snapshot_history)}
    run_started_at = run_started_at or time.perf_counter()
    execution_mode = os.getenv("SPECIALIST_EXECUTION", "process")
    if execution_mode not in ("process", "inprocess"):
        raise ValueError("SPECIALIST_EXECUTION must be process or inprocess")
    capacity = int(os.getenv("SPECIALIST_CONCURRENCY", "5"))
    if capacity < 1:
        raise ValueError("SPECIALIST_CONCURRENCY must be positive")
    loop = asyncio.get_running_loop()
    if loop not in _WORKER_LIMITS:
        _WORKER_LIMITS[loop] = asyncio.Semaphore(capacity)
    semaphore = _WORKER_LIMITS[loop]
    tasks: list[asyncio.Task[SpecialistResult]] = []
    for name in names:
        fn = REGISTRY.get(name)

        if fn is None:
            async def unsupported(_event, _stats, worker_name=name):
                raise ValueError(f"no specialist registered as {worker_name!r}")

            fn = unsupported

        async def call(f=fn, stalled=(name in stall), worker_name=name):
            async with semaphore:
                inputs = history_stats if worker_name == "history" else window_stats
                if execution_mode == "process" and worker_name in REGISTRY:
                    from app.worker_runtime import process_specialist
                    return await process_specialist(worker_name, event.model_dump(mode="json"), inputs, stalled)
                if stalled:
                    await asyncio.sleep(settings.specialist_timeout_s + 1.0)
                result = await f(event, inputs)
                result.findings.pop('_resource_usage', None)
                return result

        tasks.append(asyncio.create_task(_timed(
            name, call, settings.specialist_timeout_s,
            run_id=run_id, run_started_at=run_started_at,
            synthetic=event.detector_source == "synthetic",
        )))

    if cancel_event is None:
        return list(await asyncio.gather(*tasks))

    cancel_wait = asyncio.create_task(cancel_event.wait())
    try:
        unfinished: set[asyncio.Task] = set(tasks)
        while unfinished:
            done, _ = await asyncio.wait(
                unfinished | {cancel_wait}, return_when=asyncio.FIRST_COMPLETED,
            )
            if cancel_wait in done and cancel_event.is_set():
                for task in unfinished:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                return []
            unfinished.difference_update(done)
        return list(await asyncio.gather(*tasks))
    finally:
        if not cancel_wait.done():
            cancel_wait.cancel()
