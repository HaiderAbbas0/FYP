import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { RouteBadge } from "../components/ui/Badge";
import type { Screen } from "../types";

interface Props {
  view: "configure" | "running" | "result";
  onNavigate: (s: Screen) => void;
}

const stages = ["Baseline", "Attack", "Detect", "Route", "Investigate", "Respond", "Validate", "Finalize"];
const checkItems = [
  { label: "Lab mode enabled", ok: true },
  { label: "Target device online", ok: true },
  { label: "Edge pipeline healthy", ok: true },
  { label: "Detector online", ok: true },
  { label: "Controller online", ok: true },
  { label: "Database online", ok: true },
  { label: "Baseline monitoring ready", ok: true },
];

const liveLog = [
  { ts: "14:02:01", msg: "Attack generator started", level: "info" },
  { ts: "14:02:02", msg: "Detector confidence: 0.97", level: "alert" },
  { ts: "14:02:02", msg: "Controller route → PARTIAL", level: "route" },
  { ts: "14:02:03", msg: "Case Memory retrieved: CASE-017", level: "info" },
  { ts: "14:02:04", msg: "Investigation running — device context analysis", level: "info" },
  { ts: "14:02:05", msg: "Partial reuse approved — device context differs", level: "warn" },
  { ts: "14:02:06", msg: "Response queued: MQTT rate limiting (120s)", level: "info" },
];

function generateRunningData(elapsed: number) {
  return Array.from({ length: Math.max(1, elapsed) }, (_, i) => {
    const isAttack = i >= 3;
    const malicious = isAttack ? 60 + Math.random() * 25 : 0;
    const legit = isAttack ? Math.max(5, 25 - malicious * 0.15 + Math.random() * 3) : 24 + Math.random() * 3;
    return { t: i, legit: +legit.toFixed(1), malicious: +malicious.toFixed(1) };
  });
}

const resultData = [
  ...Array.from({ length: 10 }, (_, i) => ({ t: i, phase: "baseline", legit: 25 + Math.random() * 3, malicious: 0 })),
  ...Array.from({ length: 20 }, (_, i) => ({ t: i + 10, phase: "attack", legit: Math.max(5, 20 - i * 0.6), malicious: 65 + Math.random() * 20 })),
  ...Array.from({ length: 20 }, (_, i) => ({ t: i + 30, phase: "post", legit: 18 + i * 0.35, malicious: Math.max(0, 30 - i * 2 + Math.random() * 3) })),
];

function InvestigationFlowchart() {
  const lime = "#B6FF3B", limeDim = "#1C2D0A", limeLine = "#4A7A20";
  const red = "#EF4444", redDim = "#2C1010";
  const amber = "#D97706", amberDim = "#2C1A06";
  const violet = "#A78BFA", violetDim = "#1E1A3D";
  const node = "#111411", nodeBorder = "#242924";
  const hi = "#E8EDE9", textMid = "#94A8BA", textDim = "#94A8BA";
  const lineDim = "#242924", lineActive = lime;

  const lp = (x: number, y: number, color: string = hi, size: number = 10, weight: string = "500") => ({
    x, y, textAnchor: "middle" as const, dominantBaseline: "middle" as const,
    fontSize: size, fontFamily: "Space Grotesk, sans-serif", fill: color, fontWeight: weight,
  });
  const mp = (x: number, y: number, color: string = textDim, size: number = 8) => ({
    x, y, textAnchor: "middle" as const, dominantBaseline: "middle" as const,
    fontSize: size, fontFamily: "JetBrains Mono, monospace", fill: color, letterSpacing: 1,
  });

  return (
    <div className="mt-6 bg-[#0D100D] border border-[#1A1E1B] rounded-[14px] p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[19px] font-semibold text-[#E8EDE9]">Investigation Path</div>
        <div className="flex items-center gap-4 text-[13px] mono text-[#94A8BA]">
          <span className="flex items-center gap-1.5"><span className="inline-block w-8 h-px bg-[#B6FF3B]"/><span>Active path</span></span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-8 border-t border-dashed border-[#242924]"/><span>Alternate</span></span>
        </div>
      </div>
      <div className="text-[13px] mono text-[#94A8BA] mb-4">Simulated case traversal · PARTIAL route selected by controller</div>
      <svg viewBox="0 0 960 280" className="w-full" style={{ height: "auto" }}>
        <defs>
          <marker id="arr-active" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0.5 L0,6.5 L6,3.5 Z" fill={lineActive}/>
          </marker>
          <marker id="arr-dim" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0.5 L0,6.5 L6,3.5 Z" fill={lineDim}/>
          </marker>
        </defs>

        {/* ── Phase labels ── */}
        <text {...mp(205, 10, textDim, 8)}>DETECTION PHASE</text>
        <text {...mp(620, 10, textDim, 8)}>ROUTING</text>
        <text {...mp(490, 145, textDim, 8)}>PATH SELECTION</text>
        <text {...mp(680, 248, textDim, 8)}>RESPONSE PIPELINE</text>

        {/* ══ ROW 1: Detection pipeline ══ */}
        {/* Baseline Monitor */}
        <rect x={10} y={28} width={140} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(80, 47, textMid)}>Baseline Monitor</text>

        {/* arrow → */}
        <path d="M150,47 L178,47" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Attack Detected */}
        <rect x={182} y={28} width={144} height={38} rx={8} fill={redDim} stroke={red} strokeWidth={1}/>
        <text {...lp(254, 44, "#F87171", 10, "600")}>Attack Detected</text>
        <text {...mp(254, 57, "#7F1D1D", 8)}>Confidence: 97%</text>

        {/* arrow → */}
        <path d="M326,47 L354,47" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Feature Extraction */}
        <rect x={358} y={28} width={148} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(432, 47, hi)}>Feature Extraction</text>

        {/* arrow → */}
        <path d="M506,47 L534,47" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Route Decision (diamond-style rect) */}
        <rect x={538} y={26} width={164} height={42} rx={8} fill={amberDim} stroke={amber} strokeWidth={1.2}/>
        <text {...lp(620, 43, "#FBBF24", 10, "600")}>Route Decision</text>
        <text {...mp(620, 57, amber, 8)}>◆  Controller</text>

        {/* ── Branch lines from Route bottom (620, 68) ── */}
        <path d="M620,68 L620,100" stroke={amber} strokeWidth={1.2} strokeDasharray="4,3"/>
        {/* → Full */}
        <path d="M620,100 L370,100 L370,120" stroke={lineDim} strokeWidth={1} strokeDasharray="4,3" markerEnd="url(#arr-dim)"/>
        {/* → Partial (straight down) */}
        <path d="M620,100 L620,120" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>
        {/* → Novel */}
        <path d="M620,100 L870,100 L870,120" stroke={lineDim} strokeWidth={1} strokeDasharray="4,3" markerEnd="url(#arr-dim)"/>

        {/* ══ ROW 2: Branch nodes y=139 ══ */}
        {/* Full Reuse (dimmed) */}
        <rect x={300} y={120} width={140} height={38} rx={8} fill={node} stroke={lineDim} strokeWidth={1}/>
        <text {...lp(370, 133, textDim)}>Full Reuse</text>
        <text {...mp(370, 146, textDim, 8)}>exact match</text>

        {/* Partial Reuse (highlighted) */}
        <rect x={548} y={118} width={144} height={42} rx={8} fill={limeDim} stroke={lime} strokeWidth={1.5}/>
        <text {...lp(620, 133, lime, 10, "700")}>Partial Reuse</text>
        <text {...mp(620, 147, limeLine, 8)}>✓  PATH TAKEN</text>

        {/* Novel Case (dimmed) */}
        <rect x={800} y={120} width={140} height={38} rx={8} fill={node} stroke={lineDim} strokeWidth={1}/>
        <text {...lp(870, 133, textDim)}>Novel Case</text>
        <text {...mp(870, 146, textDim, 8)}>no prior match</text>

        {/* ── Convergence lines to response pipeline ── */}
        {/* Full → down, dashed (path not taken) */}
        <path d="M370,158 L370,195" stroke={lineDim} strokeWidth={1} strokeDasharray="3,4"/>
        {/* Novel → down, dashed (path not taken) */}
        <path d="M870,158 L870,195" stroke={lineDim} strokeWidth={1} strokeDasharray="3,4"/>
        {/* Partial → lime highlighted path sweeping to Case Retrieval */}
        <path d="M620,160 L620,195 L100,195 L100,210" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* ══ ROW 3: Response pipeline y=229 ══ */}
        {/* Case Retrieval */}
        <rect x={20} y={210} width={160} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(100, 229, hi)}>Case Retrieval</text>

        {/* → */}
        <path d="M180,229 L208,229" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Context Adapt */}
        <rect x={212} y={210} width={148} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(286, 229, hi)}>Context Adapt</text>

        {/* → */}
        <path d="M360,229 L388,229" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Execute Response */}
        <rect x={392} y={210} width={160} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(472, 229, hi)}>Execute Response</text>

        {/* → */}
        <path d="M552,229 L580,229" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Validate */}
        <rect x={584} y={210} width={120} height={38} rx={8} fill={node} stroke={nodeBorder} strokeWidth={1}/>
        <text {...lp(644, 229, hi)}>Validate</text>

        {/* → */}
        <path d="M704,229 L732,229" stroke={lineActive} strokeWidth={1.5} markerEnd="url(#arr-active)"/>

        {/* Update Case Memory */}
        <rect x={736} y={210} width={200} height={38} rx={8} fill={violetDim} stroke={violet} strokeWidth={1}/>
        <text {...lp(836, 229, violet)}>Update Case Memory</text>
      </svg>
    </div>
  );
}

function ConfigureView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [vector, setVector] = useState("MQTT Connect Flood");
  const [target, setTarget] = useState("Gateway-01");
  const [intensity, setIntensity] = useState("High");
  const [duration, setDuration] = useState("60 sec");
  const [mode, setMode] = useState("DDoS");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        {/* Banner */}
        <div className="bg-[#080B08] border border-[#1A1F1B] rounded-[14px] px-7 py-5 mb-7 flex items-center justify-between">
          <div>
            <div className="text-[#B6FF3B] text-[14px] mono uppercase tracking-widest mb-1">Controlled Attack Simulation</div>
            <div className="text-[#E8EDE9] font-bold text-[32px]">Isolated Lab Mode</div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Form */}

          <Card className="p-6">
            <div className="text-[19px] font-semibold text-[#E8EDE9] mb-5">Simulation Parameters</div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Attack Mode</label>
                <div className="flex rounded-[8px] border border-[#242924] overflow-hidden">
                  {["DoS", "DDoS"].map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2 text-[19px] font-medium transition-colors ${mode === m ? "bg-[#B6FF3B] text-[#0C0F0D]" : "bg-[#0C0F0D] text-[#94A8BA] hover:text-[#94A8BA]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Attack Vector</label>
                <select value={vector} onChange={e => setVector(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B]">
                  {["SYN Flood", "TCP Flood", "UDP Flood", "ICMP Flood", "MQTT Connect Flood", "MQTT Publish Flood"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Target Device</label>
                <select value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B]">
                  {["Gateway-01", "Broker-01", "Sensor-01", "Sensor-02"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Intensity</label>
                <div className="flex rounded-[8px] border border-[#242924] overflow-hidden">
                  {["Low", "Medium", "High"].map(m => (
                    <button key={m} onClick={() => setIntensity(m)}
                      className={`flex-1 py-2 text-[15px] font-medium transition-colors ${intensity === m ? "bg-[#B6FF3B] text-[#0C0F0D]" : "bg-[#0C0F0D] text-[#94A8BA] hover:text-[#94A8BA]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Duration</label>
                <div className="flex rounded-[8px] border border-[#242924] overflow-hidden">
                  {["30 sec", "60 sec", "120 sec"].map(m => (
                    <button key={m} onClick={() => setDuration(m)}
                      className={`flex-1 py-2 text-[15px] font-medium transition-colors ${duration === m ? "bg-[#B6FF3B] text-[#0C0F0D]" : "bg-[#0C0F0D] text-[#94A8BA] hover:text-[#94A8BA]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Source Count</label>
                <input type="number" defaultValue={1} className="w-full px-3 py-2.5 rounded-[10px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B] mono"/>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Run Note (optional)</label>
              <input type="text" placeholder="e.g. FYP Demo Run — MQTT scenario" className="w-full px-3 py-2.5 rounded-[10px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B] placeholder:text-[#94A8BA]"/>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1A1F1B] flex items-center gap-3">
              <Button variant="danger" className="py-3 px-6 text-[19px]" onClick={() => setShowModal(true)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Start Controlled Simulation
              </Button>
              <button
                className="flex items-center gap-2 py-3 px-5 text-[19px] font-medium rounded-[10px] transition-colors"
                style={{ background: "#14532D", color: "#4ADE80", border: "1px solid #166534" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#166534")}
                onMouseLeave={e => (e.currentTarget.style.background = "#14532D")}
                onClick={() => {}}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v7M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Export Attack Report
              </button>
            </div>
          </Card>

          {/* Pre-flight checklist */}
          <Card className="p-5">
            <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Pre-flight Checklist</div>
            <div className="space-y-2">
              {checkItems.map(c => (
                <div key={c.label} className="flex items-center gap-3 py-2 border-b border-[#1A1F1B] last:border-0">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[13px] ${c.ok ? "bg-[#14291A] text-[#4ADE80]" : "bg-[#2C1010] text-[#F87171]"}`}>
                    {c.ok ? "✓" : "✗"}
                  </span>
                  <span className="text-[15px] text-[#94A8BA]">{c.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Investigation Flowchart */}
        <InvestigationFlowchart />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 max-w-[420px] w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 bg-[#2C1010] rounded-full flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3L15 14H3L9 3Z" stroke="#EF4444" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 8v3M9 13v.5" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
            <h2 className="text-[21px] font-semibold text-[#E8EDE9] mb-2">Confirm Simulation</h2>
            <p className="text-[19px] text-[#94A8BA] mb-4">
              Start <strong className="text-[#E8EDE9]">{mode} · {vector}</strong> against <strong className="text-[#E8EDE9]">{target}</strong>?
            </p>
            <div className="bg-[#0C0F0D] rounded-[8px] border border-[#1A1F1B] p-3 mb-5 text-[15px] mono text-[#94A8BA]">
              Duration: {duration} · Intensity: {intensity} · Lab mode: ACTIVE
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1 justify-center" onClick={() => { setShowModal(false); onNavigate("simulation-running"); }}>
                Start Simulation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RunningView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [elapsed, setElapsed] = useState(18);
  const [currentStage] = useState(4);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(e => {
        if (e >= 60) { clearInterval(t); return e; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const data = generateRunningData(elapsed);

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        {/* Header */}
        <div className="bg-[#080B08] border border-[#1A1F1B] rounded-[14px] px-7 py-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="stage-dot-active w-3 h-3 bg-[#EF4444] rounded-full"/>
            <div>
              <div className="text-[#B6FF3B] text-[14px] mono uppercase tracking-widest">RUN-0042</div>
              <div className="text-[#E8EDE9] font-bold">DDoS · MQTT Connect Flood → Gateway-01</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#94A8BA] text-[13px] mono uppercase">Elapsed / Total</div>
            <div className="text-[#E8EDE9] font-bold text-[32px] mono">{fmt(elapsed)} / 01:00</div>
          </div>
        </div>

        {/* Stage indicator */}
        <div className="bg-[#111511] border border-[#242924] rounded-[12px] px-6 py-4 mb-6 flex items-center gap-0">
          {stages.map((s, i) => {
            const done = i < currentStage;
            const active = i === currentStage;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-bold transition-all
                    ${done ? "bg-[#B6FF3B] text-[#0C0F0D]" : active ? "bg-[#E8EDE9] text-[#0C0F0D] stage-dot-active" : "bg-[#1A1F1B] text-[#94A8BA]"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-[13px] mt-1 font-medium ${done ? "text-[#B6FF3B]" : active ? "text-[#E8EDE9]" : "text-[#94A8BA]"}`}>{s}</span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${done ? "bg-[#B6FF3B]" : "bg-[#1A1F1B]"}`}/>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[19px] font-semibold text-[#E8EDE9]">Live Telemetry</div>
                <div className="flex items-center gap-3 text-[15px]">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#EF4444] rounded-full"/><span className="text-[#94A8BA]">Malicious</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#E8EDE9] rounded-full"/><span className="text-[#94A8BA]">Legitimate</span></span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="malG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E241F" vertical={false}/>
                    <XAxis dataKey="t" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                    <Area type="monotone" dataKey="malicious" stroke="#EF4444" strokeWidth={1.5} fill="url(#malG)" dot={false}/>
                    <Area type="monotone" dataKey="legit" stroke="#E8EDE9" strokeWidth={1.5} fill="none" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card dark className="p-4">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Event Log</div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {liveLog.map((l, i) => (
                  <div key={i} className="flex gap-3 text-[15px]">
                    <span className="mono text-[#94A8BA] shrink-0">{l.ts}</span>
                    <span className={`mono ${l.level === "alert" ? "text-[#F87171]" : l.level === "route" ? "text-[#FBBF24]" : l.level === "warn" ? "text-[#FBBF24]" : "text-[#94A8BA]"}`}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card dark className="p-5">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-4">Detector</div>
              <div className="text-[40px] font-bold text-[#B6FF3B] mono mb-1">97%</div>
              <div className="text-[15px] text-[#94A8BA] mb-4">Confidence · DDoS Positive</div>
              <div className="w-full bg-[#1A1F1B] rounded-full h-1.5 mb-4">
                <div className="bg-[#B6FF3B] h-1.5 rounded-full" style={{ width: "97%" }}/>
              </div>
              <div className="pt-3 border-t border-[#1A1F1B]">
                <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-1">Controller Route</div>
                <RouteBadge value="PARTIAL"/>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Current Stage</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="stage-dot-active w-2 h-2 bg-[#B6FF3B] rounded-full"/>
                <span className="text-[19px] font-semibold text-[#E8EDE9]">{stages[currentStage]}</span>
              </div>
              <div className="text-[15px] text-[#94A8BA]">Case memory retrieved · Context analysis active</div>
            </Card>

            <Button variant="danger" className="w-full justify-center py-2.5 text-[15px]" onClick={() => onNavigate("simulation-result")}>
              Stop Attack Generator
            </Button>
            <Button variant="secondary" className="w-full justify-center py-2.5 text-[15px]" onClick={() => onNavigate("simulation-result")}>
              Skip to Result →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="text-center mb-8">
          <div className="text-[14px] mono text-[#94A8BA] uppercase tracking-widest mb-2">Simulation Complete · RUN-0042</div>
          <div className="text-[40px] font-bold text-[#E8EDE9] mb-1">MQTT Connect Flood → Gateway-01</div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-[#14291A] border border-[#1A3D22] rounded-full text-[#4ADE80] text-[32px] font-bold">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="1.5"/><path d="M6 10l3 3 5-6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              SUCCESS
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6 mb-6">
          <Card className="p-6">
            <div className="text-[19px] font-semibold text-[#E8EDE9] mb-1">Traffic — Baseline / Attack / Post-Response</div>
            <div className="text-[15px] text-[#94A8BA] mono mb-4">msg/s over simulation duration</div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resultData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="mG2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="lG2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E241F" vertical={false}/>
                  <XAxis dataKey="t" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                  <Area type="monotone" dataKey="malicious" stroke="#EF4444" strokeWidth={1.5} fill="url(#mG2)" dot={false} name="Malicious"/>
                  <Area type="monotone" dataKey="legit" stroke="#22C55E" strokeWidth={1.5} fill="url(#lG2)" dot={false} name="Legitimate"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Attack Suppression", value: "90%", color: "#22C55E" },
                { label: "Service Availability", value: "88%", color: "#22C55E" },
                { label: "Time to Containment", value: "14s", color: "#B6FF3B" },
                { label: "Recovery Time", value: "20s", color: "#7C6FF0" },
              ].map(m => (
                <Card key={m.label} className="p-3 text-center">
                  <div className="text-[32px] font-bold mono mb-0.5" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[13px] text-[#94A8BA] uppercase tracking-wider">{m.label}</div>
                </Card>
              ))}
            </div>
            <Card dark className="p-4">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Simulation Summary</div>
              {[
                { label: "Attack Vector", value: "MQTT Connect Flood" },
                { label: "Target Device", value: "Gateway-01" },
                { label: "Controller Route", value: "PARTIAL" },
                { label: "Best Historical Case", value: "CASE-017 (82% sim.)" },
                { label: "Executed Response", value: "MQTT Rate Limiting" },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1.5 border-b border-[#161B17] last:border-0">
                  <span className="text-[15px] text-[#94A8BA]">{r.label}</span>
                  <span className="text-[15px] mono text-[#E8EDE9]">{r.value}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={() => onNavigate("incident-overview")}>View Full Incident →</Button>
          <Button variant="secondary" onClick={() => onNavigate("simulation-configure")}>Run Again</Button>
        </div>
      </div>
    </div>
  );
}

export default function AttackSimulation({ view, onNavigate }: Props) {
  if (view === "configure") return <ConfigureView onNavigate={onNavigate}/>;
  if (view === "running") return <RunningView onNavigate={onNavigate}/>;
  return <ResultView onNavigate={onNavigate}/>;
}
