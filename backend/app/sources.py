"""Explicit incident sources. Fixtures contain synthetic evidence only."""
from __future__ import annotations

import hashlib
import json
import math
import random
from typing import Any

from .detector import WindowResult
from .incidents import DEVICES, SCENARIOS, build_event, detector_artifact, replay_scenario
from .schemas import DetectorEvent


def prepare(request: Any) -> tuple[list[WindowResult], DetectorEvent | None, dict]:
    mode = request.source_mode
    if mode == "capture_replay":
        windows, trigger = replay_scenario(request.scenario)
        event = build_event(request.scenario, trigger) if trigger else None
        return windows, event, detector_artifact(trigger, event) if trigger and event else {"source": mode, "detected": False}
    if mode == "live_lab":
        raw = getattr(request, "incident_detector", None)
        if raw is None:
            raise ValueError("live_lab requires an incident_detector event from the authenticated detector API")
        event = DetectorEvent.model_validate(raw)
        dev = DEVICES.get(event.device_id)
        if dev is None or (event.device_type, event.device_criticality, event.dst_ip) != (dev.device_type, dev.criticality, dev.ip):
            raise ValueError("detector device attribution does not match the trusted registry")
        if event.detector_source == "synthetic":
            raise ValueError("synthetic detector evidence cannot drive live_lab")
        if not 0 <= event.confidence <= 1 or not 0 <= event.anomaly_score <= 1:
            raise ValueError("detector probabilities must be in [0,1]")
        supplied = getattr(request, "window_stats", {}) or {}
        stats = {}
        for name, measurement in supplied.items():
            if name not in {"Rate", "Srate", "Drate", "Duration", "Header_Length", "IAT", "Number", "Tot size", "Tot sum", "Min", "Max", "AVG", "Std", "Magnitue", "Variance", "syn_count", "ack_count", "fin_count", "rst_count", "syn_flag_number", "ack_flag_number", "psh_flag_number", "rst_flag_number", "fin_flag_number", "TCP", "UDP", "ICMP", "ARP", "HTTP", "HTTPS", "DNS"}:
                raise ValueError(f"unsupported flow statistic: {name}")
            if not isinstance(measurement, dict) or not {"mean", "max", "baseline_mean", "ratio_vs_baseline"}.issubset(measurement):
                raise ValueError(f"incomplete flow statistic: {name}")
            for key, value in measurement.items():
                if key not in {"mean", "max", "baseline_mean", "ratio_vs_baseline"} or (value is None and key != "ratio_vs_baseline") or (value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value))):
                    raise ValueError(f"invalid flow statistic: {name}.{key}")
            stats[name] = measurement
        return [], event, {"source": "external authenticated detector event", "incident_object": event.model_dump(mode="json"), "window_flow_statistics": stats, "evidence_gaps": [] if stats else ["capture flow statistics not supplied"]}
    if mode != "fixture":
        raise ValueError(f"unsupported source mode: {mode}")
    seed = getattr(request, "fixture_seed", 42)
    rng = random.Random(seed)
    scn = SCENARIOS[request.scenario]
    windows = []
    for i in range(6):
        attack = i >= 2
        probability = round((0.96 if request.scenario != "high" else 0.86) + rng.uniform(-0.005, 0.005), 4) if attack else 0.01
        windows.append(WindowResult(i, float(i), 40, 40 if attack else 0, 0 if attack else 40, 40 if attack else 0, probability, min(1.0, probability + .02), attack))
    trigger = windows[2]
    event = build_event(request.scenario, trigger)
    event.detector_source = "synthetic"
    event.ts = 0
    event.incident_id = "FIX-" + hashlib.sha256(f"{request.scenario}:{seed}".encode()).hexdigest()[:12]
    # Fixtures deliberately expose their statistics; consumers must retain provenance.
    trigger.stats = {
        "Rate": {"mean": 1000., "max": 1200., "baseline_mean": 20., "ratio_vs_baseline": 50.},
        "Tot size": {"mean": 64., "max": 80., "baseline_mean": 256., "ratio_vs_baseline": .25},
        **{name: {"mean": value, "max": value, "baseline_mean": 1., "ratio_vs_baseline": value}
           for name, value in (("rst_count", 1.), ("syn_count", 100.), ("ack_count", 2.), ("fin_count", 1.))},
    }
    artifact = {"source": "synthetic seeded fixture; no trained detector or dataset", "synthetic": True, "fixture_seed": seed, "incident_object": event.model_dump(mode="json"), "window_flow_statistics": trigger.stats, "top_features": [], "not_derivable_from_capture": ["source cardinality", "attack suppression"]}
    artifact["fixture_hash"] = hashlib.sha256(json.dumps([w.to_json() for w in windows], sort_keys=True).encode()).hexdigest()
    return windows, event, artifact
