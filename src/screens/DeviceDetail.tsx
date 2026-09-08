import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Card from "../components/ui/Card";
import { CriticalityBadge, StatusDot, OutcomeBadge, RouteBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const baselineData = Array.from({ length: 40 }, (_, i) => ({
  t: i,
  baseline: 25 + Math.sin(i * 0.4) * 2,
  current: 25 + Math.sin(i * 0.4) * 2 + (i > 28 ? 35 + Math.random() * 20 : Math.random() * 2),
}));

export default function DeviceDetail({ onNavigate }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="flex items-start gap-5 mb-7">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[32px] font-bold text-[#E8EDE9]">Gateway-01</h2>
              <CriticalityBadge value="Critical"/>
              <div className="flex items-center gap-1.5">
                <StatusDot online={true}/>
                <span className="text-[15px] text-[#22C55E] font-medium">Online</span>
              </div>
            </div>
            <div className="text-[19px] text-[#94A8BA]">Patient Monitor Gateway · MQTT · 10.0.0.10</div>
          </div>
          <Button variant="secondary" className="text-[15px] py-2" onClick={() => onNavigate("devices")}>← All Devices</Button>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[19px] font-semibold text-[#E8EDE9] mb-0.5">Traffic Baseline vs Current</div>
                  <div className="text-[15px] text-[#94A8BA] mono">Gateway-01 · msg/s · Live</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest">Deviation</div>
                  <div className="text-[24px] font-bold text-[#EF4444] mono">+142%</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Normal Band", value: "20–30 msg/s", color: "#E8EDE9" },
                  { label: "Current", value: "71 msg/s", color: "#EF4444" },
                  { label: "Last Seen", value: "just now", color: "#94A8BA" },
                ].map(m => (
                  <div key={m.label} className="p-3 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[8px]">
                    <div className="text-[13px] text-[#94A8BA] uppercase tracking-widest mb-1">{m.label}</div>
                    <div className="text-[19px] font-bold mono" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={baselineData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8EDE9" stopOpacity={0.07}/><stop offset="95%" stopColor="#E8EDE9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E241F" vertical={false}/>
                    <XAxis dataKey="t" tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 12, fontFamily: "JetBrains Mono", fill: "#94A8BA" }} tickLine={false} axisLine={false}/>
                    <ReferenceLine x={28} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.2} label={{ value: "Anomaly", position: "top", fontSize: 12, fill: "#EF4444" }}/>
                    <Area type="monotone" dataKey="baseline" stroke="#5A625A" strokeWidth={1.5} fill="url(#bG)" dot={false} name="Baseline"/>
                    <Area type="monotone" dataKey="current" stroke="#EF4444" strokeWidth={1.5} fill="url(#cG)" dot={false} name="Current"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Recent Incidents</div>
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-[#1A1F1B]">
                    {["ID", "Attack", "Route", "Outcome", "Time"].map(h => (
                      <th key={h} className="text-left py-2 text-[13px] text-[#94A8BA] font-semibold uppercase tracking-widest pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "INC-104", attack: "MQTT Connect Flood", route: "PARTIAL", outcome: "SUCCESS", time: "14:32" },
                    { id: "INC-102", attack: "SYN Flood", route: "DEEP", outcome: "PARTIAL", time: "13:57" },
                    { id: "INC-099", attack: "MQTT Publish Flood", route: "DEEP", outcome: "SUCCESS", time: "12:55" },
                  ].map(inc => (
                    <tr key={inc.id} className="border-b border-[#161B17] hover:bg-[#141814] cursor-pointer" onClick={() => onNavigate("incident-overview")}>
                      <td className="py-2.5 pr-4 mono font-medium text-[#E8EDE9]">{inc.id}</td>
                      <td className="py-2.5 pr-4 text-[#94A8BA]">{inc.attack}</td>
                      <td className="py-2.5 pr-4"><RouteBadge value={inc.route}/></td>
                      <td className="py-2.5 pr-4"><OutcomeBadge value={inc.outcome}/></td>
                      <td className="py-2.5 mono text-[#94A8BA]">{inc.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Device Info</div>
              {[
                { label: "Device ID", value: "GW-01" },
                { label: "Type", value: "Patient Monitor Gateway" },
                { label: "Criticality", value: "Critical" },
                { label: "IP Address", value: "10.0.0.10" },
                { label: "Protocol", value: "MQTT v3.1.1" },
                { label: "Last Seen", value: "2026-09-05 14:32:01" },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-[#1A1F1B] last:border-0">
                  <span className="text-[15px] text-[#94A8BA]">{r.label}</span>
                  <span className="text-[15px] mono text-[#E8EDE9] font-medium">{r.value}</span>
                </div>
              ))}
            </Card>

            <Card className="p-5">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Response Restrictions</div>
              {[
                { label: "Isolation", allowed: false, note: "Not preferred — patient data" },
                { label: "Upstream rate limiting", allowed: true, note: "Allowed" },
                { label: "Source blocking", allowed: true, note: "Allowed" },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-3 py-2.5 border-b border-[#1A1F1B] last:border-0">
                  <span className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[13px] font-bold shrink-0 ${r.allowed ? "bg-[#14291A] text-[#4ADE80]" : "bg-[#2C1010] text-[#F87171]"}`}>
                    {r.allowed ? "✓" : "✗"}
                  </span>
                  <div>
                    <div className="text-[15px] font-medium text-[#E8EDE9]">{r.label}</div>
                    <div className="text-[13px] text-[#94A8BA]">{r.note}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
