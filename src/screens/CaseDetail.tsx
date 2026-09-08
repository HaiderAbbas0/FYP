import React from "react";
import Card from "../components/ui/Card";
import { OutcomeBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const reuseHistory = [
  { date: "2026-09-05 14:02", incident: "INC-104", outcome: "SUCCESS", adapted: true },
  { date: "2026-09-04 09:18", incident: "INC-097", outcome: "SUCCESS", adapted: false },
  { date: "2026-09-03 16:45", incident: "INC-091", outcome: "PARTIAL", adapted: true },
  { date: "2026-09-02 11:30", incident: "INC-085", outcome: "SUCCESS", adapted: false },
];

export default function CaseDetail({ onNavigate }: Props) {
  const reliability = 84;
  const successCount = 10;
  const partialCount = 1;
  const failureCount = 1;
  const total = 12;

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] font-bold mono text-[#A78BFA]">CASE-128</span>
              <OutcomeBadge value="SUCCESS"/>
            </div>
            <div className="text-[19px] text-[#94A8BA]">MQTT DDoS · Gateway — Critical · Validated Experience Record</div>
          </div>
          <Button variant="secondary" className="text-[15px] py-2" onClick={() => onNavigate("case-memory")}>← Case Memory</Button>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Case Summary</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Attack Vector", value: "MQTT Connect Flood" },
                  { label: "Attack Mode", value: "DDoS" },
                  { label: "Device Type", value: "Patient Monitor Gateway" },
                  { label: "Device Criticality", value: "Critical" },
                  { label: "Recommended Response", value: "Rate Limiting + Source Block" },
                  { label: "Executed Response", value: "MQTT Rate Limiting (120s)" },
                  { label: "Outcome", value: "SUCCESS" },
                  { label: "Containment Time", value: "14 seconds" },
                ].map(r => (
                  <div key={r.label} className="py-2 border-b border-[#1A1F1B]">
                    <div className="text-[13px] text-[#94A8BA] uppercase tracking-widest mb-0.5">{r.label}</div>
                    <div className="text-[19px] font-medium mono text-[#E8EDE9]">{r.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Reliability Evidence</div>
              <div className="flex items-end gap-1.5 mb-4" style={{ height: 80 }}>
                {Array.from({ length: total }, (_, i) => {
                  const h = i < successCount ? 75 : i < successCount + partialCount ? 45 : 20;
                  const color = i < successCount ? "#B6FF3B" : i < successCount + partialCount ? "#F59E0B" : "#EF4444";
                  return <div key={i} className="flex-1 rounded-t-[3px]" style={{ height: h, background: color }}/>;
                })}
              </div>
              <div className="flex items-center gap-4 text-[15px] mb-3">
                {[
                  { label: `Success (${successCount})`, color: "#B6FF3B" },
                  { label: `Partial (${partialCount})`, color: "#F59E0B" },
                  { label: `Failure (${failureCount})`, color: "#EF4444" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded-sm inline-block" style={{ background: l.color }}/>
                    <span className="text-[#94A8BA]">{l.label}</span>
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-[#1A1F1B]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[15px] text-[#94A8BA]">Historical Reliability</span>
                  <span className="text-[24px] font-bold mono text-[#E8EDE9]">{reliability}%</span>
                </div>
                <div className="w-full bg-[#1A1F1B] rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#B6FF3B]" style={{ width: `${reliability}%` }}/>
                </div>
                <div className="text-[13px] text-[#94A8BA] mt-1">Based on {total} validated attempts · evidence-bounded estimate</div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Reuse History</div>
              <div className="space-y-0">
                {reuseHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-[#1A1F1B] last:border-0">
                    <div className="w-1.5 self-stretch flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7C6FF0] mt-1 shrink-0"/>
                      {i < reuseHistory.length - 1 && <div className="flex-1 w-px bg-[#1A1F1B] mt-1"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium mono text-[15px] text-[#E8EDE9]">{h.incident}</span>
                        <OutcomeBadge value={h.outcome}/>
                        {h.adapted && <span className="text-[13px] text-[#A78BFA] bg-[#1E1A3D] border border-[#3B3570] px-2 py-0.5 rounded-full">Adapted</span>}
                      </div>
                      <div className="text-[13px] mono text-[#94A8BA]">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card dark className="p-5">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-4">Validation Metrics</div>
              {[
                { label: "Validated Attempts", value: `${total}`, color: "#E8EDE9" },
                { label: "Successful", value: `${successCount}`, color: "#B6FF3B" },
                { label: "Partial", value: `${partialCount}`, color: "#F59E0B" },
                { label: "Failure", value: `${failureCount}`, color: "#EF4444" },
                { label: "Harmful", value: "0", color: "#94A8BA" },
                { label: "Historical Reliability", value: `${reliability}%`, color: "#B6FF3B" },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-[#161B17] last:border-0">
                  <span className="text-[15px] text-[#94A8BA]">{r.label}</span>
                  <span className="text-[15px] mono font-bold" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </Card>

            <Card className="p-4">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Context Tags</div>
              <div className="flex flex-wrap gap-2">
                {["MQTT", "DDoS", "Gateway", "Critical", "Rate Limiting", "Multi-Source"].map(t => (
                  <span key={t} className="px-2 py-1 text-[13px] font-medium bg-[#1A1F1B] border border-[#242924] rounded-full text-[#94A8BA]">{t}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
