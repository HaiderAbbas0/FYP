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
  | "system-health"
  | "settings";

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
