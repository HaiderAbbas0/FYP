// ---------------------------------------------------------------------------
// Shared agent-runtime contracts.
// These mirror the FastAPI event schema in backend/app/schemas.py 1:1 so the
// UI can be driven either by the local mock engine or by a live SSE stream.
// ---------------------------------------------------------------------------

export type NodeId =
  | "gateway"
  | "detector"
  | "planner"
  | "memory"
  | "investigator"
  | "sub.log"
  | "sub.threat"
  | "sub.device"
  | "sub.traffic"
  | "sub.history"
  | "explainer"
  | "response"
  | "policy"
  | "actuator";

export type NodeStatus = "idle" | "active" | "ok" | "degraded" | "failed" | "skipped";

/** Controller state machine (Revised Pipeline §21). */
export type ControllerState =
  | "CAPTURED"
  | "DETECTED"
  | "RISK_ASSESSED"
  | "MEMORY_SEARCHED"
  | "SIMILARITY_CLASSIFIED"
  | "VERIFY"
  | "DELTA_INV"
  | "FULL_INV"
  | "RESPONSE_READY"
  | "POLICY_CHECKED"
  | "EXECUTED"
  | "ESCALATED"
  | "VALIDATED"
  | "CASE_STORED"
  | "SAFE_HOLD";

export type RiskPath = "LOW" | "MEDIUM" | "HIGH";
export type SimilarityBand = "HIGH" | "PARTIAL" | "NONE";
export type Outcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "HARMFUL";
export type LogLevel = "info" | "warn" | "error" | "alert" | "route" | "ok";

export type SimEvent =
  | { type: "run.start"; runId: string; scenario: string; ts: number }
  | { type: "state"; state: ControllerState; ts: number }
  | { type: "node.enter"; node: NodeId; label: string; ts: number }
  | { type: "node.exit"; node: NodeId; status: NodeStatus; ms: number; ts: number }
  | { type: "edge"; from: NodeId; to: NodeId; label?: string; kind?: "data" | "control" | "writeback"; ts: number }
  | { type: "log"; level: LogLevel; agent: string; msg: string; ts: number }
  | { type: "artifact"; node: NodeId; title: string; payload: unknown; ts: number }
  | { type: "decision"; node: NodeId; question: string; choice: string; rationale: string; ts: number }
  | { type: "fallback"; node: NodeId; trigger: string; action: string; degraded: boolean; ts: number }
  | { type: "metric"; key: string; value: string | number; ts: number }
  | { type: "window"; window: TrafficWindow; ts: number }
  | { type: "probe"; probe: ProbeSample; ts: number }
  | { type: "run.end"; outcome: Outcome; summary: string; ts: number };

/** A stored case in the adaptive Memory Agent (backend/data/cases.json). */
export interface CaseRecord {
  case_id: string;
  attack_family: string;
  attack_subtype: string;
  device_type: string;
  device_criticality: "Critical" | "High" | "Medium" | "Low";
  behavioral_signature: string;
  source_cardinality: "single" | "few" | "distributed";
  peak_rate: string;
  investigation_summary: string;
  specialists_used: string[];
  recommended_response: string;
  executed_response: string;
  outcome: Outcome;
  containment_latency_s: number;
  reuse_count: number;
  reliability: number; // 0-1, decays on PARTIAL/HARMFUL outcomes
  confidence: number; // detector confidence at time of storage
  created: string;
  last_validated: string;
}

/** What the Memory Agent returns to the Planner. */
export interface RetrievedCase {
  case: CaseRecord;
  similarity: number; // cosine similarity of case embedding
  context_compatible: boolean; // device-criticality / operational compatibility gate
  incompatibility_reason?: string;
}

/** One scored slice of replayed capture traffic (real detector output). */
export interface TrafficWindow {
  index: number;
  t_offset_s: number;
  rows: number;
  attack_rows: number;
  benign_rows: number;
  predicted_attack_rows: number;
  p_mean: number;
  p_max: number;
  is_detection: boolean;
}

/** One availability probe against the edge gateway health endpoint. */
export interface ProbeSample {
  seq: number;
  t_offset_s: number;
  ok: boolean;
  status_code: number | null;
  latency_ms: number;
  error?: string | null;
}

/** One entry in secondary memory (the recall cache). */
export interface CacheEntryView {
  case_id: string;
  attack_subtype: string;
  device_type: string;
  device_criticality: string;
  outcome: string;
  reliability: number;
  ttl_attacks_remaining: number;
  hits: number;
  promoted_by: string;
}

export interface CacheStats {
  capacity: number;
  size: number;
  ttl_attacks: number;
  incidents_seen: number;
  lookups: number;
  hits: number;
  hit_rate_pct: number | null;
  promotions: number;
  evictions_ttl: number;
  evictions_capacity: number;
  last_tier: string;
  entries: CacheEntryView[];
}

/** Which memory tier answered, and what each cost. */
export interface MemoryTiers {
  answered_by: "cache" | "primary";
  cache_entries_scored?: number;
  cache_lookup_us: number | null;
  primary_lookup_us: number | null;
  primary_cases_scanned?: number | null;
  primary_scan_skipped?: number | null;
  promotion: { promoted: string; action: string; ttl: number; evicted_for_capacity?: string | null } | null;
  expired_this_incident: string[];
  cache: CacheStats;
}

/** Normalised memory-retrieval row, shared by the mock and live engines. */
export interface CandidateView {
  case_id: string;
  similarity: number;
  outcome: Outcome;
  reliability: number;
  reuse_count: number;
  device_type: string;
  device_criticality: string;
  executed_response: string;
  allow: boolean;
  reason: string;
  tier?: "primary" | "cache";
}

export interface FaultFlags {
  llmDown: boolean; // no API key / provider 5xx / timeout
  plannerCrash: boolean; // orchestrator process dies mid-run
  memoryDown: boolean; // vector DB unreachable
  subAgentTimeout: boolean; // one specialist worker stalls
  policyConflict: boolean; // recommended action violates a hard safety rule
}

export const NO_FAULTS: FaultFlags = {
  llmDown: false,
  plannerCrash: false,
  memoryDown: false,
  subAgentTimeout: false,
  policyConflict: false,
};
