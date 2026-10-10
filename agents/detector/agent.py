"""Detector Agent - real inference over CICIoMT2024 captures.

This wraps the trained RandomForest in `agents/detector/artifacts/legacy/` and the capture CSVs
in `data/` and `data/detector/`. Nothing here is simulated: every confidence
value the agent chain sees comes from `predict_proba` on real feature rows.

What *is* constructed is the **timeline**. The captures are separate benign and
attack files, so a replay interleaves them into a window sequence - a benign
baseline, then attack onset, then a sustained flood - which is what lets the UI
show detection actually happening rather than a single static score.

Two honest limitations to state when presenting this:

* The model's scope is binary, Benign vs TCP_Flood (see `model_metadata.json`).
  Other attack families in the architecture are not yet covered by this detector.
* The CSVs are post-feature-extraction and carry no addresses, so device
  attribution comes from the testbed device registry below, not from the data.
  In the deployed pipeline the Edge Gateway supplies that mapping.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

REPO = Path(__file__).resolve().parents[2]
DETECTOR_DIR = REPO / "agents" / "detector" / "artifacts" / "legacy"
DATA_DIR = REPO / "data"

ATTACK_CAPTURE = DATA_DIR / "detector" / "TCP_IP-DoS-TCP_test.pcap.csv"
BENIGN_CAPTURE = DATA_DIR / "Benign_test.pcap.csv"

#: rows pulled into memory per capture. The full files are 20-60MB; this is
#: plenty to sample non-repeating windows from and keeps startup under a second.
POOL_ROWS = 6000

#: a window is classified attack when the mean per-flow attack probability
#: crosses this. Detection threshold, not the action threshold - the policy gate
#: has its own, higher, floor before anything may execute.
DETECT_THRESHOLD = 0.5


@dataclass
class WindowResult:
    """One scored time window of live traffic."""

    index: int
    t_offset_s: float
    rows: int
    #: ground truth from which capture each row came
    attack_rows: int
    benign_rows: int
    #: what the model actually said
    predicted_attack_rows: int
    p_mean: float
    p_max: float
    is_detection: bool
    top_features: list[dict[str, Any]] = field(default_factory=list)
    sample_row: dict[str, Any] = field(default_factory=dict)
    #: real aggregate flow statistics for this window, vs the benign baseline
    stats: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "t_offset_s": self.t_offset_s,
            "rows": self.rows,
            "attack_rows": self.attack_rows,
            "benign_rows": self.benign_rows,
            "predicted_attack_rows": self.predicted_attack_rows,
            "p_mean": round(self.p_mean, 4),
            "p_max": round(self.p_max, 4),
            "is_detection": self.is_detection,
        }


@dataclass
class ReplayProfile:
    """How to construct one incident's traffic timeline from the captures."""

    windows: int = 12
    rows_per_window: int = 40
    #: index of the first window containing attack traffic
    attack_start: int = 4
    #: fraction of flows in an attack window drawn from the attack capture.
    #: This is the honest lever on detector confidence: a partially contaminated
    #: window genuinely scores lower than a saturated flood.
    attack_ratio: float = 1.0
    window_seconds: float = 2.0
    seed: int = 42


class DetectorAgent:
    def __init__(self) -> None:
        self.model = joblib.load(DETECTOR_DIR / "tcp_flood_rf_model.joblib")
        self.scaler = joblib.load(DETECTOR_DIR / "tcp_flood_scaler.joblib")
        self.features: list[str] = json.loads(
            (DETECTOR_DIR / "feature_schema.json").read_text(encoding="utf-8")
        )["feature_names"]
        self.metadata: dict[str, Any] = json.loads(
            (DETECTOR_DIR / "model_metadata.json").read_text(encoding="utf-8")
        )
        self.importances = dict(zip(self.features, (float(v) for v in self.model.feature_importances_)))
        self._pools: dict[str, pd.DataFrame] = {}
        self._benign_stats: tuple[np.ndarray, np.ndarray] | None = None

    # ------------------------------------------------------------------ #
    def pool(self, kind: str) -> pd.DataFrame:
        if kind not in self._pools:
            path = ATTACK_CAPTURE if kind == "attack" else BENIGN_CAPTURE
            df = pd.read_csv(path, nrows=POOL_ROWS)[self.features]
            self._pools[kind] = df.reset_index(drop=True)
            log.info("Loaded %s rows from %s", len(df), path.name)
        return self._pools[kind]

    def _baseline(self) -> tuple[np.ndarray, np.ndarray]:
        """Mean/std of the benign pool, used to explain *why* a window fired."""
        if self._benign_stats is None:
            b = self.pool("benign")
            self._benign_stats = (b.mean().to_numpy(), b.std().replace(0, 1e-9).to_numpy())
        return self._benign_stats

    # ------------------------------------------------------------------ #
    def score(self, df: pd.DataFrame) -> np.ndarray:
        """Per-flow attack probability. Real model, real rows.

        The two artefacts disagree about feature names: the scaler was fitted on
        a named DataFrame and warns if given a bare array, while the forest was
        fitted on the scaler's array output and warns if given names. So we hand
        each the form it was fitted with rather than silencing the warnings.
        """
        scaled = self.scaler.transform(df[self.features])
        return self.model.predict_proba(scaled)[:, 1]

    #: aggregates the specialist workers are allowed to report. Every one of
    #: these is a real column in the capture feature schema.
    STAT_COLS = [
        "Rate", "Srate", "Drate", "Duration", "Header_Length", "IAT", "Number",
        "Tot size", "Tot sum", "Min", "Max", "AVG", "Std", "Magnitue", "Variance",
        "syn_count", "ack_count", "fin_count", "rst_count",
        "syn_flag_number", "ack_flag_number", "psh_flag_number", "rst_flag_number",
        "fin_flag_number", "TCP", "UDP", "ICMP", "ARP", "HTTP", "HTTPS", "DNS",
    ]

    def window_stats(self, df: pd.DataFrame) -> dict[str, Any]:
        """Real aggregates for this window, each with its benign-baseline ratio.

        This is the only evidence the specialist workers are permitted to report
        as fact. Anything a worker cannot compute from these columns it must
        declare unavailable rather than invent.
        """
        ben = self.pool("benign")
        out: dict[str, Any] = {}
        for c in self.STAT_COLS:
            m = float(df[c].mean())
            b = float(ben[c].mean())
            out[c] = {
                "mean": round(m, 4),
                "max": round(float(df[c].max()), 4),
                "baseline_mean": round(b, 4),
                "ratio_vs_baseline": round(m / b, 3) if abs(b) > 1e-9 else None,
            }
        return out

    def explain_window(self, df: pd.DataFrame) -> list[dict[str, Any]]:
        """Top contributing features for this window.

        Global RandomForest importance tells us which features the model relies
        on; the window's standardised deviation from the benign baseline tells us
        which of them are actually abnormal right now. The product is a cheap,
        honest attribution - it is not SHAP, and it is labelled as such in the UI.
        """
        mean, std = self._baseline()
        z = np.abs((df[self.features].mean().to_numpy() - mean) / std)
        contrib = [
            {
                "feature": f,
                "importance": round(self.importances[f], 4),
                "z_score": round(float(zi), 2),
                "contribution": round(float(self.importances[f] * min(zi, 10.0)), 4),
            }
            for f, zi in zip(self.features, z)
        ]
        contrib.sort(key=lambda c: -c["contribution"])
        return contrib[:5]

    # ------------------------------------------------------------------ #
    def replay(self, profile: ReplayProfile) -> list[WindowResult]:
        """Build and score a full traffic timeline."""
        rng = np.random.default_rng(profile.seed)
        atk, ben = self.pool("attack"), self.pool("benign")
        out: list[WindowResult] = []

        for i in range(profile.windows):
            in_attack = i >= profile.attack_start
            ratio = profile.attack_ratio if in_attack else 0.0
            n_atk = int(round(profile.rows_per_window * ratio))
            n_ben = profile.rows_per_window - n_atk

            parts = []
            if n_atk:
                parts.append(atk.iloc[rng.choice(len(atk), n_atk, replace=False)])
            if n_ben:
                parts.append(ben.iloc[rng.choice(len(ben), n_ben, replace=False)])
            window = pd.concat(parts).reset_index(drop=True)

            p = self.score(window)
            p_mean = float(p.mean())
            result = WindowResult(
                index=i,
                t_offset_s=round(i * profile.window_seconds, 1),
                rows=len(window),
                attack_rows=n_atk,
                benign_rows=n_ben,
                predicted_attack_rows=int((p > DETECT_THRESHOLD).sum()),
                p_mean=p_mean,
                p_max=float(p.max()),
                is_detection=p_mean >= DETECT_THRESHOLD,
            )
            if result.is_detection and not any(w.is_detection for w in out):
                # only the triggering window needs the expensive extras
                result.top_features = self.explain_window(window)
                result.sample_row = {
                    k: round(float(v), 3) for k, v in window.iloc[0].items() if k in self.features
                }
                result.stats = self.window_stats(window)
            out.append(result)
        return out

    # ------------------------------------------------------------------ #
    def info(self) -> dict[str, Any]:
        top = sorted(self.importances.items(), key=lambda kv: -kv[1])[:8]
        return {
            "loaded": True,
            "model_type": self.metadata.get("model_type"),
            "n_estimators": int(getattr(self.model, "n_estimators", 0)),
            "n_features": len(self.features),
            "attack_scope": self.metadata.get("attack_scope"),
            "dataset": self.metadata.get("dataset"),
            "test_roc_auc": self.metadata.get("test_roc_auc"),
            "label_mapping": self.metadata.get("label_mapping"),
            "trained_at_utc": self.metadata.get("trained_at_utc"),
            "detect_threshold": DETECT_THRESHOLD,
            "captures": {
                "attack": ATTACK_CAPTURE.name,
                "benign": BENIGN_CAPTURE.name,
                "pool_rows": POOL_ROWS,
            },
            "top_importances": [{"feature": f, "importance": round(v, 4)} for f, v in top],
        }


@lru_cache(maxsize=1)
def get_detector() -> DetectorAgent:
    """Process-wide singleton. Loading the forest costs ~0.3s; do it once."""
    return DetectorAgent()
