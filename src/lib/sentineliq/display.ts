import type { ComponentState, CorrelationStatus, IncidentStatus, Severity } from "./types";

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export const severityMeta: Record<Severity, { label: string; badge: string; text: string; bar: string; color: string }> = {
  critical: {
    label: "CRITICAL",
    badge: "bg-critical-soft text-critical border-critical/40",
    text: "text-critical",
    bar: "bg-critical",
    color: "var(--critical)",
  },
  high: {
    label: "HIGH",
    badge: "bg-high-soft text-high border-high/40",
    text: "text-high",
    bar: "bg-high",
    color: "var(--high)",
  },
  medium: {
    label: "MEDIUM",
    badge: "bg-medium-soft text-medium border-medium/40",
    text: "text-medium",
    bar: "bg-medium",
    color: "var(--medium)",
  },
  low: {
    label: "LOW",
    badge: "bg-low-soft text-low border-low/40",
    text: "text-low",
    bar: "bg-low",
    color: "var(--low)",
  },
};

export const statusMeta: Record<IncidentStatus, { label: string; badge: string }> = {
  new: { label: "New", badge: "bg-primary/12 text-primary border-primary/35" },
  triaged: { label: "Triaged", badge: "bg-secondary text-secondary-foreground border-border-strong" },
  investigating: { label: "Investigating", badge: "bg-medium-soft text-medium border-medium/40" },
  escalated: { label: "Escalated", badge: "bg-critical-soft text-critical border-critical/40" },
  false_positive: { label: "False positive", badge: "bg-muted text-muted-foreground border-border-strong" },
  closed: { label: "Closed", badge: "bg-ok-soft text-ok border-ok/40" },
};

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "new",
  "triaged",
  "investigating",
  "escalated",
  "false_positive",
  "closed",
];

export const correlationMeta: Record<CorrelationStatus, { label: string; badge: string }> = {
  correlated: { label: "Correlated", badge: "bg-primary/12 text-primary border-primary/35" },
  uncorrelated: { label: "Uncorrelated", badge: "bg-muted text-muted-foreground border-border-strong" },
  part_of_incident: { label: "Part of incident", badge: "bg-ok-soft text-ok border-ok/40" },
};

export const componentStateMeta: Record<ComponentState, { label: string; dot: string; text: string }> = {
  connected: { label: "CONNECTED", dot: "bg-ok", text: "text-ok" },
  disconnected: { label: "DISCONNECTED", dot: "bg-critical", text: "text-critical" },
  loaded: { label: "LOADED", dot: "bg-ok", text: "text-ok" },
  not_loaded: { label: "NOT LOADED", dot: "bg-critical", text: "text-critical" },
  available: { label: "AVAILABLE", dot: "bg-ok", text: "text-ok" },
  unavailable: { label: "UNAVAILABLE", dot: "bg-critical", text: "text-critical" },
  online: { label: "ONLINE", dot: "bg-ok", text: "text-ok" },
  degraded: { label: "DEGRADED", dot: "bg-warn", text: "text-warn" },
  unknown: { label: "UNKNOWN", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(11, 19);
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)}Z`;
}

export function formatDuration(fromIso: string, toIso: string) {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function eventTypeLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
