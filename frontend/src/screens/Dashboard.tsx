import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from "recharts";
import { trafficData, incidents, services, alertTrendData } from "../data/mock";
import type { Screen } from "../types";
import { outcomeTone, severityTone, statusTone } from "../components/severity";
import { AXIS, GRID, ChartTooltip } from "../components/chart";

interface Props { onNavigate: (s: Screen) => void; }

const STAGES = ["Detect", "Route", "Investigate", "Respond", "Validate"];

function KpiCard({
  label, value, sub, tone, onClick,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "critical" | "warning" | "success" | "default";
  onClick?: () => void;
}) {
  const color =
    tone === "critical" ? "var(--critical)"
    : tone === "warning" ? "var(--warning)"
    : tone === "success" ? "var(--success)"
    : "var(--text)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`kpi-card text-left ${onClick ? "clickable" : ""}`}
      style={{ opacity: onClick ? 1 : 0.95 }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="kpi-label">{label}</span>
        {tone && tone !== "default" && (
          <span className="dot mt-1.5" style={{ background: color }} aria-hidden />
        )}
      </div>
      <div className="kpi-value mt-1.5" style={{ color }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </button>
  );
}

function PanelHeader({ title, meta, action, onAction }: {
  title: string;
  meta?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-head">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h2 className="truncate">{title}</h2>
        {meta && <span className="t-label truncate">{meta}</span>}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[12px] text-[var(--text-4)] transition-colors duration-150 hover:text-[var(--text)]"
        >
          {action} →
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }: Props) {
  const [hoveredInc, setHoveredInc] = useState<string | null>(null);

  const active = incidents.filter((i) => i.status === "Investigating" || i.status === "Escalated");
  const lead = active[0];

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        {/* ── Active incident strip ── */}
        {lead && (
          <button
            type="button"
            onClick={() => onNavigate("incident-overview")}
            className="card edge-critical mb-5 flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="dot pulse-critical shrink-0" style={{ background: "var(--critical)" }} aria-hidden />
              <span className="t-label shrink-0" style={{ color: "var(--critical)" }}>Active Critical Incident</span>
              <span className="mono text-[13px] font-semibold" style={{ color: "var(--text)" }}>{lead.id}</span>
              <span className="truncate text-[13px] text-[var(--text-2)]">
                {lead.type} · {lead.attack} · {lead.target}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              {/* Stage progress */}
              <div className="hidden items-center gap-1 lg:flex">
                {STAGES.map((s, i) => (
                  <React.Fragment key={s}>
                    <span
                      className="mono rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{
                        background: i < 2 ? "var(--low-bg)" : i === 2 ? "var(--critical-bg)" : "var(--surface-3)",
                        color: i < 2 ? "var(--success)" : i === 2 ? "var(--critical)" : "var(--text-4)",
                        border: `1px solid ${i < 2 ? "var(--low-line)" : i === 2 ? "var(--critical-line)" : "transparent"}`,
                      }}
                    >
                      {s}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span className="h-px w-2" style={{ background: i < 1 ? "var(--low-line)" : "var(--border)" }} aria-hidden />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="mono shrink-0 text-[12px] text-[var(--text-4)]">
                {statusTone(lead.status).label} · 00:18 elapsed
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[var(--text-4)]" aria-hidden>
                <path d="M3.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        )}

        {/* ── KPI strip ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Active Incidents"
            value={String(active.length)}
            sub="2 critical · 1 escalated"
            tone="critical"
            onClick={() => onNavigate("incidents")}
          />
          <KpiCard label="Critical Devices" value="1" sub="Gateway-01 at risk" tone="warning" onClick={() => onNavigate("devices")} />
          <KpiCard label="Detector F1 Score" value="0.957" sub="XGBoost-v3 · in-domain test" tone="success" />
          <KpiCard label="Containment Rate" value="87.5%" sub="7 / 8 recent incidents" tone="success" />
        </div>

        {/* ── Traffic chart (full width) ── */}
        <div className="panel mb-5">
          <PanelHeader title="Network Traffic · Gateway-01" meta="msg/sec · 60s window" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-[18px] py-2.5" style={{ borderColor: "var(--border)" }}>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: "var(--critical)" }} aria-hidden />
                Malicious
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: "var(--lime)" }} aria-hidden />
                Legitimate
              </span>
              <span className="legend-item">
                <span className="h-2.5 w-px" style={{ background: "var(--border-3)" }} aria-hidden />
                <span style={{ color: "var(--critical)" }}>Attack</span>
              </span>
              <span className="legend-item">
                <span className="h-2.5 w-px" style={{ background: "var(--success)" }} aria-hidden />
                <span style={{ color: "var(--success)" }}>Response</span>
              </span>
            </div>
            <span className="demo-banner ml-auto">Demo data</span>
          </div>
          <div className="panel-body">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="dashMal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5A5A" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#FF5A5A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashLeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A8FF35" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#A8FF35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" {...AXIS} />
                  <YAxis {...AXIS} width={44} />
                  <Tooltip
                    cursor={{ stroke: "var(--border-3)", strokeWidth: 1 }}
                    content={<ChartTooltip labelPrefix="T+" unit=" msg/s" />}
                  />
                  <ReferenceLine x={15} stroke="var(--critical)" strokeWidth={1} strokeOpacity={0.6}
                    label={{ value: "ATTACK", position: "insideTopRight", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--critical)", fontWeight: 700 }} />
                  <ReferenceLine x={38} stroke="var(--success)" strokeWidth={1} strokeOpacity={0.6}
                    label={{ value: "RESPONSE", position: "insideTopRight", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--success)", fontWeight: 700 }} />
                  <Area type="monotone" dataKey="malicious" stroke="#FF5A5A" strokeWidth={1.6} fill="url(#dashMal)" dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey="legit" stroke="#A8FF35" strokeWidth={1.6} fill="url(#dashLeg)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Recent incidents table (full width) ── */}
        <div className="panel mb-5">
          <PanelHeader title="Recent Incidents" action="View all" onAction={() => onNavigate("incidents")} />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Attack</th>
                  <th>Device</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Route</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 6).map((inc) => {
                  const sv = severityTone(inc.criticality);
                  const st = statusTone(inc.status);
                  const out = outcomeTone(inc.outcome);
                  return (
                    <tr
                      key={inc.id}
                      className="cursor-pointer"
                      style={{
                        background: hoveredInc === inc.id ? "var(--surface-2)" : "transparent",
                        boxShadow: `inset 3px 0 0 ${sv.solid}`,
                      }}
                      onClick={() => onNavigate("incident-overview")}
                      onMouseEnter={() => setHoveredInc(inc.id)}
                      onMouseLeave={() => setHoveredInc(null)}
                    >
                      <td>
                        <div className="mono text-[12.5px] font-semibold text-[var(--text)]">{inc.id}</div>
                        <div className="mono mt-0.5 text-[11px] text-[var(--text-4)]">{inc.type}</div>
                      </td>
                      <td className="font-medium text-[var(--text-2)]">{inc.attack}</td>
                      <td className="mono text-[12.5px] text-[var(--text-4)]">{inc.target}</td>
                      <td>
                        <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.line }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: sv.solid }} aria-hidden />
                          {inc.criticality}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: st.bg, color: st.text, borderColor: st.line }}>{st.label}</span>
                      </td>
                      <td className="mono text-[12px]" style={{ color: inc.route === "SHORT" ? "var(--success)" : inc.route === "PARTIAL" ? "var(--warning)" : "var(--violet)" }}>
                        {inc.route}
                      </td>
                      <td className="font-medium" style={{ color: out.text }}>{out.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Trend + health ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="panel">
            <PanelHeader title="Alert Trend" meta="7-day · Demo data" />
            <div className="panel-body">
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="day" {...AXIS} />
                    <YAxis {...AXIS} width={36} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
                    <Bar dataKey="critical" fill="#FF5A5A" stackId="a" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="high" fill="#F97316" stackId="a" isAnimationActive={false} />
                    <Bar dataKey="medium" fill="#EAB308" stackId="a" isAnimationActive={false} />
                    <Bar dataKey="low" fill="#22C55E" stackId="a" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="legend mt-3">
                {[
                  { label: "Critical", color: "#FF5A5A" },
                  { label: "High", color: "#F97316" },
                  { label: "Medium", color: "#EAB308" },
                  { label: "Low", color: "#22C55E" },
                ].map((l) => (
                  <span key={l.label} className="legend-item">
                    <span className="legend-swatch" style={{ background: l.color }} aria-hidden />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <PanelHeader title="System Health" action="Details" onAction={() => onNavigate("system-health")} />
            <div>
              {services.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 px-[18px] py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                >
                  <span className="dot" style={{ background: s.status === "Online" ? "var(--success)" : "var(--danger)" }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-[var(--text-2)]">{s.name}</div>
                    <div className="mono text-[11.5px] text-[var(--text-4)]">{s.detail}</div>
                  </div>
                  <span className="mono shrink-0 text-[12px] font-semibold" style={{ color: "var(--success)" }}>{s.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}