/**
 * MediSOC API Service Layer
 *
 * All data access goes through this file.
 * Currently backed by mock data from src/data/mock.ts
 *
 * INTEGRATION GUIDE (when backend arrives):
 * - Replace each function's mock return with a real fetch() call.
 * - The calling component code does NOT need to change.
 * - Set VITE_API_BASE in your .env file: VITE_API_BASE=http://localhost:8000
 * - The BASE_URL constant will pick it up automatically.
 */

import {
  trafficData,
  featureImportance,
  incidents as mockIncidents,
  devices as mockDevices,
  cases as mockCases,
  services as mockServices,
  detectionMetrics as mockDetectionMetrics,
  confusionMatrix as mockConfusionMatrix,
  modelComparison as mockModelComparison,
  safeReuseMetrics as mockSafeReuseMetrics,
  vectorMetrics as mockVectorMetrics,
} from "../data/mock";

/* ─── Config ────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BASE_URL: string = (import.meta as any).env?.VITE_API_BASE ?? "";

/** Simulated network delay (ms) — remove when using real API */
const MOCK_DELAY = 400;

/* ─── Generic response wrapper ──────────────────────────────────────────────── */
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function ok<T>(data: T): ApiResult<T> {
  return { data, error: null, loading: false };
}

function err<T>(message: string): ApiResult<T> {
  return { data: null, error: message, loading: false };
}

async function delay(): Promise<void> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY));
}

/* ─── Domain types (extend / replace with real backend schema) ──────────────── */
export interface Incident {
  id: string;
  attack: string;
  type: string;
  target: string;
  criticality: string;
  confidence: number;
  route: string;
  outcome: string;
  time: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  criticality: string;
  ip: string;
  protocol: string;
  baseline: string;
  status: string;
}

export interface Case {
  id: string;
  attack: string;
  device: string;
  response: string;
  outcome: string;
  uses: number;
  reliability: number;
  similarity: number;
}

export interface ServiceStatus {
  name: string;
  status: string;
  detail: string;
  latency: string;
  impact: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

/* ─── Mock audit events ─────────────────────────────────────────────────────── */
const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: "AUD-012", timestamp: "14:32:01", action: "INCIDENT_ACKNOWLEDGED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-104", detail: "Incident acknowledged by Super Admin", severity: "info" },
  { id: "AUD-011", timestamp: "14:31:50", action: "RESPONSE_APPROVED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-104", detail: "Response action approved: MQTT Rate Limiting", severity: "warning" },
  { id: "AUD-010", timestamp: "14:28:33", action: "CASE_REUSE_REJECTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "CASE-017", detail: "Safe-reuse rejected — device context differs (Sensor→Gateway)", severity: "warning" },
  { id: "AUD-009", timestamp: "14:21:02", action: "INCIDENT_ACKNOWLEDGED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-103", detail: "Incident acknowledged — UDP Flood suppressed at source", severity: "info" },
  { id: "AUD-008", timestamp: "14:18:44", action: "SIMULATION_STARTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "SIM-RUN-0042", detail: "Attack simulation started: MQTT Connect Flood · Gateway-01", severity: "info" },
  { id: "AUD-007", timestamp: "13:57:12", action: "INCIDENT_ESCALATED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-102", detail: "Incident escalated to Super Admin — partial outcome", severity: "warning" },
  { id: "AUD-006", timestamp: "13:44:05", action: "INCIDENT_ACKNOWLEDGED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-101", detail: "Incident acknowledged — ICMP Flood resolved", severity: "info" },
  { id: "AUD-005", timestamp: "13:15:30", action: "DEVICE_ISOLATION_REQUESTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "GW-01", detail: "Device isolation requested for Gateway-01 — awaiting approval", severity: "critical" },
  { id: "AUD-004", timestamp: "13:12:01", action: "RESPONSE_APPROVED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-100", detail: "Response action approved: Source Block + Rate Limit", severity: "warning" },
  { id: "AUD-003", timestamp: "12:55:44", action: "SYSTEM_LOGIN", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "AUTH", detail: "User login — analyst@iomt-testbed.local", severity: "info" },
  { id: "AUD-002", timestamp: "12:55:10", action: "SYSTEM_LOGIN", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "AUTH", detail: "User login — admin@iomt-testbed.local", severity: "info" },
  { id: "AUD-001", timestamp: "12:50:00", action: "SYSTEM_STARTUP", actor: "SYSTEM", actorRole: "system", target: "ALL", detail: "MediSOC system started — all services online", severity: "info" },
];

/* ─── Mock notification events ──────────────────────────────────────────────── */
export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "N-003", title: "Critical Incident Active", detail: "INC-104 · DDoS MQTT Connect Flood on Gateway-01", time: "00:18 ago", read: false, severity: "critical" },
  { id: "N-002", title: "Detector Confidence Low", detail: "INC-102 confidence below 90% threshold", time: "35 min ago", read: false, severity: "warning" },
  { id: "N-001", title: "Case Memory Updated", detail: "CASE-128 marked as reliable · uses: 12", time: "1 hr ago", read: true, severity: "info" },
];

/* ─── API functions ─────────────────────────────────────────────────────────── */

/** Fetch all incidents (paginated) */
export async function getIncidents(filters?: {
  criticality?: string;
  outcome?: string;
  route?: string;
  search?: string;
}): Promise<ApiResult<{ items: Incident[]; total: number }>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/incidents?...`); */
  let items = [...mockIncidents];
  if (filters?.criticality && filters.criticality !== "All")
    items = items.filter((i) => i.criticality === filters.criticality);
  if (filters?.outcome && filters.outcome !== "All")
    items = items.filter((i) => i.outcome === filters.outcome);
  if (filters?.route && filters.route !== "All")
    items = items.filter((i) => i.route === filters.route);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.attack.toLowerCase().includes(q) ||
        i.target.toLowerCase().includes(q),
    );
  }
  return ok({ items, total: items.length });
}

/** Fetch single incident by ID */
export async function getIncident(id: string): Promise<ApiResult<Incident>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/incidents/${id}`); */
  const found = mockIncidents.find((i) => i.id === id);
  if (!found) return err(`Incident ${id} not found`);
  return ok(found);
}

/** Acknowledge an incident */
export async function acknowledgeIncident(
  id: string,
  note: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/acknowledge */
  console.info(`[MOCK] Acknowledged ${id}: ${note}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Escalate an incident */
export async function escalateIncident(
  id: string,
  reason: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/escalate */
  console.info(`[MOCK] Escalated ${id}: ${reason}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Submit an approved response action */
export async function submitResponse(
  incidentId: string,
  action: string,
  authorizedBy: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/response */
  console.info(`[MOCK] Response submitted for ${incidentId}: ${action} by ${authorizedBy}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Fetch all devices */
export async function getDevices(filters?: {
  criticality?: string;
  status?: string;
}): Promise<ApiResult<Device[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/devices`); */
  let items = [...mockDevices];
  if (filters?.criticality && filters.criticality !== "All")
    items = items.filter((d) => d.criticality === filters.criticality);
  if (filters?.status && filters.status !== "All")
    items = items.filter((d) => d.status === filters.status);
  return ok(items);
}

/** Request device isolation (requires admin authorization) */
export async function requestDeviceIsolation(
  deviceId: string,
  requestedBy: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/devices/:id/isolate */
  console.info(`[MOCK] Isolation requested for ${deviceId} by ${requestedBy}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Fetch case memory */
export async function getCases(): Promise<ApiResult<Case[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/cases`); */
  return ok(mockCases);
}

/** Fetch system service health */
export async function getSystemHealth(): Promise<ApiResult<ServiceStatus[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/system/health`); */
  return ok(mockServices);
}

/** Fetch audit log */
export async function getAuditLog(filters?: {
  action?: string;
  actor?: string;
  severity?: string;
}): Promise<ApiResult<AuditEvent[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/audit`); */
  let items = [...MOCK_AUDIT_EVENTS];
  if (filters?.action && filters.action !== "All")
    items = items.filter((e) => e.action === filters.action);
  if (filters?.actor) items = items.filter((e) => e.actor.includes(filters.actor!));
  if (filters?.severity && filters.severity !== "All")
    items = items.filter((e) => e.severity === filters.severity);
  return ok(items);
}

/** Fetch notifications */
export async function getNotifications(): Promise<ApiResult<Notification[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/notifications`); */
  return ok(MOCK_NOTIFICATIONS);
}

/** Fetch live traffic data */
export async function getTrafficData(): Promise<ApiResult<typeof trafficData>> {
  await delay();
  /* REPLACE WITH: WebSocket or polling /api/traffic/live */
  return ok(trafficData);
}

/** Fetch detection metrics */
export async function getDetectionMetrics(): Promise<
  ApiResult<{
    metrics: typeof mockDetectionMetrics;
    confusionMatrix: typeof mockConfusionMatrix;
    modelComparison: typeof mockModelComparison;
    featureImportance: typeof featureImportance;
    safeReuseMetrics: typeof mockSafeReuseMetrics;
    vectorMetrics: typeof mockVectorMetrics;
  }>
> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/evaluation/metrics`); */
  return ok({
    metrics: mockDetectionMetrics,
    confusionMatrix: mockConfusionMatrix,
    modelComparison: mockModelComparison,
    featureImportance,
    safeReuseMetrics: mockSafeReuseMetrics,
    vectorMetrics: mockVectorMetrics,
  });
}
