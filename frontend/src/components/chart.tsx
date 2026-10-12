/**
 * Shared chart theming and tooltips.
 *
 * Dashboard, Evaluation and IncidentDetail each defined their own tooltip
 * and each passed its own hard-coded recharts `contentStyle`. This is the one
 * definition, so a tooltip looks and reads the same on every chart.
 */
import React from "react";
import type { Tone } from "./severity";

/** Shared recharts props. Spread into any chart. */
export const AXIS = {
  tick: { fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "var(--text-4)" },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = {
  stroke: "var(--border)",
  strokeDasharray: "2 4",
  vertical: false,
} as const;

export interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  fill?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Prefix shown before the label, e.g. "T+12s · ". */
  labelPrefix?: string;
  /** Appended to each value, e.g. "%" or " pps". */
  unit?: string;
  /** Hide the colour swatch when the chart already shows a legend. */
  hideSwatch?: boolean;
}

/** Dark tooltip body used by every chart in the app. */
export function ChartTooltip({
  active,
  payload,
  label,
  labelPrefix = "",
  unit = "",
  hideSwatch = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--border-2)] bg-[var(--surface-3)] px-3 py-2.5 shadow-[var(--shadow-lg)]">
      {label != null && (
        <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-4)]">
          {labelPrefix}
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const key = String(entry.dataKey ?? entry.name ?? i);
          const swatch = entry.color ?? entry.fill;
          const name = String(entry.name ?? key);
          const raw = typeof entry.value === "number" ? entry.value.toFixed(entry.value % 1 === 0 ? 0 : 2) : String(entry.value);
          return (
            <div key={key} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5">
                {!hideSwatch && swatch && (
                  <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: swatch }} />
                )}
                <span className="font-mono text-[11px] capitalize text-[var(--text-3)]">{name}</span>
              </span>
              <span className="font-mono text-[12.5px] font-semibold text-[var(--text)]">
                {raw}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Vertical reference-line label shared by the traffic and response charts. */
export function phaseLabel(value: string, tone: Tone) {
  return {
    value,
    position: "insideTopRight" as const,
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    fill: tone.text,
    fontWeight: 700,
  };
}