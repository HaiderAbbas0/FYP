import React from "react";
import { Chip } from "./MarketingPage";

/* ────────────────────────────────────────────────────────────────────────
   Marketing visuals. Hand-rolled SVG so every chart inherits the token
   palette instead of a library theme. All of them scale with their
   container through viewBox and stay legible down to phone widths.
──────────────────────────────────────────────────────────────────────── */

/** Telemetry strip: one or more series, optional markers, area fill, hover readout. */
export function TelemetryLine({
  data,
  id,
  series,
  markers = [],
  height = 190,
  unit = " msg/s",
  yMax,
}: {
  data: number[];
  /** Unique per instance so the gradient defs do not collide on a page. */
  id: string;
  series: { key: string; label: string; color: string; fill?: boolean }[];
  markers?: { at: number; label: string; color: string }[];
  height?: number;
  unit?: string;
  yMax?: number;
}) {
  const W = 960, H = 300, PAD = 8;
  const max = yMax ?? Math.max(...data, 1);
  const sx = (i: number) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
  const sy = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const linePath = (values: number[]) => values.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d).toFixed(1)}`).join(" ");
  const areaPath = (values: number[]) => `${linePath(values)} L${sx(values.length - 1).toFixed(1)},${H - PAD} L${sx(0).toFixed(1)},${H - PAD} Z`;

  const [hover, setHover] = React.useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label={series.map((s) => s.label).join(" and ")}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const rel = (e.clientX - rect.left) / rect.width;
            setHover(Math.round(rel * (data.length - 1)));
          }}
        >
          <defs>
            {series.filter((s) => s.fill).map((s) => (
              <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} y1={PAD + f * (H - PAD * 2)} x2={W} y2={PAD + f * (H - PAD * 2)} stroke="var(--border)" strokeDasharray="2 6" strokeWidth="1" />
          ))}

          {markers.map((m) => (
            <g key={m.at}>
              <line x1={sx(m.at)} y1={PAD} x2={sx(m.at)} y2={H - PAD} stroke={m.color} strokeWidth="1.5" strokeDasharray="6 4" />
              <text x={sx(m.at) + 8} y={PAD + 18} style={{ fontSize: 22, fontFamily: "var(--font-mono)", fill: m.color }}>{m.label}</text>
            </g>
          ))}

          {series.filter((s) => s.fill).map((s) => (
            <path key={`a-${s.key}`} d={areaPath(data)} fill={`url(#${id}-${s.key})`} />
          ))}
          {series.map((s) => (
            <path key={s.key} d={linePath(data)} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}

          {hover !== null && (
            <line x1={sx(hover)} y1={PAD} x2={sx(hover)} y2={H - PAD} stroke="var(--text-4)" strokeWidth="1" />
          )}
        </svg>

        {hover !== null && (
          <div
            className="mono pointer-events-none absolute top-2 rounded-md px-2.5 py-1.5 text-[11px]"
            style={{
              background: "var(--surface-4)",
              border: "1px solid var(--border-2)",
              color: "var(--text)",
              left: `${(sx(hover) / W) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            t{hover} · {Math.round(data[hover])}{unit}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12px]" style={{ color: s.color }}>
            <span className="h-0.5 w-4 rounded" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Donut built from stroked arc segments so it needs no chart library. */
export function Donut({
  data,
  size = 190,
  stroke = 26,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - stroke / 2 - 2;
  const SWEEP = 250;
  const START = 90 + (360 - SWEEP) / 2;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={data.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(", ")}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
        {data.map((d) => {
          const frac = d.value / total;
          const gap = Math.min(2.5, frac * SWEEP * 0.25);
          const a0 = START + acc * SWEEP + gap / 2;
          const a1 = START + (acc + frac) * SWEEP - gap / 2;
          acc += frac;
          if (a1 <= a0) return null;
          const s = pt(a0), e = pt(a1);
          const large = a1 - a0 > 180 ? 1 : 0;
          return (
            <path
              key={d.label}
              d={`M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: size * 0.16, fontFamily: "var(--font-mono)", fontWeight: 700, fill: "var(--text)" }}>
          {Math.round((data[0]?.value ?? 0) / total * 100)}%
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" style={{ fontSize: size * 0.055, fontFamily: "var(--font-mono)", fill: "var(--text-4)" }}>
          {(data[0]?.label ?? "").toUpperCase()}
        </text>
      </svg>

      <ul className="min-w-[180px] flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-4 text-[13.5px]">
            <span className="flex items-center gap-2 text-[var(--text-2)]">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: d.color }} aria-hidden />
              {d.label}
            </span>
            <span className="mono font-semibold text-[var(--text)]">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal ranked bars with an optional muted comparison series. */
export function Bars({
  data,
  unit = "",
  legend,
}: {
  data: { label: string; value: number; color?: string; compare?: number; compareColor?: string }[];
  unit?: string;
  legend?: { primary: string; secondary?: string };
}) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.compare ?? 0)), 1);
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)_56px]">
          <span className="mono truncate text-[12.5px] text-[var(--text-3)]">{d.label}</span>
          <span className="space-y-1">
            <span className="block h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <span className="block h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "var(--lime)" }} />
            </span>
            {d.compare !== undefined && (
              <span className="block h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                <span className="block h-full rounded-full" style={{ width: `${(d.compare / max) * 100}%`, background: d.compareColor ?? "var(--text-4)", opacity: 0.55 }} />
              </span>
            )}
          </span>
          <span className="mono text-right text-[13px] font-semibold text-[var(--text)]">{d.value}{unit}</span>
        </li>
      ))}
      {legend && (
        <li className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1">
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-3)]">
            <span className="h-2.5 w-3 rounded-sm" style={{ background: "var(--lime)" }} aria-hidden />
            {legend.primary}
          </span>
          {legend.secondary && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-4)]">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: "var(--text-4)", opacity: 0.55 }} aria-hidden />
              {legend.secondary}
            </span>
          )}
        </li>
      )}
    </ul>
  );
}

/** Milestone / process timeline with status chips. */
export function Timeline({
  items,
}: {
  items: { title: string; meta: string; status: string; desc: string; done?: boolean }[];
}) {
  return (
    <ol className="relative space-y-6 pl-10">
      <span className="absolute bottom-4 left-[15px] top-4 w-px" style={{ background: "var(--border-2)" }} aria-hidden />
      {items.map((it, i) => (
        <li key={it.title} className="relative">
          <span
            className="absolute -left-10 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold"
            style={{
              background: it.done ? "var(--lime-soft)" : "var(--surface-2)",
              border: `1px solid ${it.done ? "var(--lime-line)" : "var(--border-2)"}`,
              color: it.done ? "var(--lime)" : "var(--text-3)",
            }}
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="card p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="mono text-[11px] uppercase text-[var(--text-4)]">{it.meta}</span>
              <Chip>{it.status}</Chip>
            </div>
            <h3 className="t-h3 mb-2 text-[var(--text)]">{it.title}</h3>
            <p className="text-[13.5px] leading-relaxed text-[var(--text-3)]">{it.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Pipeline flow. Stage cards are HTML so their type stays crisp; the connector
 * between cards is a thin SVG strip with an animated dash. On narrow screens
 * the cards stack and the connectors rotate to a vertical line.
 */
export function PipelineFlow({
  stages,
  active,
  onSelect,
  caption,
}: {
  stages: { id: string; title: string; items: string[]; color: string }[];
  active: string;
  onSelect: (id: string) => void;
  caption?: React.ReactNode;
}) {
  const current = stages.find((s) => s.id === active) ?? stages[0];
  const activeIndex = Math.max(stages.findIndex((s) => s.id === current.id), 0);
  return (
    <div>
      <ol className="grid grid-cols-1 gap-y-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-x-2" role="list">
        {stages.map((s, i) => {
          const on = s.id === active;
          const passed = activeIndex > i;
          const stroke = on ? s.color : passed ? "var(--lime)" : "var(--border-2)";
          return (
            <React.Fragment key={s.id}>
              <li>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  aria-pressed={on}
                  className="flex h-full w-full flex-col justify-center rounded-xl px-4 py-4 text-center transition-all duration-300"
                  style={{
                    background: on ? "var(--surface-3)" : "var(--surface-2)",
                    border: `1px solid ${on ? s.color : "var(--border)"}`,
                    boxShadow: on ? "inset 0 0 0 1px rgba(255,255,255,0.02)" : "none",
                  }}
                >
                  <span className="mono block text-[10.5px]" style={{ color: on ? s.color : "var(--text-4)" }}>STAGE {i + 1}</span>
                  <span className="mt-1 block text-[15px] font-semibold leading-snug text-[var(--text)]">{s.title}</span>
                  <span className="mt-1.5 block text-[12px] leading-snug text-[var(--text-4)]">{s.items.length} {s.items.length === 1 ? "capability" : "capabilities"}</span>
                  <span className="mt-2.5 flex justify-center gap-1" aria-hidden>
                    {s.items.slice(0, 4).map((it) => (
                      <span key={it} className="h-1 w-1 rounded-full" style={{ background: on ? s.color : "var(--border-3)" }} />
                    ))}
                  </span>
                </button>
              </li>

              {i < stages.length - 1 && (
                <li className="flex items-center justify-center md:px-0" aria-hidden>
                  <svg width="56" height="12" viewBox="0 0 56 12" preserveAspectRatio="none" className="hidden h-[12px] w-14 md:block">
                    <line x1="0" y1="6" x2="52" y2="6" stroke={stroke} strokeWidth="2" strokeDasharray="6 8" className="flow-link" />
                    <path d="M50 2 L56 6 L50 10" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="12" height="28" viewBox="0 0 12 28" preserveAspectRatio="none" className="block h-7 w-3 md:hidden">
                    <line x1="6" y1="0" x2="6" y2="24" stroke={stroke} strokeWidth="2" strokeDasharray="6 8" className="flow-link" />
                    <path d="M2 22 L6 28 L10 22" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>

      <style>{`@keyframes flow-dash { to { stroke-dashoffset: -28; } } .flow-link { animation: flow-dash 1.2s linear infinite; }`}</style>

      <div className="card mt-4 p-5" aria-live="polite">
        <div className="t-label mb-3" style={{ color: current.color }}>{current.title}</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {current.items.map((it) => (
            <div key={it} className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: current.color }} aria-hidden />
              {it}
            </div>
          ))}
        </div>
        {caption && <div className="mt-3 text-[12px] text-[var(--text-4)]">{caption}</div>}
      </div>
    </div>
  );
}

/** Vertical stacked defence layers, each row labelled and enforced. */
export function DefenceLayers({
  layers,
}: {
  layers: { name: string; desc: string; color: string }[];
}) {
  const [open, setOpen] = React.useState<string | null>(layers[0]?.name ?? null);
  return (
    <ul className="space-y-3">
      {layers.map((l, i) => {
        const on = open === l.name;
        return (
          <li key={l.name}>
            <button
              type="button"
              onClick={() => setOpen(on ? null : l.name)}
              aria-expanded={on}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-4 text-left transition-colors"
              style={{ background: on ? "var(--surface-2)" : "var(--surface)", border: `1px solid ${on ? l.color : "var(--border)"}` }}
            >
              <span className="flex items-center gap-3">
                <span className="mono text-[11px]" style={{ color: l.color }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] font-semibold text-[var(--text)]">{l.name}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="mono text-[10.5px] uppercase tracking-wider text-[var(--success)]">Enforced</span>
                <span className="mono text-[14px]" style={{ color: l.color }} aria-hidden>{on ? "−" : "+"}</span>
              </span>
            </button>
            {on && (
              <p className="animate-in fade-in ml-5 mt-2 border-l-2 pb-1 pl-4 text-[13.5px] leading-relaxed text-[var(--text-3)]" style={{ borderColor: l.color }}>
                {l.desc}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Filter chip row used by Resources and Integrations. */
export function ChipRow({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className="filter-chip"
            style={{
              background: on ? "var(--lime-soft)" : "transparent",
              color: on ? "var(--lime)" : "var(--text-3)",
              borderColor: on ? "var(--lime-line)" : "var(--border)",
              fontWeight: on ? 600 : 500,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}