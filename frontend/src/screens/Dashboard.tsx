import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";
import { trafficData, incidents, services, alertTrendData, attackTypeData } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

/* ── Severity helpers ─────────────────────────────────────────────── */
function sevColor(crit: string) {
  if (crit === "Critical") return { bg: "rgba(245,56,56,0.12)", text: "#F87171", bar: "#F53838", border: "rgba(245,56,56,0.3)" };
  if (crit === "High")     return { bg: "rgba(232,101,12,0.12)", text: "#FB923C", bar: "#E8650C", border: "rgba(232,101,12,0.3)" };
  if (crit === "Medium")   return { bg: "rgba(232,194,12,0.1)", text: "#FBBF24", bar: "#E8C20C", border: "rgba(232,194,12,0.25)" };
  return                          { bg: "rgba(12,184,107,0.1)",  text: "#4ADE80", bar: "#0CB86B", border: "rgba(12,184,107,0.25)" };
}

function outcomeLabel(o: string) {
  if (o === "SUCCESS") return { label: "Resolved", color: "#1CC970" };
  if (o === "PARTIAL") return { label: "Partial",  color: "#F0A020" };
  if (o === "FAILURE") return { label: "Failed",   color: "#F53838" };
  return                     { label: o,           color: "#8EA5B0" };
}

function statusPill(s: string) {
  if (s === "Investigating") return { label: "Investigating", bg: "rgba(245,56,56,0.12)", color: "#F87171" };
  if (s === "Escalated")     return { label: "Escalated",     bg: "rgba(240,160,32,0.12)", color: "#F0A020" };
  if (s === "Resolved")      return { label: "Resolved",      bg: "rgba(28,201,112,0.1)",  color: "#1CC970" };
  return                            { label: s,               bg: "rgba(78,130,160,0.1)", color: "#8EA5B0" };
}

/* ── KPI Card ─────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, accent, warn, ok, onClick
}: {
  label: string; value: string; sub: string;
  accent?: boolean; warn?: boolean; ok?: boolean;
  onClick?: () => void;
}) {
  const valueColor = accent ? "#F87171" : warn ? "#F0A020" : ok ? "#1CC970" : "var(--text)";
  return (
    <div
      className="kpi-card cursor-pointer hover:border-[var(--border-2)] transition-all"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: valueColor, fontSize: "26px" }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

/* ── Chart tooltip ────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-[12px] rounded-[8px] px-3 py-2.5 shadow-xl"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", fontFamily: "JetBrains Mono, monospace" }}
    >
      <div className="mb-1.5" style={{ color: "var(--text-3)" }}>T+{label}s</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: "var(--text-2)" }}>{p.dataKey}</span>
          </div>
          <span style={{ color: "var(--text)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-[12px] rounded-[8px] px-3 py-2.5 shadow-xl"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", fontFamily: "JetBrains Mono, monospace" }}
    >
      <div className="mb-1.5 font-semibold" style={{ color: "var(--text-2)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="capitalize" style={{ color: "var(--text-3)" }}>{p.dataKey}</span>
          </div>
          <span style={{ color: "var(--text)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Section header ───────────────────────────────────────────────── */
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="text-[12px] transition-colors"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
        >
          {action} →
        </button>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function Dashboard({ onNavigate }: Props) {
  const [hoveredInc, setHoveredInc] = useState<string | null>(null);

  const activeIncidents = incidents.filter(i => i.status === "Investigating" || i.status === "Escalated");
  const criticalCount = incidents.filter(i => i.criticality === "Critical").length;
  const resolvedCount = incidents.filter(i => i.status === "Resolved").length;

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1600px] mx-auto">

        {/* ── Active incident critical banner ──────────────────────── */}
        <div
          className="flex items-center gap-4 px-4 py-3 mb-5 rounded-[8px] cursor-pointer transition-all"
          style={{
            background: "rgba(245,56,56,0.07)",
            border: "1px solid rgba(245,56,56,0.25)",
            borderLeft: "3px solid var(--critical)",
          }}
          onClick={() => onNavigate("incident-overview")}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.11)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.07)")}
        >
          <span className="w-2 h-2 rounded-full pulse-critical flex-shrink-0" style={{ background: "var(--critical)" }} />
          <span className="text-[12px] font-bold mono uppercase tracking-widest" style={{ color: "var(--critical)" }}>
            Active Critical Incident
          </span>
          <span className="text-[13px]" style={{ color: "#D08080" }}>
            INC-104 · DDoS MQTT Connect Flood · Gateway-01 (Patient Monitor Gateway)
          </span>
          <span className="ml-auto text-[12px] mono flex items-center gap-1.5 shrink-0" style={{ color: "var(--text-3)" }}>
            Investigating · 00:18 elapsed
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <KpiCard
            label="Active Incidents"
            value={String(activeIncidents.length)}
            sub="2 critical · 1 escalated"
            accent
            onClick={() => onNavigate("incidents")}
          />
          <KpiCard
            label="Critical Devices"
            value="1"
            sub="Gateway-01 at risk"
            warn
            onClick={() => onNavigate("devices")}
          />
          <KpiCard
            label="Detector F1 Score"
            value="0.957"
            sub="XGBoost-v3 · in-domain test"
            ok
          />
          <KpiCard
            label="Containment Rate"
            value="87.5%"
            sub="7 / 8 recent incidents"
            ok
          />
        </div>

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* Traffic chart */}
          <div className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <span className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                  Network Traffic · Gateway-01
                </span>
                <span className="ml-2.5 text-[11px] mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                  msg/sec · 60s window
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--critical)" }} />
                  <span style={{ color: "var(--text-3)" }}>Malicious</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--lime)" }} />
                  <span style={{ color: "var(--text-3)" }}>Legitimate</span>
                </span>
                <span
                  className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(139,114,240,0.1)", color: "#8B72F0", border: "1px solid rgba(139,114,240,0.2)" }}
                >
                  Demo data
                </span>
              </div>
            </div>
            <div className="px-5 py-4">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="malGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F53838" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#F53838" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="legGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A8FF35" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#A8FF35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={15} stroke="#F53838" strokeWidth={1} strokeOpacity={0.5} label={{ value: "ATTACK", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: "#F53838", fontWeight: 700 }} />
                    <ReferenceLine x={38} stroke="#1CC970" strokeWidth={1} strokeOpacity={0.5} label={{ value: "RESPONSE", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: "#1CC970", fontWeight: 700 }} />
                    <Area type="monotone" dataKey="malicious" stroke="#F53838" strokeWidth={1.5} fill="url(#malGrad)" dot={false} />
                    <Area type="monotone" dataKey="legit" stroke="#A8FF35" strokeWidth={1.5} fill="url(#legGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active incident panel */}
          <div
            className="card overflow-hidden flex flex-col"
            style={{
              borderLeft: "3px solid var(--critical)",
              background: "rgba(245,56,56,0.03)",
            }}
          >
            <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full pulse-critical" style={{ background: "var(--critical)" }} />
                <span className="text-[10px] font-bold mono uppercase tracking-widest" style={{ color: "var(--critical)" }}>
                  Active Incident
                </span>
              </div>
              <div className="mono text-[26px] font-bold leading-none" style={{ color: "var(--text)" }}>INC-104</div>
              <div className="text-[14px] mt-1 font-medium" style={{ color: "#C87070" }}>
                DDoS · MQTT Connect Flood
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                Gateway-01 (Patient Monitor Gateway)
              </div>
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col gap-0">
              {[
                { label: "Criticality",  value: "Critical",     color: "#F87171" },
                { label: "Status",       value: "Investigating", color: "#F87171" },
                { label: "Confidence",   value: "97%",          color: "#1CC970" },
                { label: "Route",        value: "PARTIAL",      color: "#F0A020" },
                { label: "Elapsed",      value: "00:18",        color: "var(--text-2)" },
              ].map(r => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{r.label}</span>
                  <span className="text-[13px] font-semibold mono" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}

              {/* Stage progress */}
              <div className="py-2.5">
                <div className="text-[10px] mono uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                  Stage
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {["Detect", "Route", "Investigate", "Respond", "Validate"].map((s, i) => (
                    <React.Fragment key={s}>
                      <div
                        className="text-[10px] mono uppercase px-1.5 py-0.5 rounded-[3px]"
                        style={{
                          background: i < 2 ? "rgba(28,201,112,0.15)" : i === 2 ? "rgba(245,56,56,0.15)" : "var(--surface-3)",
                          color: i < 2 ? "#1CC970" : i === 2 ? "#F87171" : "var(--text-4)",
                          border: i === 2 ? "1px solid rgba(245,56,56,0.3)" : "1px solid transparent",
                        }}
                      >
                        {s}
                      </div>
                      {i < 4 && <div className="w-1.5 h-px" style={{ background: i < 1 ? "#1CC970" : "var(--border)" }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => onNavigate("incident-overview")}
                className="w-full py-2 text-[13px] font-semibold mono uppercase tracking-widest transition-all rounded-[7px]"
                style={{ color: "var(--critical)", border: "1px solid rgba(245,56,56,0.3)", background: "rgba(245,56,56,0.08)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.08)")}
              >
                Open Incident →
              </button>
            </div>
          </div>
        </div>

        {/* ── Secondary grid: incidents + alert trend + system ──────── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 260px 260px" }}>

          {/* Recent incidents table */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <SectionHeader title="Recent Incidents" action="View all" onAction={() => onNavigate("incidents")} />
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)` }}>
                  {["ID", "Attack", "Device", "Severity", "Status", "Outcome"].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[11px] font-semibold mono uppercase tracking-widest"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 6).map((inc, i) => {
                  const sv = sevColor(inc.criticality);
                  const out = outcomeLabel(inc.outcome);
                  const st = statusPill(inc.status);
                  return (
                    <tr
                      key={inc.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: i < 5 ? `1px solid var(--border)` : undefined,
                        borderLeft: `3px solid ${sv.bar}`,
                        background: hoveredInc === inc.id ? "var(--surface-2)" : "transparent",
                      }}
                      onClick={() => onNavigate("incident-overview")}
                      onMouseEnter={() => setHoveredInc(inc.id)}
                      onMouseLeave={() => setHoveredInc(null)}
                    >
                      <td className="px-4 py-2.5 mono text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                        {inc.id}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                        {inc.attack}
                      </td>
                      <td className="px-4 py-2.5 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                        {inc.target}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="badge"
                          style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}
                        >
                          {inc.criticality}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[11px] font-semibold mono px-1.5 py-0.5 rounded-[4px]"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-medium" style={{ color: out.color }}>
                          {out.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 7-day alert trend */}
          <div className="card p-0 overflow-hidden">
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Alert Trend</div>
              <div className="text-[11px] mono mt-0.5" style={{ color: "var(--text-3)" }}>
                7-day · Demo data
              </div>
            </div>
            <div className="px-3 py-3">
              <div style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TrendTooltip />} />
                    <Bar dataKey="critical" fill="#F53838" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="high"     fill="#E8650C" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="medium"   fill="#E8C20C" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="low"      fill="#0CB86B" radius={[2,2,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {[
                  { label: "Critical", color: "#F53838" },
                  { label: "High",     color: "#E8650C" },
                  { label: "Medium",   color: "#E8C20C" },
                  { label: "Low",      color: "#0CB86B" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                    <span className="w-2 h-2 rounded-[2px]" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System health */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <SectionHeader title="System Health" action="Details" onAction={() => onNavigate("system-health")} />
            </div>
            <div>
              {services.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < services.length - 1 ? `1px solid var(--border)` : undefined }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: s.status === "Online" ? "var(--success)" : "var(--danger)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{s.name}</div>
                    <div className="mono text-[11px]" style={{ color: "var(--text-3)" }}>{s.detail}</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-[12px] font-semibold" style={{ color: "var(--success)" }}>{s.latency}</div>
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
