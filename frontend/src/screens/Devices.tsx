import React, { useState, useMemo } from "react";
import type { Screen } from "../types";
import Field from "../components/Field";
import { severityTone } from "../components/severity";
import { devices } from "../data/mock";

interface Props { onNavigate: (s: Screen) => void; }

function DeviceIcon({ type }: { type: string }) {
  const isGateway = type.toLowerCase().includes("gateway");
  const isBroker = type.toLowerCase().includes("broker");
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)" }}
      aria-hidden
    >
      {isGateway && (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="var(--text-3)" strokeWidth="1.3">
          <rect x="2" y="5" width="14" height="8" rx="2" />
          <path d="M6 13v2M12 13v2" strokeLinecap="round" />
        </svg>
      )}
      {isBroker && (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="var(--text-3)" strokeWidth="1.3">
          <circle cx="9" cy="9" r="4" />
          <path d="M9 1v4M9 13v4M1 9h4M13 9h4" strokeLinecap="round" />
        </svg>
      )}
      {!isGateway && !isBroker && (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="var(--text-3)" strokeWidth="1.3">
          <path d="M4 9c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
          <circle cx="9" cy="9" r="2" />
        </svg>
      )}
    </div>
  );
}

function BaselineMeter({ baseline }: { baseline: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
        <div className="h-full w-3/5 rounded-full" style={{ background: "var(--lime)" }} />
      </div>
      <span className="mono shrink-0 text-[11.5px] text-[var(--text-4)]">{baseline}</span>
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
      d = d.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.ip.includes(q) ||
          x.type.toLowerCase().includes(q),
      );
    }
    if (filterCrit !== "All") d = d.filter((x) => x.criticality === filterCrit);
    return d;
  }, [search, filterCrit]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Device Inventory</h1>
            <p className="page-sub">Discovered clinical and infrastructure devices · Demonstration data</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm">Export Inventory</button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Field label="Search devices" className="w-full max-w-[320px]">
            {(p) => (
              <input
                {...p}
                type="search"
                placeholder="Search devices by name, IP, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map((c) => {
              const on = filterCrit === c;
              const sv = c !== "All" ? severityTone(c) : null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCrit(c)}
                  className="filter-chip"
                  style={{
                    background: on && sv ? sv.bg : on ? "var(--surface-4)" : "transparent",
                    color: on && sv ? sv.text : on ? "var(--text)" : "var(--text-3)",
                    borderColor: on && sv ? sv.line : on ? "var(--border-3)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-14 text-center text-[14px] text-[var(--text-4)]">
              No devices match your search criteria.
            </div>
          ) : (
            filtered.map((d) => {
              const sv = severityTone(d.criticality);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onNavigate("device-detail")}
                  className="card flex flex-col p-5 text-left transition-colors duration-200 hover:border-[var(--border-3)] hover:bg-[var(--surface-2)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <DeviceIcon type={d.type} />
                      <span>
                        <span className="block text-[15px] font-semibold text-[var(--text)]">{d.name}</span>
                        <span className="mono block text-[12px] text-[var(--text-4)]">{d.ip}</span>
                      </span>
                    </div>
                    <span className="badge shrink-0" style={{ background: sv.bg, color: sv.text, borderColor: sv.line }}>
                      {d.criticality}
                    </span>
                  </div>

                  <div className="mb-4 flex-1 space-y-3">
                    <div>
                      <div className="t-label mb-0.5">Clinical Role</div>
                      <div className="text-[13px] leading-tight text-[var(--text-2)]">{d.clinicalRole}</div>
                    </div>
                    <div>
                      <div className="t-label mb-0.5">Hardware</div>
                      <div className="text-[13px] text-[var(--text-2)]">
                        {d.manufacturer} {d.model}
                      </div>
                    </div>
                    <div>
                      <div className="t-label mb-1.5">Telemetry Baseline</div>
                      <BaselineMeter baseline={d.baseline} />
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between border-t pt-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="dot"
                        style={{ background: d.status === "Online" ? "var(--success)" : "var(--danger)" }}
                        aria-hidden
                      />
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: d.status === "Online" ? "var(--success)" : "var(--danger)" }}
                      >
                        {d.status}
                      </span>
                    </span>
                    <span className="mono text-[11.5px] text-[var(--text-4)]">Risk Score: {d.riskScore}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}