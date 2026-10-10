import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CandidateView,
  ControllerState,
  FaultFlags,
  NodeId,
  NodeStatus,
  Outcome,
  RiskPath,
  SimEvent,
  MemoryTiers,
  ProbeSample,
  SimilarityBand,
  TrafficWindow,
} from "./types";
import { buildRun, type BuiltRun, type Step } from "./scenarios";

export interface ActiveEdge {
  from: NodeId;
  to: NodeId;
  label?: string;
  kind: "data" | "control" | "writeback";
  at: number;
}

export interface RunState {
  status: "idle" | "running" | "done" | "error";
  /** Durable backend run identity, available for live controls and recovery. */
  runId: string | null;
  /** Which engine produced these events. */
  source: "mock" | "live";
  events: SimEvent[];
  nodeStatus: Record<string, NodeStatus>;
  nodeLabel: Record<string, string>;
  activeEdges: ActiveEdge[];
  controllerState: ControllerState | null;
  /** Derived from the stream, so it works identically for mock and live. */
  path: RiskPath | null;
  band: SimilarityBand | null;
  candidates: CandidateView[];
  /** real scored capture windows, accumulated as detection unfolds */
  windows: TrafficWindow[];
  /** real availability probes against the gateway health endpoint */
  probes: ProbeSample[];
  /** which memory tier answered this incident, and the cache state after it */
  tiers: MemoryTiers | null;
  outcome: Outcome | null;
  summary: string | null;
  error: string | null;
  /** Only populated in mock mode (the local builder knows more than the wire). */
  run: BuiltRun | null;
}

const IDLE: RunState = {
  status: "idle",
  runId: null,
  source: "mock",
  events: [],
  nodeStatus: {},
  nodeLabel: {},
  activeEdges: [],
  controllerState: null,
  path: null,
  band: null,
  candidates: [],
  windows: [],
  probes: [],
  tiers: null,
  outcome: null,
  summary: null,
  error: null,
  run: null,
};

// --------------------------------------------------------------------------- //
// One reducer for both engines.
//
// The local mock and the FastAPI SSE stream emit the same `SimEvent` union, so
// everything the UI shows is derived here rather than in either producer. That
// is what makes "live" a data-source switch instead of a second code path.
// --------------------------------------------------------------------------- //
function reduce(s: RunState, ev: SimEvent): RunState {
  const next: RunState = { ...s, events: [...s.events, ev] };

  switch (ev.type) {
    case "node.enter":
      next.nodeStatus = { ...s.nodeStatus, [ev.node]: "active" };
      next.nodeLabel = { ...s.nodeLabel, [ev.node]: ev.label };
      break;

    case "node.exit":
      next.nodeStatus = { ...s.nodeStatus, [ev.node]: ev.status };
      break;

    case "edge":
      next.activeEdges = [
        ...s.activeEdges.filter((e) => Date.now() - e.at < 2600),
        { from: ev.from, to: ev.to, label: ev.label, kind: ev.kind ?? "data", at: Date.now() },
      ];
      break;

    case "state":
      next.controllerState = ev.state;
      break;

    case "window":
      // replace on re-send so a reconnect cannot duplicate the series
      next.windows = [...s.windows.filter((w) => w.index !== ev.window.index), ev.window]
        .sort((a, b) => a.index - b.index);
      break;

    case "probe":
      next.probes = [...s.probes.filter((p) => p.seq !== ev.probe.seq), ev.probe]
        .sort((a, b) => a.seq - b.seq);
      break;

    case "decision":
      // the Planner's route choice arrives as "MEDIUM path"
      if (ev.node === "planner" && /\b(LOW|MEDIUM|HIGH)\b/.test(ev.choice)) {
        const m = ev.choice.match(/\b(LOW|MEDIUM|HIGH)\b/);
        if (m) next.path = m[1] as RiskPath;
      }
      break;

    case "artifact": {
      const p = ev.payload as Record<string, unknown> | null;
      if (ev.node === "memory" && p && typeof p === "object" && "answered_by" in p && "cache" in p) {
        next.tiers = p as unknown as MemoryTiers;
      }
      if (ev.node === "memory" && p && typeof p === "object" && "candidates" in p) {
        next.band = (p.band as SimilarityBand) ?? next.band;
        next.candidates = normaliseCandidates(p.candidates);
      }
      break;
    }

    case "run.end":
      next.status = "done";
      next.outcome = ev.outcome;
      next.summary = ev.summary;
      break;
  }
  return next;
}

/** Accept either the mock's shape or the backend's flat candidate rows. */
function normaliseCandidates(raw: unknown): CandidateView[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: Record<string, unknown>) => ({
    case_id: String(c.case_id ?? "?"),
    similarity: Number(c.similarity ?? 0),
    outcome: String(c.prior_outcome ?? c.outcome ?? "—") as Outcome,
    reliability: Number(c.reliability ?? 0),
    reuse_count: Number(c.reuse_count ?? 0),
    device_type: String(c.device_type ?? ""),
    device_criticality: String(c.device_criticality ?? ""),
    executed_response: String(c.executed_response ?? ""),
    allow: c.gate === "ALLOW",
    reason: String(c.reason ?? ""),
  }));
}

// --------------------------------------------------------------------------- //

export function useSimRun() {
  const [state, setState] = useState<RunState>(IDLE);
  const timers = useRef<number[]>([]);
  const source = useRef<EventSource | null>(null);
  const generation = useRef(0);

  const clear = () => {
    generation.current += 1;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    source.current?.close();
    source.current = null;
  };

  useEffect(() => () => clear(), []);

  const reset = useCallback(() => {
    clear();
    setState(IDLE);
  }, []);

  const push = useCallback((ev: SimEvent) => setState((s) => reduce(s, ev)), []);

  // ------------------------------------------------------------------ //
  // Mock engine: plays a locally-built run on a timer.
  // ------------------------------------------------------------------ //
  const startMock = useCallback((scenarioKey: string, faults: FaultFlags) => {
    clear();
    const run = buildRun(scenarioKey, faults);
    const t0 = Date.now();
    const ts = () => Date.now() - t0;

    setState({
      ...IDLE,
      status: "running",
      source: "mock",
      run,
      runId: null,
      events: [{ type: "run.start", runId: `RUN-${t0.toString(36).toUpperCase()}`, scenario: scenarioKey, ts: 0 }],
    });

    const at = (delayMs: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, delayMs));
    };

    let cursor = 260;

    run.steps.forEach((step: Step) => {
      const enterAt = cursor;
      const groupSpan = step.group ? Math.max(...step.group.map((g) => g.ms)) : 0;
      const span = Math.max(step.ms, groupSpan);

      at(enterAt, () => {
        // A skipped node must never flash active, so it gets no enter event.
        if (step.status !== "skipped") {
          push({ type: "node.enter", node: step.node, label: step.label, ts: ts() });
        }
        if (step.window) push({ type: "window", window: step.window, ts: ts() });
        step.probes?.forEach((pr) => push({ type: "probe", probe: pr, ts: ts() }));
        if (step.state) push({ type: "state", state: step.state, ts: ts() });
        (step.edges ?? []).forEach((e) =>
          push({ type: "edge", from: e.from, to: e.to, label: e.label, kind: e.kind ?? "data", ts: ts() }),
        );
        step.group?.forEach((g) => push({ type: "node.enter", node: g.node, label: g.label, ts: ts() }));
        step.logs?.forEach((l) => push({ type: "log", level: l.level, agent: l.agent, msg: l.msg, ts: ts() }));
        if (step.decision) push({ type: "decision", node: step.node, ...step.decision, ts: ts() });
        if (step.fallback) push({ type: "fallback", node: step.node, ...step.fallback, ts: ts() });
        if (step.artifact)
          push({ type: "artifact", node: step.node, title: step.artifact.title, payload: step.artifact.payload, ts: ts() });
        step.metrics?.forEach((m) => push({ type: "metric", key: m.key, value: m.value, ts: ts() }));
      });

      // concurrent specialist workers finish independently
      step.group?.forEach((g) => {
        at(enterAt + g.ms, () => {
          g.logs?.forEach((l) => push({ type: "log", level: l.level, agent: l.agent, msg: l.msg, ts: ts() }));
          if (g.artifact)
            push({ type: "artifact", node: g.node, title: g.artifact.title, payload: g.artifact.payload, ts: ts() });
          push({ type: "node.exit", node: g.node, status: g.status ?? "ok", ms: g.ms, ts: ts() });
        });
      });

      at(enterAt + span, () => {
        push({ type: "node.exit", node: step.node, status: step.status ?? "ok", ms: span, ts: ts() });
      });

      cursor = enterAt + span + 190;
    });

    at(cursor + 200, () => {
      push({ type: "run.end", outcome: run.outcome, summary: run.summary, ts: ts() });
    });
  }, [push]);

  // ------------------------------------------------------------------ //
  // Live engine: the same events, streamed from the FastAPI agent runtime.
  // ------------------------------------------------------------------ //
  const startLive = useCallback((scenarioKey: string, faults: FaultFlags, apiBase: string, sourceMode: "fixture" | "capture_replay" = "fixture") => {
    clear();
    const requestGeneration = generation.current;
    const t0 = Date.now();
    setState({
      ...IDLE,
      status: "running",
      source: "live",
      runId: null,
      events: [{ type: "run.start", runId: "LIVE", scenario: scenarioKey, ts: 0 }],
    });

    const connect = (runId: string) => {
      const es = new EventSource(`${apiBase}/api/runs/${encodeURIComponent(runId)}/events`, { withCredentials: true });
      source.current = es;

      es.onmessage = (m) => {
        if (requestGeneration !== generation.current) return;
        try {
          const ev = JSON.parse(m.data) as SimEvent;
          push(ev);
          if (ev.type === "run.end") {
            es.close();
            source.current = null;
          }
        } catch {
          /* a malformed frame must not kill the run; the next one may be fine */
        }
      };

      // Leave EventSource open while it is CONNECTING: it retries transient
      // disconnects and sends Last-Event-ID so the server can replay the gap.
      es.onerror = () => {
        if (requestGeneration !== generation.current) return;
        if (es.readyState !== EventSource.CLOSED) return;
        source.current = null;
        setState((s) => s.status === "done" ? s : {
          ...s,
          status: "error",
          error:
            `Could not reach the agent runtime at ${apiBase}. Start it with ` +
            `"uvicorn app.main:app --port 8099" in backend/, or switch back to Local mode.`,
        });
      };
    };

    fetch(`${apiBase}/api/runs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: scenarioKey,
        source_mode: sourceMode,
        faults: {
          llmDown: faults.llmDown,
          plannerCrash: faults.plannerCrash,
          memoryDown: faults.memoryDown,
          subAgentTimeout: faults.subAgentTimeout,
          policyConflict: faults.policyConflict,
        },
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
        return response.json() as Promise<{ run_id: string }>;
      })
      .then(({ run_id }) => {
        if (requestGeneration === generation.current) {
          setState((s) => ({ ...s, runId: run_id }));
          connect(run_id);
        }
      })
      .catch((error: unknown) => {
        if (requestGeneration !== generation.current) return;
        setState((s) => ({
          ...s,
          status: "error",
          error: `Could not create a run at ${apiBase}: ${error instanceof Error ? error.message : String(error)}`,
        }));
      });

    // guard against a run that never reaches a terminal event
    timers.current.push(
      window.setTimeout(() => {
        source.current?.close();
        source.current = null;
        setState((s) => (s.status === "running" ? { ...s, status: "error", error: "Live run timed out after 90s." } : s));
      }, 90_000),
    );
    void t0;
  }, [push]);

  const cancelLive = useCallback(async (apiBase: string) => {
    const runId = state.runId;
    if (!runId || state.source !== "live" || state.status !== "running") return;
    try {
      const response = await fetch(`${apiBase}/api/runs/${encodeURIComponent(runId)}/cancel`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
    } catch (error) {
      setState((s) => ({
        ...s,
        error: `Cancellation request failed: ${error instanceof Error ? error.message : String(error)}`,
      }));
    }
  }, [state.runId, state.source, state.status]);

  return { state, startMock, startLive, cancelLive, reset };
}
