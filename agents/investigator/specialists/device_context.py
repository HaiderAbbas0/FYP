"""Clinical role and the hard operational limits for this device class.

Sourced from the testbed device registry, not from the capture - the feature
schema has no device identity. Labelled as such."""

from __future__ import annotations

import asyncio
from typing import Any

from agents.detector.confidence import event_confidence_fields
from app.attack_class import FAMILY_CONNECTION, FAMILY_SESSION, classify, label_uncertainty
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult



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
