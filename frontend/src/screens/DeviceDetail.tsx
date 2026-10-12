import React, { useState } from "react";
import type { Screen } from "../types";
import { severityClass, severityTone } from "../components/severity";
import { devices, incidents } from "../data/mock";

interface Props { onNavigate: (s: Screen) => void; }

export default function DeviceDetail({ onNavigate }: Props) {
  const d = devices[0];
  const [tab, setTab] = useState<"overview" | "incidents">("overview");
  const sv = severityTone(d.criticality);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => onNavigate("devices")}
            className="mb-3 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
          >
            ← Back to Inventory
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <h1 className="text-[24px] font-bold tracking-tight text-[var(--text)]">{d.name}</h1>
                <span className={`badge ${severityClass(d.criticality)}`}>{d.criticality} Asset</span>
                <span
                  className="badge"
                  style={{
                    background: d.status === "Online" ? "var(--low-bg)" : "var(--critical-bg)",
                    borderColor: d.status === "Online" ? "var(--low-line)" : "var(--critical-line)",
                    color: d.status === "Online" ? "var(--success)" : "var(--critical)",
                  }}
                >
                  {d.status}
                </span>
              </div>
              <div className="mono mt-2 text-[13px] text-[var(--text-4)]">
                IP: {d.ip} · MAC: {d.macAddress}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary btn-sm" disabled>
                Isolate Network
              </button>
            </div>
          </div>
        </div>

        <div className="tab-nav mb-6">
          {(["overview", "incidents"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              role="tab"
              aria-selected={tab === t}
            >
              {t === "overview" ? "Asset Overview" : "Associated Incidents"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <div className="panel">
                <div className="panel-head">
                  <h2>Device Profile</h2>
                </div>
                <div className="panel-body grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: "Device Type", value: d.type },
                    { label: "Clinical Role", value: d.clinicalRole },
                    { label: "Hardware Manufacturer", value: d.manufacturer },
                    { label: "Model", value: d.model },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="t-label mb-1">{f.label}</div>
                      <div className="text-[14px] text-[var(--text)]">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel flex h-[250px] flex-col">
                <div className="panel-head">
                  <h2>Network Topology (Simulated)</h2>
                </div>
                <div className="panel-body flex flex-1 items-center justify-center">
                  <div
                    className="flex w-full items-center justify-center rounded-lg border border-dashed"
                    style={{ borderColor: "var(--border-2)", background: "var(--well)" }}
                  >
                    <div className="text-center">
                      <svg
                        width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="var(--text-4)" strokeWidth="1.4" className="mx-auto mb-2" aria-hidden
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                      <div className="text-[12.5px] text-[var(--text-4)]">Connected to VLAN-40 (Medical IoT)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="panel">
                <div className="panel-body flex flex-col items-center justify-center py-8 text-center">
                  <div className="t-label mb-2">Calculated Risk Score</div>
                  <div className="mono text-[38px] font-bold leading-none" style={{ color: sv.text }}>
                    {d.riskScore}
                  </div>
                  <div className="mt-2 max-w-[220px] text-[12.5px] leading-relaxed text-[var(--text-4)]">
                    Based on criticality, vulnerabilities, and recent incidents.
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>Open Vulnerabilities</h2>
                </div>
                <div className="panel-body space-y-3">
                  <div className="flex gap-2">
                    <span className="badge sev-high shrink-0">CVE-2023-XXXX</span>
                    <span className="text-[12.5px] leading-tight text-[var(--text-2)]">
                      MQTT Broker authentication bypass in underlying OS library.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge sev-medium shrink-0">CVE-2022-YYYY</span>
                    <span className="text-[12.5px] leading-tight text-[var(--text-2)]">
                      Weak default credentials on administration interface.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "incidents" && (
          <div className="table-wrap">
            <div className="overflow-x-auto">
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
                  {incidents
                    .filter((i) => i.target.includes(d.name))
                    .map((inc) => (
                      <tr key={inc.id} className="cursor-pointer" onClick={() => onNavigate("incident-overview")}>
                        <td className="mono font-semibold text-[var(--text)]">{inc.id}</td>
                        <td className="text-[var(--text-2)]">{inc.attack}</td>
                        <td>
                          <span className={`badge ${severityClass(inc.criticality)}`}>{inc.criticality}</span>
                        </td>
                        <td className="text-[var(--text-3)]">{inc.status}</td>
                        <td className="mono text-[var(--text-4)]">{inc.time}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}