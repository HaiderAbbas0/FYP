import React from "react";
import { Link } from "react-router-dom";

/**
 * Layout shell for the inner marketing pages.
 *
 * Each page supplies an eyebrow, a headline, a lead paragraph and sections.
 * The frame owns the page grid, the section rhythm and the scroll reveal, so
 * Platform, Solutions, Integrations, Security & Compliance, Resources, About and
 * Contact all sit on the same layout.
 */
export function MarketingPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full overflow-hidden pb-24 text-[var(--text)]">
      {/* Cyber network artwork, faded back and scrimmed so text stays legible */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/cyber-network-bg.png')", backgroundPosition: "center top", opacity: 0.35 }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{ background: "linear-gradient(to bottom, rgba(7,10,9,0.55) 0%, rgba(7,10,9,0.25) 45%, var(--bg) 100%)" }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-6">
        <header className="reveal mx-auto max-w-[820px] pt-36 pb-16 text-center">
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5" style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--lime)" }} aria-hidden />
            <span className="t-label" style={{ color: "var(--lime)" }}>{eyebrow}</span>
          </span>

          <h1 className="t-display">{title}</h1>
          <p className="t-lead mx-auto mt-6 max-w-[760px] leading-relaxed text-[var(--text-3)]">{lead}</p>
        </header>

        {children}
      </div>
    </div>
  );
}

/** Standard section rhythm: centred heading, then content. */
export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`reveal mb-24 ${className}`}>
      {children}
    </section>
  );
}

/** Section heading block. The lead is optional. */
export function SectionTitle({
  title,
  lead,
  center = true,
  action,
}: {
  title: React.ReactNode;
  lead?: string;
  center?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`mb-10 flex flex-wrap items-end justify-between gap-4 ${center ? "flex-col items-center text-center" : ""}`}>
      <div className={center ? "max-w-[720px]" : "max-w-[680px]"}>
        <h2 className="t-h2 text-[var(--text)]">{title}</h2>
        {lead && <p className="t-lead mt-3 leading-relaxed text-[var(--text-3)]">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** Two-line gradient span used for the second half of every hero headline. */
export function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: "linear-gradient(90deg, var(--lime) 0%, #80FF72 45%, var(--violet) 100%)" }}
    >
      {children}
    </span>
  );
}

/** Small uppercase pill for module labels and KPIs. */
export function Chip({
  children,
  color = "var(--lime)",
  bg = "var(--lime-soft)",
  line = "var(--lime-line)",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  line?: string;
  className?: string;
}) {
  return (
    <span
      className={`mono rounded px-2.5 py-1 text-[10.5px] font-bold tracking-wider ${className}`}
      style={{ color, background: bg, border: `1px solid ${line}` }}
    >
      {children}
    </span>
  );
}

/** Numbered card with a check list; used by Platform modules and Solutions outcomes. */
export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--text-2)]">
          <span
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--lime-soft)" }}
            aria-hidden
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="var(--lime)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Metric card: big number, label, small note. */
export function StatCard({
  label,
  value,
  note,
  color = "var(--text)",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="t-label mb-2">{label}</div>
      <div className="mono text-[28px] font-bold leading-none" style={{ color }}>{value}</div>
      {note && <div className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-3)]">{note}</div>}
      {sub && <div className="mono mt-1 text-[11px] text-[var(--text-4)]">{sub}</div>}
    </div>
  );
}

/** Disclosure note used on the pages that must be honest about testbed status. */
export function Notice({
  label,
  children,
  tone = "info",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "info" | "lime";
}) {
  return (
    <div
      className={`${tone === "lime" ? "demo-banner" : "alert-info"} mx-auto max-w-[760px] text-left text-[12.5px] leading-relaxed`}
    >
      <span className="mono block text-[10.5px] font-bold uppercase tracking-wider" style={{ color: tone === "lime" ? "var(--lime)" : "var(--info)" }}>
        {label}
      </span>
      <span className="mt-1 block text-[var(--text-2)]">{children}</span>
    </div>
  );
}

/** Closing call to action band. */
export function CtaBand({
  title,
  lead,
  primary,
  secondary,
}: {
  title: React.ReactNode;
  lead: string;
  primary: { to: string; label: string };
  secondary?: { to: string; label: string };
}) {
  return (
    <section className="reveal border-t pt-16 text-center" style={{ borderColor: "var(--border)" }}>
      <h2 className="t-h2 text-[var(--text)]">{title}</h2>
      <p className="t-lead mx-auto mt-4 max-w-[620px] leading-relaxed text-[var(--text-3)]">{lead}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to={primary.to} className="btn btn-primary btn-lg">{primary.label}</Link>
        {secondary && (
          <Link to={secondary.to} className="btn btn-secondary btn-lg">{secondary.label}</Link>
        )}
      </div>
    </section>
  );
}