import React, { useState } from "react";
import type { Screen } from "../types";
import { devices, incidents } from "../data/mock";

interface Props { onNavigate: (s: Screen) => void; }

export default function DeviceDetail({ onNavigate }: Props) {
  const d = devices[0]; // Hardcode mock for demo
  const [tab, setTab] = useState<"overview" | "incidents">("overview");

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate("devices")}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors mb-3"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
          >
            ← Back to Inventory
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[24px] font-bold" style={{ color: "var(--text)" }}>{d.name}</h1>
                <span className={`badge ${
                  d.criticality === "Critical" ? "sev-critical" : 
                  d.criticality === "High" ? "sev-high" : 
                  d.criticality === "Medium" ? "sev-medium" : "sev-low"
                }`}>
                  {d.criticality} Asset
                </span>
                <span className="badge" style={{ background: d.status === "Online" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)", color: d.status === "Online" ? "#1CC970" : "#F53838", borderColor: d.status === "Online" ? "rgba(28,201,112,0.3)" : "rgba(245,56,56,0.3)" }}>
                  {d.status}
                </span>
              </div>
              <div className="text-[13px] mono mt-2" style={{ color: "var(--text-3)" }}>
                IP: {d.ip} · MAC: {d.mac}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm" disabled>Isolate Network</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav mb-6">
          {(["overview", "incidents"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
            >
              {t === "overview" ? "Asset Overview" : "Associated Incidents"}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && (
           <div className="grid grid-cols-[1fr_300px] gap-6">
              <div className="space-y-6">
                 {/* Details */}
                 <div className="card p-5">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Device Profile</h2>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Device Type</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.type}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Clinical Role</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.clinicalRole}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Hardware Manufacturer</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.manufacturer}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Model</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.model}</div>
                       </div>
                    </div>
                 </div>

                 {/* Network Map / Topology placeholder */}
                 <div className="card p-5 h-[250px] flex flex-col">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Network Topology (Simulated)</h2>
                    <div className="flex-1 flex items-center justify-center border border-dashed rounded-[8px]" style={{ borderColor: "var(--border-2)", background: "var(--surface-2)" }}>
                       <div className="text-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" className="mx-auto mb-2">
                             <circle cx="12" cy="12" r="10" />
                             <line x1="2" y1="12" x2="22" y2="12" />
                             <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <div className="text-[12px]" style={{ color: "var(--text-3)" }}>Connected to VLAN-40 (Medical IoT)</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Risk Box */}
                 <div className="card p-5 flex flex-col justify-center items-center text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Calculated Risk Score</div>
                    <div className="text-[36px] font-bold mono leading-none mb-2" style={{ color: "#F0A020" }}>{d.riskScore}</div>
                    <div className="text-[12px]" style={{ color: "var(--text-3)" }}>Based on criticality, vulnerabilities, and recent incidents.</div>
                 </div>
                 
                 {/* Vulnerabilities */}
                 <div className="card p-5">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Open Vulnerabilities</h2>
                    <div className="space-y-3">
                       <div className="flex gap-2">
                          <span className="badge sev-high shrink-0 mt-0.5">CVE-2023-XXXX</span>
                          <div className="text-[12px] leading-tight" style={{ color: "var(--text-2)" }}>MQTT Broker authentication bypass in underlying OS library.</div>
                       </div>
                       <div className="flex gap-2">
                          <span className="badge sev-medium shrink-0 mt-0.5">CVE-2022-YYYY</span>
                          <div className="text-[12px] leading-tight" style={{ color: "var(--text-2)" }}>Weak default credentials on administration interface.</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        
        {tab === "incidents" && (
           <div className="card overflow-hidden">
             <table className="data-table">
               <thead>
                 <tr>
                   <th>ID</th>
                   <th>Attack</th>
                   <th>Severity</th>
                   <th>Status</th>
                   <th>Date</th>
                 </tr>
               </thead>
               <tbody>
                  {incidents.filter(i => i.target.includes(d.name)).map(inc => (
                    <tr key={inc.id} onClick={() => onNavigate("incident-overview")} className="cursor-pointer">
                       <td className="font-semibold mono">{inc.id}</td>
                       <td>{inc.attack}</td>
                       <td>
                          <span className={`badge ${
                             inc.criticality === "Critical" ? "sev-critical" : 
                             inc.criticality === "High" ? "sev-high" : "sev-medium"
                           }`}>
                             {inc.criticality}
                          </span>
                       </td>
                       <td>{inc.status}</td>
                       <td className="mono">{inc.time}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        )}
        
      </div>
    </div>
  );
}
