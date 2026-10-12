import React from "react";
import type { Screen } from "../types";
import { OutcomeBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";

interface Props { onNavigate: (s: Screen) => void; }

const REUSE_HISTORY = [
  { date: "2026-09-05 14:02", incident: "INC-104", outcome: "SUCCESS", adapted: true },
  { date: "2026-09-04 09:18", incident: "INC-097", outcome: "SUCCESS", adapted: false },
  { date: "2026-09-03 16:45", incident: "INC-091", outcome: "PARTIAL", adapted: true },
  { date: "2026-09-02 11:30", incident: "INC-085", outcome: "SUCCESS", adapted: false },
];

const SUMMARY = [
  { label: "Attack Vector", value: "MQTT Connect Flood" },
  { label: "Attack Mode", value: "DDoS" },
  { label: "Device Type", value: "Patient Monitor Gateway" },
  { label: "Device Criticality", value: "Critical" },
  { label: "Recommended Response", value: "Rate Limiting + Source Block" },
  { label: "Executed Response", value: "MQTT Rate Limiting (120s)" },
  { label: "Outcome", value: "SUCCESS" },
  { label: "Containment Time", value: "14 seconds" },
];

const METRICS = [
  { label: "Validated Attempts", value: "12", color: "var(--text)" },
  { label: "Successful", value: "10", color: "var(--success)" },
  { label: "Partial", value: "1", color: "var(--warning)" },
  { label: "Failure", value: "1", color: "var(--critical)" },
  { label: "Harmful", value: "0", color: "var(--text-4)" },
  { label: "Historical Reliability", value: "84%", color: "var(--success)" },
];

const TAGS = ["MQTT", "DDoS", "Gateway", "Critical", "Rate Limiting", "Multi-Source"];

export default function CaseDetail({ onNavigate }: Props) {
  const reliability = 84;
  const successCount = 10;
  const partialCount = 1;
  const total = 12;

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="mono text-[38px] font-bold leading-none" style={{ color: "var(--violet)" }}>CASE-128</span>
              <OutcomeBadge value="SUCCESS" />
            </div>
            <div className="text-[15px] text-[var(--text-4)]">
              MQTT DDoS · Gateway — Critical · Validated Experience Record
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onNavigate("case-memory")}>
            ← Case Memory
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="panel">
              <div className="panel-head">
                <h2>Case Summary</h2>
              </div>
              <div className="panel-body grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {SUMMARY.map((r) => (
                  <div key={r.label} className="border-b pb-2.5" style={{ borderColor: "var(--border)" }}>
                    <div className="t-label mb-1">{r.label}</div>
                    <div className="mono text-[15px] font-medium text-[var(--text)]">{r.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Reliability Evidence</h2>
              </div>
              <div className="panel-body">
                <div className="mb-4 flex h-20 items-end gap-1.5">
                  {Array.from({ length: total }, (_, i) => {
                    const isSuccess = i < successCount;
                    const isPartial = i < successCount + partialCount;
                    const color = isSuccess ? "var(--success)" : isPartial ? "var(--warning)" : "var(--critical)";
                    const h = isSuccess ? 75 : isPartial ? 45 : 20;
                    return <div key={i} className="flex-1 rounded-t-[3px]" style={{ height: h, background: color }} />;
                  })}
                </div>
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {[
                    { label: `Success (${successCount})`, color: "var(--success)" },
                    { label: `Partial (${partialCount})`, color: "var(--warning)" },
                    { label: `Failure (${total - successCount - partialCount})`, color: "var(--critical)" },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[13px]">
                      <span className="h-2 w-3 rounded-sm" style={{ background: l.color }} aria-hidden />
                      <span className="text-[var(--text-4)]">{l.label}</span>
                    </span>
                  ))}
                </div>
                <div className="border-t pt-3.5" style={{ borderColor: "var(--border)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13.5px] text-[var(--text-3)]">Historical Reliability</span>
                    <span className="mono text-[22px] font-bold text-[var(--text)]">{reliability}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                    <div className="h-full rounded-full" style={{ width: `${reliability}%`, background: "var(--success)" }} />
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-[var(--text-4)]">
                    Based on {total} validated attempts · evidence-bounded estimate
                  </div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Reuse History</h2>
              </div>
              <div className="panel-body">
                <div>
                  {REUSE_HISTORY.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 py-3"
                      style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                    >
                      <div className="flex w-1.5 shrink-0 flex-col items-center self-stretch">
                        <span
                          className="timeline-dot"
                          style={{ background: h.adapted ? "var(--violet)" : "var(--border-3)" }}
                          aria-hidden
                        />
                        {i < REUSE_HISTORY.length - 1 && <span className="timeline-line" aria-hidden />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="mono text-[13.5px] font-medium text-[var(--text)]">{h.incident}</span>
                          <OutcomeBadge value={h.outcome} />
                          {h.adapted && (
                            <span className="badge" style={{ background: "var(--violet-bg)", color: "var(--violet)", borderColor: "var(--violet-line)" }}>
                              Adapted
                            </span>
                          )}
                        </div>
                        <div className="mono text-[12px] text-[var(--text-4)]">{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel">
              <div className="panel-head">
                <h2>Validation Metrics</h2>
              </div>
              <div className="panel-body">
                {METRICS.map((r, i) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between py-2"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                  >
                    <span className="text-[13px] text-[var(--text-3)]">{r.label}</span>
                    <span className="mono text-[13.5px] font-semibold" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Context Tags</h2>
              </div>
              <div className="panel-body">
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-1 text-[12.5px] font-medium"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text-3)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}