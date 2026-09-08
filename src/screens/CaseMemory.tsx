import React, { useState } from "react";
import { cases } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const TOTAL = 128;
const COUNTS = { success: 104, partial: 18, failed: 5, harmful: 1 };

// Week-by-week harmful+failed combined (4 weeks, current = last value)
const TREND_FAILED  = [8, 7, 6, 5];   // failed cases per week
const TREND_HARMFUL = [0, 1, 0, 1];   // harmful cases per week

function TrendSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = 0;
  const w = 40, h = 14;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / (max - min)) * (h - 2) - 1}`).join(" ");
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const down = last <= prev;
  return (
    <div className="flex items-center gap-1.5">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <polyline points={pts} stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" fill="none"/>
        <circle cx={(data.length - 1) * step} cy={h - ((last - min) / (max - min)) * (h - 2) - 1} r="1.8" fill={color}/>
      </svg>
      <span className="text-[11px] mono" style={{ color: down ? "#4A6A4A" : "#C06060" }}>
        {down ? "↓" : "↑"} wk
      </span>
    </div>
  );
}

// CBR retrieve-and-reuse icon: stacked records + retrieval arrow loop
function CBRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="11.5" width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <rect x="2" y="8"   width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <rect x="2" y="4.5" width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <circle cx="4.8" cy="5.6" r="0.65" fill="#94A8BA"/>
      <path d="M13 9.5C15.5 9.5 16 8 16 6.5C16 5 15.5 3.5 13 3.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M13.2 3.5L11.5 2.5M13.2 3.5L11.5 4.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Status bar with minimum segment width so failed/harmful are always visible
function StatusBar() {
  const segs = [
    { key: "success", count: COUNTS.success, color: "#243024", label: "Resolved",  textColor: "#94A8BA", alert: false },
    { key: "partial", count: COUNTS.partial,  color: "#5C2E08", label: "Partial",   textColor: "#94A8BA", alert: false },
    { key: "failed",  count: COUNTS.failed,   color: "#7F1D1D", label: "Failed",    textColor: "#F87171", alert: true  },
    { key: "harmful", count: COUNTS.harmful,  color: "#EF4444", label: "Harmful",   textColor: "#EF4444", alert: true  },
  ];
  const MIN_PCT = 7;
  const extra = 100 - segs.length * MIN_PCT;
  const widths = segs.map(s => MIN_PCT + (s.count / TOTAL) * extra);

  return (
    <div>
      {/* Bar */}
      <div className="flex h-[7px] rounded-full overflow-hidden gap-[2px] w-full mb-3">
        {segs.map((s, i) => (
          <div key={s.key} style={{ width: `${widths[i]}%`, background: s.color, borderRadius: 2 }} />
        ))}
      </div>

      {/* Integrated legend + alert cells — connected to bar by top border color */}
      <div className="grid grid-cols-4 gap-1.5">
        {segs.map(s => (
          <div
            key={s.key}
            className="px-3 pt-2.5 pb-2 rounded-[6px]"
            style={{
              borderTop: `2px solid ${s.color}`,
              background: s.alert ? (s.key === "harmful" ? "#150808" : "#120505") : "transparent",
            }}
          >
            <div className="flex items-start justify-between mb-0.5">
              <div className="text-[11px] mono uppercase tracking-widest" style={{ color: s.alert ? s.textColor : "#94A8BA" }}>
                {s.label}
              </div>
              {s.key === "failed"  && <TrendSparkline data={TREND_FAILED}  color="#C06060" />}
              {s.key === "harmful" && <TrendSparkline data={TREND_HARMFUL} color="#EF4444" />}
            </div>
            <div className="text-[26px] font-bold leading-none" style={{ color: s.alert ? s.textColor : "#C8CEC8" }}>
              {s.count}
            </div>
            <div className="text-[11px] text-[#94A8BA] mt-0.5">
              {((s.count / TOTAL) * 100).toFixed(s.count < 10 ? 1 : 0)}% of {TOTAL}
            </div>
            {s.alert && (
              <div className="text-[11px] mt-1" style={{ color: s.key === "harmful" ? "#8A4040" : "#7A3030" }}>
                {s.key === "harmful" ? "caused adverse effect" : "no containment"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function responseComplexity(r: string): "multi" | "single" {
  return r.includes("+") ? "multi" : "single";
}

function OutcomeDisplay({ outcome, response }: { outcome: string; response: string }) {
  const cl = responseComplexity(response) === "multi" ? "multi-step negotiation" : "single-tool action";
  if (outcome === "SUCCESS") return (
    <div>
      <div className="text-[15px] text-[#94A8BA]">Resolved</div>
      <div className="text-[13px] text-[#94A8BA] mt-0.5">{cl}</div>
    </div>
  );
  if (outcome === "PARTIAL") return (
    <div>
      <div className="text-[15px] text-[#D97706]">Partial containment</div>
      <div className="text-[13px] text-[#94A8BA] mt-0.5">{cl}</div>
    </div>
  );
  return <div className="text-[15px] text-[#EF4444] font-medium">Failed</div>;
}

function TrustCell({ uses, reliability }: { uses: number; reliability: number }) {
  const tier = reliability >= 88 ? { label: "HIGH", color: "#94A8BA" }
    : reliability >= 75 ? { label: "MED", color: "#D97706" }
    : { label: "LOW", color: "#EF4444" };
  const filled = Math.round((uses / 16) * reliability / 100 * 16);
  return (
    <div className="flex items-start gap-3">
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] font-semibold text-[#C8CEC8]">{uses}</span>
          <span className="text-[13px] text-[#94A8BA]">× verified</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[13px] font-medium" style={{ color: tier.color }}>{tier.label}</span>
          <span className="text-[13px] text-[#94A8BA]">· {reliability}%</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-[3px] max-w-[30px] mt-0.5">
        {Array.from({ length: Math.min(uses, 12) }).map((_, i) => (
          <div key={i} className="w-[5px] h-[5px] rounded-full"
            style={{ background: i < filled ? "#2E3B2E" : "#1A1E1B" }}/>
        ))}
      </div>
    </div>
  );
}

export default function CaseMemory({ onNavigate }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">

        {/* ─── CBR Memory Header ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[14px] p-6 mb-6">

          {/* Top row: identity + key metrics */}
          <div className="flex items-start justify-between mb-5">
            {/* Left: title + info toggle */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#1A1E1B] border border-[#242924] flex items-center justify-center shrink-0">
                <CBRIcon />
              </div>
              <div>
                <div className="text-[11px] text-[#94A8BA] uppercase tracking-widest mb-0.5 mono">Case-Based Reasoning Memory</div>
                <div className="text-[19px] font-semibold text-[#E8EDE9]">Case Memory Bank</div>
              </div>
              <button
                onClick={() => setShowHow(v => !v)}
                title="How CBR retrieval works"
                className="ml-1 flex items-center gap-1 px-2 py-1 rounded-[5px] border border-[#1A1E1B] text-[#94A8BA] hover:text-[#C8CEC8] hover:border-[#2E342E] transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M5.5 5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="5.5" cy="3.3" r="0.55" fill="currentColor"/>
                </svg>
                <span className="text-[12px] mono">how this works</span>
              </button>
            </div>

            {/* Right: total + resolution rate */}
            <div className="text-right">
              <div className="text-[44px] font-bold text-[#E8EDE9] leading-none tracking-tight">128</div>
              <div className="text-[13px] text-[#94A8BA] mt-1">validated cases in memory</div>
              <div className="flex items-center justify-end gap-2 mt-1.5">
                <span className="text-[20px] font-semibold text-[#E8EDE9]">81.3%</span>
                <span className="text-[13px] text-[#94A8BA]">full resolution rate</span>
                <span className="text-[11px] mono text-[#94A8BA] bg-[#1A1E1B] border border-[#242924] px-1.5 py-0.5 rounded-[4px]">resolved ÷ total</span>
              </div>
            </div>
          </div>

          {/* Collapsible explanation */}
          {showHow && (
            <div className="mb-5 px-4 py-3 bg-[#111411] border border-[#1A1E1B] rounded-[8px]">
              <p className="text-[14px] text-[#94A8BA] leading-relaxed max-w-[720px]">
                When a new attack arrives, the controller retrieves the most similar past case by comparing attack type, device context, and severity. If the match confidence exceeds threshold, the stored response is reused directly — bypassing full agent investigation and cutting median TTC from ~60 s to ~14 s. Cases accumulate with each resolved incident and are weighted by outcome reliability over time.
              </p>
            </div>
          )}

          {/* Integrated status bar + legend + alert cells */}
          <StatusBar />
        </div>

        {/* ─── Table label ─── */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest">Validated Case Records — most recently activated first</div>
          <div className="text-[13px] text-[#94A8BA]">Click a row to inspect match evidence and reuse history</div>
        </div>

        {/* ─── Case Table ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                {[
                  ["Case ID", "w-[130px]"],
                  ["Attack Vector", ""],
                  ["Device Context", ""],
                  ["Response Action", ""],
                  ["Outcome", "w-[160px]"],
                  ["Trust", "w-[180px]"],
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-5 py-3.5 text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => (
                <tr
                  key={c.id}
                  className="border-b border-[#131613] hover:bg-[#111411] cursor-pointer transition-colors group"
                  onClick={() => onNavigate("case-detail")}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[3px] h-7 rounded-full bg-[#1E241E] group-hover:bg-[#2E362E] transition-colors shrink-0"/>
                      <div>
                        <div className="text-[14px] mono font-semibold text-[#9D8BF4] group-hover:text-[#B8ABFA] transition-colors">{c.id}</div>
                        <div className="text-[12px] text-[#94A8BA] mt-0.5">entry {TOTAL - idx}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[15px] text-[#C0C7C0] font-medium">{c.attack}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] text-[#94A8BA]">{c.device}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] text-[#A8B0A8]">{c.response}</div>
                    <div className="mt-1.5">
                      {responseComplexity(c.response) === "multi" ? (
                        <span className="text-[12px] text-[#94A8BA] bg-[#181C18] border border-[#242924] px-1.5 py-0.5 rounded-sm">multi-step</span>
                      ) : (
                        <span className="text-[12px] text-[#94A8BA] bg-[#131613] border border-[#1A1E1B] px-1.5 py-0.5 rounded-sm">single-tool</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <OutcomeDisplay outcome={c.outcome} response={c.response}/>
                  </td>
                  <td className="px-5 py-4">
                    <TrustCell uses={c.uses} reliability={c.reliability}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[13px] mono text-[#94A8BA] text-center">
          Showing {cases.length} of {TOTAL} cases · trust = validated-uses × outcome-weighted reliability · sorted by last activation
        </div>
      </div>
    </div>
  );
}
