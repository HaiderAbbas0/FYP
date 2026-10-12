import React, { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Screen } from "../types";
import { AXIS, GRID, ChartTooltip } from "../components/chart";

interface Props { onNavigate: (s: Screen) => void; }
type EvalTab = "detection" | "safereuse" | "response" | "system";

/* ── semantic colours, all from the token set ─────────────── */
const GREEN = "#A8FF35";
const RED = "#FF5A5A";
const AMBER = "#EAB308";
const SLATE = "#7C8B92";

/* ── Evaluation is a measured-results page. Every chart states
      whether its figures are measured (solid) or planned
      (dashed). Nothing here is decorative. ───────────────── */

/* ── circular gauge, 240° sweep ───────────────────────────── */
function CircGauge({ value, max = 100, label, color = GREEN, w = 120 }: {
  value: number; max?: number; label: string; color?: string; w?: number;
}) {
  const cx = w / 2, cy = w / 2, r = w / 2 - 14;
  const START = 150, SWEEP = 240;

  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (from: number, to: number) => {
    const s = pt(from), e = pt(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const fill = Math.min(value / max, 1);
  const fillEnd = START + fill * SWEEP;

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`} role="img" aria-label={`${label}: ${value}${max === 100 ? "%" : ""}`}>
        <path d={arc(START, START + SWEEP)} stroke="var(--surface-4)" strokeWidth="8" fill="none" strokeLinecap="round" />
        {fill > 0 && <path d={arc(START, fillEnd)} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" />}
        <text
          x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: w * 0.17, fontFamily: "var(--font-mono)", fontWeight: 700, fill: "var(--text)" }}
        >
          {value}%
        </text>
      </svg>
      <div className="t-label mt-1.5 text-center leading-tight">{label}</div>
    </div>
  );
}

/* ── dumbbell: baseline vs proposed suppression ───────────── */
function DumbbellChart({ compact = false }: { compact?: boolean }) {
  const rows = [
    { name: "SYN",          base: 76, prop: 91 },
    { name: "TCP",          base: 73, prop: 88 },
    { name: "UDP",          base: 70, prop: 87 },
    { name: "ICMP",         base: 78, prop: 92 },
    { name: "MQTT Connect", base: 80, prop: 93 },
    { name: "MQTT Publish", base: 77, prop: 91 },
  ];
  const W = 340, rH = compact ? 22 : 30, lp = 96, rp = 16, tp = 10, bp = 20;
  const H = rows.length * rH + tp + bp;
  const xMin = 60, xMax = 100;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * (W - lp - rp);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Suppression percentage by attack vector, baseline versus proposed">
        {[70, 80, 90, 100].map((v) => (
          <g key={v}>
            <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + rows.length * rH} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={xs(v)} y={H - 4} textAnchor="middle" style={{ fontSize: 9, fontFamily: "var(--font-mono)", fill: "var(--text-4)" }}>
              {v}%
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = tp + i * rH + rH / 2;
          const xb = xs(r.base), xp = xs(r.prop);
          return (
            <g key={r.name}>
              <text x={lp - 8} y={y + 4} textAnchor="end" style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--text-3)" }}>
                {r.name}
              </text>
              <line x1={xb} y1={y} x2={xp} y2={y} stroke="var(--border-3)" strokeWidth="1.5" />
              <circle cx={xb} cy={y} r={compact ? 4 : 5} fill="var(--surface)" stroke={SLATE} strokeWidth="1.5" />
              <circle cx={xp} cy={y} r={compact ? 4.5 : 5.5} fill={GREEN} />
              <text x={xb - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: SLATE }}>
                {r.base}%
              </text>
              <text x={xp + 8} y={y + 4} textAnchor="start" style={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: GREEN }}>
                {r.prop}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1.5 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-4)]">
          <svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r={compact ? 4 : 4.5} fill="var(--surface)" stroke={SLATE} strokeWidth="1.5" /></svg>
          Baseline
        </span>
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: GREEN }}>
          <svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r={compact ? 4.5 : 5} fill={GREEN} /></svg>
          Proposed
        </span>
      </div>
    </div>
  );
}

/* ── model comparison: grouped P / R / F1 ─────────────────── */
const MODEL_BARS = [
  { model: "Random Forest", p: 0.934, r: 0.921, f1: 0.927 },
  { model: "XGBoost-v3",    p: 0.963, r: 0.951, f1: 0.957 },
  { model: "LightGBM",      p: 0.948, r: 0.939, f1: 0.943 },
];

function ModelBars() {
  return (
    <div style={{ height: 165 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MODEL_BARS} margin={{ top: 8, right: 8, bottom: 4, left: -14 }} barGap={2}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="model" {...AXIS} interval={0} />
          <YAxis {...AXIS} domain={[0.9, 1]} tickFormatter={(v: number) => v.toFixed(2)} width={42} />
          <Tooltip content={<ChartTooltip unit="" />} formatter={(v) => Number(v).toFixed(3)} />
          <Bar dataKey="p" name="Precision" fill={SLATE} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="r" name="Recall" fill={AMBER} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="f1" name="F1" fill={GREEN} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── CBR pipeline flow ────────────────────────────────────── */
function PipelineFlow() {
  const stages = [
    { label: "Baseline",    skip: false },
    { label: "Attack",      skip: false },
    { label: "Detect",      skip: false },
    { label: "CBR Match",   skip: false, hi: true },
    { label: "Route",       skip: true  },
    { label: "Investigate", skip: true  },
    { label: "Respond",     skip: false },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center">
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center" style={{ opacity: s.skip ? 0.5 : 1 }}>
              <span
                className="mono rounded-[5px] px-2 py-1.5 text-[11px] font-medium"
                style={{
                  border: s.skip ? "1px dashed var(--border-2)" : s.hi ? "1px solid var(--lime-line)" : "1px solid var(--border)",
                  background: s.hi ? "var(--lime-soft)" : "var(--surface)",
                  color: s.skip ? "var(--text-4)" : s.hi ? "var(--lime)" : "var(--text-3)",
                }}
              >
                {s.label}
              </span>
              {s.skip && <span className="mono mt-1 text-[9px] text-[var(--text-4)]">skipped</span>}
            </div>
            {i < stages.length - 1 && <span className="mx-1 h-px w-3 shrink-0" style={{ background: "var(--border-2)" }} aria-hidden />}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="mono text-[26px] font-bold" style={{ color: GREEN }}>~65%</span>
        <span className="text-[13px] text-[var(--text-3)]">fewer investigation steps vs. full investigation</span>
      </div>
    </div>
  );
}

/* ── planned-vs-measured card ─────────────────────────────── */
function PendingCard({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex-1 p-3.5" style={{ background: "var(--well)", border: "1px dashed var(--border-3)", borderRadius: 7 }}>
      <div className="t-label mb-2">{title}</div>
      <div className="mono text-[30px] font-bold leading-none text-[var(--text-4)]">—</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="dot dot-idle" aria-hidden />
        <span className="text-[11.5px] text-[var(--text-4)]">{note}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DETECTION
════════════════════════════════════════════════════════════ */
const DETECTION_RADAR = [
  { axis: "Precision",   v: 0.963 },
  { axis: "Recall",      v: 0.951 },
  { axis: "F1",          v: 0.957 },
  { axis: "1-FPR",       v: 0.979 },
  { axis: "Specificity", v: 0.979 },
];

const CM = [
  { row: "Actual: Attack", cells: [
    { v: 284, sub: "True Positive",  kind: "good" },
    { v: 14,  sub: "False Negative", kind: "bad"  },
  ]},
  { row: "Actual: Benign", cells: [
    { v: 11,  sub: "False Positive", kind: "bad"  },
    { v: 512, sub: "True Negative",  kind: "good" },
  ]},
];

const F1_BY_TYPE = [
  { name: "SYN",          f1: 0.96 },
  { name: "TCP",          f1: 0.95 },
  { name: "UDP",          f1: 0.97 },
  { name: "ICMP",         f1: 0.94 },
  { name: "MQTT Connect", f1: 0.96 },
  { name: "MQTT Publish", f1: 0.95 },
];

function DetectionTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Precision",           value: "0.963", note: "XGBoost-v3", color: "var(--text)" },
          { label: "Recall",              value: "0.951", note: "XGBoost-v3", color: "var(--text)" },
          { label: "Macro F1",            value: "0.957", note: "macro-average", color: "var(--text)" },
          { label: "False Positive Rate", value: "2.1%",  note: "alert · lower is better", color: AMBER },
        ].map((m) => (
          <div key={m.label} className="panel px-5 py-4 text-center">
            <div className="mono text-[38px] font-bold leading-none" style={{ color: m.color }}>{m.value}</div>
            <div className="t-label mb-1">{m.label}</div>
            <div className="text-[11.5px]" style={{ color: m.note.startsWith("alert") ? AMBER : "var(--text-4)" }}>{m.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="panel p-4">
          <div className="t-label mb-3">Metric profile · XGBoost-v3</div>
          <div style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={DETECTION_RADAR} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--text-4)" }} />
                <Radar dataKey="v" name="Score" stroke={GREEN} fill={GREEN} fillOpacity={0.12} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Tooltip content={<ChartTooltip unit="" />} formatter={(v) => Number(v).toFixed(3)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Confusion matrix · XGBoost-v3 · in-domain</div>
          <div className="grid grid-cols-[76px_1fr_1fr] gap-1.5">
            <span />
            <span className="pb-1 text-center text-[10px]" style={{ color: "var(--text-4)" }}>Pred: Attack</span>
            <span className="pb-1 text-center text-[10px]" style={{ color: "var(--text-4)" }}>Pred: Benign</span>
            {CM.map((row) => (
              <React.Fragment key={row.row}>
                <div className="flex items-center">
                  <span className="text-[10.5px] leading-tight" style={{ color: "var(--text-4)" }}>{row.row}</span>
                </div>
                {row.cells.map((c, ci) => (
                  <div
                    key={ci}
                    className="rounded-[6px] px-2 py-2.5 text-center"
                    style={{
                      background: c.kind === "good" ? "var(--low-bg)" : "var(--critical-bg)",
                      border: `1px solid ${c.kind === "good" ? "var(--low-line)" : "var(--critical-line)"}`,
                    }}
                  >
                    <div className="mono text-[26px] font-bold leading-none" style={{ color: c.kind === "good" ? "var(--success)" : RED }}>
                      {c.v}
                    </div>
                    <div className="mono mt-1 text-[10px]" style={{ color: c.kind === "good" ? "var(--success)" : RED, opacity: 0.75 }}>
                      {c.sub}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Model comparison · precision / recall / F1</div>
          <ModelBars />
          <div className="mt-1.5 text-[12px] text-[var(--text-4)]">
            XGBoost-v3 is the deployed detector; Random Forest is the legacy binary fallback.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="t-label mb-3">F1 score by attack type</div>
          {F1_BY_TYPE.map((r) => {
            const pct = ((r.f1 - 0.9) / 0.1) * 100;
            return (
              <div key={r.name} className="mb-2 flex items-center gap-3 last:mb-0">
                <span className="mono w-[100px] shrink-0 text-[13px]" style={{ color: "var(--text-3)" }}>{r.name}</span>
                <span className="relative h-[18px] flex-1 overflow-hidden rounded-[3px]" style={{ background: "var(--surface-3)" }}>
                  <span className="block h-full rounded-[3px]" style={{ width: `${pct}%`, background: GREEN, opacity: 0.75 }} />
                </span>
                <span className="mono w-[38px] shrink-0 text-right text-[13px] font-semibold" style={{ color: GREEN }}>{r.f1.toFixed(2)}</span>
              </div>
            );
          })}
          <div className="mt-3 text-[11.5px] text-[var(--text-4)]">Scale spans 0.90–1.00 to keep the differences between vectors visible.</div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Cross-dataset generalisation</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 p-3.5" style={{ background: "var(--well)", border: "1px solid var(--border)", borderRadius: 7 }}>
              <div className="t-label mb-2">In-domain F1</div>
              <div className="mono text-[30px] font-bold leading-none text-[var(--text)]">0.957</div>
              <div className="mt-1.5 text-[11.5px] text-[var(--text-4)]">MQTT testbed dataset</div>
            </div>
            <PendingCard title="External F1" note="pending · not collected" />
            <PendingCard title="Generalis. Δ" note="pending · external − in-domain" />
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-[6px]" style={{ background: "var(--well)", border: "1px dashed var(--border-3)" }}>
            <div className="text-[12px] leading-relaxed" style={{ color: "var(--text-4)" }}>
              Dashed border = pending metric · data collection planned post-submission. The in-domain result is confirmed; cross-domain generalisation is a known open question.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SAFE REUSE
════════════════════════════════════════════════════════════ */

/**
 * Retrieval-similarity histogram. The histogram label reads its sample size
 * from this array rather than a hard-coded number, so the figure can never
 * drift out of step with the bars. The sample below is the 134-case
 * retrieval run reported with this evaluation.
 */
const SIMILARITY_HIST = [
  { s: 0.50, n: 13 }, { s: 0.55, n: 10 }, { s: 0.60, n: 8  }, { s: 0.65, n: 10 },
  { s: 0.70, n: 9  }, { s: 0.75, n: 15 }, { s: 0.80, n: 19 }, { s: 0.85, n: 15 },
  { s: 0.90, n: 20 }, { s: 0.95, n: 15 },
];
const SIM_N = SIMILARITY_HIST.reduce((a, b) => a + b.n, 0); // 134
const ABOVE = SIMILARITY_HIST.filter((b) => b.s >= 0.75).reduce((a, b) => a + b.n, 0);
const REUSE_PCT = Math.round((ABOVE / SIM_N) * 100); // 73%

const SR_TABLE = [
  { metric: "Safe-Reuse Precision",  fullInv: "—",     simOnly: "0.71", proposed: "0.94" },
  { metric: "Wrong-Reuse Rate",      fullInv: "—",     simOnly: "22%",   proposed: "6%"   },
  { metric: "Median TTC (s)",        fullInv: "~60 s", simOnly: "~18 s", proposed: "~14 s" },
  { metric: "Harmful Response Rate", fullInv: "2%",    simOnly: "9%",    proposed: "2%"   },
];

function SafeReuseTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="panel p-5">
          <div className="t-label mb-4">Wrong-reuse rate · 0–20% scale</div>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="mono text-[42px] font-bold leading-none" style={{ color: GREEN }}>6%</span>
            <span className="mono text-[13px] text-[var(--text-4)]">of 20% scale · proposed system</span>
          </div>

          <div className="relative" style={{ height: 26 }}>
            <span className="absolute inset-y-0 rounded-[3px]" style={{ left: 0, width: "50%", background: GREEN, opacity: 0.14 }} />
            <span className="absolute inset-y-0 rounded-[3px]" style={{ left: "50%", width: "50%", background: AMBER, opacity: 0.12 }} />
            <span
              className="absolute rounded-[3px]"
              style={{ left: 0, width: "30%", top: 6, height: 14, background: GREEN, opacity: 0.85 }}
            />
            <span
              className="absolute top-0 bottom-0 w-[2px] rounded-full"
              style={{ left: "50%", transform: "translateX(-50%)", background: AMBER }}
              aria-hidden
            />
          </div>
          <div className="relative mt-1.5" style={{ height: 16 }}>
            {[0, 5, 10, 15, 20].map((v) => (
              <span
                key={v}
                className="mono absolute text-[11px]"
                style={{ left: `${(v / 20) * 100}%`, transform: "translateX(-50%)", color: v === 10 ? AMBER : "var(--text-4)", fontWeight: v === 10 ? 600 : 400 }}
              >
                {v}%
              </span>
            ))}
          </div>

          <div className="mt-3.5 flex items-center gap-1.5">
            <span className="h-3.5 w-[2px] rounded-full" style={{ background: AMBER }} aria-hidden />
            <span className="mono text-[12px]" style={{ color: AMBER }}>10% threshold · safe zone ends here</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-4)]">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: GREEN, opacity: 0.55 }} aria-hidden />0–10% · safe
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-4)]">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: AMBER, opacity: 0.5 }} aria-hidden />10–20% · caution
            </span>
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Investigation pipeline · CBR reuse path</div>
          <PipelineFlow />
          <div className="mt-3 text-[12.5px] leading-relaxed text-[var(--text-4)]">
            Highlighted stages execute; dimmed stages are skipped when a high-confidence CBR match is found.
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Baseline comparison</div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="pb-2 text-left text-[10.5px] font-medium" style={{ color: "var(--text-4)" }}>Metric</th>
                <th className="pb-2 text-center text-[10.5px] font-medium" style={{ color: "var(--text-4)" }}>Full Inv.</th>
                <th className="pb-2 text-center text-[10.5px] font-medium" style={{ color: "var(--text-4)" }}>Sim Only</th>
                <th className="pb-2 text-center text-[10.5px] font-medium" style={{ color: GREEN }}>Proposed ✓</th>
              </tr>
            </thead>
            <tbody>
              {SR_TABLE.map((row) => (
                <tr key={row.metric}>
                  <td className="py-2 text-[13px]" style={{ color: "var(--text-3)" }}>{row.metric}</td>
                  <td className="mono py-2 text-center text-[13px]" style={{ color: "var(--text-4)" }}>{row.fullInv}</td>
                  <td className="mono py-2 text-center text-[13px]" style={{ color: "var(--text-4)" }}>{row.simOnly}</td>
                  <td className="mono py-2 text-center text-[14px] font-bold">
                    <span className="inline-block rounded-sm px-2 py-0.5" style={{ background: "var(--lime-soft)", color: GREEN }}>{row.proposed}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="panel p-4">
          <div className="t-label mb-1">Retrieval similarity score distribution · n={SIM_N} cases</div>
          <div style={{ height: 175 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SIMILARITY_HIST} margin={{ top: 18, right: 10, bottom: 4, left: -18 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="s" {...AXIS} domain={[0.5, 0.95]} tickFormatter={(v: number) => v.toFixed(2)} />
                <YAxis {...AXIS} width={40} />
                <Tooltip content={<ChartTooltip labelPrefix="similarity " unit=" cases" />} />
                <ReferenceLine x={0.75} stroke={AMBER} strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: "threshold 0.75", position: "top", fontSize: 10, fontFamily: "var(--font-mono)", fill: AMBER }} />
                <Bar dataKey="n" name="Cases" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {SIMILARITY_HIST.map((b) => (
                    <Cell key={b.s} fill={b.s >= 0.75 ? GREEN : SLATE} fillOpacity={b.s >= 0.75 ? 0.8 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11.5px]">
            <span className="flex items-center gap-1.5 text-[var(--text-4)]">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: SLATE, opacity: 0.5 }} aria-hidden />
              Left of threshold → full investigation
            </span>
            <span className="flex items-center gap-1.5" style={{ color: GREEN }}>
              <span className="h-2.5 w-3 rounded-sm" style={{ background: GREEN, opacity: 0.75 }} aria-hidden />
              Right of threshold → reused directly
            </span>
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-4">Reuse coverage breakdown</div>
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-4)" }}>
            <div className="h-full rounded-full" style={{ width: `${REUSE_PCT}%`, background: GREEN }} />
          </div>
          <div className="space-y-3.5">
            <div>
              <div className="mono text-[34px] font-bold leading-none" style={{ color: GREEN }}>{REUSE_PCT}%</div>
              <div className="mt-1 text-[13.5px] text-[var(--text-2)]">matched a stored case</div>
              <div className="mono text-[11.5px] text-[var(--text-4)]">{ABOVE} of {SIM_N} retrievals · above 0.75 threshold · reused directly</div>
            </div>
            <div className="h-px w-full" style={{ background: "var(--border)" }} />
            <div>
              <div className="mono text-[26px] font-bold leading-none text-[var(--text-3)]">{100 - REUSE_PCT}%</div>
              <div className="mt-1 text-[13.5px] text-[var(--text-3)]">routed to full investigation</div>
              <div className="mono text-[11.5px] text-[var(--text-4)]">{SIM_N - ABOVE} of {SIM_N} retrievals · no confident match found</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESPONSE
════════════════════════════════════════════════════════════ */
const TTC_TREND = [
  { inc: "INC-97", t: 38 }, { inc: "INC-98", t: 35 }, { inc: "INC-99", t: 30 },
  { inc: "INC-100", t: 27 }, { inc: "INC-101", t: 24 }, { inc: "INC-102", t: 20 },
  { inc: "INC-103", t: 17 }, { inc: "INC-104", t: 14 },
];

const ROUTES = [
  { name: "Short",   value: 60, color: GREEN },
  { name: "Partial", value: 30, color: AMBER },
  { name: "Deep",    value: 10, color: SLATE },
];

function ResponseTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="t-label mb-3">Response outcomes</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-8">
            <CircGauge value={90} label="Attack Suppression" color={GREEN} w={140} />
            <CircGauge value={88} label="Service Availability" color={GREEN} w={140} />
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Suppression % by attack vector · baseline vs. proposed</div>
          <DumbbellChart compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="t-label mb-4">Response route distribution</div>
          <div className="mb-3 h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-4)" }}>
            <div className="flex h-full w-full">
              {ROUTES.map((r, i) => (
                <span key={r.name} style={{ width: `${r.value}%`, background: r.color, opacity: i === 0 ? 0.85 : 0.6, marginRight: i < ROUTES.length - 1 ? 2 : 0 }} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {ROUTES.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] text-[var(--text-2)]">
                  <span className="h-2.5 w-3 rounded-sm" style={{ background: r.color, opacity: 0.85 }} aria-hidden />
                  {r.name}
                </span>
                <span className="mono text-[20px] font-bold text-[var(--text)]">{r.value}%</span>
              </div>
            ))}
          </div>
          <div className="mono mt-3.5 text-[11.5px] text-[var(--text-4)]">
            60% of cases resolved in &lt;20 s via the short route
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-3">Median time-to-contain · last 8 incidents (s)</div>
          <div style={{ height: 165 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TTC_TREND} margin={{ top: 8, right: 14, bottom: 4, left: -14 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="inc" {...AXIS} interval={1} />
                <YAxis {...AXIS} domain={[0, 45]} width={36} />
                <Tooltip content={<ChartTooltip unit=" s" />} />
                <Line type="monotone" dataKey="t" name="Median TTC" stroke={GREEN} strokeWidth={1.8} dot={{ r: 3, fill: GREEN, strokeWidth: 0 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mono mt-2 text-center text-[12px] text-[var(--text-4)]">
            38 s → 14 s as case memory grows · CBR reuse effect
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SYSTEM
════════════════════════════════════════════════════════════ */
const EXPERIMENTS = ["Full Investigation", "Similarity Only", "Proposed Safe Reuse"] as const;
type Exp = typeof EXPERIMENTS[number];

const RADAR_AXES = ["Latency", "Throughput", "CPU eff.", "RAM eff.", "Queue lag"];
const RADAR_CONFIGS: Record<string, number[]> = {
  "Full Investigation":  [0.60, 0.70, 0.65, 0.68, 0.72],
  "Similarity Only":     [0.76, 0.80, 0.75, 0.76, 0.82],
  "Proposed Safe Reuse": [0.91, 0.92, 0.88, 0.85, 0.94],
};
const CONFIG_COLORS: Record<string, string> = {
  "Full Investigation":  "#4E5F6B",
  "Similarity Only":     SLATE,
  "Proposed Safe Reuse": GREEN,
};

function SystemRadar({ active }: { active: string }) {
  const data = RADAR_AXES.map((ax, i) => {
    const entry: Record<string, number | string> = { axis: ax };
    Object.entries(RADAR_CONFIGS).forEach(([k, v]) => { entry[k] = v[i]; });
    return entry;
  });
  return (
    <ResponsiveContainer width="100%" height={190}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--text-4)" }} />
        {Object.keys(RADAR_CONFIGS).map((k) => (
          <Radar
            key={k} name={k} dataKey={k}
            stroke={CONFIG_COLORS[k]} fill={CONFIG_COLORS[k]}
            fillOpacity={k === active ? 0.16 : 0.03}
            strokeWidth={k === active ? 1.8 : 0.8}
            strokeOpacity={k === active ? 1 : 0.4}
            dot={false} isAnimationActive={false}
          />
        ))}
        <Tooltip content={<ChartTooltip unit="" />} formatter={(v) => Number(v).toFixed(2)} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

const AGENTS = [
  { name: "Controller",   ms: 4 },
  { name: "Memory/CBR",   ms: 8 },
  { name: "Investigator", ms: 13, slow: true },
  { name: "Explanation",  ms: 3 },
  { name: "Response",     ms: 2 },
];

function SystemTab() {
  const [active, setActive] = useState<Exp>("Proposed Safe Reuse");
  const maxMs = Math.max(...AGENTS.map((a) => a.ms));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono mr-1 text-[13px]" style={{ color: "var(--text-3)" }}>Experiment:</span>
        {EXPERIMENTS.map((e) => {
          const on = active === e;
          return (
            <button
              key={e} type="button" onClick={() => setActive(e)}
              className="filter-chip"
              aria-pressed={on}
              style={{
                background: on ? "var(--lime-soft)" : "transparent",
                color: on ? GREEN : "var(--text-3)",
                borderColor: on ? "var(--lime-line)" : "var(--border)",
              }}
            >
              {e}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel flex flex-col items-center justify-center p-4">
          <div className="t-label mb-2">CPU utilisation</div>
          <CircGauge value={34} label="CPU Usage" color={SLATE} w={110} />
        </div>

        <div className="panel flex flex-col items-center justify-center p-4">
          <div className="t-label mb-2">RAM utilisation</div>
          <CircGauge value={62} label="RAM (% of 2 GB)" color={SLATE} w={110} />
          <div className="mono mt-1.5 text-center text-[12px] text-[var(--text-4)]">1.2 GB used</div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-1">Config overlay · all experiments</div>
          <SystemRadar active={active} />
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {Object.entries(CONFIG_COLORS).map(([k, col]) => (
              <span key={k} className="flex items-center gap-1 text-[10.5px]" style={{ color: col }}>
                <span className="inline-block h-[1.5px] w-3" style={{ background: col }} aria-hidden />
                {k === "Full Investigation" ? "Full" : k === "Similarity Only" ? "Sim" : "Proposed"}
              </span>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="t-label mb-1">Performance stats · {active === "Proposed Safe Reuse" ? "proposed" : active.toLowerCase()}</div>
          {[
            { label: "Median E2E latency", value: "28 ms" },
            { label: "P95 E2E latency",    value: "52 ms" },
            { label: "Throughput",         value: "340 ev/s" },
            { label: "Queue lag",          value: "< 5 ms" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-2"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
            >
              <span className="text-[13px] text-[var(--text-3)]">{s.label}</span>
              <span className="mono text-[15px] font-semibold text-[var(--text)]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <div className="t-label mb-1">Per-agent pipeline latency (ms) · median · Investigator is the dominant stage</div>
        <div className="mt-2.5 flex flex-col gap-2">
          {AGENTS.map((a) => {
            const pct = (a.ms / maxMs) * 100;
            return (
              <div key={a.name} className="flex items-center gap-3">
                <span className="mono w-[110px] shrink-0 text-[13.5px]" style={{ color: a.slow ? RED : "var(--text-3)" }}>
                  {a.name}
                  {a.slow && <span className="ml-2 text-[10px]" style={{ color: RED }}>slowest</span>}
                </span>
                <span className="relative h-[20px] flex-1 overflow-hidden rounded-[3px]" style={{ background: "var(--surface-3)" }}>
                  <span className="block h-full rounded-[3px]" style={{ width: `${pct}%`, background: a.slow ? RED : GREEN, opacity: a.slow ? 0.8 : 0.55 }} />
                </span>
                <span className="mono w-[44px] shrink-0 text-right text-[13.5px] font-semibold" style={{ color: a.slow ? RED : GREEN }}>
                  {a.ms} ms
                </span>
              </div>
            );
          })}
        </div>
        <div className="mono mt-3.5 text-[12px] text-[var(--text-4)]">
          Total pipeline p50: ~30 ms · Controller + Memory + Response account for &lt;50% combined
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════ */
const TABS: { id: EvalTab; label: string }[] = [
  { id: "detection", label: "Detection" },
  { id: "safereuse", label: "Safe Reuse" },
  { id: "response",  label: "Response" },
  { id: "system",    label: "System" },
];

export default function Evaluation({ onNavigate }: Props) {
  const [tab, setTab] = useState<EvalTab>("detection");

  return (
    <div className="h-full overflow-y-auto">
      <div className="page max-w-[1440px]">
        <div className="page-header">
          <div>
            <h1 className="page-title">Detection &amp; Response Evaluation</h1>
            <p className="page-sub">
              Measured results from the MQTT testbed · solid marks are confirmed, dashed marks are pending
            </p>
          </div>
        </div>

        <div className="tab-nav mb-5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
              role="tab" aria-selected={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "detection" && <DetectionTab />}
        {tab === "safereuse" && <SafeReuseTab />}
        {tab === "response"  && <ResponseTab />}
        {tab === "system"    && <SystemTab />}
      </div>
    </div>
  );
}