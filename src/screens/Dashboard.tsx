import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Label,
} from "recharts";
import { trafficData, incidents, services } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

/* ── palette ─────────────────────────────────────────────── */
const C = {
  bg:        "#0A0C0A",
  surface:   "#0D100D",
  surface2:  "#111411",
  border:    "#1A1E1B",
  border2:   "#222722",
  text:      "#E2E8E2",
  text2:     "#94A8BA",
  text3:     "#94A8BA",
  red:       "#EF4444",
  redDim:    "#7F1D1D",
  amber:     "#D97706",
  green:     "#16A34A",
  greenDim:  "#14532D",
};

/* ── tiny primitives ──────────────────────────────────────── */
function Divider({ v }: { v?: boolean }) {
  return v
    ? <div className="w-px self-stretch" style={{ background: C.border }} />
    : <div className="h-px w-full" style={{ background: C.border }} />;
}

function Dot({ color }: { color: string }) {
  return <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: color }} />;
}

function CritText({ v }: { v: string }) {
  const color = v === "Critical" ? C.red : v === "High" ? C.amber : v === "Medium" ? "#8B8BF0" : C.text2;
  return <span className="mono text-[14px] font-semibold uppercase" style={{ color }}>{v}</span>;
}

function RouteText({ v }: { v: string }) {
  const color = v === "SHORT" ? C.green : v === "PARTIAL" ? C.amber : C.text2;
  return <span className="mono text-[14px] font-semibold uppercase tracking-widest" style={{ color }}>{v}</span>;
}

function OutcomeText({ v }: { v: string }) {
  const color = v === "SUCCESS" ? C.green : v === "PARTIAL" ? C.amber : C.red;
  return <span className="mono text-[14px] font-semibold uppercase" style={{ color }}>{v}</span>;
}

/* ── chart tooltip ────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-[15px] rounded border px-3 py-2 shadow-xl"
      style={{ background: C.surface2, borderColor: C.border2, fontFamily: "JetBrains Mono, monospace" }}>
      <div className="mb-1" style={{ color: C.text3 }}>T+{label}s</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: C.text2 }}>{p.dataKey}</span>
          <span style={{ color: C.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI readout ──────────────────────────────────────────── */
function KPI({ label, value, sub, accent, warn }: {
  label: string; value: string; sub: string; accent?: boolean; warn?: boolean;
}) {
  const valColor = accent ? C.red : warn ? C.amber : C.text;
  return (
    <div className="flex-1 min-w-0 px-6 py-4">
      <div className="text-[13px] mono uppercase tracking-widest mb-2" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[37px] font-bold mono leading-none mb-1.5" style={{ color: valColor }}>{value}</div>
      <div className="text-[14px] mono" style={{ color: C.text2 }}>{sub}</div>
    </div>
  );
}

/* ── incident stage chip ──────────────────────────────────── */
const stageOrder = ["Baseline", "Attack", "Detect", "Route", "Investigate", "Respond", "Validate", "Finalize"];
function StageBar({ current }: { current: string }) {
  const idx = stageOrder.indexOf(current);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stageOrder.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className="text-[12px] mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{
                background: done ? C.greenDim : active ? C.red : C.border,
                color: done ? C.green : active ? "#fff" : C.text3,
              }}
            >
              {s}
            </div>
            {i < stageOrder.length - 1 && (
              <div className="w-2 h-px" style={{ background: done ? C.green : C.border }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── main ─────────────────────────────────────────────────── */
export default function Dashboard({ onNavigate }: Props) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: C.bg }}>
      <div className="w-full px-6 py-5 fade-in">

        {/* ── active alert banner ──────────────────────────── */}
        <div
          className="flex items-center gap-4 px-5 py-3 mb-5 rounded-sm border-l-2 cursor-pointer"
          style={{ background: "#1A0A0A", borderColor: C.red, borderWidth: "0 0 0 2px" }}
          onClick={() => onNavigate("incident-overview")}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.red }} />
          <span className="mono text-[14px] font-semibold uppercase tracking-widest" style={{ color: C.red }}>
            Active Critical Incident
          </span>
          <span className="mono text-[14px]" style={{ color: "#C87070" }}>
            INC-104 · DDoS MQTT Connect Flood · Gateway-01 (Patient Monitor)
          </span>
          <span className="ml-auto mono text-[14px]" style={{ color: C.text3 }}>Investigating · 00:18 elapsed →</span>
        </div>

        {/* ── KPI strip ───────────────────────────────────── */}
        <div
          className="flex items-stretch mb-5 rounded-sm border overflow-hidden"
          style={{ background: C.surface, borderColor: C.border }}
        >
          <KPI label="Active Incidents" value="2" sub="INC-104 critical · INC-103 active" accent />
          <Divider v />
          <KPI label="Detector F1" value="0.957" sub="XGBoost-v3 · in-domain" />
          <Divider v />
          <KPI label="Containment Rate" value="87.5%" sub="7 / 8 recent incidents" />
          <Divider v />
          <KPI label="Median TTC" value="14 s" sub="Proposed Safe Reuse mode" />
        </div>

        {/* ── main grid: chart + incident ─────────────────── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1fr 360px" }}>

          {/* Traffic chart */}
          <div className="rounded-sm border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
            {/* chart header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: C.border }}>
              <div>
                <span className="text-[17px] font-semibold" style={{ color: C.text }}>Live Traffic · Gateway-01</span>
                <span className="ml-3 mono text-[13px] uppercase tracking-widest" style={{ color: C.text3 }}>msg / sec · 60 s window</span>
              </div>
              <div className="flex items-center gap-4 text-[14px] mono">
                <span className="flex items-center gap-1.5"><Dot color={C.red} /><span style={{ color: C.text2 }}>Malicious</span></span>
                <span className="flex items-center gap-1.5"><Dot color="#94A8BA" /><span style={{ color: C.text2 }}>Legitimate</span></span>
              </div>
            </div>

            {/* chart body */}
            <div className="px-4 py-4">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="malG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.red} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={C.red} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="legG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94A8BA" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#94A8BA" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
                    <XAxis dataKey="t"
                      tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.text3 }}
                      tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.text3 }}
                      tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />

                    {/* Phase reference areas */}
                    <ReferenceArea x1={15} x2={38} fill={C.red} fillOpacity={0.04} />
                    <ReferenceArea x1={38} x2={50} fill={C.green} fillOpacity={0.04} />

                    {/* Phase boundary lines with inline labels */}
                    <ReferenceLine x={15} stroke={C.red} strokeWidth={1} strokeOpacity={0.5}>
                      <Label value="ATTACK" position="insideTopRight"
                        style={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.red, fontWeight: 700, letterSpacing: "0.08em" }} />
                    </ReferenceLine>
                    <ReferenceLine x={20} stroke={C.amber} strokeWidth={1} strokeOpacity={0.5}>
                      <Label value="DETECTED" position="insideTopRight"
                        style={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.amber, fontWeight: 700, letterSpacing: "0.08em" }} />
                    </ReferenceLine>
                    <ReferenceLine x={38} stroke={C.green} strokeWidth={1} strokeOpacity={0.5}>
                      <Label value="RESPONSE" position="insideTopRight"
                        style={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.green, fontWeight: 700, letterSpacing: "0.08em" }} />
                    </ReferenceLine>
                    <ReferenceLine x={50} stroke={C.green} strokeWidth={1} strokeOpacity={0.4}>
                      <Label value="CONTAINED" position="insideTopRight"
                        style={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: C.green, fontWeight: 700, letterSpacing: "0.08em" }} />
                    </ReferenceLine>

                    <Area type="monotone" dataKey="malicious" stroke={C.red} strokeWidth={1.5}
                      fill="url(#malG)" dot={false} />
                    <Area type="monotone" dataKey="legit" stroke="#4A5249" strokeWidth={1.5}
                      fill="url(#legG)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active incident — dominant panel */}
          <div
            className="rounded-sm border-l-2 border overflow-hidden flex flex-col"
            style={{ background: "#0F0C0C", borderColor: C.border2, borderLeftColor: C.red }}
          >
            {/* panel header */}
            <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.red }} />
                <span className="mono text-[13px] uppercase tracking-widest font-semibold" style={{ color: C.red }}>
                  Active Incident
                </span>
              </div>
              <div className="mono text-[32px] font-bold leading-none" style={{ color: C.text }}>INC-104</div>
              <div className="text-[18px] mt-1 font-medium" style={{ color: "#C87070" }}>
                DDoS · MQTT Connect Flood
              </div>
              <div className="text-[14px] mt-0.5" style={{ color: C.text2 }}>
                Gateway-01 (Patient Monitor Gateway)
              </div>
            </div>

            {/* data rows */}
            <div className="flex-1 px-5 py-3 flex flex-col gap-0">
              {[
                { label: "Criticality",    value: <CritText v="Critical" /> },
                { label: "Severity",       value: <span className="mono text-[14px] font-semibold" style={{ color: C.text }}>High</span> },
                { label: "Confidence",     value: <span className="mono text-[14px] font-semibold" style={{ color: C.green }}>97%</span> },
                { label: "Route",          value: <RouteText v="PARTIAL" /> },
                { label: "Run",            value: <span className="mono text-[14px]" style={{ color: C.text2 }}>RUN-0042</span> },
                { label: "Elapsed",        value: <span className="mono text-[14px]" style={{ color: C.text2 }}>00:18</span> },
              ].map(r => (
                <div key={r.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: C.border }}>
                  <span className="text-[14px]" style={{ color: C.text3 }}>{r.label}</span>
                  {r.value}
                </div>
              ))}

              <div className="py-3">
                <div className="text-[13px] mono uppercase tracking-widest mb-2" style={{ color: C.text3 }}>
                  Investigation Stage
                </div>
                <StageBar current="Investigate" />
              </div>
            </div>

            {/* action */}
            <div className="px-5 pb-4">
              <button
                onClick={() => onNavigate("incident-overview")}
                className="w-full py-2.5 text-[17px] font-semibold mono uppercase tracking-widest transition-colors rounded-sm border"
                style={{ color: C.red, borderColor: C.redDim, background: "#1A0A0A" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2A0F0F")}
                onMouseLeave={e => (e.currentTarget.style.background = "#1A0A0A")}
              >
                Open Incident →
              </button>
            </div>
          </div>
        </div>

        {/* ── bottom grid: incidents + system health ───────── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>

          {/* Recent incidents — dense table */}
          <div className="rounded-sm border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: C.border }}>
              <span className="text-[17px] font-semibold" style={{ color: C.text }}>Recent Incidents</span>
              <button
                onClick={() => onNavigate("incidents")}
                className="mono text-[14px] transition-colors"
                style={{ color: C.text3 }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text2)}
                onMouseLeave={e => (e.currentTarget.style.color = C.text3)}
              >
                All incidents →
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["ID", "Attack", "Target", "Crit", "Conf", "Route", "Outcome", "Time"].map(h => (
                    <th key={h}
                      className="text-left px-5 py-2 mono text-[13px] uppercase tracking-widest font-semibold"
                      style={{ color: C.text3 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => (
                  <tr
                    key={inc.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: i < incidents.length - 1 ? `1px solid ${C.border}` : undefined }}
                    onClick={() => onNavigate("incident-overview")}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-2.5 mono text-[17px] font-semibold" style={{ color: C.text }}>{inc.id}</td>
                    <td className="px-5 py-2.5 text-[17px]" style={{ color: C.text2 }}>{inc.attack}</td>
                    <td className="px-5 py-2.5 mono text-[14px]" style={{ color: C.text2 }}>{inc.target}</td>
                    <td className="px-5 py-2.5"><CritText v={inc.criticality} /></td>
                    <td className="px-5 py-2.5 mono text-[14px] font-semibold" style={{ color: C.text }}>{inc.confidence}%</td>
                    <td className="px-5 py-2.5"><RouteText v={inc.route} /></td>
                    <td className="px-5 py-2.5"><OutcomeText v={inc.outcome} /></td>
                    <td className="px-5 py-2.5 mono text-[14px]" style={{ color: C.text3 }}>{inc.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* System health */}
          <div className="rounded-sm border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: C.border }}>
              <span className="text-[17px] font-semibold" style={{ color: C.text }}>System Health</span>
              <button
                onClick={() => onNavigate("system-health")}
                className="mono text-[14px] transition-colors"
                style={{ color: C.text3 }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text2)}
                onMouseLeave={e => (e.currentTarget.style.color = C.text3)}
              >
                Details →
              </button>
            </div>
            <div>
              {services.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < services.length - 1 ? `1px solid ${C.border}` : undefined }}
                >
                  <Dot color={s.status === "Online" ? C.green : C.red} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-medium" style={{ color: C.text }}>{s.name}</div>
                    <div className="mono text-[13px]" style={{ color: C.text3 }}>{s.detail}</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-[14px] font-semibold" style={{ color: C.green }}>{s.latency}</div>
                    <div className="mono text-[13px]" style={{ color: C.text3 }}>p50</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
