"""Wire contracts.

The `SimEvent` union here is the source of truth for the SSE stream consumed by
`src/agents/types.ts` in the frontend. Keeping the two in sync is what lets the
UI be driven either by the local mock engine or by this service without any
component changes.
"""

from __future__ import annotations

import time
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# enums
# --------------------------------------------------------------------------- #
class RiskPath(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SimilarityBand(str, Enum):
    HIGH = "HIGH"
    PARTIAL = "PARTIAL"
    NONE = "NONE"


class Outcome(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILURE = "FAILURE"
    HARMFUL = "HARMFUL"
    #: action executed but telemetry was missing - never written to memory
    UNVALIDATED = "UNVALIDATED"


class ControllerState(str, Enum):
    CAPTURED = "CAPTURED"
    DETECTED = "DETECTED"
    RISK_ASSESSED = "RISK_ASSESSED"
    MEMORY_SEARCHED = "MEMORY_SEARCHED"
    SIMILARITY_CLASSIFIED = "SIMILARITY_CLASSIFIED"
    VERIFY = "VERIFY"
    DELTA_INV = "DELTA_INV"
    FULL_INV = "FULL_INV"
    RESPONSE_READY = "RESPONSE_READY"
    POLICY_CHECKED = "POLICY_CHECKED"
    EXECUTED = "EXECUTED"
    ESCALATED = "ESCALATED"
    VALIDATED = "VALIDATED"
    CASE_STORED = "CASE_STORED"
    SAFE_HOLD = "SAFE_HOLD"


class PolicyVerdict(str, Enum):
    PASS = "PASS"
    DOWNGRADE = "DOWNGRADE"
    ESCALATE = "ESCALATE"


NodeId = Literal[
    "gateway", "detector", "planner", "memory", "investigator",
    "sub.log", "sub.threat", "sub.device", "sub.traffic", "sub.history",
    "explainer", "response", "policy", "actuator",
]


# --------------------------------------------------------------------------- #
# domain objects
# --------------------------------------------------------------------------- #
class DetectorEvent(BaseModel):
    """Structured incident object produced by the detection track."""

    incident_id: str
    attack_family: str
    attack_subtype: str
    confidence: float
    anomaly_score: float = 0.0
    device_id: str
    device_type: str
    device_criticality: Literal["Critical", "High", "Medium", "Low"]
    src_ip: str
    dst_ip: str
    packets_per_sec: float
    connection_fanout: int = 1
    top_features: list[str] = Field(default_factory=list)
    #: provenance: which capture rows produced this event, and what the model said
    detector_source: Literal["model", "rules", "synthetic"] = "model"
    window_index: int | None = None
    attack_flows: int | None = None
    total_flows: int | None = None
    ts: float = Field(default_factory=time.time)


class CaseRecord(BaseModel):
    case_id: str
    attack_family: str
    attack_subtype: str
    device_type: str
    device_criticality: str
    behavioral_signature: str
    #: "unknown" is a first-class value: the CICIoMT2024 feature schema has no
    #: addresses, so a case written from it genuinely cannot state cardinality.
    #: Recording that keeps the similarity comparison honest later.
    source_cardinality: Literal["single", "few", "distributed", "unknown"]
    peak_rate: str
    investigation_summary: str
    specialists_used: list[str]
    recommended_response: str
    executed_response: str
    outcome: Outcome
    containment_latency_s: float
    reuse_count: int
    reliability: float
    confidence: float
    created: str
    last_validated: str


class RetrievedCase(BaseModel):
    case: CaseRecord
    similarity: float
    context_compatible: bool
    incompatibility_reason: str | None = None
    #: which memory tier produced this row
    tier: Literal["primary", "cache"] = "primary"

    def reusable(self, min_reliability: float, min_similarity: float) -> bool:
        return (
            self.context_compatible
            and self.case.reliability >= min_reliability
            and self.similarity >= min_similarity
        )


class SpecialistResult(BaseModel):
    name: str
    status: Literal["ok", "unavailable", "skipped"]
    findings: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    latency_ms: int = 0


class InvestigationResult(BaseModel):
    mode: Literal["verify", "delta", "full"]
    confidence_source: Literal["llm+rules", "rules"]
    confirmed_family: str
    severity: Literal["low", "medium", "high"]
    evidence_gaps: list[str] = Field(default_factory=list)
    differences_from_prior_case: list[str] = Field(default_factory=list)
    response_constraints: list[str] = Field(default_factory=list)
    specialist_results: list[SpecialistResult] = Field(default_factory=list)
    narrative: str = ""


class Explanation(BaseModel):
    depth: Literal["none", "one-line", "detailed"]
    text: str = ""
    generated_by: Literal["llm", "template", "skipped"] = "skipped"
    xai_top_features: list[dict[str, Any]] = Field(default_factory=list)
    alternatives_rejected: list[dict[str, str]] = Field(default_factory=list)


class ResponseRecommendation(BaseModel):
    action: str
    params: dict[str, Any] = Field(default_factory=dict)
    duration_s: int = 0
    reversible: bool = True
    selector: Literal["llm_recommendation", "deterministic_table"]
    rationale: str = ""
    prior_case_action: str | None = None
    prior_case_outcome: Outcome | None = None


class PolicyCheck(BaseModel):
    rule: str
    result: Literal["PASS", "FAIL"]
    detail: str = ""


class PolicyDecision(BaseModel):
    verdict: PolicyVerdict
    checks: list[PolicyCheck]
    executed_action: str | None
    rationale: str


class OutcomeReport(BaseModel):
    """Outcome labels. A value of -1 means "not measured", never "zero"."""

    outcome: Outcome
    malicious_traffic_drop_pct: float
    legitimate_availability_pct: float
    latency_recovered_s: float
    collateral_disruption: bool
    rollback_required: bool
    containment_latency_s: float
    basis: str


# --------------------------------------------------------------------------- #
# event stream
# --------------------------------------------------------------------------- #
class SimEvent(BaseModel):
    """One line on the SSE stream. `type` discriminates the payload."""

    type: Literal[
        "run.start", "state", "node.enter", "node.exit", "edge", "log",
        "artifact", "decision", "fallback", "metric", "window", "probe", "run.end",
    ]
    ts: float
    # Flat union payload: only the fields relevant to `type` are populated.
    # Kept flat (rather than nested) so the TypeScript discriminated union in
    # src/agents/types.ts maps onto it without a translation layer.
    runId: str | None = None
    scenario: str | None = None
    state: ControllerState | None = None
    node: NodeId | None = None
    label: str | None = None
    status: str | None = None
    ms: int | None = None
    # edge
    from_: NodeId | None = Field(default=None, alias="from")
    to: NodeId | None = None
    kind: Literal["data", "control", "writeback"] | None = None
    # log
    level: Literal["info", "warn", "error", "alert", "route", "ok"] | None = None
    agent: str | None = None
    msg: str | None = None
    # artifact
    title: str | None = None
    payload: Any = None
    # decision
    question: str | None = None
    choice: str | None = None
    rationale: str | None = None
    # fallback
    trigger: str | None = None
    action: str | None = None
    degraded: bool | None = None
    # metric
    key: str | None = None
    value: Any = None
    # window (one scored slice of replayed capture traffic)
    window: dict[str, Any] | None = None
    # probe (one availability request to the edge gateway)
    probe: dict[str, Any] | None = None
    # run.end
    outcome: Outcome | None = None
    summary: str | None = None

    model_config = {"populate_by_name": True}


class RunRequest(BaseModel):
    """What the UI posts to start a run."""

    scenario: Literal["low", "medium", "high"] = "medium"
    faults: dict[str, bool] = Field(default_factory=dict)
    speed: float = 1.0
