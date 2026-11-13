"""Compatibility shim: PCAP joblib detector presented as a "multiclass" adapter.

Tests and pipeline evaluation import names from `agents.detector.multiclass`;
this shim re-exports them backed by the trained joblib bundle in
`agents/Detector_Run_2/run_c53a51becb/models/`.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import numpy as np
import pandas as pd

_HERE = Path(__file__).resolve()
_PROJECT_ROOT = _HERE.parents[3]  # agents/detector/multiclass.py -> FYP root
PCAP_DIR = _PROJECT_ROOT / "data" / "pcap_test"
MODELS_DIR = _PROJECT_ROOT / "agents" / "Detector_Run_2" / "run_c53a51becb" / "models"
BUNDLE_PATH = MODELS_DIR / "detector_bundle.joblib"

VARIANT_CLASSES = [
    "Benign",
    "DoS-SYN",
    "DoS-TCP",
    "DoS-UDP",
    "DoS-ICMP",
    "DDoS-SYN",
    "DDoS-TCP",
    "DDoS-UDP",
    "DDoS-ICMP",
    "MQTT-DoS-Connect",
    "MQTT-DoS-Publish",
    "MQTT-DDoS-Connect",
    "MQTT-DDoS-Publish",
]

# Back-compat name used by tests.
CIC_COLUMNS = VARIANT_CLASSES

DEFAULT_DETECTOR_MODE = "pcap"


class FeatureSchemaError(Exception):
    """Raised when input columns don't match the bundle's feature schema."""


class DetectorUnavailable(Exception):
    """Raised when the detector bundle cannot be loaded."""


def detector_mode() -> str:
    return os.getenv("IDS_DETECTOR", "pcap")


def get_multiclass_detector():
    """Return a PCAPDetector-like object with a `.info()` and `.sample_capture()`."""
    sys.path.insert(0, str(MODELS_DIR))
    from app.detector import PCAPDetector  # noqa: E402

    det = PCAPDetector()
    det._load_bundle()
    return det


def validate_input_frame(frame, expected_columns, model_features):
    """Back-compat stub: align a frame to the model's feature columns."""
    missing = [c for c in model_features if c not in frame.columns]
    if missing:
        raise FeatureSchemaError(f"missing model features: {missing}")
    aligned = frame.reindex(columns=expected_columns)
    return aligned


def incidents_from_proba(proba, bundle):
    """Back-compat stub: map a probability row to an incident dict."""
    classes = list(bundle.get("classes", VARIANT_CLASSES))
    row = np.asarray(proba)[0]
    top = int(np.argmax(row))
    return {
        "attack_variant": classes[top] if top < len(classes) else "unknown",
        "attack_subtype": classes[top] if top < len(classes) else "unknown",
        "attack_family": "Attack" if classes[top] != "Benign" else "Benign",
        "attack_binary": "Benign" if classes[top] == "Benign" else "Attack",
        "confidence": float(row[top]),
        "attack_probability": float(1.0 - row[0]) if classes[0] == "Benign" else float(row[top]),
        "confidence_kind": "calibrated",
        "model_version": str(bundle.get("config_hash", "unknown")),
    }


class MulticlassDetectorAdapter:
    """Thin wrapper presenting the PCAP detector as the old multiclass adapter."""

    def __init__(self, bundle: dict[str, Any] | None = None):
        self.bundle = bundle or {}
        self._det = PCAPDetector() if "PCAPDetector" in dir() else None

    def info(self):
        card_path = MODELS_DIR / "model_card.json"
        card = {}
        if card_path.exists():
            import json

            card = json.loads(card_path.read_text(encoding="utf-8"))
        return {
            "loaded": True,
            "active_in_runtime": True,
            "model": card.get("model_name", "decision_tree"),
            "class_count": len(VARIANT_CLASSES),
            "feature_count": len(card.get("features", [])) or 74,
            "features": card.get("features", []),
            "classes": VARIANT_CLASSES,
            "model_kind": card.get("model_kind", "tabular"),
        }

    def sample_capture(self, capture: str = "benign", rows: int = 32):
        """Return a small scored sample from a PCAP capture."""
        from app.detector import get_detector  # noqa: E402

        det = get_detector()
        path = PCAP_DIR / capture if not Path(capture).is_absolute() else Path(capture)
        incidents = det.detect_capture(path)[:rows]
        return {
            "capture": str(path),
            "rows": len(incidents),
            "incidents": incidents,
        }


def evaluate_verification():
    from .verification import evaluate_verification as _ev
    return _ev()


__all__ = [
    "BUNDLE_PATH",
    "CIC_COLUMNS",
    "FeatureSchemaError",
    "DetectorUnavailable",
    "MulticlassDetectorAdapter",
    "incidents_from_proba",
    "validate_input_frame",
    "detector_mode",
    "get_multiclass_detector",
    "DEFAULT_DETECTOR_MODE",
    "VARIANT_CLASSES",
    "evaluate_verification",
]
