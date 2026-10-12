import React, { useState } from "react";
import type { Screen } from "../types";
import { outcomeTone } from "../components/severity";
import { cases } from "../data/mock";

interface Props { onNavigate: (s: Screen) => void; }

const TOTAL = 128;
const COUNTS = { success: 104, partial: 18, failed: 5, harmful: 1 };
const TREND_FAILED = [8, 7, 6, 5];
const TREND_HARMFUL = [0, 1, 0, 1];

function TrendSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 40, h = 14;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(" ");
  const down = data[data.length - 1] <= data[data.length - 2];
  return (
    <div className="flex items-center gap-1.5">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
        <polyline points={pts} stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
        <circle cx={(data.length - 1) * step} cy={h - (data[data.length - 1] / max) * (h - 2) - 1} r="1.8" fill={color} />
      </svg>
      <span className="mono text-[10.5px]" style={{ color: down ? "var(--success)" : "var(--critical)" }}>
        {down ? "↓" : "↑"} wk
      </span>
    </div>
  );
}

function CBRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="11.5" width="10" height="2.2" rx="0.7" stroke="var(--text-3)" strokeWidth="1" />
      <rect x="2" y="8" width="10" height="2.2" rx="0.7" stroke="var(--text-3)" strokeWidth="1" />
      <rect x="2" y="4.5" width="10" height="2.2" rx="0.7" stroke="var(--text-3)" strokeWidth="1" />
      <circle cx="4.8" cy="5.6" r="0.65" fill="var(--text-3)" />
      <path d="M13 9.5C15.5 9.5 16 8 16 6.5 16 5 15.5 3.5 13 3.5" stroke="var(--lime)" strokeWidth="1" strokeLinecap="round" />
      <path d="M13.2 3.5L11.5 2.5M13.2 3.5l-1.7 1" stroke="var(--lime)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBar() {
  const segs = [
    { key: "success", count: COUNTS.success, color: "#1E3A28", label: "Resolved", text: "var(--text-3)", alert: false },
    { key: "partial", count: COUNTS.partial, color: "#4A3410", label: "Partial", text: "var(--text-3)", alert: false },
    { key: "failed", count: COUNTS.failed, color: "#7A2020", label: "Failed", text: "#FCA5A5", alert: true },
    { key: "harmful", count: COUNTS.harmful, color: "#FF5A5A", label: "Harmful", text: "#FF5A5A", alert: true },
  ];
  const MIN_PCT = 7;
  const extra = 100 - segs.length * MIN_PCT;
  const widths = segs.map((s) => MIN_PCT + (s.count / TOTAL) * extra);

  return (
    <div>
      <div className="mb-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
        {segs.map((s, i) => (
          <div key={s.key} style={{ width: `${widths[i]}%`, background: s.color, borderRadius: 2 }} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {segs.map((s) => (
          <div
            key={s.key}
            className="rounded-md px-3 pt-2.5 pb-2"
            style={{
              borderTop: `2px solid ${s.color}`,
              background: s.key === "harmful" ? "var(--critical-bg)" : s.key === "failed" ? "rgba(255,90,90,0.05)" : "transparent",
            }}
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <span className="t-label" style={{ color: s.alert ? s.text : "var(--text-4)" }}>{s.label}</span>
              {s.key === "failed" && <TrendSparkline data={TREND_FAILED} color="#FCA5A5" />}
              {s.key === "harmful" && <TrendSparkline data={TREND_HARMFUL} color="#FF5A5A" />}
            </div>
            <div className="mono text-[24px] font-bold leading-none" style={{ color: s.alert ? s.text : "var(--text)" }}>
              {s.count}
            </div>
            <div className="mt-1 text-[11.5px] text-[var(--text-4)]">
              {((s.count / TOTAL) * 100).toFixed(s.count < 10 ? 1 : 0)}% of {TOTAL}
            </div>
            {s.alert && (
              <div className="mt-1 text-[11px]" style={{ color: "var(--text-4)" }}>
                {s.key === "harmful" ? "caused adverse effect" : "no containment"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function multiStep(response: string) {
  return response.includes("+");
}

function OutcomeDisplay({ outcome, response }: { outcome: string; response: string }) {
  const cl = multiStep(response) ? "multi-step negotiation" : "single-tool action";
  const tone = outcomeTone(outcome);
  const label = outcome === "PARTIAL" ? "Partial containment" : outcome === "SUCCESS" ? "Resolved" : "Failed";
  return (
    <div>
      <div className="text-[13.5px] font-medium" style={{ color: tone.text }}>{label}</div>
      <div className="mt-0.5 text-[12px] text-[var(--text-4)]">{cl}</div>
    </div>
  );
}

function TrustCell({ uses, reliability }: { uses: number; reliability: number }) {
  const tier =
    reliability >= 88 ? { label: "HIGH", color: "var(--success)" }
    : reliability >= 75 ? { label: "MED", color: "var(--warning)" }
    : { label: "LOW", color: "var(--critical)" };
  const filled = Math.round(((uses / 16) * reliability) / 100 * 16);
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0">
        <div className="flex items-baseline gap-1">
          <span className="mono text-[17px] font-semibold text-[var(--text)]">{uses}</span>
          <span className="text-[12px] text-[var(--text-4)]">× verified</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="mono text-[12px] font-medium" style={{ color: tier.color }}>{tier.label}</span>
          <span className="text-[12px] text-[var(--text-4)]">· {reliability}%</span>
        </div>
      </div>
      <div className="mt-1 flex max-w-[32px] flex-wrap gap-[3px]">
        {Array.from({ length: Math.min(uses, 12) }).map((_, i) => (
          <span
            key={i}
            className="h-[5px] w-[5px] rounded-full"
            style={{ background: i < filled ? "var(--border-3)" : "var(--surface-4)" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CaseMemory({ onNavigate }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="panel mb-5">
          <div className="panel-body">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)" }}
                  aria-hidden
                >
                  <CBRIcon />
                </div>
                <div>
                  <div className="t-label mb-0.5">Case-Based Reasoning Memory</div>
                  <div className="t-h3 text-[var(--text)]">Case Memory Bank</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHow((v) => !v)}
                  aria-expanded={showHow}
                  className="badge ml-1 transition-colors"
                  style={{
                    background: "transparent",
                    borderColor: "var(--border)",
                    color: "var(--text-3)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M5.5 5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="5.5" cy="3.3" r="0.55" fill="currentColor" />
                  </svg>
                  how this works
                </button>
              </div>

              <div className="text-right">
                <div className="mono text-[40px] font-bold leading-none tracking-tight text-[var(--text)]">{TOTAL}</div>
                <div className="mt-1 text-[13px] text-[var(--text-4)]">validated cases in memory</div>
                <div className="mt-1.5 flex items-center justify-end gap-2">
                  <span className="mono text-[19px] font-semibold text-[var(--text)]">81.3%</span>
                  <span className="text-[13px] text-[var(--text-4)]">full resolution rate</span>
                  <span
                    className="mono rounded px-1.5 py-0.5 text-[10.5px]"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-4)" }}
                  >
                    resolved ÷ total
                  </span>
                </div>
              </div>
            </div>

            {showHow && (
              <div
                className="animate-in fade-in mb-5 rounded-lg px-4 py-3.5"
                style={{ background: "var(--well)", border: "1px solid var(--border)" }}
              >
                <p className="max-w-[720px] text-[13.5px] leading-relaxed text-[var(--text-3)]">
                  When a new attack arrives, the controller retrieves the most similar past case by comparing attack type, device context, and severity. If the match confidence exceeds threshold, the stored response is reused directly — bypassing full agent investigation and cutting median TTC from ~60 s to ~14 s. Cases accumulate with each resolved incident and are weighted by outcome reliability over time.
                </p>
              </div>
            )}

            <StatusBar />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="t-label">Validated Case Records — most recently activated first</span>
          <span className="text-[12.5px] text-[var(--text-4)]">Click a row to inspect match evidence and reuse history</span>
        </div>

        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[130px]">Case ID</th>
                  <th>Attack Vector</th>
                  <th>Device Context</th>
                  <th>Response Action</th>
                  <th className="w-[150px]">Outcome</th>
                  <th className="w-[170px]">Trust</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, idx) => (
                  <tr key={c.id} className="table-row-hover" onClick={() => onNavigate("case-detail")}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-7 w-[3px] shrink-0 rounded-full"
                          style={{ background: "var(--border-2)" }}
                          aria-hidden
                        />
                        <span>
                          <span className="mono block text-[13px] font-semibold" style={{ color: "var(--violet)" }}>{c.id}</span>
                          <span className="mono mt-0.5 block text-[11.5px] text-[var(--text-4)]">entry {TOTAL - idx}</span>
                        </span>
                      </div>
                    </td>
                    <td className="font-medium text-[var(--text-2)]">{c.attack}</td>
                    <td className="text-[var(--text-4)]">{c.device}</td>
                    <td>
                      <div className="text-[13.5px] text-[var(--text-3)]">{c.response}</div>
                      <span
                        className="mt-1.5 inline-block rounded-sm px-1.5 py-0.5 text-[11.5px]"
                        style={{
                          background: "var(--surface-3)",
                          border: "1px solid var(--border)",
                          color: "var(--text-4)",
                        }}
                      >
                        {multiStep(c.response) ? "multi-step" : "single-tool"}
                      </span>
                    </td>
                    <td>
                      <OutcomeDisplay outcome={c.outcome} response={c.response} />
                    </td>
                    <td>
                      <TrustCell uses={c.uses} reliability={c.reliability} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mono mt-4 text-center text-[12px] text-[var(--text-4)]">
          Showing {cases.length} of {TOTAL} cases · trust = validated-uses × outcome-weighted reliability · sorted by last activation
        </p>
      </div>
    </div>
  );
}