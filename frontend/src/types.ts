export type Screen =
  | "login"
  | "dashboard"
  | "simulation-configure"
  | "simulation-running"
  | "simulation-result"
  | "devices"
  | "device-detail"
  | "incidents"
  | "incident-overview"
  | "incident-safereuse"
  | "incident-response"
  | "case-memory"
  | "case-detail"
  | "evaluation"
  | "audit-log"
  | "reports"
  | "system-health"
  | "settings"
  | "forgot-password"
  | "reset-password"
  | "accept-invitation"
  | "verify-email";

export type SidebarItem = {
  id: Screen;
  label: string;
  icon: string;
};

export type Route = "SHORT" | "PARTIAL" | "DEEP";
export type Outcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "HARMFUL";
export type Criticality = "Critical" | "High" | "Medium" | "Low";
export type SimStage =
  | "Baseline"
  | "Attack"
  | "Detect"
  | "Route"
  | "Investigate"
  | "Respond"
  | "Validate"
  | "Finalize";

export type UserRole = "super_admin" | "analyst" | "viewer";

export type IncidentStatus = "Investigating" | "Escalated" | "Resolved" | "Closed" | "New";
export type DeviceMonitoringStatus = "Active" | "Inactive" | "Unknown";
