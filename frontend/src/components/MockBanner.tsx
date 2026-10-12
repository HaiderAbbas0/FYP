import React from "react";

interface Props {
  /** Override the default message */
  message?: string;
  /** Compact inline style vs full-width banner */
  compact?: boolean;
}

/**
 * MockBanner
 *
 * Displayed on every screen that shows data from the mock layer instead of
 * a live backend. Remove or hide this component once real API data is wired in.
 */
export default function MockBanner({ message, compact = false }: Props) {
  const text =
    message ??
    "MOCK DATA — All values shown are simulated. No live backend is connected.";

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] mono uppercase tracking-widest font-semibold"
        style={{ background: "#1A1A0A", color: "#8A8030", border: "1px solid #2A2A10" }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1" />
          <path d="M4 2.5v2M4 5.5v.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        MOCK
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 mb-4 rounded-[6px] text-[13px] mono"
      style={{ background: "#141408", color: "#8A8030", border: "1px solid #252510" }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M6.5 4v3.5M6.5 8.8v.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
