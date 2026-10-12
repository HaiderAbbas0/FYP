"""Indicator lookup. Genuinely unavailable in this PoC, and advisory when it is.

Needs source addresses and a reputation feed. The capture feature schema
contains neither and no feed is wired up, so this worker returns no finding.
Advisory by design, so losing it never blocks containment."""

from __future__ import annotations

import asyncio
from typing import Any

from agents.detector.confidence import event_confidence_fields
from app.attack_class import FAMILY_CONNECTION, FAMILY_SESSION, classify, label_uncertainty
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult



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
