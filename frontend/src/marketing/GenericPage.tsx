import React from "react";

/**
 * The seven inner marketing pages (Platform, Solutions, Integrations,
 * Security & Compliance, Resources, About, Contact) now carry their own
 * content and visuals. This frame is kept only as the shared layout so any
 * page that still has nothing to show falls back to the original placeholder
 * instead of a blank screen.
 */
export default function GenericPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full px-6 pb-28 pt-36">
      <div className="mx-auto max-w-[860px]">
        <div className="reveal mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-[12px]" style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)" }} aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>

        <div className="reveal text-center" data-reveal-delay="60">
          <h1 className="t-h1 text-[var(--text)]">{title}</h1>
          <p className="t-lead mx-auto mt-4 max-w-[620px] leading-relaxed text-[var(--text-3)]">{subtitle}</p>
        </div>

        {children && <div className="reveal mt-10" data-reveal-delay="120">{children}</div>}
      </div>
    </div>
  );
}

export function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="card-elevated p-8 text-left">
      <h2 className="t-h3 mb-3 text-[var(--text)]">Under Development</h2>
      <p className="text-[14.5px] leading-relaxed text-[var(--text-3)]">
        This is a demonstration placeholder for the <strong className="text-[var(--text-2)]">{title}</strong> page. In a full production environment, this page would contain detailed marketing copy, product diagrams, and specific feature breakdowns.
      </p>
    </div>
  );
}