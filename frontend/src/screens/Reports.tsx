import React, { useState } from "react";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

export default function Reports({ onNavigate }: Props) {
  const [reportType, setReportType] = useState("incidents");
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Reports & Export</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
             Generate compliance reports and export incident data.
          </p>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-6">
           {/* Sidebar Options */}
           <div className="space-y-4">
              <div className="card p-4">
                 <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Report Type</div>
                 <div className="space-y-1">
                    {[
                      { id: "incidents", label: "Incident Summary" },
                      { id: "compliance", label: "Compliance (HIPAA)" },
                      { id: "devices", label: "Asset Risk Posture" },
                      { id: "audit", label: "Full Audit Export" },
                    ].map(r => (
                       <button
                         key={r.id}
                         onClick={() => setReportType(r.id)}
                         className="w-full text-left px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
                         style={{ 
                            background: reportType === r.id ? "var(--surface-3)" : "transparent",
                            color: reportType === r.id ? "var(--text)" : "var(--text-3)"
                         }}
                       >
                         {r.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="card p-4">
                 <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Time Range</div>
                 <div className="space-y-1">
                    {[
                      { id: "24h", label: "Last 24 Hours" },
                      { id: "7d", label: "Last 7 Days" },
                      { id: "30d", label: "Last 30 Days" },
                      { id: "custom", label: "Custom Range..." },
                    ].map(r => (
                       <button
                         key={r.id}
                         onClick={() => setTimeRange(r.id)}
                         className="w-full text-left px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
                         style={{ 
                            background: timeRange === r.id ? "var(--surface-3)" : "transparent",
                            color: timeRange === r.id ? "var(--text)" : "var(--text-3)"
                         }}
                       >
                         {r.label}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Preview / Action */}
           <div className="card p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-[12px] flex items-center justify-center mb-6" style={{ background: "rgba(168,255,53,0.1)", color: "var(--lime)" }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                 </svg>
              </div>
              <h2 className="text-[18px] font-semibold mb-2" style={{ color: "var(--text)" }}>Report Preview</h2>
              <p className="text-[13px] mb-8 max-w-[300px]" style={{ color: "var(--text-3)" }}>
                 Generating a '{reportType}' report for the selected time range. The export will be available in CSV and PDF formats.
              </p>
              
              <div className="flex gap-3">
                 <button className="btn btn-secondary px-6">Preview</button>
                 <button className="btn btn-primary px-6">Export PDF</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
