import React, { useState } from "react";
import type { Screen } from "../types";
import Field from "../components/Field";

interface Props { onNavigate: (s: Screen) => void; }

const REPORT_TYPES = [
  { id: "incidents", label: "Incident Summary", blurb: "Every detected incident with severity, route, and outcome." },
  { id: "compliance", label: "Compliance (HIPAA)", blurb: "Detection and response activity mapped to HIPAA security controls." },
  { id: "devices",    label: "Asset Risk Posture", blurb: "Criticality, risk score, and open vulnerabilities per device." },
  { id: "audit",      label: "Full Audit Export", blurb: "Complete hash-chained record of every analyst action." },
];

const TIME_RANGES = [
  { id: "24h",    label: "Last 24 Hours" },
  { id: "7d",     label: "Last 7 Days" },
  { id: "30d",    label: "Last 30 Days" },
  { id: "custom", label: "Custom Range..." },
];

export default function Reports({ onNavigate }: Props) {
  const [reportType, setReportType] = useState("incidents");
  const [timeRange, setTimeRange] = useState("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const active = REPORT_TYPES.find((r) => r.id === reportType)!;
  const range = TIME_RANGES.find((r) => r.id === timeRange)!;

  function OptionGroup({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: { id: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="panel p-4">
        <div className="t-label mb-3">{label}</div>
        <div className="space-y-1" role="group" aria-label={label}>
          {options.map((o) => {
            const on = value === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onChange(o.id)}
                role="radio"
                aria-checked={on}
                className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2 text-left transition-colors"
                style={{
                  background: on ? "var(--surface-3)" : "transparent",
                  color: on ? "var(--text)" : "var(--text-3)",
                  border: `1px solid ${on ? "var(--border-2)" : "transparent"}`,
                }}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    border: `1.5px solid ${on ? "var(--lime)" : "var(--border-3)"}`,
                    background: on ? "var(--lime)" : "transparent",
                    boxShadow: on ? "inset 0 0 0 2px var(--surface-3)" : "none",
                  }}
                  aria-hidden
                />
                <span className="text-[13.5px] font-medium">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page max-w-[1200px]">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reports &amp; Export</h1>
            <p className="page-sub">Generate compliance reports and export incident data.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-4">
            <OptionGroup label="Report Type" options={REPORT_TYPES} value={reportType} onChange={setReportType} />
            <OptionGroup label="Time Range" options={TIME_RANGES} value={timeRange} onChange={setTimeRange} />

            {timeRange === "custom" && (
              <div className="panel animate-in fade-in p-4">
                <div className="t-label mb-3">Custom Range</div>
                <div className="space-y-3.5">
                  <Field label="From" hint="Start of the reporting window.">
                    {(p) => <input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}
                  </Field>
                  <Field label="To" hint="End of the reporting window.">
                    {(p) => <input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}
                  </Field>
                </div>
              </div>
            )}
          </div>

          <div className="panel flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
            <div
              className="mb-6 flex h-16 w-16 items-center justify-center rounded-[12px]"
              style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
              aria-hidden
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>

            <h2 className="t-h2 mb-2 text-[var(--text)]">Report Preview</h2>
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <span className="badge badge-lime">{active.label}</span>
              <span className="badge badge-neutral">{range.label}</span>
            </div>
            <p className="mb-2 max-w-[360px] text-[13.5px] leading-relaxed text-[var(--text-3)]">{active.blurb}</p>
            <p className="mono mb-8 max-w-[380px] text-[12px] text-[var(--text-4)]">
              Generating a &apos;{reportType}&apos; report for the selected time range. The export will be available in
              CSV and PDF formats.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="btn btn-secondary px-6">Preview</button>
              <button type="button" className="btn btn-primary px-6">Export PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}