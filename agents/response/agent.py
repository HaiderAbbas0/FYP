"""Response agent: validated LLM reasoning with deterministic fallback."""
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

from .prompts import RESPONSE_SYSTEM


ALLOWED_ACTIONS = ACTION_NAMES


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

    if payload and isinstance(payload.get("action"), str) and payload.get("action") in ALLOWED_ACTIONS:
        raw_duration = payload.get("duration_s")
        raw_reversible = payload.get("reversible", True)
        duration_valid = isinstance(raw_duration, int) and not isinstance(raw_duration, bool) and 1 <= raw_duration <= 86_400
        reversible_valid = isinstance(raw_reversible, bool)
        if not duration_valid or not reversible_valid:
            payload = None
        else:
            duration = raw_duration
            action_name = str(payload["action"])
            return ResponseRecommendation(
                action=format_action(action_name, duration),
                params={"base_action": action_name},
                duration_s=duration,
                reversible=raw_reversible and action_name != "device_isolate",
                selector="llm_recommendation",
                rationale=str(payload.get("rationale", ""))[:2000],
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
        action=format_action(action, duration),
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

