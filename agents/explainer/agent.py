"""Explainer agent: validated LLM reasoning with deterministic fallback."""
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

from .prompts import EXPLAINER_SYSTEM


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

