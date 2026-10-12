import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import type { Screen } from "../types";
import { submitResponse } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import { severityTone } from "../components/severity";
import { AXIS, GRID, ChartTooltip } from "../components/chart";
import { incidents } from "../data/mock";

interface Props {
  tab: "overview" | "safereuse" | "response";
  onNavigate: (s: Screen) => void;
  onTabChange: (t: "overview" | "safereuse" | "response") => void;
}

const TIMELINE = [
  { t: "14:01:45", lbl: "Baseline Deviation" },
  { t: "14:02:00", lbl: "Attack Detected" },
  { t: "14:02:01", lbl: "Auto-Triage" },
  { t: "14:02:02", lbl: "Investigation Route" },
  { t: "14:02:04", lbl: "Response Proposed" },
  { t: "14:05:10", lbl: "Analyst Reviewed", dim: true },
];

function OverviewTab({ inc }: { inc: any }) {
  const sv = severityTone(inc.criticality);
  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="panel-head">
          <h2>Detection Evidence &amp; Summary</h2>
        </div>
        <div className="panel-body grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="t-label mb-1.5">Description</div>
              <p className="text-[14px] leading-relaxed text-[var(--text-2)]">{inc.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="t-label mb-1.5">Source IP</div>
                <div className="mono text-[14px] font-semibold text-[var(--text)]">{inc.sourceIp || "Multiple"}</div>
              </div>
              <div>
                <div className="t-label mb-1.5">Protocol</div>
                <div className="mono text-[14px] font-semibold text-[var(--text)]">{inc.protocol || "Unknown"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Detector Confidence", value: `${inc.confidence}%`, color: inc.confidence >= 90 ? "var(--success)" : "var(--warning)", mono: true },
              { label: "Peak Rate", value: `${inc.packetsPerSec || 4218} pps`, color: "var(--critical)", mono: true },
              { label: "Detection Engine", value: inc.detectedBy || "XGBoost-v3", color: "var(--text)", mono: true },
              { label: "Assigned To", value: inc.assignee, color: "var(--text-2)", mono: false },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3.5"
                style={{ background: "var(--well)", border: "1px solid var(--border)" }}
              >
                <div className="t-label mb-1.5">{s.label}</div>
                <div
                  className={`truncate text-[15px] font-semibold ${s.mono ? "mono" : ""}`}
                  style={{ color: s.color }}
                  title={s.value}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Incident Timeline</h2>
        </div>
        <div className="panel-body overflow-x-auto pb-4">
          <div className="flex min-w-[640px] items-stretch">
            {TIMELINE.map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex min-w-[108px] flex-1 flex-col items-center text-center">
                  <div
                    className="mono mb-2 flex h-7 w-7 items-center justify-center rounded-full border text-[11.5px] font-bold"
                    style={{
                      background: step.dim ? "transparent" : sv.bg,
                      color: step.dim ? "var(--text-4)" : sv.text,
                      borderColor: step.dim ? "var(--border-2)" : sv.line,
                    }}
                  >
                    T{i}
                  </div>
                  <div
                    className="text-[12px] font-medium leading-tight"
                    style={{ color: step.dim ? "var(--text-4)" : "var(--text)" }}
                  >
                    {step.lbl}
                  </div>
                  <div className="mono mt-0.5 text-[10.5px] text-[var(--text-4)]">{step.t}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mt-3.5 mx-1 h-px flex-1" style={{ background: "var(--border-2)" }} aria-hidden />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SafeReuseTab({ inc }: { inc: any }) {
  const COMPARISON = [
    { vec: "Attack Type", cur: inc.attack, hist: "MQTT Connect Flood", stat: "EXACT" },
    { vec: "Target Role", cur: "Gateway", hist: "Sensor", stat: "DEVIATION" },
    { vec: "Criticality", cur: inc.criticality, hist: "Medium", stat: "ESCALATED" },
    { vec: "Source IPs", cur: inc.sourceIp || "Multiple", hist: "Single", stat: "DEVIATION" },
  ];

  return (
    <div className="space-y-5">
      <div className="safety-notice">
        <strong className="font-semibold">SAFE REUSE ANALYSIS</strong> — MediSOC attempts to safely reuse previous successful responses for similar attacks. This analysis compares the current incident against historical Case Memory to determine if a full manual investigation can be skipped.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vector</th>
                  <th>Current ({inc.id})</th>
                  <th>Historical (CASE-017)</th>
                  <th>Match Status</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => {
                  const exact = r.stat === "EXACT";
                  return (
                    <tr key={r.vec}>
                      <td className="font-medium text-[var(--text)]">{r.vec}</td>
                      <td className="mono text-[var(--text-2)]">{r.cur}</td>
                      <td className="mono text-[var(--text-4)]">{r.hist}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: exact ? "var(--low-bg)" : "var(--high-bg)",
                            color: exact ? "var(--success)" : "var(--high)",
                            borderColor: exact ? "var(--low-line)" : "var(--high-line)",
                          }}
                        >
                          {r.stat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-head">
            <h2>Routing Decision</h2>
          </div>
          <div className="panel-body flex flex-1 flex-col justify-between">
            <div>
              <div className="t-label mb-1.5">Selected Route</div>
              <div className="mono mb-4 text-[22px] font-bold" style={{ color: "var(--warning)" }}>PARTIAL</div>
              <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
                Historical case memory (CASE-017) is 82% similar. However, target role differs (Gateway vs Sensor) and criticality is higher. Full automated reuse is unsafe. Partial manual review required.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <span className="text-[12px] text-[var(--text-4)]">Historical Reliability</span>
              <span className="mono font-semibold" style={{ color: "var(--success)" }}>89%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponseTab({ inc }: { inc: any }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(inc.status === "Resolved" || inc.status === "Closed");

  async function handleApprove() {
    setApproving(true);
    await submitResponse(inc.id, "MQTT Connection Rate Limiting", "admin@iomt-testbed.local");
    setApproving(false);
    setConfirmOpen(false);
    setApproved(true);
  }

  // Deterministic shape so the chart does not redraw differently on each render.
  const responseData = [
    ...Array.from({ length: 10 }, (_, i) => ({ t: i, legit: 25 + (i % 3) * 0.4, malicious: 0 })),
    ...Array.from({ length: 18 }, (_, i) => ({
      t: i + 10,
      legit: Math.max(5, 20 - i * 0.5),
      malicious: 65 + Math.sin(i * 0.7) * 18,
    })),
    ...Array.from({ length: 20 }, (_, i) => ({
      t: i + 28,
      legit: 16 + i * 0.45,
      malicious: Math.max(0, 28 - i * 1.6),
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="alert-info flex items-start gap-3 text-[13px]">
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden>
          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 5.5v3M7 10v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>
          <strong className="font-semibold">RECOMMENDATION ONLY</strong> — No network action has been executed. This response must be explicitly approved by an authorized administrator before any containment step is applied to the network. Approved actions are logged in the Audit Log.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="panel">
          <div className="panel-head">
            <h2>Proposed Action</h2>
          </div>
          <div className="panel-body">
            <div className="t-h2 mb-2 text-[var(--text)]">MQTT Connection Rate Limiting</div>
            <p className="mb-5 text-[14px] leading-relaxed text-[var(--text-2)]">
              Apply a strict rate limit of 50 connections/sec at the upstream switch interface for Gateway-01. Duration: 120s. This will suppress the flood while maintaining baseline clinical telemetry.
            </p>

            <div className="rounded-lg p-3.5" style={{ background: "var(--well)", border: "1px solid var(--border)" }}>
              <div className="t-label mb-2.5">Policy Checks</div>
              <div className="space-y-1.5">
                {["Confidence threshold ≥ 0.90", "Device policy compliant", "Duration within bounds", "Clinical allowlist check passed"].map((c) => (
                  <div key={c} className="flex items-center gap-2 text-[13px]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ color: "var(--success)" }} aria-hidden>
                      <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[var(--text-3)]">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-head">
            <h2>Authorization</h2>
          </div>
          <div className="panel-body flex flex-1 flex-col">
            {approved ? (
              <div className="flex flex-1 flex-col justify-center">
                <div className="mb-2.5 flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" className="shrink-0" style={{ color: "var(--success)" }} aria-hidden>
                    <circle cx="8.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5.2 8.7l2.2 2.2 4.4-4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[15px] font-bold" style={{ color: "var(--success)" }}>APPROVED &amp; LOGGED</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--text-4)]">
                  Response authorized and executed. Recorded in Audit Log.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between">
                <p className="mb-5 text-[13px] leading-relaxed text-[var(--text-4)]">
                  Review the recommendation and policy checks. Explicit authorization is required to modify network state.
                </p>
                <button type="button" onClick={() => setConfirmOpen(true)} className="btn btn-warning w-full font-semibold">
                  Authorize Action →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {approved && (
        <div className="panel animate-in fade-in">
          <div className="panel-head">
            <h2>Response Outcome (Simulated)</h2>
            <span className="badge" style={{ background: "var(--low-bg)", color: "var(--success)", borderColor: "var(--low-line)" }}>
              SUCCESS
            </span>
          </div>
          <div className="panel-body">
            <p className="mb-4 text-[13px] text-[var(--text-4)]">Attack suppressed successfully. Legitimate traffic stabilized.</p>
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseData} margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="respMal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5A5A" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#FF5A5A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="respLeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A8FF35" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#A8FF35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" {...AXIS} />
                  <YAxis {...AXIS} width={40} />
                  <Tooltip content={<ChartTooltip unit=" msg/s" />} />
                  <ReferenceLine x={10} stroke="var(--critical)" strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: "Attack", position: "top", fontSize: 10, fill: "var(--critical)" }} />
                  <ReferenceLine x={28} stroke="var(--success)" strokeDasharray="3 3" strokeWidth={1}
                    label={{ value: "Response", position: "top", fontSize: 10, fill: "var(--success)" }} />
                  <Area type="monotone" dataKey="malicious" stroke="#FF5A5A" strokeWidth={1.5} fill="url(#respMal)" dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey="legit" stroke="#A8FF35" strokeWidth={1.5} fill="url(#respLeg)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Attack Suppression", value: "90%", color: "var(--success)" },
                { label: "Service Availability", value: "88%", color: "var(--success)" },
                { label: "Time to Contain", value: "14s", color: "var(--text)" },
                { label: "Recovery Time", value: "20s", color: "var(--text)" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg p-3 text-center"
                  style={{ background: "var(--well)", border: "1px solid var(--border)" }}
                >
                  <div className="mono text-[20px] font-bold" style={{ color: m.color }}>{m.value}</div>
                  <div className="mt-1 text-[12px] text-[var(--text-4)]">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Authorize Response Action"
        variant="warning"
        confirmLabel={approving ? "Authorizing…" : "Authorize"}
        cancelLabel="Cancel"
        description={`You are about to authorize: MQTT Connection Rate Limiting for 120s on Gateway-01. This action will be recorded in the Audit Log under your identity.`}
        onConfirm={handleApprove}
        onCancel={() => setConfirmOpen(false)}
      >
        <div
          className="mono mt-3 rounded-md px-3 py-2 text-[12px]"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          <span className="font-bold" style={{ color: "var(--warning)" }}>⚠ DEMO MODE:</span> This will NOT execute real network changes. It will simulate a successful response and record the audit event.
        </div>
      </ConfirmDialog>
    </div>
  );
}

export default function IncidentDetail({ tab, onNavigate, onTabChange }: Props) {
  const inc = incidents[0];
  const sv = severityTone(inc.criticality);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => onNavigate("incidents")}
            className="mb-3 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
          >
            ← Back to Incidents
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="mono text-[26px] font-bold leading-none text-[var(--text)]">{inc.id}</h1>
                <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.line }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: sv.solid }} aria-hidden />
                  {inc.criticality}
                </span>
                <span className="badge" style={{ background: "var(--violet-bg)", color: "var(--violet)", borderColor: "var(--violet-line)" }}>
                  {inc.type}
                </span>
              </div>
              <h2 className="text-[17px] font-medium text-[var(--text-2)]">{inc.attack} on {inc.target}</h2>
              <div className="mono mt-2 flex items-center gap-2 text-[12px] text-[var(--text-4)]">
                <span>Detected: {inc.time}</span>
                <span>•</span>
                <span>Route: {inc.route}</span>
              </div>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate("device-detail")}>
              View Device Details
            </button>
          </div>
        </div>

        <div className="tab-nav mb-6">
          {(["overview", "safereuse", "response"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              role="tab"
              aria-selected={tab === t}
            >
              {t === "safereuse" ? "Safe Reuse Analysis" : t === "response" ? "Response & Outcome" : "Investigation Overview"}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab inc={inc} />}
        {tab === "safereuse" && <SafeReuseTab inc={inc} />}
        {tab === "response" && <ResponseTab inc={inc} />}
      </div>
    </div>
  );
}