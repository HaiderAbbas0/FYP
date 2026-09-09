"""Investigator, Explainer and Response agents.

All three follow the same contract: attempt LLM reasoning, validate whatever
comes back against a schema, and fall back to a deterministic implementation if
the model is unavailable or its output is unusable. The object handed downstream
has the same shape either way, so a provider outage changes the *quality* of the
reasoning, never the *shape* of the pipeline.
"""

from __future__ import annotations

from typing import Any

from .llm import LLMClient
from .schemas import (
    DetectorEvent,
    Explanation,
    InvestigationResult,
    Outcome,
    ResponseRecommendation,
    RetrievedCase,
    SpecialistResult,
)

# --------------------------------------------------------------------------- #
# Investigator
# --------------------------------------------------------------------------- #
INVESTIGATOR_SYSTEM = """You are the Investigator Agent in an IoMT intrusion-response system.
You fuse detector evidence, retrieved prior cases and specialist worker findings into ONE
structured investigation object. You never invent evidence: if a specialist returned no
findings, record it in evidence_gaps instead of guessing.

Reply with JSON only:
{"severity":"low|medium|high","confirmed_family":str,"differences_from_prior_case":[str],
 "response_constraints":[str],"narrative":str}"""


async def investigate(
    llm: LLMClient,
    event: DetectorEvent,
    specialists: list[SpecialistResult],
    prior: RetrievedCase | None,
    mode: str,
    *,
    use_llm: bool = True,
) -> InvestigationResult:
    """Fuse evidence into one structured investigation object.

    `use_llm=False` is the verify-and-adapt fast path: a near-identical prior
    case already carries the reasoning, so there is nothing for a model to work
    out. Spending a generative call there would defeat the point of the fast
    path, which is to cost less than the incident is worth.
    """
    gaps = [f"{s.name}: unavailable" for s in specialists if s.status == "unavailable"]
    base_constraints = _constraints(event, specialists, gaps)

    payload = await llm.complete_json(
        INVESTIGATOR_SYSTEM,
        _json_block({
            "detector": event.model_dump(mode="json"),
            "prior_case": prior.case.model_dump(mode="json") if prior else None,
            "prior_similarity": prior.similarity if prior else None,
            "specialists": [s.model_dump(mode="json") for s in specialists],
            "mode": mode,
        }),
    ) if use_llm else None

    if payload and _valid_investigation(payload):
        return InvestigationResult(
            mode=mode,  # type: ignore[arg-type]
            confidence_source="llm+rules",
            confirmed_family=str(payload["confirmed_family"]),
            severity=payload["severity"],
            evidence_gaps=gaps,
            differences_from_prior_case=[str(d) for d in payload.get("differences_from_prior_case", [])],
            # policy-derived constraints are appended, never replaced by the model
            response_constraints=sorted(set(base_constraints) | {str(c) for c in payload.get("response_constraints", [])}),
            specialist_results=specialists,
            narrative=str(payload.get("narrative", "")),
        )

    # ---- deterministic fallback -------------------------------------------
    return InvestigationResult(
        mode=mode,  # type: ignore[arg-type]
        confidence_source="rules",
        confirmed_family=f"{event.attack_family}/{event.attack_subtype}",
        severity=_rule_severity(event, gaps),
        evidence_gaps=gaps,
        differences_from_prior_case=_rule_differences(event, prior),
        response_constraints=base_constraints,
        specialist_results=specialists,
        narrative=" ".join(s.summary for s in specialists if s.summary) or "No specialist evidence available.",
    )


def _constraints(event: DetectorEvent, specialists: list[SpecialistResult], gaps: list[str]) -> list[str]:
    out: list[str] = []
    device = next((s for s in specialists if s.name == "device" and s.status == "ok"), None)
    if device and device.findings.get("life_critical"):
        out.append("device_isolate DENIED (life-critical class)")
    elif any(g.startswith("device:") for g in gaps):
        # unknown device class -> assume the most restrictive one
        out.append("device_isolate DENIED (device class unresolved - failing safe)")
    traffic = next((s for s in specialists if s.name == "traffic" and s.status == "ok"), None)
    cardinality = traffic.findings.get("source_cardinality") if traffic else None
    if cardinality in (None, "unknown"):
        # Fail safe: we cannot show per-source blocking would work, so it is off
        # the table. This constraint exists precisely because Traffic Analysis
        # reported the gap instead of guessing.
        out.append("source cardinality unknown - single-source blocking disallowed, prefer upstream rate limiting")
    elif cardinality != "single":
        out.append("single-source blocking ineffective - prefer upstream rate limiting")
    out.append("duration <= 300s without human approval")
    if gaps:
        out.append("confidence reduced: incomplete evidence")
    return out


def _rule_severity(event: DetectorEvent, gaps: list[str]) -> str:
    if event.device_criticality == "Critical":
        return "high"
    if event.device_criticality in ("High",) or gaps:
        return "medium"
    return "low"


def _rule_differences(event: DetectorEvent, prior: RetrievedCase | None) -> list[str]:
    if prior is None:
        return ["no compatible prior case"]
    diffs = []
    if prior.case.device_type != event.device_type:
        diffs.append(f"device class: {prior.case.device_type} -> {event.device_type}")
    if prior.case.attack_subtype != event.attack_subtype:
        diffs.append(f"subtype: {prior.case.attack_subtype} -> {event.attack_subtype}")
    diffs.append(f"source: {prior.case.source_cardinality} -> fanout {event.connection_fanout}")
    return diffs


def _valid_investigation(p: dict[str, Any]) -> bool:
    return p.get("severity") in ("low", "medium", "high") and isinstance(p.get("confirmed_family"), str)


# --------------------------------------------------------------------------- #
# Explainer
# --------------------------------------------------------------------------- #
EXPLAINER_SYSTEM = """You are the Explainer Agent. Produce an audit narrative for a clinical
SOC operator at exactly the requested depth. Do not recommend actions. Do not restate
anything the evidence does not support.

Reply with JSON only: {"text": str}"""


async def explain(
    llm: LLMClient,
    depth: str,
    event: DetectorEvent,
    investigation: InvestigationResult,
    prior: RetrievedCase | None,
) -> Explanation:
    """Explanation depth scales with risk, and is never on the critical path.

    LOW risk gets nothing but a machine event note - generating prose there
    would add latency and cost without adding decision value.
    """
    if depth == "none":
        return Explanation(depth="none", generated_by="skipped", text="")

    payload = await llm.complete_json(
        EXPLAINER_SYSTEM,
        _json_block({
            "depth": depth,
            "detector": event.model_dump(mode="json"),
            "investigation": investigation.model_dump(mode="json"),
            "prior_case": prior.case.model_dump(mode="json") if prior else None,
        }),
        max_tokens=1800 if depth == "detailed" else 500,
    )
    if payload and isinstance(payload.get("text"), str) and payload["text"].strip():
        return Explanation(depth=depth, generated_by="llm", text=payload["text"].strip())  # type: ignore[arg-type]

    # ---- template fallback -------------------------------------------------
    if depth == "one-line":
        sim = f"{prior.similarity:.2f} similar to {prior.case.case_id}; " if prior else ""
        text = (
            f"{sim}{', '.join(investigation.differences_from_prior_case) or 'no material differences'}; "
            f"severity {investigation.severity}."
        )
    else:
        text = (
            f"{investigation.confirmed_family} against {event.device_id} "
            f"({event.device_type}, {event.device_criticality}). Detector confidence "
            f"{event.confidence:.2f}, anomaly {event.anomaly_score:.2f}. "
            f"{investigation.narrative} Constraints: {'; '.join(investigation.response_constraints)}."
        )
        if investigation.evidence_gaps:
            text += f" Evidence gaps: {', '.join(investigation.evidence_gaps)}."
    return Explanation(depth=depth, generated_by="template", text=text)  # type: ignore[arg-type]


# --------------------------------------------------------------------------- #
# Response
# --------------------------------------------------------------------------- #
RESPONSE_SYSTEM = """You are the Response Agent. Recommend ONE bounded containment action from
this set only: upstream_rate_limit, upstream_prefix_ratelimit, temp_source_block,
connection_cap, device_isolate, alert_escalate.

You have no execution authority - a deterministic policy gate validates your recommendation
and may downgrade or reject it. Prefer the least disruptive action that addresses the attack.
Never recommend an action that a response_constraint forbids.

Reply with JSON only:
{"action":str,"duration_s":int,"reversible":bool,"rationale":str}"""

ALLOWED_ACTIONS = {
    "upstream_rate_limit", "upstream_prefix_ratelimit", "temp_source_block",
    "connection_cap", "device_isolate", "alert_escalate",
}

#: Deterministic response table: (life_critical, source_cardinality) -> (action, seconds).
#: This is the Response Agent's non-LLM half. It is consulted whenever the model
#: is unavailable or returns something unusable, and every entry is inside the
#: pre-approved safe action set, so it can never propose an action the Policy
#: Gate has not already sanctioned.
#:
#: "unknown" is a real row, not a fallback-of-a-fallback: when source cardinality
#: cannot be established, per-source blocking cannot be justified, so the table
#: selects upstream rate limiting on both device classes.
FALLBACK_TABLE = {
    (True, "single"): ("upstream_rate_limit", 120),
    (True, "few"): ("upstream_prefix_ratelimit", 180),
    (True, "distributed"): ("upstream_rate_limit", 300),
    (True, "unknown"): ("upstream_rate_limit", 120),
    (False, "single"): ("temp_source_block", 300),
    (False, "few"): ("upstream_prefix_ratelimit", 180),
    (False, "distributed"): ("upstream_rate_limit", 300),
    (False, "unknown"): ("upstream_rate_limit", 300),
}


async def recommend(
    llm: LLMClient,
    event: DetectorEvent,
    investigation: InvestigationResult,
    explanation: Explanation,
    prior: RetrievedCase | None,
) -> ResponseRecommendation:
    payload = await llm.complete_json(
        RESPONSE_SYSTEM,
        _json_block({
            "detector": event.model_dump(mode="json"),
            "investigation": investigation.model_dump(mode="json"),
            "explanation": explanation.text,
            "prior_case_action": prior.case.executed_response if prior else None,
            "prior_case_outcome": prior.case.outcome.value if prior else None,
        }),
    )

    if payload and payload.get("action") in ALLOWED_ACTIONS:
        duration = int(payload.get("duration_s") or 0)
        return ResponseRecommendation(
            action=f"{payload['action']}({duration}s)",
            params={"base_action": payload["action"]},
            duration_s=duration,
            reversible=bool(payload.get("reversible", True)) and payload["action"] != "device_isolate",
            selector="llm_recommendation",
            rationale=str(payload.get("rationale", "")),
            prior_case_action=prior.case.executed_response if prior else None,
            prior_case_outcome=prior.case.outcome if prior else None,
        )

    # ---- deterministic table ----------------------------------------------
    traffic = next((s for s in investigation.specialist_results if s.name == "traffic" and s.status == "ok"), None)
    cardinality = (traffic.findings.get("source_cardinality") if traffic else None) or "unknown"
    if cardinality not in ("single", "few", "distributed"):
        cardinality = "unknown"
    life_critical = any("life-critical" in c or "failing safe" in c for c in investigation.response_constraints)
    action, duration = FALLBACK_TABLE[(life_critical, cardinality)]
    return ResponseRecommendation(
        action=f"{action}({duration}s)",
        params={"base_action": action},
        duration_s=duration,
        reversible=True,
        selector="deterministic_table",
        rationale=(
            f"Selected from the deterministic policy table, row (life_critical={life_critical}, "
            f"source_cardinality={cardinality}). Narrower coverage than the model, but every entry is "
            "inside the pre-approved safe action set."
        ),
        prior_case_action=prior.case.executed_response if prior else None,
        prior_case_outcome=prior.case.outcome if prior else None,
    )


def _json_block(data: dict[str, Any]) -> str:
    import json

    return json.dumps(data, indent=2, default=str)
