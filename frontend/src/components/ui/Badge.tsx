import React from "react";
import { severityClass, outcomeTone, routeTone, statusTone } from "../severity";

type Variant = "neutral" | "lime" | "violet" | "success" | "danger" | "warning" | "outline";

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  /** Small monospace badge for IDs and codes. */
  mono?: boolean;
}

const CLASS: Record<Variant, string> = {
  neutral: "badge-neutral",
  lime: "badge-lime",
  violet: "badge-violet",
  success: "sev-low",
  danger: "sev-critical",
  warning: "sev-medium",
  outline: "badge-neutral",
};

export default function Badge({ variant = "neutral", children, className = "", mono = false }: Props) {
  return (
    <span className={`badge ${CLASS[variant]} ${mono ? "mono" : ""} ${className}`.trim()}>{children}</span>
  );
}

/** Criticality badge driven by the shared severity tokens. */
export function CriticalityBadge({ value }: { value: string }) {
  return (
    <span className={`badge ${severityClass(value)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

/** Investigation route badge. */
export function RouteBadge({ value }: { value: string }) {
  const tone = routeTone(value);
  return (
    <span className="badge" style={{ background: tone.bg, color: tone.text, borderColor: tone.line }}>
      {tone.label}
    </span>
  );
}

/** Outcome badge driven by the shared outcome tokens. */
export function OutcomeBadge({ value }: { value: string }) {
  const tone = outcomeTone(value);
  return (
    <span className="badge" style={{ background: tone.bg, color: tone.text, borderColor: tone.line }}>
      {tone.label}
    </span>
  );
}

/** Incident status badge driven by the shared status tokens. */
export function StatusBadge({ value }: { value: string }) {
  const tone = statusTone(value);
  return (
    <span className="badge" style={{ background: tone.bg, color: tone.text, borderColor: tone.line }}>
      {tone.label}
    </span>
  );
}

export function StatusDot({ online }: { online: boolean }) {
  return <span className={`dot ${online ? "dot-online" : "dot-offline"}`} />;
}