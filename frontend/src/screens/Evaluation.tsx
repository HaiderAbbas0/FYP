import React, { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }
type EvalTab = "detection" | "safereuse" | "response" | "system";

/* ── palette ──────────────────────────────────────────────── */
const P = {
  bg:      "#0A0C0A",
  surface: "#0D100D",
  border:  "#1A1E1B",
  text:    "#E2E8E2",
  text2:   "#94A8BA",
  green:   "#4ADE80",
  greenDim:"#14532D",
  red:     "#EF4444",
  amber:   "#D97706",
};

/* ── shared primitives ────────────────────────────────────── */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0D100D] border border-[#1A1E1B] rounded-[10px] ${className}`}>
      {children}
    </div>
  );
}
function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] mono uppercase tracking-widest text-[#94A8BA] mb-3">{children}</div>;
}
function Num({ v, color, size = 36 }: { v: string; color?: string; size?: number }) {
  return (
    <span className="mono font-bold" style={{ fontSize: size, color: color ?? P.text, lineHeight: 1 }}>
      {v}
    </span>
  );
}

/* ── mathematically-accurate arc gauge ──────────────────────
   Uses trig that matches the printed value exactly.
   angleDeg(val) = 180 − (val/max)×180  (0→left, max→right, through top)
   SVG: x = cx + r·cos(θ), y = cy − r·sin(θ)  (y-flipped coord)
────────────────────────────────────────────────────────────── */
function svgPt(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function arcD(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const s = svgPt(cx, cy, r, fromDeg);
  const e = svgPt(cx, cy, r, toDeg);
  const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  // sweep-flag=0 → counter-clockwise in SVG (goes through the top)
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}
function valToDeg(val: number, min: number, max: number) {
  return 180 - ((val - min) / (max - min)) * 180;
}

/* ── circular arc gauge (full circle segment, for Response/System) ── */
function CircGauge({ value, max = 100, label, unit = "%", color = P.green, w = 120 }: {
  value: number; max?: number; label: string; unit?: string; color?: string; w?: number;
}) {
  const cx = w / 2, cy = w / 2, r = w / 2 - 14;
  // Sweep 240° starting at 150° (bottom-left) clockwise to 30° (bottom-right)
  // SVG clockwise: sweep-flag=1
  function circ(fromDeg: number, toDeg: number, _sweep: number) {
    const toR = (d: number) => (d * Math.PI) / 180;
    const s = { x: cx + r * Math.cos(toR(fromDeg)), y: cy + r * Math.sin(toR(fromDeg)) };
    const e = { x: cx + r * Math.cos(toR(toDeg)), y: cy + r * Math.sin(toR(toDeg)) };
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${_sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }
  const startDeg = 150, totalSweep = 240;
  const endDeg = startDeg + totalSweep;
  const fillPct = Math.min(value / max, 1);
  const fillEndDeg = startDeg + fillPct * totalSweep;
  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`}>
        <path d={circ(startDeg, endDeg, 1)} stroke="#1E241E" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {fillPct > 0 && <path d={circ(startDeg, fillEndDeg, 1)} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"/>}
        <text x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: w * 0.18, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fill: P.text }}>
          {value}{unit}
        </text>
      </svg>
      <div className="text-[12px] mono uppercase tracking-widest text-center" style={{ color: P.text2 }}>{label}</div>
    </div>
  );
}

/* ── semicircular gauge (0–20% scale, mathematically accurate) ──
   Angle: θ = 180 − (val/max)×180  (0% → 180° left, 20% → 0° right)
   SVG position: x = cx + r·cos(θ_rad), y = cy − r·sin(θ_rad)

   Sweep rules for the UPPER semicircle (going from high θ to low θ):
     Left half  (from 180° toward 90°): sweep-flag = 0  (CCW in SVG = upward)
     Right half (from 90°  toward 0° ): sweep-flag = 1  (CW  in SVG = rightward)
   Value fill (180° → needleDeg): sweep-flag = 0 always correct for any value.
────────────────────────────────────────────────────────────────── */
function SemiGauge({ value, maxVal = 20, label }: { value: number; maxVal?: number; label: string }) {
  const W = 260, H = 160;
  const cx = W / 2, cy = H - 24, r = 104;
  const sw = 14;

  function pt(deg: number, rr = r) {
    const rad = deg * Math.PI / 180;
    return { x: cx + rr * Math.cos(rad), y: cy - rr * Math.sin(rad) };
  }
  function arc(fromDeg: number, toDeg: number, sweep: 0 | 1) {
    const s = pt(fromDeg), e = pt(toDeg);
    const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const needleDeg = 180 - (value / maxVal) * 180;
  const fillColor = value <= maxVal * 0.5 ? "#16A34A" : "#D97706";

  // Needle geometry
  const tip  = pt(needleDeg, r - 8);
  const base1 = pt(needleDeg + 90, 9);
  const base2 = pt(needleDeg - 90, 9);

  // Threshold tick at 10% (= 90°)
  const tIn  = pt(90, r - 18);
  const tOut = pt(90, r + 14);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Track */}
        <path d={arc(180, 0, 0)} stroke="#1E241E" strokeWidth={sw} fill="none" strokeLinecap="round"/>
        {/* Green band 0–10% (180°→90°): sweep=0 */}
        <path d={arc(180, 90, 0)} stroke="#16A34A" strokeWidth={sw} fill="none" strokeLinecap="round" strokeOpacity="0.30"/>
        {/* Amber band 10–20% (90°→0°): sweep=1 — must use CW to stay in upper-right */}
        <path d={arc(90, 0, 1)} stroke="#D97706" strokeWidth={sw} fill="none" strokeLinecap="round" strokeOpacity="0.25"/>
        {/* Value fill (sweep=0 is correct for any needle position) */}
        <path d={arc(180, needleDeg, 0)} stroke={fillColor} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        {/* 10% threshold tick */}
        <line x1={tIn.x.toFixed(2)} y1={tIn.y.toFixed(2)} x2={tOut.x.toFixed(2)} y2={tOut.y.toFixed(2)}
          stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
        <text x={tOut.x} y={tOut.y - 6} textAnchor="middle"
          style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#D97706" }}>10%</text>
        {/* Scale labels */}
        {[0, 5, 10, 15, 20].map(v => {
          const p = pt(180 - (v / maxVal) * 180, r + 22);
          return (
            <text key={v} x={p.x.toFixed(2)} y={p.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#94A8BA" }}>{v}%</text>
          );
        })}
        {/* Needle */}
        <polygon
          points={`${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${base1.x.toFixed(2)},${base1.y.toFixed(2)} ${base2.x.toFixed(2)},${base2.y.toFixed(2)}`}
          fill={P.text} fillOpacity="0.92"/>
        <circle cx={cx} cy={cy} r="7" fill="#111511" stroke={P.text2} strokeWidth="1.5"/>
        {/* Centre value */}
        <text x={cx} y={cy - 24} textAnchor="middle"
          style={{ fontSize: 28, fontFamily: "JetBrains Mono", fontWeight: 700, fill: P.text }}>{value}%</text>
        <text x={cx} y={cy - 6} textAnchor="middle"
          style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "#94A8BA" }}>of {maxVal}% scale</text>
      </svg>
      <div className="text-[12px] mono uppercase tracking-widest text-center" style={{ color: P.text2 }}>{label}</div>
      <div className="flex items-center gap-4 mt-1.5">
        <span className="flex items-center gap-1.5 text-[12px]">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#16A34A", opacity: 0.7 }}/>
          <span style={{ color: P.text2 }}>safe ≤ 10%</span>
        </span>
        <span className="flex items-center gap-1.5 text-[12px]">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#D97706", opacity: 0.7 }}/>
          <span style={{ color: P.text2 }}>caution ≤ 20%</span>
        </span>
      </div>
    </div>
  );
}

/* ── lollipop chart ──────────────────────────────────────── */
function ModelLollipop() {
  const models = [
    { name: "Random Forest", f1: 0.944, sel: false },
    { name: "XGBoost-v3",   f1: 0.957, sel: true  },
    { name: "LightGBM",     f1: 0.938, sel: false },
  ];
  const W = 280, H = 160, lp = 108, rp = 20, tp = 14, bp = 22;
  const pw = W - lp - rp, rH = (H - tp - bp) / models.length;
  const xMin = 0.92, xMax = 0.97;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * pw;
  const grid = [0.93, 0.94, 0.95, 0.96];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {grid.map(v => (
        <g key={v}>
          <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + (H - tp - bp)} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
          <text x={xs(v)} y={H - 6} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v.toFixed(2)}</text>
        </g>
      ))}
      {models.map((m, i) => {
        const y = tp + i * rH + rH / 2;
        const x = xs(m.f1);
        const col = m.sel ? P.green : P.text2;
        return (
          <g key={m.name}>
            <text x={lp - 8} y={y + 4} textAnchor="end"
              style={{ fontSize: 11, fontFamily: m.sel ? "JetBrains Mono" : "inherit", fontWeight: m.sel ? 700 : 400, fill: m.sel ? P.text : P.text2 }}>
              {m.name}
            </text>
            <line x1={xs(xMin)} y1={y} x2={x} y2={y} stroke={col} strokeWidth={m.sel ? 1.5 : 1} strokeOpacity={m.sel ? 1 : 0.5}/>
            <circle cx={x} cy={y} r={m.sel ? 6 : 4} fill={m.sel ? P.green : "none"} stroke={col} strokeWidth="1.5"/>
            <text x={x + 10} y={y + 4} style={{ fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: m.sel ? 700 : 400, fill: col }}>
              {m.f1.toFixed(3)}
            </text>
            {m.sel && <text x={x + 48} y={y + 4} style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.green }}>← selected</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ── dumbbell chart (compact, for Response tab) ──────────── */
function DumbbellChartSmall() {
  const rows = [
    { name: "SYN",          base: 76, prop: 91 },
    { name: "TCP",          base: 73, prop: 88 },
    { name: "UDP",          base: 70, prop: 87 },
    { name: "ICMP",         base: 78, prop: 92 },
    { name: "MQTT Connect", base: 80, prop: 93 },
    { name: "MQTT Publish", base: 77, prop: 91 },
  ];
  const W = 340, rH = 22, lp = 90, rp = 12, tp = 6, bp = 16;
  const H = rows.length * rH + tp + bp;
  const xMin = 60, xMax = 100;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * (W - lp - rp);
  const grids = [70, 80, 90, 100];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {grids.map(v => (
          <g key={v}>
            <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + rows.length * rH} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
            <text x={xs(v)} y={H - 2} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v}%</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = tp + i * rH + rH / 2;
          const xb = xs(r.base), xp = xs(r.prop);
          return (
            <g key={r.name}>
              <text x={lp - 6} y={y + 3.5} textAnchor="end"
                style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.name}</text>
              <line x1={xb} y1={y} x2={xp} y2={y} stroke="#2A3A2A" strokeWidth="1.5"/>
              <circle cx={xb} cy={y} r="4" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/>
              <circle cx={xp} cy={y} r="4.5" fill={P.green}/>
              <text x={xb - 7} y={y + 3.5} textAnchor="end"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.base}%</text>
              <text x={xp + 7} y={y + 3.5} textAnchor="start"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.green }}>{r.prop}%</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: P.text2 }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/></svg>
          Baseline
        </span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: P.green }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill={P.green}/></svg>
          Proposed
        </span>
      </div>
    </div>
  );
}

/* ── dumbbell chart ──────────────────────────────────────── */
function DumbbellChart() {
  const rows = [
    { name: "SYN",          base: 76, prop: 91 },
    { name: "TCP",          base: 73, prop: 88 },
    { name: "UDP",          base: 70, prop: 87 },
    { name: "ICMP",         base: 78, prop: 92 },
    { name: "MQTT Connect", base: 80, prop: 93 },
    { name: "MQTT Publish", base: 77, prop: 91 },
  ];
  const W = 340, rH = 30, lp = 96, rp = 14, tp = 10, bp = 20;
  const H = rows.length * rH + tp + bp;
  const xMin = 60, xMax = 100;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * (W - lp - rp);
  const grids = [70, 80, 90, 100];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {grids.map(v => (
          <g key={v}>
            <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + rows.length * rH} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
            <text x={xs(v)} y={H - 4} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v}%</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = tp + i * rH + rH / 2;
          const xb = xs(r.base), xp = xs(r.prop);
          return (
            <g key={r.name}>
              <text x={lp - 8} y={y + 4} textAnchor="end"
                style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.name}</text>
              <line x1={xb} y1={y} x2={xp} y2={y} stroke="#2A3A2A" strokeWidth="1.5"/>
              <circle cx={xb} cy={y} r="5" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/>
              <circle cx={xp} cy={y} r="5.5" fill={P.green}/>
              <text x={xb - 8} y={y + 4} textAnchor="end"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.base}%</text>
              <text x={xp + 8} y={y + 4} textAnchor="start"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.green }}>{r.prop}%</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: P.text2 }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/></svg>
          Baseline
        </span>
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: P.green }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={P.green}/></svg>
          Proposed
        </span>
      </div>
    </div>
  );
}

/* ── pipeline flow ────────────────────────────────────────── */
function PipelineFlow() {
  const stages = [
    { id: "baseline",    label: "Baseline",    skip: false },
    { id: "attack",      label: "Attack",      skip: false },
    { id: "detect",      label: "Detect",      skip: false },
    { id: "cbr",         label: "CBR Match",   skip: false, hi: true },
    { id: "route",       label: "Route",       skip: true  },
    { id: "investigate", label: "Investigate", skip: true  },
    { id: "respond",     label: "Respond",     skip: false },
  ];
  return (
    <div>
      <div className="flex items-center gap-0 flex-wrap">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div style={{ opacity: s.skip ? 0.35 : 1 }} className="flex flex-col items-center">
              <div className="px-2 py-1.5 rounded-[5px] text-[11px] mono font-medium"
                style={{
                  border: s.skip ? "1px dashed #2A342A" : s.hi ? `1px solid ${P.green}` : "1px solid #1A1E1B",
                  background: s.hi ? "#0A1A0A" : "#0D100D",
                  color: s.skip ? "#4A5A4A" : s.hi ? P.green : P.text2,
                }}>
                {s.label}
              </div>
              {s.skip && <div className="text-[9px] mono mt-0.5" style={{ color: "#4A5A4A" }}>skipped</div>}
            </div>
            {i < stages.length - 1 && (
              <div className="w-3 h-px mx-0.5 shrink-0"
                style={{ background: "#2A342A", borderTop: stages[i + 1]?.skip ? "1px dashed #2A342A" : undefined }}/>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[24px] font-bold mono" style={{ color: P.green }}>~65%</span>
        <span className="text-[13px]" style={{ color: P.text2 }}>fewer investigation steps vs. full investigation</span>
      </div>
    </div>
  );
}

/* ── similarity histogram ─────────────────────────────────── */
function SimilarityHist() {
  const bins = [
    { range: "0.50–0.55", count: 2 },
    { range: "0.55–0.60", count: 4 },
    { range: "0.60–0.65", count: 8 },
    { range: "0.65–0.70", count: 14 },
    { range: "0.70–0.75", count: 18 },
    { range: "0.75–0.80", count: 22 },  // threshold at 0.75
    { range: "0.80–0.85", count: 28 },
    { range: "0.85–0.90", count: 20 },
    { range: "0.90–0.95", count: 12 },
    { range: "0.95–1.00", count: 6 },
  ];
  const W = 260, H = 120, lp = 28, rp = 10, tp = 8, bp = 28;
  const pw = W - lp - rp, ph = H - tp - bp;
  const bw = pw / bins.length;
  const maxC = Math.max(...bins.map(b => b.count));
  const threshIdx = 5; // "0.75–0.80" is index 5, threshold is at left edge = between idx 4 and 5
  const threshX = lp + threshIdx * bw;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {bins.map((b, i) => {
        const bh = (b.count / maxC) * ph;
        const x = lp + i * bw;
        const y = tp + ph - bh;
        const aboveThresh = i >= threshIdx;
        return (
          <g key={b.range}>
            <rect x={x + 1} y={y} width={bw - 2} height={bh}
              fill={aboveThresh ? P.green : "#2A3A2A"} fillOpacity={aboveThresh ? 0.7 : 0.4} rx="1"/>
          </g>
        );
      })}
      {/* Threshold line */}
      <line x1={threshX} y1={tp} x2={threshX} y2={tp + ph + 4} stroke={P.amber} strokeWidth="1.5" strokeDasharray="4 3"/>
      <text x={threshX + 3} y={tp + 10} style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.amber }}>threshold 0.75</text>
      {/* X axis labels */}
      {[0, 4, 9].map(i => (
        <text key={i} x={lp + i * bw + bw / 2} y={H - 4} textAnchor="middle"
          style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>
          {(0.50 + i * 0.05).toFixed(2)}
        </text>
      ))}
      <text x={lp + 10 * bw / 2} y={H - 4} textAnchor="middle"
        style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>1.00</text>
      {/* Y axis */}
      <text x={lp - 4} y={tp + 4} textAnchor="end" style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>{maxC}</text>
      <text x={lp - 4} y={tp + ph} textAnchor="end" style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>0</text>
      <line x1={lp} y1={tp} x2={lp} y2={tp + ph} stroke="#1A1E1B" strokeWidth="1"/>
    </svg>
  );
}

/* ── system radar ─────────────────────────────────────────── */
const RADAR_CONFIGS: Record<string, number[]> = {
  "Full Investigation":  [0.60, 0.70, 0.65, 0.68, 0.72],
  "Similarity Only":     [0.76, 0.80, 0.75, 0.76, 0.82],
  "Proposed Safe Reuse": [0.91, 0.92, 0.88, 0.85, 0.94],
};
const RADAR_AXES = ["Latency", "Throughput", "CPU eff.", "RAM eff.", "Queue lag"];
const CONFIG_COLORS: Record<string, string> = {
  "Full Investigation":  "#4A5A6A",
  "Similarity Only":     "#6A7A8A",
  "Proposed Safe Reuse": P.green,
};
function SystemRadar({ active }: { active: string }) {
  const data = RADAR_AXES.map((ax, i) => {
    const entry: Record<string, any> = { axis: ax };
    Object.entries(RADAR_CONFIGS).forEach(([k, v]) => { entry[k] = v[i]; });
    return entry;
  });
  return (
    <ResponsiveContainer width="100%" height={190}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#1A1E1B"/>
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}/>
        {Object.keys(RADAR_CONFIGS).map(k => (
          <Radar key={k} name={k} dataKey={k}
            stroke={CONFIG_COLORS[k]} fill={CONFIG_COLORS[k]}
            fillOpacity={k === active ? 0.16 : 0.03}
            strokeWidth={k === active ? 1.8 : 0.8}
            strokeOpacity={k === active ? 1 : 0.4}
            dot={false}/>
        ))}
        <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
          formatter={((v: any, name: any) => [typeof v === "number" ? v.toFixed(2) : v, name]) as any}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

const EXPERIMENTS = ["Full Investigation", "Similarity Only", "Proposed Safe Reuse"] as const;
type Exp = typeof EXPERIMENTS[number];

/* ════════════════════════════════════════════════════════════
   DETECTION TAB
════════════════════════════════════════════════════════════ */
const DETECTION_RADAR = [
  { axis: "Precision",   v: 0.963 },
  { axis: "Recall",      v: 0.951 },
  { axis: "F1",          v: 0.957 },
  { axis: "1-FPR",       v: 0.979 },
  { axis: "Specificity", v: 0.979 },
];

function DetectionTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Precision",           value: "0.963", warn: false, note: "XGBoost-v3" },
          { label: "Recall",              value: "0.951", warn: false, note: "XGBoost-v3" },
          { label: "Macro F1",            value: "0.957", warn: false, note: "macro-average" },
          { label: "False Positive Rate", value: "2.1%",  warn: true,  note: "lower is better" },
        ].map(m => (
          <Panel key={m.label} className="px-5 py-4 text-center">
            <div className="text-[40px] font-bold mono leading-none mb-2"
              style={{ color: m.warn ? P.red : P.text }}>{m.value}</div>
            <div className="text-[12px] mono uppercase tracking-widest mb-1" style={{ color: P.text2 }}>{m.label}</div>
            {m.warn
              ? <div className="text-[11px]" style={{ color: P.amber }}>alert · lower is better</div>
              : <div className="text-[11px]" style={{ color: P.text2 }}>{m.note}</div>}
          </Panel>
        ))}
      </div>

      {/* Row 2 — 3 panels */}
      <div className="grid grid-cols-3 gap-3">
        {/* Radar */}
        <Panel className="p-4">
          <SLabel>Metric profile · XGBoost-v3</SLabel>
          <div style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={DETECTION_RADAR} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke="#1A1E1B"/>
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}/>
                <Radar dataKey="v" stroke={P.green} fill={P.green} fillOpacity={0.12} strokeWidth={1.5} dot={false}/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [typeof v === "number" ? v.toFixed(3) : v, "Score"]) as any}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Confusion matrix */}
        <Panel className="p-4">
          <SLabel>Confusion matrix · XGBoost-v3 · in-domain</SLabel>
          <div className="grid grid-cols-[72px_1fr_1fr] gap-1">
            <div/>
            <div className="text-[10px] mono text-center pb-1" style={{ color: P.text2 }}>Pred: Attack</div>
            <div className="text-[10px] mono text-center pb-1" style={{ color: P.text2 }}>Pred: Benign</div>
            {[
              { row: "Actual: Attack", cells: [
                { v: 284, sub: "True Positive",  bg: "#0B1B0B", bc: "#1A341A", col: P.green },
                { v: 14,  sub: "False Negative", bg: "#1B0B0B", bc: "#341A1A", col: P.red },
              ]},
              { row: "Actual: Benign", cells: [
                { v: 11,  sub: "False Positive", bg: "#1B0B0B", bc: "#341A1A", col: P.red },
                { v: 512, sub: "True Negative",  bg: "#0B1B0B", bc: "#1A341A", col: P.green },
              ]},
            ].map(row => (
              <React.Fragment key={row.row}>
                <div className="flex items-center">
                  <span className="text-[10px] mono leading-tight" style={{ color: P.text2 }}>{row.row}</span>
                </div>
                {row.cells.map((c, ci) => (
                  <div key={ci} className="px-2 py-2.5 rounded-[6px] text-center"
                    style={{ background: c.bg, border: `1px solid ${c.bc}` }}>
                    <div className="text-[28px] font-bold mono leading-none" style={{ color: c.col }}>{c.v}</div>
                    <div className="text-[10px] mono mt-0.5" style={{ color: c.col, opacity: 0.7 }}>{c.sub}</div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Panel>

        {/* Lollipop */}
        <Panel className="p-4">
          <SLabel>Model comparison · F1 score</SLabel>
          <ModelLollipop/>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              { m: "RF",   p: 0.951, r: 0.939 },
              { m: "XGB",  p: 0.963, r: 0.951 },
              { m: "LGBM", p: 0.944, r: 0.932 },
            ].map(row => (
              <div key={row.m} className="px-2 py-1.5 rounded-[5px] text-center bg-[#0A0C0A] border border-[#1A1E1B]">
                <div className="text-[10px] mono mb-0.5" style={{ color: P.text2 }}>{row.m}</div>
                <div className="text-[11px] mono" style={{ color: P.text }}>P {row.p}</div>
                <div className="text-[11px] mono" style={{ color: P.text }}>R {row.r}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row 3 — 2 panels */}
      <div className="grid grid-cols-2 gap-3">
        {/* F1 per attack type */}
        <Panel className="p-4">
          <SLabel>F1 score by attack type</SLabel>
          {[
            { name: "SYN",          f1: 0.96 },
            { name: "TCP",          f1: 0.95 },
            { name: "UDP",          f1: 0.97 },
            { name: "ICMP",         f1: 0.94 },
            { name: "MQTT Connect", f1: 0.96 },
            { name: "MQTT Publish", f1: 0.95 },
          ].map(r => {
            const pct = ((r.f1 - 0.90) / 0.10) * 100;
            return (
              <div key={r.name} className="flex items-center gap-3 mb-2">
                <div className="w-[100px] text-[13px] mono shrink-0" style={{ color: P.text2 }}>{r.name}</div>
                <div className="flex-1 relative h-[18px] bg-[#0A0C0A] rounded-[3px] overflow-hidden">
                  <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: "#16A34A" }}/>
                </div>
                <div className="w-[38px] text-[13px] mono text-right font-semibold shrink-0" style={{ color: P.green }}>
                  {r.f1.toFixed(2)}
                </div>
              </div>
            );
          })}
        </Panel>

        {/* Cross-dataset generalization */}
        <Panel className="p-4">
          <SLabel>Cross-dataset generalization</SLabel>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-[7px] border border-[#1A1E1B] bg-[#0A0C0A]">
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: P.text2 }}>In-domain F1</div>
              <div className="text-[32px] font-bold mono" style={{ color: P.text }}>0.957</div>
              <div className="text-[11px] mt-1" style={{ color: P.text2 }}>MQTT testbed dataset</div>
            </div>
            <div className="p-3 rounded-[7px] bg-[#0A0C0A]" style={{ border: "1px dashed #3E4C3E" }}>
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>External F1</div>
              <div className="text-[32px] font-bold mono" style={{ color: "#94A3B8" }}>—</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"/>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>pending · not collected</span>
              </div>
            </div>
            <div className="p-3 rounded-[7px] bg-[#0A0C0A]" style={{ border: "1px dashed #3E4C3E" }}>
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>Generaliz. Δ</div>
              <div className="text-[32px] font-bold mono" style={{ color: "#94A3B8" }}>—</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"/>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>pending · external − in-domain</span>
              </div>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-[6px]" style={{ background: "#0A0C0A", border: "1px dashed #3E4C3E" }}>
            <div className="text-[12px] mono" style={{ color: "#94A3B8" }}>
              Dashed border = pending metric · data collection planned post-submission.
              In-domain result is confirmed; cross-domain generalisation is a known open question.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── bullet-graph KPI bar ─────────────────────────────────── */
interface BulletBand  { from: number; to: number; color: string; opacity: number; }
interface BulletThresh { at: number; label: string; color: string; }
function BulletBar({ value, maxVal, bands, thresholds, ticks }: {
  value: number; maxVal: number;
  bands: BulletBand[]; thresholds: BulletThresh[]; ticks: number[];
}) {
  const barH = 28, trackH = 14;
  const pct = (v: number) => `${(v / maxVal) * 100}%`;

  return (
    <div>
      {/* Big value readout */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[44px] font-bold mono leading-none" style={{ color: P.green }}>{value}%</span>
        <span className="text-[14px] mono" style={{ color: P.text2 }}>of {maxVal}% scale · proposed system</span>
      </div>

      {/* Bar track */}
      <div className="relative" style={{ height: barH }}>
        {/* Background bands */}
        {bands.map((b, i) => (
          <div key={i} className="absolute inset-y-0 rounded-[3px]"
            style={{
              left: pct(b.from), width: pct(b.to - b.from),
              background: b.color, opacity: b.opacity,
            }}/>
        ))}
        {/* Filled value bar — centered vertically, slimmer than track */}
        <div className="absolute rounded-[3px]"
          style={{
            left: 0, width: pct(value),
            top: (barH - trackH) / 2, height: trackH,
            background: value <= (thresholds[0]?.at ?? maxVal / 2) ? "#16A34A" : "#D97706",
          }}/>
        {/* Threshold ticks */}
        {thresholds.map(t => (
          <div key={t.at} className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: pct(t.at), transform: "translateX(-50%)" }}>
            <div className="w-[2px] h-full rounded-full" style={{ background: t.color }}/>
          </div>
        ))}
      </div>

      {/* Axis labels */}
      <div className="relative mt-1" style={{ height: 18 }}>
        {ticks.map(v => (
          <span key={v} className="absolute text-[11px] mono" style={{
            left: pct(v), transform: "translateX(-50%)", color: v === thresholds[0]?.at ? "#D97706" : P.text2,
            fontWeight: v === thresholds[0]?.at ? 600 : 400,
          }}>{v}%</span>
        ))}
      </div>

      {/* Threshold label below */}
      {thresholds.map(t => (
        <div key={t.at} className="flex items-center gap-1.5 mt-3">
          <div className="w-[2px] h-3.5 rounded-full" style={{ background: t.color }}/>
          <span className="text-[12px] mono" style={{ color: t.color }}>
            {t.label} threshold · safe zone ends here
          </span>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        {bands.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[12px]">
            <span className="w-3 h-3 rounded-[2px] inline-block" style={{ background: b.color, opacity: b.opacity * 2 }}/>
            <span style={{ color: P.text2 }}>
              {b.from}–{b.to}% {b.color === "#16A34A" ? "· safe" : "· caution"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SAFE REUSE TAB
════════════════════════════════════════════════════════════ */
const SR_TABLE = [
  { metric: "Safe-Reuse Precision",  fullInv: "—",     simOnly: "0.71", proposed: "0.94" },
  { metric: "Wrong-Reuse Rate",      fullInv: "—",     simOnly: "22%",  proposed: "6%"   },
  { metric: "Median TTC (s)",        fullInv: "~60 s", simOnly: "~18 s",proposed: "~14 s"},
  { metric: "Harmful Response Rate", fullInv: "2%",    simOnly: "9%",   proposed: "2%"   },
];

function SafeReuseTab() {
  const histData = [
    { s: 0.50, n: 22 }, { s: 0.55, n: 18 }, { s: 0.60, n: 14 }, { s: 0.65, n: 20 },
    { s: 0.70, n: 16 }, { s: 0.75, n: 28 }, { s: 0.80, n: 34 }, { s: 0.85, n: 26 },
    { s: 0.90, n: 20 }, { s: 0.95, n: 12 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-3">
        {/* Bullet-graph KPI bar */}
        <Panel className="p-5">
          <SLabel>Wrong-reuse rate · 0–20% scale</SLabel>
          <BulletBar value={6} maxVal={20} thresholds={[{ at: 10, label: "10%", color: "#D97706" }]}
            bands={[
              { from: 0,  to: 10, color: "#16A34A", opacity: 0.18 },
              { from: 10, to: 20, color: "#D97706", opacity: 0.13 },
            ]}
            ticks={[0, 5, 10, 15, 20]}
          />
        </Panel>

        {/* Pipeline flow */}
        <Panel className="p-4">
          <SLabel>Investigation pipeline · CBR reuse path</SLabel>
          <PipelineFlow/>
          <div className="mt-3 text-[12px]" style={{ color: P.text2 }}>
            Highlighted stages execute; grayed/dashed stages are skipped when a high-confidence CBR match is found.
          </div>
        </Panel>

        {/* Baseline comparison table */}
        <Panel className="p-4">
          <SLabel>Baseline comparison</SLabel>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                <th className="text-left pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Metric</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Full Inv.</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Sim Only</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.green }}>Proposed ✓</th>
              </tr>
            </thead>
            <tbody>
              {SR_TABLE.map(row => (
                <tr key={row.metric} className="border-b border-[#131613] last:border-0">
                  <td className="py-2 text-[13px]" style={{ color: P.text2 }}>{row.metric}</td>
                  <td className="py-2 text-center mono text-[13px]" style={{ color: P.text2 }}>{row.fullInv}</td>
                  <td className="py-2 text-center mono text-[13px]" style={{ color: P.text2 }}>{row.simOnly}</td>
                  <td className="py-2 text-center mono text-[14px] font-bold rounded-sm" style={{ color: P.green, background: "#0A1A0A" }}>
                    {row.proposed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Similarity histogram */}
        <Panel className="p-4">
          <SLabel>Retrieval similarity score distribution · n=134 cases</SLabel>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={histData.map(d => ({ x: d.s.toFixed(2), n: d.n }))}
                margin={{ top: 8, right: 12, bottom: 12, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1A1E1B" vertical={false}/>
                <XAxis dataKey="x" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <ReferenceLine x="0.75" stroke={P.amber} strokeWidth={1.5} strokeDasharray="5 3"
                  label={{ value: "threshold 0.75", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: P.amber }}/>
                <Line type="monotone" dataKey="n" stroke={P.green} strokeWidth={1.5} dot={{ r: 2.5, fill: P.green }} name="Cases"/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [v, "cases"]) as any}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 justify-center mt-1 text-[11px]">
            <span style={{ color: P.text2 }}>Left of threshold → full investigation</span>
            <span style={{ color: P.green }}>Right → reused directly</span>
          </div>
        </Panel>

        {/* Reuse coverage */}
        <Panel className="p-4">
          <SLabel>Reuse coverage breakdown</SLabel>
          <div className="flex items-center gap-6">
            <div style={{ height: 160, width: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: 73 }, { v: 27 }]} dataKey="v" cx="50%" cy="50%"
                    innerRadius={46} outerRadius={68} startAngle={90} endAngle={-270}
                    strokeWidth={0}>
                    <Cell fill="#16A34A" fillOpacity={0.85}/>
                    <Cell fill="#1A1E1B"/>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-[36px] font-bold mono leading-none" style={{ color: P.green }}>73%</div>
                <div className="text-[13px] mt-0.5" style={{ color: P.text2 }}>matched a stored case</div>
                <div className="text-[11px] mono" style={{ color: P.text2 }}>above 0.75 threshold · reused directly</div>
              </div>
              <div className="w-full h-px bg-[#1A1E1B]"/>
              <div>
                <div className="text-[28px] font-bold mono leading-none" style={{ color: P.text2 }}>27%</div>
                <div className="text-[13px] mt-0.5" style={{ color: P.text2 }}>routed to full investigation</div>
                <div className="text-[11px] mono" style={{ color: P.text2 }}>no confident match found</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESPONSE TAB
════════════════════════════════════════════════════════════ */
const TTC_TREND = [
  { inc: "INC-97", t: 38 }, { inc: "INC-98", t: 35 }, { inc: "INC-99", t: 30 },
  { inc: "INC-100", t: 27 }, { inc: "INC-101", t: 24 }, { inc: "INC-102", t: 20 },
  { inc: "INC-103", t: 17 }, { inc: "INC-104", t: 14 },
];

const DONUT_ROUTES = [
  { name: "Short",   value: 60, color: "#16A34A" },
  { name: "Partial", value: 30, color: "#D97706" },
  { name: "Deep",    value: 10, color: "#5A5A8A" },
];

function ResponseTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — gauges get half, dumbbell gets other half */}
      <div className="grid grid-cols-2 gap-3">
        {/* 2 gauges — larger, properly anchored */}
        <Panel className="p-5">
          <SLabel>Response outcomes</SLabel>
          <div className="flex items-center justify-center gap-10 mt-2">
            <CircGauge value={90} label="Attack Suppression" color={P.green} w={140}/>
            <CircGauge value={88} label="Service Availability" color={P.green} w={140}/>
          </div>
        </Panel>

        {/* Dumbbell chart — condensed row height */}
        <Panel className="p-4">
          <SLabel>Suppression % by attack vector · baseline vs. proposed</SLabel>
          <DumbbellChartSmall/>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Donut — route distribution */}
        <Panel className="p-4">
          <SLabel>Response route distribution</SLabel>
          <div className="flex items-center gap-6">
            <div style={{ height: 160, width: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONUT_ROUTES} dataKey="value" cx="50%" cy="50%"
                    innerRadius={44} outerRadius={66} startAngle={90} endAngle={-270} strokeWidth={2} stroke="#0D100D">
                    {DONUT_ROUTES.map((r, i) => <Cell key={i} fill={r.color} fillOpacity={0.8}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    formatter={((v: any, name: any) => [typeof v === "number" ? `${v}%` : v, name]) as any}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {DONUT_ROUTES.map(r => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }}/>
                    <span className="text-[14px]" style={{ color: P.text2 }}>{r.name}</span>
                  </div>
                  <span className="text-[20px] font-bold mono" style={{ color: P.text }}>{r.value}%</span>
                </div>
              ))}
              <div className="text-[11px] mono mt-2" style={{ color: P.text2 }}>
                60% of cases resolved in &lt;20 s via short route
              </div>
            </div>
          </div>
        </Panel>

        {/* TTC trend */}
        <Panel className="p-4">
          <SLabel>Median time-to-contain · last 8 incidents (s)</SLabel>
          <div style={{ height: 165 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TTC_TREND} margin={{ top: 8, right: 16, bottom: 12, left: -8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1A1E1B" vertical={false}/>
                <XAxis dataKey="inc" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0, 45]} tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [typeof v === "number" ? `${v} s` : v, "Median TTC"]) as any}/>
                <Line type="monotone" dataKey="t" stroke={P.green} strokeWidth={1.8}
                  dot={{ r: 3, fill: P.green, strokeWidth: 0 }} name="TTC (s)"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[12px] mono text-center mt-1" style={{ color: P.text2 }}>
            38 s → 14 s as case memory grows · CBR reuse effect
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SYSTEM TAB
════════════════════════════════════════════════════════════ */
function SystemTab() {
  const [active, setActive] = useState<Exp>("Proposed Safe Reuse");
  const agents = [
    { name: "Controller",   ms: 4,  slow: false },
    { name: "Memory/CBR",   ms: 8,  slow: false },
    { name: "Investigator", ms: 13, slow: true  },
    { name: "Explanation",  ms: 3,  slow: false },
    { name: "Response",     ms: 2,  slow: false },
  ];
  const maxMs = Math.max(...agents.map(a => a.ms));

  return (
    <div className="flex flex-col gap-4">
      {/* Experiment selector */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] mono mr-1" style={{ color: P.text2 }}>Experiment:</span>
        {EXPERIMENTS.map(e => (
          <button key={e} onClick={() => setActive(e)}
            className="px-3 py-1.5 rounded-[6px] text-[14px] mono font-medium transition-colors border"
            style={{
              background: active === e ? "#0A1A0A" : "transparent",
              color: active === e ? P.green : P.text2,
              borderColor: active === e ? P.green + "55" : "#1A1E1B",
            }}>
            {e}
          </button>
        ))}
      </div>

      {/* Row 1 — 4 panels */}
      <div className="grid grid-cols-4 gap-3">
        {/* CPU gauge */}
        <Panel className="p-4 flex flex-col items-center justify-center">
          <SLabel>CPU utilisation</SLabel>
          <CircGauge value={34} label="CPU Usage" color="#94A8BA" w={110}/>
        </Panel>

        {/* RAM gauge */}
        <Panel className="p-4 flex flex-col items-center justify-center">
          <SLabel>RAM utilisation</SLabel>
          <CircGauge value={62} label="RAM (% of 2 GB)" color="#94A8BA" w={110}/>
          <div className="text-[12px] mono mt-1 text-center" style={{ color: P.text2 }}>1.2 GB used</div>
        </Panel>

        {/* Radar overlay */}
        <Panel className="p-4">
          <SLabel>Config overlay · all experiments</SLabel>
          <SystemRadar active={active}/>
          <div className="flex items-center justify-center gap-3 mt-0.5">
            {Object.entries(CONFIG_COLORS).map(([k, col]) => (
              <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: col }}>
                <span className="inline-block w-3 h-[1.5px]" style={{ background: col }}/>
                {k === "Full Investigation" ? "Full" : k === "Similarity Only" ? "Sim" : "Proposed"}
              </span>
            ))}
          </div>
        </Panel>

        {/* Stat list */}
        <Panel className="p-4">
          <SLabel>Performance stats · {active === "Proposed Safe Reuse" ? "proposed" : active.toLowerCase()}</SLabel>
          {[
            { label: "Median E2E latency", value: "28 ms" },
            { label: "P95 E2E latency",    value: "52 ms" },
            { label: "Throughput",         value: "340 ev/s" },
            { label: "Queue lag",          value: "< 5 ms" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-[#131613] last:border-0">
              <span className="text-[13px]" style={{ color: P.text2 }}>{s.label}</span>
              <span className="text-[15px] mono font-semibold" style={{ color: P.text }}>{s.value}</span>
            </div>
          ))}
        </Panel>
      </div>

      {/* Row 2 — per-agent latency */}
      <Panel className="p-4">
        <SLabel>Per-agent pipeline latency (ms) · median · Investigator is the dominant stage</SLabel>
        <div className="flex flex-col gap-2 mt-1">
          {agents.map(a => {
            const pct = (a.ms / maxMs) * 100;
            return (
              <div key={a.name} className="flex items-center gap-3">
                <div className="w-[110px] text-[14px] mono shrink-0" style={{ color: a.slow ? P.red : P.text2 }}>
                  {a.name}
                  {a.slow && <span className="ml-2 text-[10px]" style={{ color: P.red }}>slowest</span>}
                </div>
                <div className="flex-1 h-[20px] bg-[#0A0C0A] rounded-[3px] overflow-hidden relative">
                  <div className="h-full rounded-[3px] transition-all"
                    style={{ width: `${pct}%`, background: a.slow ? P.red + "AA" : "#16A34A88" }}/>
                </div>
                <div className="w-[44px] text-[14px] mono font-semibold text-right shrink-0"
                  style={{ color: a.slow ? P.red : P.green }}>
                  {a.ms} ms
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[12px] mono" style={{ color: P.text2 }}>
          Total pipeline p50: ~30 ms · Controller + Memory + Response account for &lt;50% combined
        </div>
      </Panel>
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
    <div className="h-full overflow-y-auto bg-[#0A0C0A]">
      <div className="max-w-[1440px] mx-auto px-8 py-5 fade-in">

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-[#1A1E1B] mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-[16px] font-medium mono transition-all border-b-2 -mb-px"
              style={{
                borderColor: tab === t.id ? P.green : "transparent",
                color: tab === t.id ? P.text : P.text2,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "detection" && <DetectionTab/>}
        {tab === "safereuse" && <SafeReuseTab/>}
        {tab === "response"  && <ResponseTab/>}
        {tab === "system"    && <SystemTab/>}
      </div>
    </div>
  );
}
