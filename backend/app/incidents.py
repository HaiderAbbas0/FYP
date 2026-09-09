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
    return {
        "source": "RandomForestClassifier over CICIoMT2024 capture rows",
        "window_index": trigger.index,
        "window_t_offset_s": trigger.t_offset_s,
        "flows_scored": trigger.rows,
        "flows_classified_attack": trigger.predicted_attack_rows,
        "mean_attack_probability": round(trigger.p_mean, 4),
        "max_attack_probability": round(trigger.p_max, 4),
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
