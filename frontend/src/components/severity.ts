/**
 * Shared severity, status and outcome presentation.
 *
 * Severity used to be implemented four separate times across Incidents,
 * IncidentDetail, Dashboard and CaseDetail, with slightly different colours
 * each time. These helpers are now the single definition, so a Critical
 * incident reads identically wherever it appears.
 */

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus = "Investigating" | "Escalated" | "Resolved" | "New" | string;
export type Outcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "HARMFUL" | string;
export type Route = "SHORT" | "PARTIAL" | "DEEP" | string;

export interface Tone {
  /** Text colour, ≥ 7:1 on the panel surface. */
  text: string;
  /** Translucent fill for badges and row accents. */
  bg: string;
  /** Border for badges. */
  line: string;
  /** Solid colour for bars, dots and left edges. */
  solid: string;
}

const SEVERITY: Record<Severity, Tone> = {
  Critical: {
    text: "var(--critical)",
    bg: "var(--critical-bg)",
    line: "var(--critical-line)",
    solid: "var(--critical)",
  },
  High: {
    text: "var(--high)",
    bg: "var(--high-bg)",
    line: "var(--high-line)",
    solid: "var(--high)",
  },
  Medium: {
    text: "var(--medium)",
    bg: "var(--medium-bg)",
    line: "var(--medium-line)",
    solid: "var(--medium)",
  },
  Low: {
    text: "var(--low)",
    bg: "var(--low-bg)",
    line: "var(--low-line)",
    solid: "var(--low)",
  },
};

export function severityTone(criticality: string): Tone {
  return SEVERITY[criticality as Severity] ?? SEVERITY.Low;
}

export function severityClass(criticality: string): string {
  switch (criticality) {
    case "Critical":
      return "sev-critical";
    case "High":
      return "sev-high";
    case "Medium":
      return "sev-medium";
    default:
      return "sev-low";
  }
}

export function severityRowClass(criticality: string): string {
  switch (criticality) {
    case "Critical":
      return "row-critical";
    case "High":
      return "row-high";
    case "Medium":
      return "row-medium";
    default:
      return "row-low";
  }
}

export interface StatusTone extends Tone {
  label: string;
}

export function statusTone(status: IncidentStatus): StatusTone {
  switch (status) {
    case "Investigating":
      return { label: "Investigating", text: "var(--critical)", bg: "var(--critical-bg)", line: "var(--critical-line)", solid: "var(--critical)" };
    case "Escalated":
      return { label: "Escalated", text: "var(--high)", bg: "var(--high-bg)", line: "var(--high-line)", solid: "var(--high)" };
    case "Resolved":
      return { label: "Resolved", text: "var(--success)", bg: "var(--low-bg)", line: "var(--low-line)", solid: "var(--success)" };
    case "New":
      return { label: "New", text: "var(--info)", bg: "var(--info-bg)", line: "var(--info-line)", solid: "var(--info)" };
    default:
      return { label: status, text: "var(--text-3)", bg: "var(--surface-3)", line: "var(--border-2)", solid: "var(--text-4)" };
  }
}

export interface OutcomeTone extends Tone {
  label: string;
}

export function outcomeTone(outcome: Outcome): OutcomeTone {
  switch (outcome) {
    case "SUCCESS":
      return { label: "Resolved", text: "var(--success)", bg: "var(--low-bg)", line: "var(--low-line)", solid: "var(--success)" };
    case "PARTIAL":
      return { label: "Partial", text: "var(--warning)", bg: "var(--high-bg)", line: "var(--high-line)", solid: "var(--warning)" };
    case "FAILURE":
      return { label: "Failed", text: "var(--critical)", bg: "var(--critical-bg)", line: "var(--critical-line)", solid: "var(--critical)" };
    case "HARMFUL":
      return { label: "⚠ Harmful", text: "var(--critical)", bg: "var(--critical-bg)", line: "var(--critical-line)", solid: "var(--critical)" };
    default:
      return { label: outcome, text: "var(--text-3)", bg: "var(--surface-3)", line: "var(--border-2)", solid: "var(--text-4)" };
  }
}

export interface RouteTone extends Tone {
  label: string;
}

export function routeTone(route: Route): RouteTone {
  switch (route) {
    case "SHORT":
      return { label: "Short", text: "var(--success)", bg: "var(--low-bg)", line: "var(--low-line)", solid: "var(--success)" };
    case "PARTIAL":
      return { label: "Partial", text: "var(--warning)", bg: "var(--high-bg)", line: "var(--high-line)", solid: "var(--warning)" };
    case "DEEP":
      return { label: "Deep", text: "var(--violet)", bg: "var(--violet-bg)", line: "var(--violet-line)", solid: "var(--violet)" };
    default:
      return { label: route, text: "var(--text-3)", bg: "var(--surface-3)", line: "var(--border-2)", solid: "var(--text-4)" };
  }
}

export const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };