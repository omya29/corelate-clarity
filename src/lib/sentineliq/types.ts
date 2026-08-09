/**
 * SentinelIQ domain types.
 *
 * These mirror the contract expected from the SentinelIQ FastAPI backend.
 * React never talks to Wazuh directly — only to the SentinelIQ API.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type IncidentStatus =
  | "new"
  | "triaged"
  | "investigating"
  | "escalated"
  | "false_positive"
  | "closed";

export type CorrelationStatus = "correlated" | "uncorrelated" | "part_of_incident";

export interface WazuhAlert {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_description: string;
  rule_level: number;
  severity: Severity;
  agent: string;
  host: string;
  source_ip: string | null;
  destination_ip: string | null;
  username: string | null;
  event_type: string;
  correlation_status: CorrelationStatus;
  incident_id: string | null;
  raw: Record<string, unknown>;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  priority_score: number;
  ml_prediction: Severity | null;
  alert_count: number;
  first_seen: string;
  last_seen: string;
  host: string;
  source_ip: string | null;
  mitre_techniques: string[];
  assigned_analyst: string | null;
  correlation_group: string | null;
  summary: IncidentSummary | null;
  notes: IncidentNote[];
}

export interface IncidentSummary {
  text: string;
  provider: string;
  model: string;
  generated_at: string;
}

export interface IncidentNote {
  id: string;
  author: string;
  created_at: string;
  body: string;
}

export interface TriageFeature {
  key: string;
  label: string;
  value: number | string;
  description?: string;
}

export interface ShapContribution {
  feature: string;
  label: string;
  contribution: number;
}

export interface IncidentExplanation {
  model: string;
  model_version: string | null;
  prediction: Severity;
  priority_score: number;
  base_value: number | null;
  features: TriageFeature[];
  shap_values: ShapContribution[];
}

export interface MitreTechnique {
  technique_id: string;
  name: string;
  tactic: string;
  evidence: string | null;
  confidence: number | null;
}

export interface CorrelationStep {
  label: string;
  detail: string;
}

export interface CorrelationGroup {
  id: string;
  incident_id: string | null;
  alert_count: number;
  window_minutes: number;
  first_seen: string;
  last_seen: string;
  hosts: string[];
  source_ips: string[];
  reasons: CorrelationStep[];
  chain: { stage: string; event_type: string; alert_ids: string[]; at: string }[];
}

export interface DashboardMetrics {
  critical_incidents: number;
  high_incidents: number;
  open_incidents: number;
  alerts_today: number;
  correlated_incidents: number;
  avg_triage_minutes: number | null;
  alerts_over_time: { bucket: string; alerts: number; incidents: number }[];
  incidents_by_severity: { severity: Severity; count: number }[];
  correlation_ratio: { correlated: number; uncorrelated: number };
  top_hosts: { host: string; alerts: number }[];
  top_source_ips: { source_ip: string; alerts: number }[];
  mitre_distribution: { technique_id: string; name: string; count: number }[];
}

export interface AnalyticsMetrics {
  alerts_per_day: { day: string; alerts: number }[];
  incidents_per_day: { day: string; incidents: number }[];
  severity_distribution: { severity: Severity; count: number }[];
  correlation_rate: number | null;
  false_positive_rate: number | null;
  triage_time_minutes: { day: string; minutes: number }[] | null;
}

export type ComponentState =
  | "connected"
  | "disconnected"
  | "loaded"
  | "not_loaded"
  | "available"
  | "unavailable"
  | "online"
  | "degraded"
  | "unknown";

export interface HealthComponent {
  key: string;
  name: string;
  role: string;
  state: ComponentState;
  detail: string | null;
  latency_ms: number | null;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  environment: string;
  demo_mode: boolean;
  components: HealthComponent[];
  checked_at: string;
}
