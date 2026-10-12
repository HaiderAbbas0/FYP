"""Flow-rate and packet-shape profile, computed from the scored window.

Source cardinality is the one thing it cannot answer: the feature schema has
no addresses. It says so, and the Policy Gate then refuses single-source
blocking rather than assuming it would work."""

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
    _traffic_summary,
)


async def traffic_analysis(event: DetectorEvent, stats: dict[str, Any]) -> SpecialistResult:
    """Flow-rate and packet-shape profile, computed from the scored window.

    Source cardinality is the one thing it cannot answer: the feature schema has
    no addresses. It says so, and the Policy Gate then refuses single-source
    blocking rather than assuming it would work.
    """
    await asyncio.sleep(0.06)
    shape = classify(event)
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
            "attack_shape": shape,
            "rate_profile_is_diagnostic": shape != FAMILY_CONNECTION,
            "label_uncertainty": label_uncertainty(event),
            "detector": event_confidence_fields(event),
        },
        summary=_traffic_summary(shape, rate_r, size_r),
    )
