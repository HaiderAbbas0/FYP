"""Shared detector confidence payload for APIs, SSE and specialists."""
from __future__ import annotations

from typing import Any

from app.schemas import DetectorEvent


def window_stream_payload(window: Any) -> dict[str, Any]:
    """Window JSON with both confidence fields always present."""
    payload = window.to_json()
    hierarchy = getattr(window, "hierarchy", None)
    if hierarchy:
        payload["window_mean_attack_probability"] = round(float(hierarchy["window_mean_attack_probability"]), 4)
        payload["variant_confidence"] = round(float(hierarchy["chosen_variant_mean_confidence"]), 4)
        payload["attack_variant"] = hierarchy.get("attack_variant")
        payload["attack_family"] = hierarchy.get("attack_family")
        payload["confidence_kind"] = "calibrated"
        payload["p_mean_meaning"] = "window_mean_attack_probability"
    else:
        payload["window_mean_attack_probability"] = round(float(window.p_mean), 4)
        payload["variant_confidence"] = None
        payload["attack_variant"] = None
        payload["attack_family"] = None
        payload["confidence_kind"] = "aggregate"
        payload["p_mean_meaning"] = "legacy_mean_per_flow_attack_probability"
    return payload


def detector_window_log(window: Any, *, detection: bool) -> str:
    payload = window_stream_payload(window)
    variant = payload.get("attack_variant") or "TCP_Flood"
    if detection:
        return (
            f"Detection at window {window.index} (t+{window.t_offset_s}s): "
            f"{window.predicted_attack_rows}/{window.rows} flows labelled {variant}; "
            f"window_mean_attack_probability={payload['window_mean_attack_probability']:.3f}; "
            f"variant_confidence={payload['variant_confidence'] if payload['variant_confidence'] is not None else 'n/a'}"
        )
    return (
        f"Window {window.index} (t+{window.t_offset_s}s): baseline, "
        f"window_mean_attack_probability={payload['window_mean_attack_probability']:.3f}; "
        f"variant_confidence={payload['variant_confidence'] if payload['variant_confidence'] is not None else 'n/a'}"
    )


def event_confidence_fields(event: DetectorEvent) -> dict[str, Any]:
    calibrated = event.confidence_kind == "calibrated"
    return {
        "variant_confidence": event.confidence if calibrated else None,
        "window_mean_attack_probability": event.anomaly_score if calibrated else event.confidence,
        "confidence_kind": event.confidence_kind,
        "attack_variant": event.attack_variant,
        "routing_uses": "variant_confidence" if calibrated else "legacy_p_mean",
    }
