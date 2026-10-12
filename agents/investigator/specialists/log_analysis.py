"""Connection-state evidence, read from the capture's own TCP counters.

The feature schema carries no service or authentication logs, so this worker
reports what the capture genuinely contains: TCP flag counts and connection
reset behaviour, each against the benign baseline. What those counters can
legitimately say depends on the attack shape."""

from __future__ import annotations

import asyncio
from typing import Any

from agents.detector.confidence import event_confidence_fields
from app.attack_class import FAMILY_CONNECTION, FAMILY_SESSION, classify, label_uncertainty
from app.memory import LIFE_CRITICAL_CLASSES
from app.schemas import DetectorEvent, SpecialistResult

from .common import (
    _connection_state_summary,
    _missing_stats,
    _ratio,
    _stat,
)


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

    shape = classify(event)
    finding = _connection_state_summary(shape, rst_ratio)

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
            "attack_shape": shape,
            "counters_diagnostic_for_this_attack": shape == FAMILY_CONNECTION,
            "label_uncertainty": label_uncertainty(event),
            "not_available": [
                "authentication events", "service/broker logs", "process and CPU telemetry",
            ],
            "reason_unavailable": "CICIoMT2024 features are post-extraction network flows; no host or service logs are in scope",
        },
        summary=finding,
    )
