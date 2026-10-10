"""Investigator agent: validated LLM reasoning with deterministic fallback."""
from __future__ import annotations
from typing import Any
from app.action_catalog import ACTION_NAMES, format_action
from app.llm import LLMClient
from app.schemas import (
    DetectorEvent,
    Explanation,
    InvestigationResult,
    Outcome,
    ResponseRecommendation,
    RetrievedCase,
    SpecialistResult,
)
from agents.common import json_block as _json_block

from .prompts import INVESTIGATOR_SYSTEM


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

