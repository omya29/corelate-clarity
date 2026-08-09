/**
 * SentinelIQ API service layer.
 *
 * The React dashboard talks ONLY to the SentinelIQ FastAPI backend.
 * It never calls the Wazuh API directly and holds no Wazuh credentials.
 *
 * Every call returns a Result<T> that records whether the payload came from the
 * live backend or from the local DEMO dataset, so the UI can label it honestly.
 */
import {
  demoAlerts,
  demoAnalytics,
  demoCorrelationGroups,
  demoExplanations,
  demoHealth,
  demoIncidents,
  demoMetrics,
  demoMitre,
} from "./demo-data";
import type {
  AnalyticsMetrics,
  CorrelationGroup,
  DashboardMetrics,
  HealthResponse,
  Incident,
  IncidentExplanation,
  IncidentStatus,
  MitreTechnique,
  WazuhAlert,
} from "./types";

export const API_BASE_URL =
  (import.meta.env["VITE_SENTINELIQ_API_URL"] as string | undefined) ?? "http://localhost:8000";

export type DataSource = "live" | "demo";

export interface Result<T> {
  data: T;
  source: DataSource;
  /** Populated when a live request was attempted and failed. */
  error?: string;
}

export type Mode = "demo" | "live";

const REQUEST_TIMEOUT_MS = 6000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Attempts the live backend when mode is "live"; falls back to demo data with an
 * explicit error message so the UI can show that the backend is not connected.
 */
async function withFallback<T>(mode: Mode, path: string, demo: () => T, init?: RequestInit): Promise<Result<T>> {
  if (mode === "demo") return { data: demo(), source: "demo" };
  try {
    return { data: await request<T>(path, init), source: "live" };
  } catch (err) {
    return {
      data: demo(),
      source: "demo",
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

/* ------------------------------------------------------------------ *
 * Local demo store — analyst actions mutate this in-memory copy only.
 * ------------------------------------------------------------------ */
const demoStore = {
  incidents: demoIncidents.map((i) => ({ ...i, notes: [...i.notes] })),
};

export const demoState = {
  incidents: () => demoStore.incidents,
  reset() {
    demoStore.incidents = demoIncidents.map((i) => ({ ...i, notes: [...i.notes] }));
  },
};

function findDemoIncident(id: string) {
  const incident = demoStore.incidents.find((i) => i.id === id);
  if (!incident) throw new Error(`Incident ${id} not found in demo dataset`);
  return incident;
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/** GET /api/health */
export const getHealth = (mode: Mode) =>
  withFallback<HealthResponse>(mode, "/api/health", () => demoHealth);

/** GET /api/alerts */
export const listAlerts = (mode: Mode) => withFallback<WazuhAlert[]>(mode, "/api/alerts", () => demoAlerts);

/** GET /api/alerts/{id} */
export const getAlert = (mode: Mode, id: string) =>
  withFallback<WazuhAlert | null>(mode, `/api/alerts/${id}`, () => demoAlerts.find((a) => a.id === id) ?? null);

/** GET /api/incidents */
export const listIncidents = (mode: Mode) =>
  withFallback<Incident[]>(mode, "/api/incidents", () => demoStore.incidents);

/** GET /api/incidents/{id} */
export const getIncident = (mode: Mode, id: string) =>
  withFallback<Incident | null>(
    mode,
    `/api/incidents/${id}`,
    () => demoStore.incidents.find((i) => i.id === id) ?? null,
  );

/** GET /api/incidents/{id}/alerts */
export const getIncidentAlerts = (mode: Mode, id: string) =>
  withFallback<WazuhAlert[]>(mode, `/api/incidents/${id}/alerts`, () =>
    demoAlerts.filter((a) => a.incident_id === id),
  );

/** GET /api/incidents/{id}/explanation */
export const getIncidentExplanation = (mode: Mode, id: string) =>
  withFallback<IncidentExplanation | null>(
    mode,
    `/api/incidents/${id}/explanation`,
    () => demoExplanations[id] ?? null,
  );

/** GET /api/incidents/{id}/mitre */
export const getIncidentMitre = (mode: Mode, id: string) =>
  withFallback<MitreTechnique[]>(mode, `/api/incidents/${id}/mitre`, () => demoMitre[id] ?? []);

/** GET /api/dashboard/metrics */
export const getDashboardMetrics = (mode: Mode) =>
  withFallback<DashboardMetrics>(mode, "/api/dashboard/metrics", () => demoMetrics);

/** GET /api/analytics (planned endpoint) */
export const getAnalytics = (mode: Mode) =>
  withFallback<AnalyticsMetrics>(mode, "/api/analytics", () => demoAnalytics);

/** GET /api/correlations (planned endpoint) */
export const listCorrelationGroups = (mode: Mode) =>
  withFallback<CorrelationGroup[]>(mode, "/api/correlations", () => demoCorrelationGroups);

/** GET /api/incidents/{id}/correlation (planned endpoint) */
export const getIncidentCorrelation = (mode: Mode, id: string) =>
  withFallback<CorrelationGroup | null>(
    mode,
    `/api/incidents/${id}/correlation`,
    () => demoCorrelationGroups.find((g) => g.incident_id === id) ?? null,
  );

/* ------------------------------------------------------------------ *
 * Analyst actions (no automated containment — the analyst decides)
 * ------------------------------------------------------------------ */

/** PATCH /api/incidents/{id}/status */
export const updateIncidentStatus = (mode: Mode, id: string, status: IncidentStatus) =>
  withFallback<Incident>(
    mode,
    `/api/incidents/${id}/status`,
    () => {
      const incident = findDemoIncident(id);
      incident.status = status;
      return incident;
    },
    { method: "PATCH", body: JSON.stringify({ status }) },
  );

/** POST /api/incidents/{id}/notes */
export const addIncidentNote = (mode: Mode, id: string, body: string, author: string) =>
  withFallback<Incident>(
    mode,
    `/api/incidents/${id}/notes`,
    () => {
      const incident = findDemoIncident(id);
      incident.notes = [
        ...incident.notes,
        { id: `NOTE-${incident.notes.length + 1}-${Date.now()}`, author, created_at: new Date().toISOString(), body },
      ];
      return incident;
    },
    { method: "POST", body: JSON.stringify({ body, author }) },
  );

/** POST /api/incidents/{id}/assign */
export const assignIncident = (mode: Mode, id: string, analyst: string) =>
  withFallback<Incident>(
    mode,
    `/api/incidents/${id}/assign`,
    () => {
      const incident = findDemoIncident(id);
      incident.assigned_analyst = analyst;
      return incident;
    },
    { method: "POST", body: JSON.stringify({ analyst }) },
  );

/** POST /api/incidents/{id}/summary — asks the backend to (re)generate the LLM summary */
export const regenerateSummary = (mode: Mode, id: string) =>
  withFallback<Incident>(
    mode,
    `/api/incidents/${id}/summary`,
    () => findDemoIncident(id),
    { method: "POST" },
  );

/** Endpoint inventory shown on the System Status page. */
export const API_ENDPOINTS = [
  { method: "GET", path: "/api/health", purpose: "Component health for Wazuh, FastAPI, PostgreSQL, XGBoost, SHAP, Ollama" },
  { method: "GET", path: "/api/alerts", purpose: "Normalized Wazuh alerts ingested by SentinelIQ" },
  { method: "GET", path: "/api/alerts/{id}", purpose: "Single alert including raw Wazuh event" },
  { method: "GET", path: "/api/incidents", purpose: "Correlated incidents with priority score" },
  { method: "GET", path: "/api/incidents/{id}", purpose: "Incident detail" },
  { method: "GET", path: "/api/incidents/{id}/alerts", purpose: "Alerts belonging to the incident" },
  { method: "GET", path: "/api/incidents/{id}/explanation", purpose: "XGBoost features and SHAP contributions" },
  { method: "GET", path: "/api/incidents/{id}/mitre", purpose: "Backend-provided MITRE ATT&CK mappings" },
  { method: "GET", path: "/api/dashboard/metrics", purpose: "Overview KPI and chart data" },
  { method: "PATCH", path: "/api/incidents/{id}/status", purpose: "Analyst status change" },
  { method: "POST", path: "/api/incidents/{id}/notes", purpose: "Analyst investigation note" },
  { method: "POST", path: "/api/incidents/{id}/assign", purpose: "Assign incident to an analyst" },
  { method: "POST", path: "/api/incidents/{id}/summary", purpose: "Request Ollama-generated incident summary" },
] as const;
