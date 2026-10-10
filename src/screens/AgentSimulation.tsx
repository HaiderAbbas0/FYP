import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgentGraph from "../components/agents/AgentGraph";
import DetectionChart from "../components/agents/DetectionChart";
import AvailabilityStrip from "../components/agents/AvailabilityStrip";
import MemoryTiersPanel from "../components/agents/MemoryTiers";
import Button from "../components/ui/Button";
import Badge, { OutcomeBadge, RouteBadge } from "../components/ui/Badge";
import { useSimRun } from "../agents/engine";
import { MODEL_CARD, REPLAYS, SCENARIOS, THRESHOLDS, scenarioByKey } from "../agents/scenarios";
import { NODE_BY_ID, PLANNER } from "../agents/graph";
import { NO_FAULTS, type CacheStats, type FaultFlags, type NodeId, type SimEvent } from "../agents/types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8099";

const FAULTS: Array<{ key: keyof FaultFlags; label: string; hint: string }> = [
  { key: "llmDown", label: "LLM provider down", hint: "Every key in every provider pool fails" },
  { key: "plannerCrash", label: "Planner interruption", hint: "Inject a controller interruption before actuation; real worker shutdown is tested separately" },
  { key: "memoryDown", label: "Memory offline", hint: "Vector store unreachable — no case reuse possible" },
  { key: "subAgentTimeout", label: "Sub-agent timeout", hint: "A specialist worker stalls past its budget" },
  { key: "policyConflict", label: "Unsafe recommendation", hint: "Response Agent proposes an action policy forbids" },
];

const LEVEL_COLOR: Record<string, string> = {
  info: "#8A918A", ok: "#4ADE80", warn: "#FBBF24", error: "#F87171", alert: "#F87171", route: "#B6FF3B",
};

interface ProviderHealth { name: string; model: string; keys_total: number; keys_available: number }
interface ModelCard {
  model_type?: string; n_estimators?: number; n_features?: number;
  attack_scope?: string[]; dataset?: string; test_roc_auc?: number;
  detect_threshold?: number;
  top_importances?: Array<{ feature: string; importance: number }>;
}

interface Health {
  llm: {
    chain: string[]; configured: boolean; available: boolean; providers: ProviderHealth[];
    calls: number; failures: number; key_rotations: number; provider_failovers: number;
    avg_latency_ms: number; last_provider: string | null; last_error: string | null; circuit_open: boolean;
  };
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="mono text-[12px] leading-[1.6] text-[#A9B3AA] bg-[#0A0D0A] border border-[#1A1F1B] rounded-[8px] p-3 overflow-x-auto whitespace-pre">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249] mb-1.5">{title}</div>
      {children}
    </div>
  );
}

export default function AgentSimulation() {
  const [scenario, setScenario] = useState("medium");
  const [faults, setFaults] = useState<FaultFlags>(NO_FAULTS);
  const [selected, setSelected] = useState<NodeId | null>("planner");
  const [tab, setTab] = useState<"stream" | "agent" | "memory" | "resilience">("stream");
  const [mode, setMode] = useState<"mock" | "live">("mock");
  const [sourceMode, setSourceMode] = useState<"fixture" | "capture_replay">("fixture");
  const [health, setHealth] = useState<Health | null>(null);
  const [cache, setCache] = useState<CacheStats | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const { state, startMock, startLive, cancelLive, reset } = useSimRun();
  const logRef = useRef<HTMLDivElement>(null);

  const meta = scenarioByKey(scenario);
  const running = state.status === "running";
  const expectedWindows = REPLAYS.scenarios[scenario]?.replay.windows ?? 12;
  const probeUrl = mode === "live" ? `${API_BASE}/gateway/health` : "/gateway/health";
  const modelCard = MODEL_CARD as ModelCard;

  // -- backend health -------------------------------------------------------
  const probe = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setHealth(await r.json());
      setHealthErr(null);
      try {
        const c = await fetch(`${API_BASE}/api/memory/cache`, { credentials: "include", signal: AbortSignal.timeout(4000) });
        if (c.ok) setCache(await c.json());
      } catch {
        /* cache state is informational; a failure here must not blank the runtime bar */
      }
    } catch (e) {
      setHealth(null);
      setHealthErr(e instanceof Error ? e.message : "unreachable");
    }
  }, []);

  useEffect(() => { void probe(); }, [probe]);
  // refresh after a live run so call counts and key rotations are current
  useEffect(() => {
    if (state.status === "done" && state.source === "live") void probe();
  }, [state.status, state.source, probe]);

  useEffect(() => {
    if (logRef.current && tab === "stream") logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [state.events.length, tab]);

  const toggleFault = (k: keyof FaultFlags) => setFaults((f) => ({ ...f, [k]: !f[k] }));
  const activeFaults = FAULTS.filter((f) => faults[f.key]);

  const fallbackEvents = state.events.filter((e): e is Extract<SimEvent, { type: "fallback" }> => e.type === "fallback");
  const decisions = state.events.filter((e): e is Extract<SimEvent, { type: "decision" }> => e.type === "decision");
  const metrics = state.events.filter((e): e is Extract<SimEvent, { type: "metric" }> => e.type === "metric");

  const selectedNode = selected && selected !== "planner" ? NODE_BY_ID[selected] : null;
  const selectedArtifacts = useMemo(
    () => state.events.filter((e): e is Extract<SimEvent, { type: "artifact" }> => e.type === "artifact" && e.node === selected),
    [state.events, selected],
  );

  const specialistsRun = Object.keys(state.nodeStatus).filter(
    (n) => n.startsWith("sub.") && state.nodeStatus[n] !== "idle",
  ).length;

  const degraded = state.run?.degraded ?? fallbackEvents.map((f) => f.trigger);
  const liveOk = mode === "live" && !!health;

  const run = () => {
    setSelected("planner");
    setTab("stream");
    if (mode === "live") startLive(scenario, faults, API_BASE, sourceMode);
    else startMock(scenario, faults);
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-8">
      {/* ---------------- header ---------------- */}
      <div className="pt-5 pb-4">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-[30px] font-bold text-[#E8EDE9] leading-tight">Agent Simulation</h1>
            <p className="text-[15px] text-[#8A918A] mt-1 max-w-[820px]">
              Replays one incident through the full agent runtime. The Planner routes by risk, the Memory Agent decides
              how much prior work can be safely reused, and a deterministic policy gate — not the model — holds
              execution authority.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* engine selector */}
            <div className="flex items-center gap-1 bg-[#111511] border border-[#242924] rounded-[10px] p-1">
              {(["mock", "live"] as const).map((m) => {
                const on = mode === m;
                const disabled = running || (m === "live" && !health);
                return (
                  <button key={m} disabled={disabled} onClick={() => { setMode(m); reset(); }}
                    title={m === "live" ? (health ? `Streaming from ${API_BASE}` : `Agent runtime unreachable at ${API_BASE}`) : "Deterministic local replay — no backend needed"}
                    className={`mono text-[13px] px-3 py-1 rounded-[6px] disabled:opacity-35 ${on ? "bg-[#1E241F] text-[#B6FF3B]" : "text-[#8A918A]"}`}>
                    {m === "mock" ? "Illustration" : "Backend"}
                  </button>
                );
              })}
            </div>
            <Button variant="secondary" disabled={running} onClick={reset}>Reset</Button>
            {mode === "live" && running && (
              <Button variant="secondary" onClick={() => void cancelLive(API_BASE)}>Cancel run</Button>
            )}
            <Button variant="primary" disabled={running} onClick={run}>
              {running ? "Running…" : mode === "live" ? "Run backend" : "Run illustration"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-[#8A918A] flex items-center gap-3">
        <label htmlFor="runtime-source">Backend input</label>
        <select id="runtime-source" disabled={running} value={sourceMode} onChange={e => setSourceMode(e.target.value as "fixture" | "capture_replay")} className="bg-[#111511] border border-[#242924] rounded p-2">
          <option value="fixture">Synthetic fixture — no detector or dataset required</option>
          <option value="capture_replay">Capture replay — requires detector and capture artifacts</option>
        </select>
        <span>Connect an API session in the operational dashboard first. Both inputs use a stub actuator and produce unvalidated outcomes.</span>
      </div>
      {/* ---------------- runtime status ---------------- */}
      <div className="mb-4 bg-[#111511] border rounded-[12px] px-4 py-3"
        style={{ borderColor: liveOk ? "#2F3D22" : "#242924" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${health ? "bg-[#22C55E] lime-pulse" : "bg-[#EF4444]"}`} />
            <span className="text-[15px] font-semibold text-[#E8EDE9]">Agent runtime</span>
            <span className="mono text-[12px] text-[#8A918A]">{API_BASE}</span>
            {health ? (
              <Badge variant={health.llm.available ? "success" : "warning"}>
                {health.llm.available ? "LLM ready" : health.llm.circuit_open ? "circuit open" : "no keys"}
              </Badge>
            ) : (
              <Badge variant="danger">offline{healthErr ? ` · ${healthErr}` : ""}</Badge>
            )}
            <button onClick={() => void probe()} className="mono text-[12px] text-[#8A918A] hover:text-[#B6FF3B] underline underline-offset-2">
              recheck
            </button>
          </div>

          {health && (
            <div className="flex items-center gap-5">
              {health.llm.providers.map((p) => (
                <div key={p.name} className="text-right">
                  <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">
                    {p.name} · {p.model}
                  </div>
                  <div className="mono text-[14px] text-[#E8EDE9]">
                    <span className="text-[#B6FF3B]">{p.keys_available}</span>
                    <span className="text-[#4A5249]">/{p.keys_total} keys ready</span>
                  </div>
                </div>
              ))}
              <div className="text-right border-l border-[#242924] pl-5">
                <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">calls · rotations · failover</div>
                <div className="mono text-[14px] text-[#E8EDE9]">
                  {health.llm.calls} · {health.llm.key_rotations} · {health.llm.provider_failovers}
                  {health.llm.avg_latency_ms > 0 && <span className="text-[#4A5249]"> · {health.llm.avg_latency_ms}ms</span>}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* detector provenance - the numbers on the chart come from here */}
        <div className="mt-3 pt-3 border-t border-[#1E241F] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[15px] font-semibold text-[#E8EDE9]">Reference capture model (requires artifacts)</span>
            <span className="mono text-[12px] text-[#8A918A]">
              {modelCard.model_type} · {modelCard.n_estimators} trees · {modelCard.n_features} features
            </span>
            <Badge variant="outline">{(modelCard.attack_scope ?? []).join(" vs ")}</Badge>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">dataset</div>
              <div className="mono text-[13px] text-[#E8EDE9]">CICIoMT2024</div>
            </div>
            <div className="text-right">
              <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">held-out roc-auc</div>
              <div className="mono text-[13px] text-[#B6FF3B]">{modelCard.test_roc_auc}</div>
            </div>
            <div className="text-right border-l border-[#242924] pl-5">
              <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">top features</div>
              <div className="mono text-[13px] text-[#E8EDE9]">
                {(modelCard.top_importances ?? []).slice(0, 3).map((f) => f.feature).join(", ")}
              </div>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-[#8A918A] mt-2 leading-relaxed">
          The detection chart and every confidence value below are real <span className="mono">predict_proba</span> output
          over CICIoMT2024 capture rows — in Local mode from a recorded run, in Live mode computed now. The outcome
          telemetry after execution is an effect model, and is labelled as such.
        </p>

        {!health && (
          <p className="text-[13px] text-[#8A918A] mt-2">
            Local mode replays a deterministic build of the same event stream, so the demo works with the backend down.
            To stream from the real agents: <span className="mono text-[#A9B3AA]">cd backend &amp;&amp; .venv/Scripts/python -m uvicorn app.main:app --port 8099</span>
          </p>
        )}
        {state.error && (
          <p className="text-[13px] text-[#F87171] mt-2">{state.error}</p>
        )}
      </div>

      {/* ---------------- scenario + faults ---------------- */}
      <div className="grid grid-cols-[1fr_400px] gap-4 mb-4">
        <div className="bg-[#111511] border border-[#242924] rounded-[12px] p-4">
          <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249] mb-2.5">Scenario</div>
          <div className="grid grid-cols-3 gap-2.5">
            {SCENARIOS.map((s) => {
              const on = scenario === s.key;
              return (
                <button key={s.key} disabled={running} onClick={() => { setScenario(s.key); reset(); }}
                  className="text-left rounded-[10px] p-3 border transition-all disabled:opacity-60"
                  style={{ borderColor: on ? "#B6FF3B" : "#242924", background: on ? "#141A10" : "#0E120E" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <RouteBadge value={s.key === "low" ? "SHORT" : s.key === "medium" ? "PARTIAL" : "DEEP"} />
                    <span className="mono text-[12px] text-[#8A918A]">conf {s.confidence.toFixed(4)}</span>
                  </div>
                  <div className="text-[14px] text-[#E8EDE9] font-medium leading-snug">{s.name}</div>
                  <div className="text-[12px] text-[#8A918A] mt-1.5 leading-snug">
                    {s.device.name} · {s.device.criticality} · {Math.round(s.attackRatio * 100)}% attack flows
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-[#8A918A] mt-3 leading-relaxed border-l-2 border-[#242924] pl-3">{meta.blurb}</p>
        </div>

        <div className="bg-[#111511] border border-[#242924] rounded-[12px] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">Fault injection</span>
            {activeFaults.length > 0 && <Badge variant="warning">{activeFaults.length} active</Badge>}
          </div>
          <div className="space-y-1.5">
            {FAULTS.map((f) => {
              const on = faults[f.key];
              return (
                <button key={f.key} disabled={running} onClick={() => { toggleFault(f.key); reset(); }}
                  title={f.hint}
                  className="w-full flex items-center gap-2.5 text-left rounded-[8px] px-2.5 py-1.5 border transition-all disabled:opacity-60"
                  style={{ borderColor: on ? "#8A6212" : "#1E241F", background: on ? "#1C1608" : "#0E120E" }}>
                  <span className="w-8 h-[18px] rounded-full relative shrink-0" style={{ background: on ? "#F59E0B" : "#242924" }}>
                    <span className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-[#0A0D0A] transition-all" style={{ left: on ? 16 : 2 }} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] ${on ? "text-[#FBBF24]" : "text-[#E8EDE9]"}`}>{f.label}</span>
                    <span className="block text-[11px] text-[#8A918A] truncate">{f.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- graph + inspector ---------------- */}
      <div className="grid grid-cols-[1fr_400px] gap-4">
        <div>
          <div className="mb-4">
            <DetectionChart
              windows={state.windows}
              expected={expectedWindows}
              detectThreshold={THRESHOLDS.DETECT}
              fastPathFloor={THRESHOLDS.MIN_DETECTOR_CONFIDENCE_FOR_FAST_PATH}
              running={running}
            />
            <div className="mt-4">
              <AvailabilityStrip probes={state.probes} running={running} probeUrl={probeUrl} />
            </div>
          </div>
          <AgentGraph
            nodeStatus={state.nodeStatus}
            nodeLabel={state.nodeLabel}
            activeEdges={state.activeEdges}
            selected={selected}
            onSelect={setSelected}
            plannerActive={state.nodeStatus["planner"] === "active" || running}
            controllerState={state.controllerState}
          />

          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { k: "Route", v: state.path ?? "—" },
              { k: "Similarity band", v: state.band ?? "—" },
              { k: "Specialists run", v: state.status === "idle" ? "—" : `${specialistsRun} / 5` },
              { k: "Outcome", v: state.outcome ?? "—" },
            ].map((c) => (
              <div key={c.k} className="bg-[#111511] border border-[#242924] rounded-[10px] px-3.5 py-2.5">
                <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">{c.k}</div>
                <div className="mono text-[19px] text-[#E8EDE9] font-semibold mt-0.5">{c.v}</div>
              </div>
            ))}
          </div>

          {metrics.length > 0 && (
            <div className="mt-3 bg-[#111511] border border-[#242924] rounded-[12px] p-4">
              <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249] mb-2.5">Outcome validation</div>
              <div className="grid grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                  <div key={i}>
                    <div className="text-[13px] text-[#8A918A]">{m.key}</div>
                    <div className="mono text-[20px] text-[#B6FF3B] font-semibold">{String(m.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.status === "done" && (
            <div className="mt-3 rounded-[12px] p-4 border" style={{ borderColor: "#2F3D22", background: "#0F1A12" }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                {state.outcome && <OutcomeBadge value={state.outcome} />}
                <span className="text-[16px] font-semibold text-[#E8EDE9]">Run complete</span>
                <Badge variant="outline">{state.source === "live" ? "live agents" : "local replay"}</Badge>
              </div>
              <p className="text-[14px] text-[#A9B3AA] leading-relaxed">{state.summary}</p>
              {degraded.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {degraded.map((d, i) => (
                    <li key={i} className="text-[13px] text-[#FBBF24] flex gap-2"><span>▲</span><span>{d}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ---------------- right inspector ---------------- */}
        <div className="bg-[#111511] border border-[#242924] rounded-[12px] flex flex-col" style={{ height: 540 }}>
          <div className="flex border-b border-[#1E241F] shrink-0">
            {([
              ["stream", "Stream"],
              ["agent", "Agent"],
              ["memory", "Memory"],
              ["resilience", "Resilience"],
            ] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 text-[14px] py-2.5 font-medium transition-colors ${tab === k ? "text-[#E8EDE9]" : "text-[#8A918A]"}`}
                style={{ borderBottom: tab === k ? "2px solid #B6FF3B" : "2px solid transparent" }}>
                {label}
                {k === "resilience" && fallbackEvents.length > 0 && (
                  <span className="ml-1.5 mono text-[11px] text-[#FBBF24]">{fallbackEvents.length}</span>
                )}
              </button>
            ))}
          </div>

          <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto p-3.5">
            {/* ---- STREAM ---- */}
            {tab === "stream" && (
              <div className="space-y-1">
                {state.events.length === 0 && (
                  <p className="text-[14px] text-[#8A918A] p-2">
                    Press <span className="text-[#B6FF3B]">{mode === "live" ? "Run live" : "Run simulation"}</span> to
                    stream the agent handoffs, routing decisions and policy checks in real time.
                  </p>
                )}
                {state.events.map((e, i) => {
                  const t = "ts" in e ? `${(e.ts / 1000).toFixed(2)}s` : "";
                  if (e.type === "log")
                    return (
                      <div key={i} className="flex gap-2 fade-in">
                        <span className="mono text-[11px] text-[#4A5249] w-[46px] shrink-0 pt-[2px]">{t}</span>
                        <span className="mono text-[11px] w-[78px] shrink-0 pt-[2px] truncate" style={{ color: LEVEL_COLOR[e.level] }}>{e.agent}</span>
                        <span className="text-[13px] leading-snug" style={{ color: e.level === "info" ? "#A9B3AA" : LEVEL_COLOR[e.level] }}>{e.msg}</span>
                      </div>
                    );
                  if (e.type === "decision")
                    return (
                      <div key={i} className="my-2 rounded-[8px] border border-[#2F3D22] bg-[#141A10] p-2.5 fade-in">
                        <div className="mono text-[10px] uppercase tracking-wider text-[#B6FF3B] mb-1">Decision · {e.node}</div>
                        <div className="text-[13px] text-[#E8EDE9] font-medium">{e.question}</div>
                        <div className="mono text-[13px] text-[#B6FF3B] my-1">→ {e.choice}</div>
                        <div className="text-[12px] text-[#8A918A] leading-relaxed">{e.rationale}</div>
                      </div>
                    );
                  if (e.type === "fallback")
                    return (
                      <div key={i} className="my-2 rounded-[8px] border border-[#8A6212] bg-[#1C1608] p-2.5 fade-in">
                        <div className="mono text-[10px] uppercase tracking-wider text-[#FBBF24] mb-1">Fallback engaged · {e.node}</div>
                        <div className="text-[13px] text-[#FBBF24] font-medium">{e.trigger}</div>
                        <div className="text-[12px] text-[#A9B3AA] leading-relaxed mt-1">{e.action}</div>
                      </div>
                    );
                  if (e.type === "state")
                    return (
                      <div key={i} className="flex gap-2 items-center fade-in py-0.5">
                        <span className="mono text-[11px] text-[#4A5249] w-[46px] shrink-0">{t}</span>
                        <span className="mono text-[11px] px-1.5 rounded border border-[#2A302B] text-[#8A918A]">STATE</span>
                        <span className="mono text-[12px] text-[#E8EDE9]">{e.state}</span>
                      </div>
                    );
                  if (e.type === "run.end")
                    return <div key={i} className="mt-2 mono text-[12px] text-[#4ADE80] fade-in">■ run.end · {e.outcome}</div>;
                  return null;
                })}
              </div>
            )}

            {/* ---- AGENT ---- */}
            {tab === "agent" && (
              <div>
                {selected === "planner" ? (
                  <>
                    <div className="text-[18px] font-bold text-[#E8EDE9] mb-1">{PLANNER.title}</div>
                    <div className="text-[13px] text-[#8A918A] mb-3">{PLANNER.subtitle}</div>
                    <Section title="Role">
                      <p className="text-[13px] text-[#A9B3AA] leading-relaxed">
                        The Planner is the workflow manager. It decides what should happen next; it never performs the
                        analysis itself. It owns routing, memory usage, which specialists are invoked, explanation depth,
                        and the case lifecycle. Transitions are journaled for audit and SSE replay; the current PoC marks
                        interrupted runs for review instead of resuming controller execution after a process crash.
                      </p>
                    </Section>
                    <Section title="What it does NOT do">
                      <p className="text-[13px] text-[#8A918A] leading-relaxed">
                        Packet parsing · feature extraction · ML classification · vector similarity computation ·
                        SHAP/LIME · firewall or device actions · outcome measurement.
                      </p>
                    </Section>
                    {decisions.length > 0 && (
                      <Section title={`Decision trail (${decisions.length})`}>
                        <div className="space-y-2">
                          {decisions.map((d, i) => (
                            <div key={i} className="rounded-[8px] border border-[#1E241F] p-2.5">
                              <div className="text-[13px] text-[#E8EDE9]">{d.question}</div>
                              <div className="mono text-[13px] text-[#B6FF3B] my-1">→ {d.choice}</div>
                              <div className="text-[12px] text-[#8A918A] leading-relaxed">{d.rationale}</div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </>
                ) : selectedNode ? (
                  <>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[18px] font-bold text-[#E8EDE9]">{selectedNode.name ?? selectedNode.title}</span>
                      {selectedNode.code && <Badge variant="violet">{selectedNode.code}</Badge>}
                      {selectedNode.owner === "partner" && <Badge variant="outline">detection track</Badge>}
                      {selectedNode.llm !== "none" && (
                        <Badge variant="violet">{selectedNode.llm === "primary" ? "LLM" : "LLM optional"}</Badge>
                      )}
                    </div>
                    <div className="text-[13px] text-[#8A918A] mb-3">{selectedNode.subtitle}</div>
                    <Section title="Role"><p className="text-[13px] text-[#A9B3AA] leading-relaxed">{selectedNode.role}</p></Section>
                    <Section title="If it fails"><p className="text-[13px] text-[#FBBF24] leading-relaxed">{selectedNode.fallback}</p></Section>
                    {selectedArtifacts.map((a, i) => (
                      <Section key={i} title={a.title}><Json value={a.payload} /></Section>
                    ))}
                    {selectedArtifacts.length === 0 && (
                      <p className="text-[13px] text-[#4A5249]">No artifact produced yet in this run.</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] text-[#8A918A]">Select any node in the graph.</p>
                )}
              </div>
            )}

            {/* ---- MEMORY ---- */}
            {tab === "memory" && (
              <div>
                <Section title="Two-tier memory">
                  <MemoryTiersPanel
                    tiers={state.tiers}
                    cache={cache}
                    primaryCases={null}
                  />
                </Section>
                <Section title="Why the Memory Agent exists">
                  <p className="text-[13px] text-[#A9B3AA] leading-relaxed">
                    Every validated incident is stored as a case: attack family and subtype, device type and criticality,
                    behavioural signature, source cardinality, which specialists were useful, the executed action, the
                    measured outcome and a reliability score. Over time the store covers more attack families and more
                    device classes, so more incidents can reuse validated reasoning instead of re-deriving it. That is the
                    adaptation — not retraining the detector after every alert.
                  </p>
                </Section>
                <Section title="Reuse gate">
                  <div className="rounded-[8px] border border-[#1E241F] p-3 space-y-1.5">
                    {[
                      ["High-similarity reuse", `≥ ${THRESHOLDS.HIGH_SIMILARITY}`],
                      ["Partial-similarity reuse", `≥ ${THRESHOLDS.PARTIAL_SIMILARITY}`],
                      ["Minimum prior reliability", `≥ ${THRESHOLDS.MIN_RELIABILITY}`],
                      ["Detector confidence for fast path", `≥ ${THRESHOLDS.MIN_DETECTOR_CONFIDENCE_FOR_FAST_PATH}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[13px]">
                        <span className="text-[#8A918A]">{k}</span><span className="mono text-[#B6FF3B]">{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#8A918A] leading-relaxed mt-2">
                    Thresholds are deliberately high. In cybersecurity the same attack family against a different device
                    class can demand a completely different response, so similarity alone never authorises reuse — the
                    context-compatibility check and the prior outcome's reliability must both pass as well.
                  </p>
                </Section>
                {state.candidates.length > 0 ? (
                  <Section title={`Retrieved this run (band: ${state.band ?? "—"})`}>
                    <div className="space-y-2">
                      {state.candidates.map((c) => (
                        <div key={c.case_id} className="rounded-[8px] border p-2.5"
                          style={{ borderColor: c.allow ? "#1F6E38" : "#3D1A1A", background: c.allow ? "#0F1A12" : "#1A0E0E" }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="mono text-[13px] text-[#E8EDE9]">{c.case_id}</span>
                            <Badge variant={c.allow ? "success" : "danger"}>{c.allow ? "REUSE ALLOWED" : "BLOCKED"}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 my-1.5">
                            {[["similarity", c.similarity.toFixed(3)], ["reliability", c.reliability.toFixed(2)], ["outcome", c.outcome]].map(([k, v]) => (
                              <div key={k}>
                                <div className="mono text-[10px] uppercase text-[#4A5249]">{k}</div>
                                <div className="mono text-[14px] text-[#E8EDE9]">{v}</div>
                              </div>
                            ))}
                          </div>
                          {c.device_type && (
                            <div className="text-[12px] text-[#8A918A]">
                              {c.device_type} · {c.device_criticality} · reused {c.reuse_count}×
                            </div>
                          )}
                          {c.executed_response && <div className="mono text-[12px] text-[#A9B3AA] mt-1">{c.executed_response}</div>}
                          {!c.allow && c.reason && (
                            <div className="text-[12px] text-[#F87171] mt-1.5 leading-snug">{c.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                ) : (
                  <Section title="Retrieved this run">
                    <p className="text-[13px] text-[#8A918A]">
                      {state.status === "idle"
                        ? "Run a simulation to see retrieval."
                        : "No cases retrieved — memory was offline, so the run proceeded with zero reuse."}
                    </p>
                  </Section>
                )}
                <Section title="Degrading gracefully without API keys">
                  <p className="text-[13px] text-[#A9B3AA] leading-relaxed">
                    Because memory stores the executed action and its measured outcome — not model weights — the store
                    keeps working when the LLMs are switched off. With generative reasoning disabled the system falls
                    back to retrieval plus the deterministic policy table: it still recognises attack families it has
                    validated before and still avoids actions previously recorded as HARMFUL, which a static
                    signature IDS cannot do. It will not match a fully-online run on novel incidents, and we do not
                    claim it will.
                  </p>
                </Section>
              </div>
            )}

            {/* ---- RESILIENCE ---- */}
            {tab === "resilience" && (
              <div>
                {fallbackEvents.length > 0 && (
                  <Section title={`Fallbacks engaged this run (${fallbackEvents.length})`}>
                    <div className="space-y-2">
                      {fallbackEvents.map((f, i) => (
                        <div key={i} className="rounded-[8px] border border-[#8A6212] bg-[#1C1608] p-2.5">
                          <div className="mono text-[11px] text-[#FBBF24] uppercase tracking-wider mb-1">{f.node}</div>
                          <div className="text-[13px] text-[#FBBF24] font-medium">{f.trigger}</div>
                          <div className="text-[12px] text-[#A9B3AA] leading-relaxed mt-1">{f.action}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                <Section title="LLM provider chain">
                  <p className="text-[13px] text-[#A9B3AA] leading-relaxed mb-2">
                    Reasoning calls walk a chain of providers, and each provider has a pool of keys. A rate-limited key is
                    parked and the next one is used; when a whole pool is spent the next provider serves the same prompt.
                    Free-tier inference limits per key, and one incident can fire several agent calls, so the pool is what
                    stops a burst of incidents from taking the reasoning layer offline.
                  </p>
                  {health ? (
                    <div className="rounded-[8px] border border-[#1E241F] p-3 space-y-1.5">
                      {health.llm.providers.map((p, i) => (
                        <div key={p.name} className="flex justify-between text-[13px]">
                          <span className="text-[#8A918A]">{i + 1}. {p.name} <span className="mono text-[11px] text-[#4A5249]">{p.model}</span></span>
                          <span className="mono text-[#B6FF3B]">{p.keys_available}/{p.keys_total} keys</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[13px] pt-1.5 border-t border-[#1E241F]">
                        <span className="text-[#8A918A]">then</span>
                        <span className="mono text-[#FBBF24]">deterministic rules</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#4A5249]">Runtime offline — provider status unavailable.</p>
                  )}
                </Section>
                <Section title="Failure matrix — every agent">
                  <div className="space-y-2">
                    {Object.values(NODE_BY_ID).map((n) => (
                      <div key={n.id} className="rounded-[8px] border border-[#1E241F] p-2.5">
                        <div className="text-[13px] text-[#E8EDE9] font-medium mb-1">
                          {n.name ?? n.title}
                          {n.code && <span className="mono text-[10px] text-[#7C6FF0] ml-1.5">{n.code}</span>}
                        </div>
                        <div className="text-[12px] text-[#8A918A] leading-relaxed">{n.fallback}</div>
                      </div>
                    ))}
                    <div className="rounded-[8px] border border-[#2F3D22] bg-[#141A10] p-2.5">
                      <div className="text-[13px] text-[#E8EDE9] font-medium mb-1">Planner Agent (Controller)</div>
                      <div className="text-[12px] text-[#A9B3AA] leading-relaxed">
                        The Planner validates each state transition and records it in the run journal. The current runtime
                        does not resume execution after a process crash: unfinished runs are marked interrupted and their
                        outcomes remain unvalidated. Specialist workers run concurrently with bounded deadlines; failures
                        are recorded as evidence gaps, and missing required evidence escalates before an action can run.
                      </div>
                    </div>
                  </div>
                </Section>
                <Section title="Invariant">
                  <p className="text-[13px] text-[#A9B3AA] leading-relaxed">
                    Whatever fails, three things never change: no action executes without passing the deterministic
                    policy gate; no case is written to memory without a measured outcome; and every degradation is
                    recorded on the incident so the run can be reconstructed afterwards.
                  </p>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
