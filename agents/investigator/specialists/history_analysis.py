"""Recurrence, counted from the real case store.

Distinct from the Memory Agent: memory asks "have we solved something like
this before"; this asks "how often has this device seen this family recently".
Recurrence changes the containment duration, not the action."""

from __future__ import annotations

import asyncio
from typing import Any

from agents.detector.confidence import event_confidence_fields
from app.attack_class import FAMILY_CONNECTION, FAMILY_SESSION, classify, label_uncertainty
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult



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
