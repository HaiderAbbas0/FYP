"""Compatibility shim: re-exports the PCAP detector from backend.app.detector.

The specialist agents and controller still import from `agents.detector.confidence`;
this module mirrors the names they used (`event_confidence_fields`,
`detector_window_log`, `window_stream_payload`) backed by the trained joblib
bundle in `agents/Detector_Run_2/run_c53a51becb/models/`.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make backend importable as `app` from the agents package.
_HERE = Path(__file__).resolve()
_BACKEND = _HERE.parents[3] / "backend"  # agents/detector/confidence.py -> backend/
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.detector import (  # noqa: E402
    PCAPDetector,
    ReplayProfile,
    WindowResult,
    get_detector,
    detector_mode,
    multiclass_runtime_status,
    DetectorUnavailable,
    FeatureSchemaError,
    window_stream_payload,
    DETECTOR_BUNDLE_PATH,
    PCAP_TEST_DIR,
)


def event_confidence_fields(event: dict) -> dict:
    """Confidence fields read off a DetectorEvent for specialist narratives."""
    return {
        "confidence": event.get("confidence", 0.0),
        "confidence_kind": event.get("confidence_kind", "unknown"),
        "anomaly_score": event.get("anomaly_score", 0.0),
        "attack_variant": event.get("attack_variant"),
        "attack_family": event.get("attack_family"),
        "attack_subtype": event.get("attack_subtype"),
        "attack_binary": event.get("attack_binary"),
        "model_version": event.get("model_version", "unknown"),
        "feature_schema_version": event.get("feature_schema_version", "unknown"),
        "detector_source": event.get("detector_source", "model"),
        "window_index": event.get("window_index"),
    }


def detector_window_log(window, detection: bool = True) -> str:
    """One-line log message for a scored detection window."""
    kind = "DETECTION" if detection else "window"
    variant = getattr(window, "attack_variant", None) or (window or {}).get("attack_variant", "?")
    p_mean = getattr(window, "p_mean", None)
    if p_mean is None and isinstance(window, dict):
        p_mean = window.get("p_mean")
    return f"[{kind}] variant={variant} p_mean={p_mean:.3f}" if p_mean is not None else f"[{kind}] variant={variant}"


__all__ = [
    "PCAPDetector",
    "ReplayProfile",
    "WindowResult",
    "get_detector",
    "detector_mode",
    "multiclass_runtime_status",
    "DetectorUnavailable",
    "FeatureSchemaError",
    "window_stream_payload",
    "event_confidence_fields",
    "detector_window_log",
    "DETECTOR_BUNDLE_PATH",
    "PCAP_TEST_DIR",
]
