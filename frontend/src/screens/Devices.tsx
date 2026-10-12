import React, { useState, useMemo } from "react";
import { devices } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

// ── Icons ──
function DeviceIcon({ type }: { type: string }) {
  const isGateway = type.toLowerCase().includes("gateway");
  const isBroker = type.toLowerCase().includes("broker");
  
  return (
    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)" }}>
      {isGateway && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <rect x="2" y="5" width="14" height="8" rx="2" />
          <path d="M6 13v2M12 13v2" strokeLinecap="round" />
        </svg>
      )}
      {isBroker && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <circle cx="9" cy="9" r="4" />
          <path d="M9 1v4M9 13v4M1 9h4M13 9h4" strokeLinecap="round" />
        </svg>
      )}
      {!isGateway && !isBroker && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <path d="M4 9c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
          <circle cx="9" cy="9" r="2" />
        </svg>
      )}
    </div>
  );
}

// ── Baseline Meter ──
function BaselineMeter({ baseline }: { baseline: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full" style={{ background: "var(--lime)", width: "60%" }} />
      </div>
      <span className="text-[11px] mono shrink-0" style={{ color: "var(--text-3)" }}>{baseline}</span>
    </div>
  );
}

export default function Devices({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCrit, setFilterCrit] = useState("All");

  const filtered = useMemo(() => {
    let d = [...devices];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x => x.name.toLowerCase().includes(q) || x.ip.includes(q) || x.type.toLowerCase().includes(q));
    }
    if (filterCrit !== "All") d = d.filter(x => x.criticality === filterCrit);
    return d;
  }, [search, filterCrit]);

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1440px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Device Inventory</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Discovered clinical and infrastructure devices · Demonstration data
            </p>
          </div>
          <div className="flex items-center gap-2">
             <button className="btn btn-primary btn-sm">Export Inventory</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search devices by name, IP, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-[300px]"
          />
          <div className="flex items-center gap-1">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(c => (
              <button
                key={c}
                onClick={() => setFilterCrit(c)}
                className={`filter-chip ${filterCrit === c ? "active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[14px]" style={{ color: "var(--text-3)" }}>
              No devices match your search criteria.
            </div>
          ) : (
            filtered.map((d) => (
              <div 
                key={d.id} 
                className="card p-5 cursor-pointer hover:border-[var(--border-2)] transition-colors group flex flex-col"
                onClick={() => onNavigate("device-detail")}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <DeviceIcon type={d.type} />
                    <div>
                      <div className="font-bold text-[15px] group-hover:text-[var(--lime)] transition-colors" style={{ color: "var(--text)" }}>{d.name}</div>
                      <div className="text-[12px] mono" style={{ color: "var(--text-3)" }}>{d.ip}</div>
                    </div>
                  </div>
                  <span className={`badge ${
                    d.criticality === "Critical" ? "sev-critical" : 
                    d.criticality === "High" ? "sev-high" : 
                    d.criticality === "Medium" ? "sev-medium" : "sev-low"
                  }`}>
                    {d.criticality}
                  </span>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Clinical Role</div>
                    <div className="text-[13px] leading-tight" style={{ color: "var(--text-2)" }}>{d.clinicalRole}</div>
                  </div>
                  <div>
                     <div className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Hardware</div>
                     <div className="text-[13px]" style={{ color: "var(--text-2)" }}>{d.manufacturer} {d.model}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Telemetry Baseline</div>
                    <BaselineMeter baseline={d.baseline} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.status === "Online" ? "var(--success)" : "var(--danger)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: d.status === "Online" ? "var(--success)" : "var(--danger)" }}>{d.status}</span>
                  </div>
                  <span className="text-[11px] mono" style={{ color: "var(--text-3)" }}>Risk Score: {d.riskScore}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
