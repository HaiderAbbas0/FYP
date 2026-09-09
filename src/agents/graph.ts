import type { NodeId } from "./types";

export interface GraphNode {
  id: NodeId;
  /** Short label rendered on the node. */
  title: string;
  /** Full agent name, shown in the inspector. */
  name?: string;
  /** Stable agent identifier, e.g. LOG-1. */
  code?: string;
  subtitle: string;
  /** Who owns this component in the FYP split. */
  owner: "partner" | "core" | "sub";
  /** Does this node call an LLM at runtime? */
  llm: "none" | "optional" | "primary";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Longer description surfaced in the inspector when nothing has run yet. */
  role: string;
  fallback: string;
}

export const CANVAS = { w: 1310, h: 540 };

const PIPE_Y = 268;
const NW = 168;
const NH = 78;
const pitch = 185;
const x = (i: number) => 22 + i * pitch;

export const NODES: GraphNode[] = [
  {
    id: "gateway",
    title: "Edge Gateway",
    subtitle: "Zeek / Scapy",
    owner: "partner",
    llm: "none",
    x: x(0), y: PIPE_Y, w: NW, h: NH,
    role: "Captures PCAP, builds flows/time-windows and emits a model-ready feature vector. Fully deterministic, no LLM.",
    fallback: "Capture stalls, so the detector receives no window. The Planner holds in CAPTURED and raises an availability alert. No response is ever issued on stale features.",
  },
  {
    id: "detector",
    title: "Detector Agent",
    subtitle: "XGBoost + XAI",
    owner: "partner",
    llm: "none",
    x: x(1), y: PIPE_Y, w: NW, h: NH,
    role: "Classifies Normal vs Attack + subtype, emits calibrated confidence, anomaly score and top contributing features as a structured incident object.",
    fallback: "Model unavailable, so a threshold/rule detector takes over at reduced precision. The Planner marks the run degraded and forces the HIGH path, never the fast path, because confidence is untrusted.",
  },
  {
    id: "investigator",
    title: "Investigator Agent",
    subtitle: "evidence fusion",
    owner: "core",
    llm: "primary",
    x: x(2), y: PIPE_Y, w: NW, h: NH,
    role: "Contextual reasoning centre. Fuses detector evidence, retrieved memory, specialist worker outputs and device metadata into one structured investigation result.",
    fallback: "LLM unavailable, so deterministic evidence-fusion runs instead: specialist findings are concatenated, rule-based severity is applied, and confidence_source is marked as rules. Explanation drops to template mode.",
  },
  {
    id: "explainer",
    title: "Explainer Agent",
    subtitle: "scalable depth",
    owner: "core",
    llm: "primary",
    x: x(3), y: PIPE_Y, w: NW, h: NH,
    role: "Produces the audit narrative at a depth chosen by the Planner: skipped (LOW), one-line (MEDIUM), full detailed + XAI (HIGH).",
    fallback: "Explanation is never on the containment critical path. If it fails, the Response Agent still receives the structured investigation object and the run continues; the incident is flagged explanation_missing for later regeneration.",
  },
  {
    id: "response",
    title: "Response Agent",
    subtitle: "recommend (LLM)",
    owner: "core",
    llm: "primary",
    x: x(4), y: PIPE_Y, w: NW, h: NH,
    role: "Recommends a bounded action from the allowed action set, given the investigation result, explanation summary, prior case action + outcome, and device constraints. It recommends only. It has no execution authority.",
    fallback: "LLM unavailable, so a deterministic policy table selects the action by attack_family x device_class x source_cardinality. Coverage is narrower but every output is guaranteed inside the safe action set.",
  },
  {
    id: "policy",
    title: "Policy Gate",
    subtitle: "deterministic",
    owner: "core",
    llm: "none",
    x: x(5), y: PIPE_Y, w: NW, h: NH,
    role: "Hard safety layer. Checks allowlist, device criticality, action and duration limits, and approval requirements. Verdict: PASS, DOWNGRADE, or ESCALATE. No model can override it.",
    fallback: "This IS the fallback. If it cannot evaluate a rule it fails closed: ESCALATE to a human, never execute.",
  },
  {
    id: "actuator",
    title: "Execute + Validate",
    subtitle: "outcome telemetry",
    owner: "core",
    llm: "none",
    x: x(6), y: PIPE_Y, w: NW, h: NH,
    role: "Applies the approved action, keeps the attack generator running, then measures suppression, legitimate-service availability, device health and latency recovery to label SUCCESS / PARTIAL / FAILURE / HARMFUL.",
    fallback: "If the action fails to apply, it rolls back to the pre-action state and escalates. If validation telemetry is missing the outcome is recorded as UNVALIDATED and the case is NOT written to memory. The system never learns from an unmeasured action.",
  },
  {
    id: "memory",
    title: "Memory Agent",
    subtitle: "adaptive case store",
    owner: "core",
    llm: "none",
    x: 26, y: 404, w: 200, h: 78,
    role: "Embeds the current incident, searches the vector store, and returns prior cases with similarity, executed action, outcome and reliability. After validation it writes the new case back. This is where the system gets smarter over time.",
    fallback: "Vector store unreachable, so memory is treated as empty. The run degrades to the full-investigation path: slower and more LLM calls, but never wrong-reuse. Write-back is queued and replayed when the store returns.",
  },
];

export const PLANNER = {
  id: "planner" as NodeId,
  title: "Planner Agent  ·  Controller",
  subtitle: "risk-aware orchestration · state machine · owns every routing decision",
  x: 22,
  y: 118,
  w: CANVAS.w - 44,
  h: 92,
};

// ---------------------------------------------------------------------------
// Investigator sub-agents.
// Five named specialist evidence workers. Each is independently invocable and
// independently timeoutable, which is what lets the Planner call two of five on
// a delta investigation instead of paying for all five every time.
// ---------------------------------------------------------------------------
const SUB_Y = 418;
const SUB_W = 152;
const SUB_PITCH = 162;
const SUB_X0 = 248;
const sx = (i: number) => SUB_X0 + i * SUB_PITCH;

export const SUB_CLUSTER = { x: SUB_X0 - 14, y: SUB_Y - 20, w: 5 * SUB_W + 4 * 10 + 28, h: 48 + 34 };

export const SUB_AGENTS: GraphNode[] = [
  {
    id: "sub.log", code: "LOG-1", title: "Log Analysis", name: "Log Analysis Agent",
    subtitle: "auth · firewall · MQTT", owner: "sub", llm: "optional",
    x: sx(0), y: SUB_Y, w: SUB_W, h: 48,
    role: "Reads authentication events, firewall events, MQTT/service logs, connection failures and resource consumption around the incident window. Establishes whether service degradation is downstream of the attack or an independent fault.",
    fallback: "On timeout it returns status unavailable with no findings. The Investigator records the evidence gap and lowers investigation confidence rather than inventing a finding.",
  },
  {
    id: "sub.threat", code: "TIA-1", title: "Threat Intel", name: "Threat Intelligence Agent",
    subtitle: "IOC · CVE · reputation", owner: "sub", llm: "optional",
    x: sx(1), y: SUB_Y, w: SUB_W, h: 48,
    role: "Checks source indicators against known malicious patterns, CVE/malware context and reputation feeds. Advisory only.",
    fallback: "If the feed is unreachable or rate-limited it is skipped. No response decision may depend solely on threat-intel output, so losing it never blocks containment.",
  },
  {
    id: "sub.device", code: "DCX-1", title: "Device Context", name: "Device Context Agent",
    subtitle: "clinical role · limits", owner: "sub", llm: "optional",
    x: sx(2), y: SUB_Y, w: SUB_W, h: 48,
    role: "Resolves device type, clinical role, criticality, normal communication pattern, allowed peers and the operational response constraints for that device class. This is the worker that tells the Policy Gate isolation is forbidden.",
    fallback: "If unavailable, the Policy Gate assumes the most restrictive device class (life-critical). Fails safe: isolation is denied and only reversible bounded actions remain permitted.",
  },
  {
    id: "sub.traffic", code: "TRF-1", title: "Traffic Analysis", name: "Traffic Analysis Agent",
    subtitle: "rate · source cardinality", owner: "sub", llm: "optional",
    x: sx(3), y: SUB_Y, w: SUB_W, h: 48,
    role: "Characterises the flood: rate profile, source cardinality (single / few / distributed), protocol behaviour and whether legitimate traffic is still being served. Decides whether blocking can work at all.",
    fallback: "If unavailable, source cardinality is unknown, so single-IP blocking is disallowed because it may be ineffective against a distributed source. The Planner prefers upstream rate limiting.",
  },
  {
    id: "sub.history", code: "HIS-1", title: "History Analysis", name: "History Analysis Agent",
    subtitle: "recurrence · repeat sources", owner: "sub", llm: "optional",
    x: sx(4), y: SUB_Y, w: SUB_W, h: 48,
    role: "Queries the incident log for recurrence: is this source hitting this device again, and is it escalating? Distinct from the Memory Agent — memory asks 'have we solved something like this before', this asks 'is this the fourth time tonight'. A repeat justifies a longer containment window than a first occurrence.",
    fallback: "If the incident log is unavailable, recurrence is treated as zero and the shortest safe containment duration is used. Under-reacting on duration is recoverable; over-reacting on a life-critical device is not.",
  },
];

export const ALL_NODES = [...NODES, ...SUB_AGENTS];

export const NODE_BY_ID: Record<string, GraphNode> = Object.fromEntries(
  ALL_NODES.map((n) => [n.id, n]),
);

/** Static pipeline skeleton drawn underneath the animated edges. */
export const STATIC_EDGES: Array<{ from: NodeId; to: NodeId }> = [
  { from: "gateway", to: "detector" },
  { from: "detector", to: "investigator" },
  { from: "investigator", to: "explainer" },
  { from: "explainer", to: "response" },
  { from: "response", to: "policy" },
  { from: "policy", to: "actuator" },
];
