"""Staged multiclass detector adapter.

Loads Hamd's LightGBM bundle and emits the incident object from the training
notebook. This module is intentionally separate from `agent.py` so the legacy
binary RandomForest path stays the default runtime detector.

Capture-replay uses this adapter only when `IDS_DETECTOR=multiclass`. The default
remains the legacy binary RandomForest in `agent.py`. Inspect it via
`GET /api/detector/multiclass/info` and the sample endpoint, or from tests.
"""

from __future__ import annotations

import os
from collections import Counter
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Mapping

import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parents[2]
BUNDLE_PATH = REPO / "agents" / "detector" / "artifacts" / "multiclass" / "detector_bundle.joblib"
BEST_MODEL_POINTER = REPO / "agents" / "detector" / "artifacts" / "multiclass" / "best_model.json"

CIC_COLUMNS = [
    "Header_Length", "Protocol Type", "Duration", "Rate", "Srate", "Drate",
    "fin_flag_number", "syn_flag_number", "rst_flag_number", "psh_flag_number",
    "ack_flag_number", "ece_flag_number", "cwr_flag_number",
    "ack_count", "syn_count", "fin_count", "rst_count",
    "HTTP", "HTTPS", "DNS", "Telnet", "SMTP", "SSH", "IRC",
    "TCP", "UDP", "DHCP", "ARP", "ICMP", "IGMP", "IPv", "LLC",
    "Tot sum", "Min", "Max", "AVG", "Std", "Tot size",
    "IAT", "Number", "Magnitue", "Radius", "Covariance", "Variance", "Weight",
]

SAMPLE_CAPTURES = {
    "benign": REPO / "data" / "Benign_test.pcap.csv",
    "dos-tcp": REPO / "data" / "detector" / "TCP_IP-DoS-TCP_test.pcap.csv",
    "mqtt-dos-connect": REPO / "data" / "MQTT-DoS-Connect_Flood_test.pcap.csv",
}

REQUIRED_BUNDLE_KEYS = (
    "pipeline",
    "calibrator",
    "classes",
    "eval_levels",
    "features",
    "model_name",
    "config_hash",
)


def detector_mode() -> str:
    """Active capture-replay detector. Default is the legacy binary RF."""
    value = os.getenv("IDS_DETECTOR", "legacy").strip().lower()
    if value in {"multiclass", "lightgbm"}:
        return "multiclass"
    return "legacy"


class DetectorUnavailable(RuntimeError):
    """Bundle, dependency, or artifact is missing."""


class FeatureSchemaError(ValueError):
    """Rows cannot be scored without inventing a missing feature set."""


def validate_input_frame(
    rows: pd.DataFrame | Mapping[str, Any] | list[Mapping[str, Any]],
    *,
    expected_columns: list[str],
    model_features: list[str],
) -> pd.DataFrame:
    """Align CIC columns and refuse a completely missing model-feature set.

    Hamd's notebook reindexes to expected columns and lets the preprocessor
    impute NaNs. That is acceptable when *some* model features are present.
    Imputing every model feature from an empty frame would be a silent fake
    score, so that case is rejected.
    """
    frame = pd.DataFrame(rows)
    if frame.empty:
        raise FeatureSchemaError("no rows to score")
    present_model = [name for name in model_features if name in frame.columns]
    if not present_model:
        raise FeatureSchemaError(
            "none of the multiclass model features are present; refusing to impute an empty feature set"
        )
    aligned = frame.reindex(columns=expected_columns)
    model_block = aligned.reindex(columns=model_features)
    if bool(model_block.isna().all().all()):
        raise FeatureSchemaError(
            "every model feature is missing after alignment; refusing to impute an empty feature set"
        )
    return aligned


def incidents_from_proba(
    probability: np.ndarray,
    bundle: Mapping[str, Any],
    *,
    device_type: str = "unknown",
    src_ip: str | None = None,
    dst_ip: str | None = None,
) -> list[dict[str, Any]]:
    """Map calibrated class probabilities to Hamd's incident dictionaries."""
    classes = list(bundle["classes"])
    train_level = bundle.get("train_level", "variant")
    levels = {
        level: (spec["names"], np.asarray(spec["matrix"]))
        for level, spec in bundle["eval_levels"].items()
    }
    top_features = list(bundle.get("top_features") or [])
    out: list[dict[str, Any]] = []
    for row_p in np.asarray(probability, dtype=float):
        if row_p.ndim != 1 or row_p.shape[0] != len(classes):
            raise ValueError("probability row does not match bundle class order")
        if not np.isfinite(row_p).all():
            raise ValueError("non-finite class probability")
        idx = int(row_p.argmax())
        incident: dict[str, Any] = {
            f"attack_{train_level}": classes[idx],
            "confidence": round(float(row_p[idx]), 4),
        }
        for level, (names, matrix) in levels.items():
            collapsed = row_p @ matrix
            if level != train_level:
                incident[f"attack_{level}"] = names[int(collapsed.argmax())]
            if level == "binary":
                incident["attack_probability"] = round(float(collapsed[list(names).index("Attack")]), 4)
        top3 = np.argsort(row_p)[::-1][:3]
        incident["top3"] = [(classes[int(j)], round(float(row_p[int(j)]), 4)) for j in top3]
        incident.update({
            "device_type": device_type,
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "top_features": top_features,
            "model": bundle["model_name"],
            "model_version": bundle["config_hash"],
            "confidence_kind": "calibrated",
        })
        out.append(incident)
    return out


@dataclass
class WindowScore:
    """Window summary that keeps variant confidence off the attack-probability mean."""

    rows: int
    predicted_attack_rows: int
    window_mean_attack_probability: float
    window_max_attack_probability: float
    chosen_variant: str
    chosen_variant_mean_confidence: float
    attack_subtype: str
    attack_family: str
    attack_binary: str
    incidents: list[dict[str, Any]] = field(default_factory=list)

    def to_json(self) -> dict[str, Any]:
        counts = Counter(item.get("attack_variant", item.get("attack_family")) for item in self.incidents)
        return {
            "rows": self.rows,
            "predicted_attack_rows": self.predicted_attack_rows,
            "window_mean_attack_probability": round(self.window_mean_attack_probability, 4),
            "window_max_attack_probability": round(self.window_max_attack_probability, 4),
            "chosen_variant": self.chosen_variant,
            "chosen_variant_mean_confidence": round(self.chosen_variant_mean_confidence, 4),
            "attack_subtype": self.attack_subtype,
            "attack_family": self.attack_family,
            "attack_binary": self.attack_binary,
            "variant_counts": dict(counts),
            "sample_incident": self.incidents[0] if self.incidents else None,
        }


class MulticlassDetectorAdapter:
    def __init__(self, bundle_path: Path | None = None, bundle: Mapping[str, Any] | None = None) -> None:
        if bundle is not None:
            self.bundle = dict(bundle)
            self.bundle_path = bundle_path
        else:
            path = Path(bundle_path) if bundle_path else BUNDLE_PATH
            if not path.exists():
                raise DetectorUnavailable(f"multiclass bundle not found: {path}")
            try:
                import joblib
            except ImportError as exc:  # pragma: no cover
                raise DetectorUnavailable("joblib is required to load the multiclass bundle") from exc
            try:
                loaded = joblib.load(path)
            except Exception as exc:  # noqa: BLE001 - missing lightgbm surfaces here
                raise DetectorUnavailable(f"failed to load multiclass bundle: {type(exc).__name__}: {exc}") from exc
            self.bundle = loaded
            self.bundle_path = path
        missing = [key for key in REQUIRED_BUNDLE_KEYS if key not in self.bundle]
        if missing:
            raise DetectorUnavailable(f"multiclass bundle missing keys: {missing}")
        self.expected_columns = list(self.bundle.get("expected_columns") or CIC_COLUMNS)
        self.features = list(self.bundle["features"])
        self.classes = list(self.bundle["classes"])
        self._pools: dict[str, pd.DataFrame] = {}

    def prepare(self, rows: pd.DataFrame | Mapping[str, Any] | list[Mapping[str, Any]]) -> pd.DataFrame:
        return validate_input_frame(
            rows,
            expected_columns=self.expected_columns,
            model_features=self.features,
        )

    def _probabilities(self, aligned: pd.DataFrame, *, use_calibrated: bool = True) -> np.ndarray:
        prep = self.bundle["pipeline"].named_steps["prep"]
        features = prep.transform(aligned)
        try:
            names = list(prep.get_feature_names_out())
            features = pd.DataFrame(features, columns=names)
        except Exception:  # pragma: no cover - older transformers without names
            pass
        model = (
            self.bundle["calibrator"]
            if use_calibrated and self.bundle.get("calibrator") is not None
            else self.bundle["pipeline"].named_steps["clf"]
        )
        probability = np.asarray(model.predict_proba(features), dtype=float)
        if probability.shape != (len(aligned), len(self.classes)):
            raise DetectorUnavailable("model output shape does not match bundle class list")
        if not np.isfinite(probability).all():
            raise DetectorUnavailable("model produced non-finite probabilities")
        return probability

    def predict_incidents(
        self,
        rows: pd.DataFrame | Mapping[str, Any] | list[Mapping[str, Any]],
        *,
        device_type: str = "unknown",
        src_ip: str | None = None,
        dst_ip: str | None = None,
        use_calibrated: bool = True,
    ) -> list[dict[str, Any]]:
        aligned = self.prepare(rows)
        probability = self._probabilities(aligned, use_calibrated=use_calibrated)
        return incidents_from_proba(
            probability,
            self.bundle,
            device_type=device_type,
            src_ip=src_ip,
            dst_ip=dst_ip,
        )

    def score_window(
        self,
        rows: pd.DataFrame | Mapping[str, Any] | list[Mapping[str, Any]],
        **kwargs: Any,
    ) -> WindowScore:
        incidents = self.predict_incidents(rows, **kwargs)
        attack_p = np.asarray([item["attack_probability"] for item in incidents], dtype=float)
        variants = [item.get("attack_variant", "") for item in incidents]
        chosen = Counter(variants).most_common(1)[0][0]
        chosen_conf = float(np.mean([
            item["confidence"] for item in incidents if item.get("attack_variant") == chosen
        ]))
        representative = next(item for item in incidents if item.get("attack_variant") == chosen)
        predicted_attack = int(sum(1 for item in incidents if item.get("attack_binary") == "Attack"))
        return WindowScore(
            rows=len(incidents),
            predicted_attack_rows=predicted_attack,
            window_mean_attack_probability=float(attack_p.mean()),
            window_max_attack_probability=float(attack_p.max()),
            chosen_variant=chosen,
            chosen_variant_mean_confidence=chosen_conf,
            attack_subtype=str(representative.get("attack_subtype", "")),
            attack_family=str(representative.get("attack_family", "")),
            attack_binary=str(representative.get("attack_binary", "")),
            incidents=incidents,
        )

    def sample_capture(self, capture: str, rows: int = 32) -> dict[str, Any]:
        path = SAMPLE_CAPTURES.get(capture)
        if path is None or not path.exists():
            raise FileNotFoundError(f"unknown or missing capture: {capture}")
        frame = pd.read_csv(path, nrows=max(1, min(rows, 256)))
        window = self.score_window(frame)
        payload = window.to_json()
        payload["capture"] = capture
        payload["capture_file"] = path.name
        payload["active_in_runtime"] = detector_mode() == "multiclass"
        payload["note"] = (
            "Window-mean attack probability is the mean P(Attack) over rows. "
            "chosen_variant_mean_confidence is the mean calibrated P(variant) "
            "for the majority predicted variant. These are not the same quantity."
        )
        return payload

    def info(self) -> dict[str, Any]:
        pointer = {}
        if BEST_MODEL_POINTER.exists():
            import json
            pointer = json.loads(BEST_MODEL_POINTER.read_text(encoding="utf-8"))
        return {
            "loaded": True,
            "active_in_runtime": detector_mode() == "multiclass",
            "model": self.bundle.get("model_name"),
            "model_version": self.bundle.get("config_hash"),
            "train_level": self.bundle.get("train_level", "variant"),
            "class_count": len(self.classes),
            "classes": self.classes,
            "feature_count": len(self.features),
            "features": self.features,
            "expected_columns": self.expected_columns,
            "excluded_shortcut_features": self.bundle.get("excluded_shortcut_features") or ["IAT", "Number", "Weight"],
            "best_model_pointer": pointer,
            "bundle_path": str(self.bundle_path) if self.bundle_path else None,
            "note": (
                "GET /api/detector/info remains the legacy RandomForest card. "
                "capture_replay uses this bundle only when IDS_DETECTOR=multiclass. "
                "Do not apply the legacy 45-feature scaler to this bundle."
            ),
        }

    def pool(self, kind: str, capture: str = "tcp-dos") -> pd.DataFrame:
        from agents.detector.agent import POOL_ROWS
        from agents.detector.captures import ATTACK_CAPTURES, BENIGN_CAPTURE

        if kind == "benign":
            path = BENIGN_CAPTURE
            key = "benign"
        else:
            path = ATTACK_CAPTURES.get(capture)
            if path is None or not path.exists():
                raise FileNotFoundError(f"unknown or missing attack capture: {capture}")
            key = f"attack:{capture}"
        if key not in self._pools:
            frame = pd.read_csv(path, nrows=POOL_ROWS)
            self._pools[key] = frame.reset_index(drop=True)
        return self._pools[key]

    def window_stats(self, df: pd.DataFrame) -> dict[str, Any]:
        from agents.detector.agent import DetectorAgent

        ben = self.pool("benign")
        out: dict[str, Any] = {}
        for column in DetectorAgent.STAT_COLS:
            if column not in df.columns or column not in ben.columns:
                continue
            measured = float(df[column].mean())
            baseline = float(ben[column].mean())
            out[column] = {
                "mean": round(measured, 4),
                "max": round(float(df[column].max()), 4),
                "baseline_mean": round(baseline, 4),
                "ratio_vs_baseline": round(measured / baseline, 3) if abs(baseline) > 1e-9 else None,
            }
        return out

    def replay(self, profile: Any, attack_capture: str = "tcp-dos") -> list[Any]:
        """Build the same window timeline as the legacy agent, scored by LightGBM."""
        from agents.detector.agent import DETECT_THRESHOLD, WindowResult

        rng = np.random.default_rng(profile.seed)
        attack, benign = self.pool("attack", attack_capture), self.pool("benign")
        out: list[Any] = []
        for index in range(profile.windows):
            in_attack = index >= profile.attack_start
            ratio = profile.attack_ratio if in_attack else 0.0
            n_attack = int(round(profile.rows_per_window * ratio))
            n_benign = profile.rows_per_window - n_attack
            parts = []
            if n_attack:
                parts.append(attack.iloc[rng.choice(len(attack), n_attack, replace=False)])
            if n_benign:
                parts.append(benign.iloc[rng.choice(len(benign), n_benign, replace=False)])
            window = pd.concat(parts).reset_index(drop=True)
            scored = self.score_window(window)
            result = WindowResult(
                index=index,
                t_offset_s=round(index * profile.window_seconds, 1),
                rows=len(window),
                attack_rows=n_attack,
                benign_rows=n_benign,
                predicted_attack_rows=scored.predicted_attack_rows,
                p_mean=scored.window_mean_attack_probability,
                p_max=scored.window_max_attack_probability,
                is_detection=scored.window_mean_attack_probability >= DETECT_THRESHOLD,
            )
            result.hierarchy = {
                "attack_variant": scored.chosen_variant,
                "attack_subtype": scored.attack_subtype,
                "attack_family": scored.attack_family,
                "attack_binary": scored.attack_binary,
                "chosen_variant_mean_confidence": scored.chosen_variant_mean_confidence,
                "window_mean_attack_probability": scored.window_mean_attack_probability,
                "window_max_attack_probability": scored.window_max_attack_probability,
                "model": self.bundle.get("model_name"),
                "model_version": str(self.bundle.get("config_hash") or "unknown"),
                "feature_schema_version": f"multiclass-{len(self.features)}",
                "sample_incident": scored.incidents[0] if scored.incidents else None,
            }
            if result.is_detection and not any(item.is_detection for item in out):
                result.top_features = [
                    {"feature": name, "importance": None, "z_score": None, "contribution": None}
                    for name in list(self.bundle.get("top_features") or self.features[:5])[:5]
                ]
                result.sample_row = {
                    key: round(float(value), 3)
                    for key, value in window.iloc[0].items()
                    if key in self.expected_columns and pd.notna(value)
                }
                result.stats = self.window_stats(window)
            out.append(result)
        return out


@lru_cache(maxsize=1)
def get_multiclass_detector() -> MulticlassDetectorAdapter:
    return MulticlassDetectorAdapter()


def multiclass_runtime_status() -> dict[str, Any]:
    mode = detector_mode()
    if mode != "multiclass":
        return {
            "requested": "legacy",
            "available": True,
            "active": "legacy",
            "detail": "Default binary RandomForest is active. Set IDS_DETECTOR=multiclass to load the LightGBM bundle.",
        }
    try:
        info = get_multiclass_detector().info()
    except DetectorUnavailable as exc:
        return {
            "requested": "multiclass",
            "available": False,
            "active": None,
            "detail": str(exc),
        }
    return {
        "requested": "multiclass",
        "available": True,
        "active": "multiclass",
        "model_version": info.get("model_version"),
        "detail": "LightGBM multiclass bundle loaded.",
    }
