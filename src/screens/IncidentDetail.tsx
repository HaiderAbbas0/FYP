import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";
import Card from "../components/ui/Card";
import Badge, { CriticalityBadge, RouteBadge, OutcomeBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { featureImportance } from "../data/mock";
import type { Screen } from "../types";

interface Props { tab: "overview" | "safereuse" | "response"; onNavigate: (s: Screen) => void; onTabChange: (t: "overview" | "safereuse" | "response") => void; }

const lifecycle = [
  { code: "T0", label: "Baseline", time: "14:01:45" },
  { code: "T1", label: "Attack Start", time: "14:02:00" },
  { code: "T2", label: "Detection", time: "14:02:01" },
  { code: "T3", label: "Route", time: "14:02:02" },
  { code: "T4", label: "Recommendation", time: "14:02:02" },
  { code: "T5", label: "Policy", time: "14:02:03" },
  { code: "T6", label: "Execute", time: "14:02:04" },
  { code: "T7", label: "Containment", time: "14:02:14" },
  { code: "T8", label: "Stable", time: "14:02:20" },
  { code: "T9", label: "Recovery", time: "14:02:34" },
  { code: "T10", label: "Stored", time: "14:02:35" },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-[19px] font-semibold text-[#E8EDE9] mb-5">Incident Lifecycle</div>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {lifecycle.map((t, i) => (
            <React.Fragment key={t.code}>
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 mb-2
                  ${i <= 9 ? "bg-[#B6FF3B] border-[#B6FF3B] text-[#0C0F0D]" : "bg-[#1A1F1B] border-[#242924] text-[#94A8BA]"}`}>
                  {t.code}
                </div>
                <div className={`text-[13px] font-semibold text-center leading-tight ${i <= 9 ? "text-[#E8EDE9]" : "text-[#94A8BA]"}`}>{t.label}</div>
                <div className="text-[12px] mono text-[#94A8BA] mt-1">{t.time}</div>
              </div>
              {i < lifecycle.length - 1 && (
                <div className={`h-px flex-1 mt-4 mx-1 ${i <= 8 ? "bg-[#B6FF3B]" : "bg-[#1A1F1B]"}`}/>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Detection Evidence</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Prediction Confidence", value: "97%", color: "#22C55E" },
              { label: "Packets / sec", value: "4,218", color: "#EF4444" },
              { label: "Connections / sec", value: "312", color: "#EF4444" },
              { label: "Baseline Deviation", value: "+142%", color: "#EF4444" },
            ].map(m => (
              <div key={m.label} className="p-3 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[8px]">
                <div className="text-[13px] text-[#94A8BA] uppercase tracking-widest mb-1">{m.label}</div>
                <div className="text-[21px] font-bold mono" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Feature Importance</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E241F" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`}/>
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                <Bar dataKey="value" fill="#B6FF3B" radius={[0, 3, 3, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SafeReuseTab() {
  const comparisonRows = [
    { field: "Attack Vector", prev: "MQTT Connect Flood", curr: "MQTT Connect Flood", status: "MATCH" },
    { field: "Device", prev: "Sensor — Patient Monitor", curr: "Gateway — Patient Monitor", status: "CHANGED" },
    { field: "Criticality", prev: "Medium", curr: "Critical", status: "CHANGED" },
    { field: "Traffic Pattern", prev: "Single Source", curr: "Multi-Source", status: "CHANGED" },
    { field: "Proposed Response", prev: "Source Block", curr: "Pending", status: "INCOMPATIBLE" },
  ];

  const statusColors: Record<string, string> = {
    MATCH: "text-[#4ADE80] bg-[#14291A]",
    CHANGED: "text-[#FBBF24] bg-[#2C1E06]",
    INCOMPATIBLE: "text-[#F87171] bg-[#2C1010]",
  };

  const investigationTasks = [
    { name: "Traffic Analysis", status: "Complete", reused: false },
    { name: "Device Context", status: "Complete", reused: false },
    { name: "Historical Evidence", status: "Reused", reused: true },
    { name: "Threat Intelligence", status: "Skipped", reused: null },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_300px] gap-5">
        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Controller Decision Inputs</div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Detector Confidence", value: "97%", ok: true },
              { label: "Severity", value: "High", ok: true },
              { label: "Device Criticality", value: "Critical", ok: true },
              { label: "Best Case Similarity", value: "82%", ok: true },
              { label: "Historical Reliability", value: "89%", ok: true },
            ].map(g => (
              <div key={g.label} className="flex items-center justify-between p-3 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[8px]">
                <div className="text-[15px] text-[#94A8BA]">{g.label}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold mono text-[#E8EDE9]">{g.value}</span>
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[12px] ${g.ok ? "bg-[#14291A] text-[#4ADE80]" : "bg-[#2C1010] text-[#F87171]"}`}>✓</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#0A0D0A] border border-[#1A1F1B] rounded-[10px]">
            <RouteBadge value="PARTIAL"/>
            <div>
              <div className="text-[#B6FF3B] text-[15px] font-semibold">PARTIAL INVESTIGATION</div>
              <div className="text-[#94A8BA] text-[15px] mt-0.5">Similar historical evidence exists, but current device context differs.</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Best Historical Case</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-[#A78BFA] mono text-[24px]">CASE-017</span>
            <Badge variant="violet">82% Similar</Badge>
          </div>
          {[
            { label: "Previous Response", value: "Rate Limiting" },
            { label: "Previous Outcome", value: "SUCCESS" },
            { label: "Validated Uses", value: "12" },
            { label: "Historical Reliability", value: "89%" },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2 border-b border-[#1A1F1B] last:border-0">
              <span className="text-[15px] text-[#94A8BA]">{r.label}</span>
              <span className="text-[15px] mono font-semibold text-[#E8EDE9]">{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-5">
        <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Case Comparison</div>
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b border-[#1A1F1B]">
              {["Field", "Previous Case (CASE-017)", "Current Incident (INC-104)", "Status"].map(h => (
                <th key={h} className="text-left py-2.5 pr-5 text-[13px] text-[#94A8BA] font-semibold uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(r => (
              <tr key={r.field} className="border-b border-[#161B17] last:border-0">
                <td className="py-3 pr-5 text-[#94A8BA] font-medium">{r.field}</td>
                <td className="py-3 pr-5 mono text-[#94A8BA]">{r.prev}</td>
                <td className="py-3 pr-5 mono text-[#E8EDE9]">{r.curr}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[13px] font-bold mono ${statusColors[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Investigation Evidence</div>
        <div className="grid grid-cols-4 gap-3">
          {investigationTasks.map(t => (
            <div key={t.name} className={`p-3 rounded-[8px] border ${t.reused === true ? "border-[#3B3570] bg-[#1E1A3D]" : t.reused === false ? "border-[#1A1F1B] bg-[#0C0F0D]" : "border-dashed border-[#1A1F1B] bg-transparent"}`}>
              <div className="text-[15px] font-semibold text-[#E8EDE9] mb-1">{t.name}</div>
              <span className={`text-[13px] font-semibold mono uppercase ${t.reused === true ? "text-[#A78BFA]" : t.reused === false ? "text-[#4ADE80]" : "text-[#94A8BA]"}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ResponseTab() {
  const responseData = [
    ...Array.from({ length: 10 }, (_, i) => ({ t: i, legit: 25 + Math.random() * 2, malicious: 0 })),
    ...Array.from({ length: 18 }, (_, i) => ({ t: i + 10, legit: Math.max(5, 20 - i * 0.5), malicious: 65 + Math.random() * 20 })),
    ...Array.from({ length: 20 }, (_, i) => ({ t: i + 28, legit: 16 + i * 0.45, malicious: Math.max(0, 28 - i * 1.6 + Math.random() * 2) })),
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Response Recommendation</div>
          <div className="text-[21px] font-bold text-[#E8EDE9] mb-2">MQTT Connection Rate Limiting</div>
          <div className="text-[15px] text-[#94A8BA] mb-3">Duration: 120s · Scope: upstream traffic only</div>
          <div className="p-2 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[6px] text-[13px] mono text-[#94A8BA]">
            Controller derived from CASE-017 — partial adaptation for gateway context
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Deterministic Policy</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded bg-[#14291A] flex items-center justify-center text-[13px] text-[#4ADE80] font-bold">✓</span>
            <span className="text-[19px] font-bold text-[#22C55E]">APPROVED</span>
          </div>
          <div className="space-y-1.5">
            {[
              "Confidence threshold ≥ 0.90",
              "Device policy compliant",
              "Duration within bounds",
              "Allowlist check passed",
              "Criticality rules satisfied",
            ].map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className="text-[#22C55E] text-[13px]">✓</span>
                <span className="text-[13px] text-[#94A8BA]">{c}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Execution</div>
          <div className="text-[19px] font-bold text-[#E8EDE9] mb-1">Applied successfully</div>
          <div className="text-[15px] text-[#94A8BA] mb-3">Rate limiting active at T6 → 14:02:04</div>
          {[
            { label: "Applied at", value: "T6 · 14:02:04" },
            { label: "Contained at", value: "T7 · 14:02:14" },
            { label: "Recovery", value: "T9 · 14:02:34" },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-[#1A1F1B] last:border-0">
              <span className="text-[13px] text-[#94A8BA]">{r.label}</span>
              <span className="text-[13px] mono font-medium text-[#E8EDE9]">{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[19px] font-semibold text-[#E8EDE9] mb-0.5">Traffic — Baseline / Attack / Post-Response</div>
            <div className="text-[15px] text-[#94A8BA]">Attack effect reduced while legitimate IoMT service remained within acceptable bounds.</div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#14291A] border border-[#1A3D22] rounded-full">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#22C55E" strokeWidth="1.2"/><path d="M4 7l2.5 2.5L10 5" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[19px] font-bold text-[#4ADE80]">SUCCESS</span>
          </div>
        </div>

        <div className="h-[200px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={responseData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="lG3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E241F" vertical={false}/>
              <XAxis dataKey="t" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
              <ReferenceLine x={10} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Attack", position: "top", fontSize: 11, fill: "#EF4444" }}/>
              <ReferenceLine x={28} stroke="#22C55E" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Response", position: "top", fontSize: 11, fill: "#22C55E" }}/>
              <Area type="monotone" dataKey="malicious" stroke="#EF4444" strokeWidth={1.5} fill="url(#rG)" dot={false}/>
              <Area type="monotone" dataKey="legit" stroke="#22C55E" strokeWidth={1.5} fill="url(#lG3)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "Attack Suppression", value: "90%", color: "#22C55E" },
            { label: "Service Availability", value: "88%", color: "#22C55E" },
            { label: "Delivery Rate", value: "96%", color: "#E8EDE9" },
            { label: "p95 Latency", value: "32ms", color: "#E8EDE9" },
            { label: "Time to Contain", value: "14s", color: "#B6FF3B" },
            { label: "Recovery Time", value: "20s", color: "#A78BFA" },
          ].map(m => (
            <div key={m.label} className="p-3 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[8px] text-center">
              <div className="text-[24px] font-bold mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[13px] text-[#94A8BA] mt-0.5 leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function IncidentDetail({ tab, onNavigate, onTabChange }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[32px] font-bold mono text-[#E8EDE9]">INC-104</span>
              <CriticalityBadge value="Critical"/>
              <OutcomeBadge value="SUCCESS"/>
              <span className="text-[15px] mono text-[#94A8BA] bg-[#111511] border border-[#242924] px-2 py-0.5 rounded">RUN-0042</span>
            </div>
            <div className="text-[19px] text-[#94A8BA]">DDoS · MQTT Connect Flood · Gateway-01</div>
            <div className="flex items-center gap-3 mt-2 text-[15px] text-[#94A8BA]">
              <span className="mono">Confidence: <strong className="text-[#22C55E]">97%</strong></span>
              <span>·</span>
              <span>Severity: High</span>
              <span>·</span>
              <span>Route: <strong className="text-[#F59E0B]">PARTIAL</strong></span>
            </div>
          </div>
          <Button variant="secondary" className="text-[15px] py-2" onClick={() => onNavigate("incidents")}>← All Incidents</Button>
        </div>

        <div className="flex gap-0 border-b border-[#1A1F1B] mb-6">
          {(["overview", "safereuse", "response"] as const).map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`px-5 py-3 text-[19px] font-medium capitalize transition-all border-b-2 -mb-px
                ${tab === t ? "border-[#B6FF3B] text-[#E8EDE9]" : "border-transparent text-[#94A8BA] hover:text-[#E8EDE9]"}`}
            >
              {t === "safereuse" ? "Safe Reuse" : t === "response" ? "Response & Outcome" : "Overview"}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab/>}
        {tab === "safereuse" && <SafeReuseTab/>}
        {tab === "response" && <ResponseTab/>}
      </div>
    </div>
  );
}
