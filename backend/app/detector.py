"""PCAP-based detector backed by the trained joblib bundle from `Detector_Run_2`.

Loads `agents/Detector_Run_2/run_c53a51becb/models/detector_bundle.joblib` and
streams PCAP captures through `iomt_inference.predict_pcap_stream`, aggregating
per-packet scores into windows the planner and UI consume.

Replaces the old CSV-based detector (agents/detector/artifacts/legacy) entirely.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np

# ---------------------------------------------------------------------------
# Stub torch so the joblib bundle (which pickles torch type references even for
# a tabular decision-tree model) can be unpickled without torch installed.
# The actual model is a scikit-learn Pipeline; torch is never executed.
# The stub is a package (has __path__) so `torch.torch_version` resolves.
# ---------------------------------------------------------------------------
import types as _types

_torch_stub = _types.ModuleType("torch")
_torch_stub.__path__ = []
_torch_stub.Tensor = object
_torch_stub.nn = _types.ModuleType("nn")
_torch_stub.nn.Module = object
_torch_stub.utils = _types.ModuleType("utils")
_torch_stub.float32 = "float32"
_torch_stub.float64 = "float64"
_torch_stub.int64 = "int64"
_torch_stub.device = "cpu"


def _stub_no_grad():
    class _Ctx:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    return _Ctx()


_torch_stub.no_grad = _stub_no_grad
_torch_stub.jit = _types.ModuleType("jit")
_torch_stub.jit.ScriptModule = object
_torch_stub.torch_version = "999.0"
# torch.torch_version is imported as a submodule by some pickled objects
_torch_version_stub = _types.ModuleType("torch.torch_version")
_torch_version_stub.__version__ = "999.0"


class _TorchVersion:
    def __new__(cls, *a, **k):
        instance = super().__new__(cls)
        instance.major = 999
        instance.minor = 0
        instance.patch = 0
        return instance


_torch_version_stub.TorchVersion = _TorchVersion
sys.modules["torch"] = _torch_stub
sys.modules["torch.nn"] = _torch_stub.nn
sys.modules["torch.utils"] = _torch_stub.utils
sys.modules["torch.jit"] = _torch_stub.jit
sys.modules["torch.torch_version"] = _torch_version_stub

# ---------------------------------------------------------------------------
# paths (config lives in backend/app/config.py; import lazily to avoid cycles)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve()
_BACKEND = _HERE.parent.parent
_PROJECT_ROOT = _BACKEND.parent

DETECTOR_RUN_DIR = _PROJECT_ROOT / "agents" / "Detector_Run_2" / "run_c53a51becb"
DETECTOR_BUNDLE_PATH = DETECTOR_RUN_DIR / "models" / "detector_bundle.joblib"
DETECTOR_MODELS_DIR = DETECTOR_RUN_DIR / "models"
PCAP_TEST_DIR = _PROJECT_ROOT / "data" / "pcap_test"

MODEL_CARD_PATH = DETECTOR_MODELS_DIR / "model_card.json"
FEATURE_SCHEMA_PATH = DETECTOR_MODELS_DIR / "feature_schema.json"

# Make the bundle folder importable so `iomt_runtime` / `iomt_torch_models`
# referenced inside the pickled pipeline resolve at load time.
if str(DETECTOR_MODELS_DIR) not in sys.path:
    sys.path.insert(0, str(DETECTOR_MODELS_DIR))

# Reuse the training runtime for live streaming (same file training used).
try:  # trained runtime ships next to the bundle
    import iomt_runtime as _rt  # noqa: E402
except Exception:  # pragma: no cover - fallback to the local copy
    _rt = None  # type: ignore[assignment]

from iomt_inference import load_detector, predict_pcap_stream  # noqa: E402


# ---------------------------------------------------------------------------
# window / profile dataclasses consumed by incidents.py and the UI
# ---------------------------------------------------------------------------
@dataclass
class ReplayProfile:
    """Configuration for one capture-replay run (attack mix + windowing)."""

    attack_ratio: float = 1.0
    seed: int = 42
    window_seconds: float = 5.0
    rows_per_window: int = 1000


@dataclass
class WindowResult:
    """One scored slice of a PCAP stream - the detector's 'window' of evidence."""

    index: int
    t_offset_s: float
    p_mean: float
    p_max: float
    rows: int
    predicted_attack_rows: int
    is_detection: bool
    attack_family: str = "unknown"
    attack_subtype: str = "unknown"
    attack_variant: str | None = None
    attack_binary: str = "Benign"
    hierarchy: dict[str, Any] = field(default_factory=dict)
    top_features: list[dict[str, Any]] = field(default_factory=list)
    sample_row: dict[str, Any] = field(default_factory=dict)
    stats: dict[str, Any] = field(default_factory=dict)
    model_version: str = "unknown"
    feature_schema_version: str = "unknown"


# ---------------------------------------------------------------------------
# detector
# ---------------------------------------------------------------------------
class PCAPDetector:
    """Live PCAP detector wrapping the trained joblib bundle."""

    def __init__(self, bundle_path: Path | str | None = None):
        self.bundle_path = Path(bundle_path or DETECTOR_BUNDLE_PATH)
        self._bundle: dict[str, Any] | None = None
        self._model_card: dict[str, Any] | None = None
        self._feature_schema: dict[str, Any] | None = None

    # -- loading -----------------------------------------------------------
    def _load_bundle(self) -> dict[str, Any]:
        if self._bundle is None:
            if not self.bundle_path.exists():
                raise FileNotFoundError(f"detector bundle not found: {self.bundle_path}")
            self._bundle = load_detector(str(self.bundle_path))
        return self._bundle

    def _load_json(self, path: Path) -> dict[str, Any]:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return {}

    def info(self) -> dict[str, Any]:
        """Model card for the trained detector - what it is and what it covers."""
        if self._model_card is None:
            self._model_card = self._load_json(MODEL_CARD_PATH)
        card = dict(self._model_card)
        card["bundle_path"] = str(self.bundle_path)
        card["models_dir"] = str(DETECTOR_MODELS_DIR)
        card["pcap_test_dir"] = str(PCAP_TEST_DIR)
        card["loaded"] = self._bundle is not None
        if not card.get("classes") and self._bundle is not None:
            card["classes"] = self._bundle.get("classes", [])
        card["detector_mode"] = "pcap"
        card["model_kind"] = self._bundle.get("model_kind") if self._bundle else None
        card["feature_schema_version"] = (
            self._bundle.get("feature_version") if self._bundle else "unknown"
        )
        card["runtime_version"] = (
            self._bundle.get("runtime_version") if self._bundle else "unknown"
        )
        return card

    # -- scoring -----------------------------------------------------------
    def _score_pcap(
        self,
        pcap_path: Path,
        batch_size: int = 1000,
        max_packets: int | None = None,
    ) -> list[dict[str, Any]]:
        """Run predict_pcap_stream over one capture; returns incident dicts."""
        bundle = self._load_bundle()
        incidents: list[dict[str, Any]] = []
        for inc in predict_pcap_stream(
            str(pcap_path), bundle, batch_size=batch_size, emit="all", max_packets=max_packets
        ):
            incidents.append(inc)
        return incidents

    def _incidents_to_windows(
        self, incidents: list[dict[str, Any]], window_seconds: float = 5.0
    ) -> list[WindowResult]:
        """Aggregate per-packet incidents into time windows."""
        if not incidents:
            return []
        windows: list[WindowResult] = []
        # Group incidents into windows by timestamp
        start_ts = datetime.fromisoformat(incidents[0]["timestamp"].replace("Z", "+00:00")).timestamp()
        cur_window: list[dict[str, Any]] = []
        window_index = 0
        window_start = start_ts

        def flush(window_idx: int, win_start: float, rows: list[dict[str, Any]]) -> WindowResult | None:
            if not rows:
                return None
            probs = [r["confidence"] for r in rows]
            attack_rows = [r for r in rows if r["attack_binary"] == "Attack"]
            p_mean = float(np.mean(probs))
            p_max = float(max(probs))
            variants = {}
            for r in rows:
                v = r.get("attack_variant") or "unknown"
                variants[v] = variants.get(v, 0) + 1
            top_variant = max(variants, key=variants.get) if variants else "unknown"
            hierarchy = {
                "attack_variant": top_variant,
                "attack_family": rows[0].get("attack_family", "unknown"),
                "attack_subtype": rows[0].get("attack_subtype", "unknown"),
                "attack_binary": rows[0].get("attack_binary", "Benign"),
                "chosen_variant_mean_confidence": p_mean,
                "window_mean_attack_probability": p_mean,
                "window_max_attack_probability": p_max,
                "model_version": rows[0].get("model_version", "unknown"),
                "feature_schema_version": "v1.1-long-horizon",
            }
            return WindowResult(
                index=window_idx,
                t_offset_s=round(win_start - start_ts, 3),
                p_mean=round(p_mean, 4),
                p_max=round(p_max, 4),
                rows=len(rows),
                predicted_attack_rows=len(attack_rows),
                is_detection=p_mean > 0.5,
                attack_variant=top_variant,
                attack_family=rows[0].get("attack_family", "unknown"),
                attack_subtype=rows[0].get("attack_subtype", "unknown"),
                attack_binary=rows[0].get("attack_binary", "Benign"),
                hierarchy=hierarchy,
                top_features=[],
                sample_row=rows[0],
                stats={"rate": p_mean, "attack_ratio": len(attack_rows) / len(rows)},
                model_version=rows[0].get("model_version", "unknown"),
                feature_schema_version="v1.1-long-horizon",
            )

        for inc in incidents:
            ts = datetime.fromisoformat(inc["timestamp"].replace("Z", "+00:00")).timestamp()
            if ts - window_start >= window_seconds:
                w = flush(window_index, window_start, cur_window)
                if w is not None:
                    windows.append(w)
                window_index += 1
                window_start = ts
                cur_window = [inc]
            else:
                cur_window.append(inc)
        w = flush(window_index, window_start, cur_window)
        if w is not None:
            windows.append(w)
        return windows

    def replay(self, profile: ReplayProfile, max_packets: int | None = None) -> list[WindowResult]:
        """Score every PCAP in `PCAP_TEST_DIR` and return aggregated windows."""
        bundle = self._load_bundle()
        windows: list[WindowResult] = []
        if not PCAP_TEST_DIR.exists():
            return windows
        pcap_files = sorted(PCAP_TEST_DIR.glob("*.pcap")) + sorted(PCAP_TEST_DIR.glob("*.pcapng"))
        window_index = 0
        for pcap_path in pcap_files:
            incidents = self._score_pcap(pcap_path, batch_size=1000, max_packets=max_packets)
            cap_windows = self._incidents_to_windows(incidents, profile.window_seconds)
            for w in cap_windows:
                w.index = window_index
                window_index += 1
                windows.append(w)
        return windows

    def detect_capture(self, pcap_path: Path | str, max_packets: int | None = None) -> list[dict[str, Any]]:
        """Score one PCAP file and return raw incident dicts."""
        return self._score_pcap(Path(pcap_path), max_packets=max_packets)


# ---------------------------------------------------------------------------
# module-level singleton + helpers used by main.py / incidents.py
# ---------------------------------------------------------------------------
_detector: PCAPDetector | None = None


def get_detector() -> PCAPDetector:
    global _detector
    if _detector is None:
        _detector = PCAPDetector()
    return _detector


def detector_mode() -> str:
    """Which detector backend is active."""
    return os.getenv("IDS_DETECTOR", "pcap")


def multiclass_runtime_status() -> dict[str, Any]:
    """Compatibility shim: the pcap detector is always 'available' when its bundle loads."""
    try:
        get_detector()._load_bundle()
        return {"requested": "pcap", "available": True, "mode": "pcap"}
    except Exception as exc:  # pragma: no cover - defensive
        return {"requested": "pcap", "available": False, "mode": "pcap", "detail": str(exc)}


class DetectorUnavailable(Exception):
    """Raised when the detector bundle cannot be loaded."""


class FeatureSchemaError(Exception):
    """Raised when a capture's feature schema does not match the bundle's."""


def window_stream_payload(window: WindowResult | None) -> dict[str, Any] | None:
    """Serialize a WindowResult for the detector-replay / detector-info endpoints."""
    if window is None:
        return None
    h = window.hierarchy or {}
    return {
        "index": window.index,
        "t_offset_s": window.t_offset_s,
        "p_mean": window.p_mean,
        "p_max": window.p_max,
        "rows": window.rows,
        "predicted_attack_rows": window.predicted_attack_rows,
        "is_detection": window.is_detection,
        "attack_variant": window.attack_variant,
        "attack_family": window.attack_family,
        "attack_subtype": window.attack_subtype,
        "attack_binary": window.attack_binary,
        "variant_confidence": window.p_mean,
        "window_mean_attack_probability": window.p_mean,
        "window_max_attack_probability": window.p_max,
        "confidence_kind": "calibrated",
        "chosen_variant_mean_confidence": window.p_mean,
        "model_version": window.model_version,
        "feature_schema_version": window.feature_schema_version,
        "hierarchy": h,
        "top_features": window.top_features,
        "sample_row": window.sample_row,
        "stats": window.stats,
    }


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
    "DETECTOR_BUNDLE_PATH",
    "PCAP_TEST_DIR",
]
