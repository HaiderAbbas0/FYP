"""Incident construction from real capture traffic.

Bridges the Detector Agent to the Planner: replays a capture timeline, finds the
window where detection actually fires, and turns that window into the structured
`DetectorEvent` the agent chain consumes.

The device registry lives here because the capture CSVs are post-feature-
extraction and carry no addresses. In the deployed pipeline the Edge Gateway
supplies this mapping from flow to device; for the PoC it is testbed metadata.
Being explicit about that matters - the device criticality is what drives the
routing difference between the three scenarios, and it is *not* something the
model inferred.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from agents.detector.captures import ATTACK_CAPTURES
from agents.detector.multiclass import DetectorUnavailable, detector_mode, get_multiclass_detector

from .detector import ReplayProfile, WindowResult, get_detector
from .schemas import DetectorEvent


@dataclass(frozen=True)
class Device:
    device_id: str
    name: str
    device_type: str
    criticality: str
    ip: str
    clinical_role: str


DEVICES = {
    "SN-02": Device("SN-02", "Sensor-02", "medical-sensor", "Low", "10.0.0.22",
                    "non-clinical lab test sensor"),
    "BR-01": Device("BR-01", "Broker-01", "mqtt-broker", "High", "10.0.0.5",
                    "MQTT transport for 40+ downstream devices"),
    "GW-01": Device("GW-01", "Gateway-01", "patient-monitor-gateway", "Critical", "10.0.0.10",
                    "continuous vitals telemetry for 14 beds"),
}


@dataclass(frozen=True)
class Scenario:
    key: str
    name: str
    blurb: str
    device_id: str
    src_ip: str
    profile: ReplayProfile
    attack_capture: str = "tcp-dos"


# The three scenarios run the SAME real attack family (TCP_Flood - the only one
# this detector covers) against three device classes. That is deliberate: it
# isolates device criticality and prior-case availability as the variables that
# change the routing, rather than confounding them with a different attack.
SCENARIOS: dict[str, Scenario] = {
    "low": Scenario(
        key="low",
        name="LOW · saturated TCP flood on a non-critical sensor",
        blurb=(
            "A fully saturated flood, so the detector is near-certain, and the target is a lab "
            "sensor with a validated near-identical prior case. The Planner takes the fast path: "
            "no specialists, no explanation, straight to a bounded response."
        ),
        device_id="SN-02",
        src_ip="10.0.0.61",
        profile=ReplayProfile(attack_ratio=1.0, seed=42),
    ),
    "medium": Scenario(
        key="medium",
        name="MEDIUM · TCP flood on the MQTT broker",
        blurb=(
            "Same attack family, but the target now carries transport for 40+ devices and the "
            "closest prior case ran against a different device class. The Planner reuses what "
            "still holds and re-investigates only the changed evidence."
        ),
        device_id="BR-01",
        src_ip="10.0.0.45",
        profile=ReplayProfile(attack_ratio=0.97, seed=7),
    ),
    "high": Scenario(
        key="high",
        name="HIGH · partially-contaminated flood on a patient-monitor gateway",
        blurb=(
            "The flood is mixed with legitimate telemetry, so the detector's real confidence "
            "drops below the fast-path floor - and the target is life-critical. Memory blocks "
            "the closest prior case because its action was recorded HARMFUL."
        ),
        device_id="GW-01",
        src_ip="10.0.0.77",
        profile=ReplayProfile(attack_ratio=0.85, seed=13),
    ),
    "mqtt-dos-connect": Scenario(
        key="mqtt-dos-connect",
        name="MQTT · DoS Connect flood on the MQTT broker",
        blurb=(
            "Replay mixes MQTT-DoS-Connect capture rows with benign traffic. Requires "
            "IDS_DETECTOR=multiclass; the legacy TCP_Flood forest cannot label MQTT variants."
        ),
        device_id="BR-01",
        src_ip="10.0.0.81",
        profile=ReplayProfile(attack_ratio=1.0, seed=21),
        attack_capture="mqtt-dos-connect",
    ),
    "mqtt-ddos-publish": Scenario(
        key="mqtt-ddos-publish",
        name="MQTT · DDoS Publish flood on the MQTT broker",
        blurb=(
            "Replay mixes MQTT-DDoS-Publish capture rows with benign traffic. Distinct from the "
            "TCP flood scenarios. Requires IDS_DETECTOR=multiclass."
        ),
        device_id="BR-01",
        src_ip="10.0.0.82",
        profile=ReplayProfile(attack_ratio=1.0, seed=22),
        attack_capture="mqtt-ddos-publish",
    ),
}


def source_cardinality(event: DetectorEvent) -> str:
    """Derive source cardinality, or admit that we cannot.

    `connection_fanout == 0` means the evidence source could not supply it -
    true for CICIoMT2024's post-extraction feature schema, which has no
    addresses. Defined here so the runtime and the offline exporter cannot
    drift apart on it.
    """
    n = event.connection_fanout
    if n <= 0:
        return "unknown"
    if n == 1:
        return "single"
    return "few" if n <= 8 else "distributed"


def scenario(key: str) -> Scenario:
    return SCENARIOS.get(key, SCENARIOS["medium"])


def replay_scenario(key: str) -> tuple[list[WindowResult], WindowResult | None]:
    """Score the whole timeline and return it plus the triggering window."""
    scn = scenario(key)
    if scn.attack_capture != "tcp-dos" and detector_mode() != "multiclass":
        raise ValueError("MQTT capture-replay requires IDS_DETECTOR=multiclass")
    if scn.attack_capture != "tcp-dos" and scn.attack_capture not in ATTACK_CAPTURES:
        raise ValueError(f"unknown attack capture: {scn.attack_capture}")
    if detector_mode() == "multiclass":
        try:
            windows = get_multiclass_detector().replay(scn.profile, attack_capture=scn.attack_capture)
        except DetectorUnavailable as exc:
            raise ValueError(f"IDS_DETECTOR=multiclass but the bundle is unavailable: {exc}") from exc
    else:
        windows = get_detector().replay(scn.profile)
    trigger = next((w for w in windows if w.is_detection), None)
    return windows, trigger


def build_event(key: str, trigger: WindowResult) -> DetectorEvent:
    """Turn the triggering window into the structured incident object.

    Every number here except the device mapping and the source address comes
    from the model or the capture rows.
    """
    scn = scenario(key)
    dev = DEVICES[scn.device_id]

    # Window confidence is the mean per-flow attack probability. It is not a
    # calibrated posterior over the *window*, and we label it as such rather
    # than dressing it up: it is the proportion of this window's flows the
    # detector believes are attack traffic.
    confidence = trigger.p_mean

    # Flows scored per second, from the capture's own window duration. This is a
    # flow rate, not a packet rate - the per-flow packet rate lives in the
    # capture's own `Rate` column and is reported by Traffic Analysis.
    flows_per_sec = trigger.rows / max(scn.profile.window_seconds, 1e-6)

    hierarchy = getattr(trigger, "hierarchy", None)
    if hierarchy:
        return DetectorEvent(
            incident_id=f"INC-{uuid.uuid4().hex[:6].upper()}",
            attack_family=str(hierarchy.get("attack_family") or "unknown"),
            attack_subtype=str(hierarchy.get("attack_subtype") or "unknown"),
            attack_variant=hierarchy.get("attack_variant"),
            confidence=round(float(hierarchy["chosen_variant_mean_confidence"]), 4),
            confidence_kind="calibrated",
            model_version=str(hierarchy.get("model_version") or "unknown"),
            feature_schema_version=str(hierarchy.get("feature_schema_version") or "unknown"),
            anomaly_score=round(float(hierarchy["window_mean_attack_probability"]), 4),
            device_id=dev.device_id,
            device_type=dev.device_type,
            device_criticality=dev.criticality,  # type: ignore[arg-type]
            src_ip=scn.src_ip,
            dst_ip=dev.ip,
            packets_per_sec=round(flows_per_sec, 1),
            connection_fanout=0,
            top_features=[f["feature"] for f in trigger.top_features],
            detector_source="model",
            window_index=trigger.index,
            attack_flows=trigger.predicted_attack_rows,
            total_flows=trigger.rows,
        )

    return DetectorEvent(
        incident_id=f"INC-{uuid.uuid4().hex[:6].upper()}",
        attack_family="DoS",
        attack_subtype="TCP-flood",
        confidence=round(confidence, 4),
        anomaly_score=round(trigger.p_max, 4),
        device_id=dev.device_id,
        device_type=dev.device_type,
        device_criticality=dev.criticality,  # type: ignore[arg-type]
        src_ip=scn.src_ip,
        dst_ip=dev.ip,
        packets_per_sec=round(flows_per_sec, 1),
        # Source cardinality is NOT derivable: the CICIoMT2024 feature schema is
        # post-extraction and carries no addresses. Leaving this at its unknown
        # default is what makes the Policy Gate refuse single-source blocking,
        # which is the correct failure mode. Inventing a fan-out here would have
        # silently unlocked an action we cannot justify.
        connection_fanout=0,
        top_features=[f["feature"] for f in trigger.top_features],
        detector_source="model",
        window_index=trigger.index,
        attack_flows=trigger.predicted_attack_rows,
        total_flows=trigger.rows,
    )


def detector_artifact(trigger: WindowResult, event: DetectorEvent) -> dict[str, Any]:
    """The evidence payload shown under the Detector node in the UI."""
    hierarchy = getattr(trigger, "hierarchy", None)
    if hierarchy:
        return {
            "source": "LightGBM multiclass bundle over CICIoMT2024 capture rows",
            "active_detector": "multiclass",
            "window_index": trigger.index,
            "window_t_offset_s": trigger.t_offset_s,
            "flows_scored": trigger.rows,
            "flows_classified_attack": trigger.predicted_attack_rows,
            "mean_attack_probability": round(float(hierarchy["window_mean_attack_probability"]), 4),
            "window_mean_attack_probability": round(float(hierarchy["window_mean_attack_probability"]), 4),
            "max_attack_probability": round(float(hierarchy["window_max_attack_probability"]), 4),
            "chosen_variant_mean_confidence": round(float(hierarchy["chosen_variant_mean_confidence"]), 4),
            "variant_confidence": round(float(hierarchy["chosen_variant_mean_confidence"]), 4),
            "routing_confidence_field": "chosen_variant_mean_confidence",
            "predicted_label": hierarchy.get("attack_variant"),
            "attack_variant": hierarchy.get("attack_variant"),
            "attack_subtype": hierarchy.get("attack_subtype"),
            "attack_family": hierarchy.get("attack_family"),
            "attack_binary": hierarchy.get("attack_binary"),
            "model": hierarchy.get("model"),
            "model_version": hierarchy.get("model_version"),
            "feature_schema_version": hierarchy.get("feature_schema_version"),
            "top_features": trigger.top_features,
            "attribution_method": (
                "bundle top_features from training; not SHAP. Window-mean P(Attack) is separate "
                "from calibrated variant confidence."
            ),
            "sample_flow": trigger.sample_row,
            "window_flow_statistics": trigger.stats,
            "incident_object": event.model_dump(mode="json"),
            "not_derivable_from_capture": [
                "source / destination addresses",
                "source cardinality (single vs distributed)",
                "attacker count — a DoS vs DDoS label is not evidence of source count",
                "device identity - supplied by the testbed registry",
            ],
        }
    return {
        "source": "RandomForestClassifier over CICIoMT2024 capture rows",
        "window_index": trigger.index,
        "window_t_offset_s": trigger.t_offset_s,
        "flows_scored": trigger.rows,
        "flows_classified_attack": trigger.predicted_attack_rows,
        "mean_attack_probability": round(trigger.p_mean, 4),
        "window_mean_attack_probability": round(trigger.p_mean, 4),
        "max_attack_probability": round(trigger.p_max, 4),
        "variant_confidence": None,
        "predicted_label": "TCP_Flood",
        "top_features": trigger.top_features,
        "attribution_method": (
            "global RandomForest feature importance x standardised deviation from the benign "
            "baseline. Cheap and explainable - not SHAP."
        ),
        "sample_flow": trigger.sample_row,
        "window_flow_statistics": trigger.stats,
        "incident_object": event.model_dump(mode="json"),
        "not_derivable_from_capture": [
            "source / destination addresses",
            "source cardinality (single vs distributed)",
            "device identity - supplied by the testbed registry",
        ],
    }
