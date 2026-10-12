import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";
import { incidents, cases } from "../data/mock";
import { submitResponse } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Screen } from "../types";

interface Props {
  tab: "overview" | "safereuse" | "response";
  onNavigate: (s: Screen) => void;
  onTabChange: (t: "overview" | "safereuse" | "response") => void;
}

// ── Severity helpers ──
function CritBadge({ c }: { c: string }) {
  const bg = c === "Critical" ? "rgba(245,56,56,0.12)" : c === "High" ? "rgba(232,101,12,0.12)" : "rgba(232,194,12,0.1)";
  const color = c === "Critical" ? "#F87171" : c === "High" ? "#FB923C" : "#FBBF24";
  const border = c === "Critical" ? "rgba(245,56,56,0.3)" : c === "High" ? "rgba(232,101,12,0.3)" : "rgba(232,194,12,0.25)";
  const bar = c === "Critical" ? "#F53838" : c === "High" ? "#E8650C" : "#E8C20C";
  return (
    <span className="badge" style={{ background: bg, color, borderColor: border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: bar }} />
      {c}
    </span>
  );
}

function OverviewTab({ inc }: { inc: any }) {
  return (
    <div className="space-y-4">
      {/* ── Investigation Summary ── */}
      <div className="card p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
          Detection Evidence & Summary
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Description</div>
              <div className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{inc.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Source IP</div>
                <div className="text-[14px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.sourceIp || "Multiple"}</div>
              </div>
              <div>
                <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Protocol</div>
                <div className="text-[14px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.protocol || "Unknown"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Detector Confidence", value: `${inc.confidence}%`, color: inc.confidence >= 90 ? "#1CC970" : "#F0A020" },
              { label: "Peak Rate", value: `${inc.packetsPerSec || 4218} pps`, color: "#F53838" },
              { label: "Detection Engine", value: inc.detectedBy || "XGBoost-v3", color: "var(--text)" },
              { label: "Assigned To", value: inc.assignee, color: "var(--text-2)", mono: false },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-[8px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>{s.label}</div>
                <div className={`text-[15px] ${s.mono !== false ? 'mono' : ''} font-bold`} style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="card p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
          Incident Timeline
        </h2>
        <div className="flex gap-0 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { t: "14:01:45", lbl: "Baseline Deviation" },
            { t: "14:02:00", lbl: "Attack Detected" },
            { t: "14:02:01", lbl: "Auto-Triage" },
            { t: "14:02:02", lbl: "Investigation Route" },
            { t: "14:02:04", lbl: "Response Proposed" },
            { t: "14:05:10", lbl: "Analyst Reviewed", dim: true },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] mono mb-2 border-2"
                  style={{
                    background: step.dim ? "transparent" : "rgba(168,255,53,0.1)",
                    color: step.dim ? "var(--text-3)" : "var(--lime)",
                    borderColor: step.dim ? "var(--border-2)" : "var(--lime)",
                  }}
                >
                  T{i}
                </div>
                <div className="text-[12px] font-medium text-center leading-tight mb-1" style={{ color: step.dim ? "var(--text-3)" : "var(--text)" }}>{step.lbl}</div>
                <div className="text-[10px] mono" style={{ color: "var(--text-3)" }}>{step.t}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="h-px flex-1 mt-3.5 mx-2" style={{ background: "var(--border-2)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function SafeReuseTab({ inc }: { inc: any }) {
  return (
    <div className="space-y-4">
      <div className="safety-notice mb-2">
        <strong>SAFE REUSE ANALYSIS</strong> — MediSOC attempts to safely reuse previous successful responses for similar attacks. This analysis compares the current incident against historical Case Memory to determine if a full manual investigation can be skipped.
      </div>
      
      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Comparison */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Contextual Comparison
          </h2>
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
              {[
                { vec: "Attack Type", cur: inc.attack, hist: "MQTT Connect Flood", stat: "EXACT" },
                { vec: "Target Role", cur: "Gateway", hist: "Sensor", stat: "DEVIATION" },
                { vec: "Criticality", cur: inc.criticality, hist: "Medium", stat: "ESCALATED" },
                { vec: "Source IPs", cur: inc.sourceIp || "Multiple", hist: "Single", stat: "DEVIATION" },
              ].map(r => (
                <tr key={r.vec}>
                  <td className="font-medium">{r.vec}</td>
                  <td className="mono" style={{ color: "var(--text)" }}>{r.cur}</td>
                  <td className="mono">{r.hist}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.stat === "EXACT" ? "rgba(28,201,112,0.1)" : "rgba(240,160,32,0.1)",
                      color: r.stat === "EXACT" ? "#1CC970" : "#F0A020",
                      borderColor: r.stat === "EXACT" ? "rgba(28,201,112,0.3)" : "rgba(240,160,32,0.3)",
                    }}>{r.stat}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Decision */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
              Routing Decision
            </h2>
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Selected Route</div>
              <div className="text-[20px] font-bold mono" style={{ color: "#F0A020" }}>PARTIAL</div>
            </div>
            <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Historical case memory (CASE-017) is 82% similar. However, target role differs (Gateway vs Sensor) and criticality is higher. Full automated reuse is unsafe. Partial manual review required.
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between items-center text-[12px]">
              <span style={{ color: "var(--text-3)" }}>Historical Reliability</span>
              <span className="mono font-semibold" style={{ color: "#1CC970" }}>89%</span>
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

  const responseData = [
    ...Array.from({ length: 10 }, (_, i) => ({ t: i, legit: 25 + Math.random() * 2, malicious: 0 })),
    ...Array.from({ length: 18 }, (_, i) => ({ t: i + 10, legit: Math.max(5, 20 - i * 0.5), malicious: 65 + Math.random() * 20 })),
    ...Array.from({ length: 20 }, (_, i) => ({ t: i + 28, legit: 16 + i * 0.45, malicious: Math.max(0, 28 - i * 1.6 + Math.random() * 2) })),
  ];

  return (
    <div className="space-y-4">
      {/* ── Healthcare safety notice ── */}
      <div className="alert-info text-[13px] flex gap-3 items-start">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M7 5.5v3M7 10v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>
          <strong className="font-semibold">RECOMMENDATION ONLY</strong> — No network action has been executed.
          This response must be explicitly approved by an authorized administrator before any containment step is applied to the network.
          Approved actions are logged in the Audit Log.
        </span>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Recommendation */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Proposed Action
          </h2>
          <div className="text-[20px] font-bold mb-2" style={{ color: "var(--text)" }}>MQTT Connection Rate Limiting</div>
          <div className="text-[14px] mb-4" style={{ color: "var(--text-2)" }}>
            Apply a strict rate limit of 50 connections/sec at the upstream switch interface for Gateway-01. Duration: 120s. 
            This will suppress the flood while maintaining baseline clinical telemetry.
          </div>
          
          <div className="p-3 rounded-[8px] mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Policy Checks</div>
            <div className="space-y-1.5">
              {["Confidence threshold ≥ 0.90", "Device policy compliant", "Duration within bounds", "Clinical allowlist check passed"].map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px]">
                  <span style={{ color: "#1CC970" }}>✓</span>
                  <span style={{ color: "var(--text-3)" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authorization */}
        <div className="card p-5 flex flex-col">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Authorization
          </h2>
          
          {approved ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded bg-[rgba(28,201,112,0.15)] flex items-center justify-center text-[11px] text-[#1CC970] font-bold">✓</span>
                <span className="text-[16px] font-bold" style={{ color: "#1CC970" }}>APPROVED & LOGGED</span>
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-3)" }}>Response authorized and executed. Recorded in Audit Log.</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>
                Review the recommendation and policy checks. Explicit authorization is required to modify network state.
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn btn-warning w-full py-2.5 font-bold uppercase tracking-widest mono text-[13px]"
              >
                Authorize Action →
              </button>
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
            <div className="mt-3 px-3 py-2 rounded-[6px] text-[12px] mono" style={{ background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              <span className="text-[var(--warning)] font-bold">⚠ DEMO MODE:</span> This will NOT execute real network changes. It will simulate a successful response and record the audit event.
            </div>
          </ConfirmDialog>
        </div>
      </div>
      
      {/* Simulation Result / Chart */}
      {approved && (
        <div className="card p-5 fade-in">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Response Outcome (Simulated)</h2>
               <div className="text-[13px]" style={{ color: "var(--text-3)" }}>Attack suppressed successfully. Legitimate traffic stabilized.</div>
             </div>
             <span className="badge" style={{ background: "rgba(28,201,112,0.1)", color: "#1CC970", borderColor: "rgba(28,201,112,0.3)" }}>SUCCESS</span>
           </div>
           
           <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F53838" stopOpacity={0.2}/><stop offset="100%" stopColor="#F53838" stopOpacity={0}/></linearGradient>
                  <linearGradient id="lG3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1CC970" stopOpacity={0.15}/><stop offset="100%" stopColor="#1CC970" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="t" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false}/>
                <ReferenceLine x={10} stroke="#F53838" strokeDasharray="3 3" strokeWidth={1} label={{ value: "Attack", position: "top", fontSize: 10, fill: "#F53838" }}/>
                <ReferenceLine x={28} stroke="#1CC970" strokeDasharray="3 3" strokeWidth={1} label={{ value: "Response", position: "top", fontSize: 10, fill: "#1CC970" }}/>
                <Area type="monotone" dataKey="malicious" stroke="#F53838" strokeWidth={1.5} fill="url(#rG)" dot={false}/>
                <Area type="monotone" dataKey="legit" stroke="#1CC970" strokeWidth={1.5} fill="url(#lG3)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
             {[
                { label: "Attack Suppression", value: "90%", color: "#1CC970" },
                { label: "Service Availability", value: "88%", color: "#1CC970" },
                { label: "Time to Contain", value: "14s", color: "var(--text)" },
                { label: "Recovery Time", value: "20s", color: "var(--text)" },
             ].map(m => (
               <div key={m.label} className="p-3 text-center rounded-[8px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                 <div className="text-[20px] font-bold mono" style={{ color: m.color }}>{m.value}</div>
                 <div className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>{m.label}</div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncidentDetail({ tab, onNavigate, onTabChange }: Props) {
  // Use a hardcoded mock incident for demo (ideally would fetch based on URL params)
  const inc = incidents[0]; 

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate("incidents")}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors mb-3"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
          >
            ← Back to Incidents
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[28px] font-bold mono leading-none" style={{ color: "var(--text)" }}>{inc.id}</h1>
                <CritBadge c={inc.criticality} />
                <span className="badge" style={{ background: "rgba(139,114,240,0.1)", color: "#8B72F0", borderColor: "rgba(139,114,240,0.3)" }}>
                  {inc.type}
                </span>
              </div>
              <h2 className="text-[18px] font-medium" style={{ color: "var(--text-2)" }}>{inc.attack} on {inc.target}</h2>
              <div className="flex items-center gap-2 mt-2 text-[12px] mono" style={{ color: "var(--text-3)" }}>
                <span>Detected: {inc.time}</span>
                <span>•</span>
                <span>Route: {inc.route}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("device-detail")}>View Device Details</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav mb-6">
          {(["overview", "safereuse", "response"] as const).map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
            >
              {t === "safereuse" ? "Safe Reuse Analysis" : t === "response" ? "Response & Outcome" : "Investigation Overview"}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewTab inc={inc} />}
        {tab === "safereuse" && <SafeReuseTab inc={inc} />}
        {tab === "response" && <ResponseTab inc={inc} />}
        
      </div>
    </div>
  );
}
