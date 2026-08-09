import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Brain, CheckCircle2, ExternalLink, FileText, Sparkles, UserPlus } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { JsonViewer } from "@/components/soc/json-viewer";
import {
  AwaitingBackend,
  KeyValue,
  Panel,
  ScoreMeter,
  SeverityBadge,
  SourceBadge,
  StatusBadge,
} from "@/components/soc/primitives";
import {
  useIncident,
  useIncidentActions,
  useIncidentAlerts,
  useIncidentCorrelation,
  useIncidentExplanation,
  useIncidentMitre,
} from "@/lib/sentineliq/hooks";
import { INCIDENT_STATUSES, eventTypeLabel, formatDateTime, formatDuration, formatTime, severityMeta, statusMeta } from "@/lib/sentineliq/display";
import type { IncidentStatus } from "@/lib/sentineliq/types";

export const Route = createFileRoute("/incidents/$incidentId")({
  head: () => ({
    meta: [
      { title: "Incident Investigation — SentinelIQ" },
      {
        name: "description",
        content:
          "Investigation workspace: correlated alerts, XGBoost triage features, SHAP contributions, MITRE context and the AI-assisted incident summary.",
      },
      { property: "og:title", content: "Incident Investigation — SentinelIQ" },
      {
        property: "og:description",
        content: "Correlated alerts, priority explanation and MITRE context for a single SOC incident.",
      },
    ],
  }),
  component: InvestigationPage,
});

function InvestigationPage() {
  const { incidentId } = useParams({ from: "/incidents/$incidentId" });
  const incidentQuery = useIncident(incidentId);
  const alertsQuery = useIncidentAlerts(incidentId);
  const explanationQuery = useIncidentExplanation(incidentId);
  const mitreQuery = useIncidentMitre(incidentId);
  const correlationQuery = useIncidentCorrelation(incidentId);
  const actions = useIncidentActions(incidentId);

  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");

  const incident = incidentQuery.data?.data ?? null;
  const alerts = alertsQuery.data?.data ?? [];
  const explanation = explanationQuery.data?.data ?? null;
  const mitre = mitreQuery.data?.data ?? [];
  const correlation = correlationQuery.data?.data ?? null;

  if (!incident) {
    return (
      <Panel title="Incident not available">
        <p className="text-sm text-muted-foreground">
          {incidentQuery.isLoading ? "Loading incident…" : `No incident ${incidentId} was returned by the data source.`}
        </p>
        <Link to="/incidents" className="mt-3 inline-block text-xs text-primary hover:underline">
          Back to incident queue
        </Link>
      </Panel>
    );
  }

  const setStatus = (status: IncidentStatus) => {
    actions.setStatus.mutate(status, {
      onSuccess: () => toast.success(`Status set to ${statusMeta[status].label}`),
    });
  };

  const shapMax = explanation ? Math.max(...explanation.shap_values.map((s) => Math.abs(s.contribution))) : 1;

  return (
    <div className="space-y-4">
      <Link to="/incidents" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Incident queue
      </Link>

      {/* Header */}
      <div className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-primary">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <SourceBadge source={incidentQuery.data?.source} error={incidentQuery.data?.error} />
            </div>
            <h1 className="mt-1.5 text-lg font-semibold text-foreground">{incident.title}</h1>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KeyValue label="Affected host" value={incident.host} mono />
              <KeyValue label="Source" value={incident.source_ip ?? "—"} mono />
              <KeyValue label="Correlated alerts" value={`${incident.alert_count} alerts`} />
              <KeyValue
                label="Window"
                value={`${formatTime(incident.first_seen)} → ${formatTime(incident.last_seen)} (${formatDuration(incident.first_seen, incident.last_seen)})`}
                mono
              />
            </div>
          </div>
          <div className="w-full max-w-64 space-y-3">
            <ScoreMeter score={incident.priority_score} severity={incident.severity} />
            <KeyValue label="Assigned analyst" value={incident.assigned_analyst ?? "Unassigned"} />
          </div>
        </div>
      </div>

      {/* Analyst actions */}
      <Panel title="Analyst actions" subtitle="SentinelIQ assists — the analyst remains the decision maker. No automated containment is performed." bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={incident.status} onValueChange={(v) => setStatus(v as IncidentStatus)}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INCIDENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="analyst.id"
              className="h-8 w-36 rounded-sm border border-input bg-background px-2 text-xs outline-none focus:border-ring"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={!assignee.trim()}
              onClick={() =>
                actions.assign.mutate(assignee.trim(), {
                  onSuccess: () => {
                    toast.success(`Assigned to ${assignee.trim()}`);
                    setAssignee("");
                  },
                })
              }
            >
              <UserPlus className="size-3.5" aria-hidden /> Assign
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStatus("escalated")}>
            Escalate
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStatus("false_positive")}>
            Mark as false positive
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setStatus("closed")}>
            <CheckCircle2 className="size-3.5" aria-hidden /> Close incident
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
            <Link to="/reports">
              <FileText className="size-3.5" aria-hidden /> Report
            </Link>
          </Button>
        </div>
      </Panel>

      {/* Section A — AI summary */}
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden /> AI-assisted summary
          </span>
        }
        subtitle={
          incident.summary
            ? `Provider: ${incident.summary.provider} · Model: ${incident.summary.model} · Generated ${formatDateTime(incident.summary.generated_at)}`
            : undefined
        }
      >
        {incident.summary ? (
          <>
            <p className="text-sm leading-relaxed text-foreground">{incident.summary.text}</p>
            <p className="mt-3 rounded-sm border border-border bg-surface px-3 py-2 text-[11px] leading-snug text-muted-foreground">
              The local LLM did not detect this activity and did not assign the severity. It only rewrites the already
              correlated and scored incident information into analyst-readable text.
            </p>
          </>
        ) : (
          <AwaitingBackend label="No summary returned" />
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Section B — correlated alerts + timeline */}
        <Panel
          title="Correlated alerts"
          subtitle={`${alerts.length} Wazuh alerts grouped into this incident`}
          actions={<SourceBadge source={alertsQuery.data?.source} />}
          bodyClassName="p-0"
        >
          <ol className="divide-y divide-border">
            {alerts.map((a, i) => (
              <li key={a.id} className="flex gap-3 px-4 py-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2 rounded-full ${severityMeta[a.severity].bar}`} aria-hidden />
                  {i < alerts.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Alert {String(i + 1).padStart(2, "0")} · {formatTime(a.timestamp)}
                    </span>
                    <SeverityBadge severity={a.severity} />
                    <span className="font-mono text-[11px] text-primary">rule {a.rule_id}</span>
                    <span className="rounded-sm border border-border px-1.5 text-[11px] text-muted-foreground">
                      {eventTypeLabel(a.event_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-foreground">{a.rule_description}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {a.source_ip ?? "—"} → {a.host} {a.username ? `· user ${a.username}` : ""} · level {a.rule_level}
                  </p>
                  <div className="mt-2">
                    <JsonViewer data={a.raw} />
                  </div>
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="px-4 py-6 text-xs text-muted-foreground">No alerts returned for this incident.</li>
            )}
          </ol>
        </Panel>

        <div className="space-y-4">
          {/* Section C — correlation view */}
          <Panel title="Why these alerts were grouped" subtitle={correlation ? `Correlation group ${correlation.id} · ${correlation.window_minutes}-minute window` : undefined}>
            {correlation ? (
              <>
                <ol className="space-y-1.5">
                  {correlation.chain.map((step, i) => (
                    <li key={`${step.stage}-${i}`} className="flex items-start gap-2">
                      <span className="mt-1.5 font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 rounded-sm border border-border bg-surface px-2.5 py-1.5">
                        <p className="text-xs font-medium text-foreground">{step.stage}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {formatTime(step.at)} · {eventTypeLabel(step.event_type)}
                          {step.alert_ids.length ? ` · ${step.alert_ids.join(", ")}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {correlation.reasons.map((r) => (
                    <li key={r.label} className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.label}:</span> {r.detail}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <AwaitingBackend label="No correlation detail returned" />
            )}
          </Panel>

          {/* XGBoost triage */}
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Brain className="size-4 text-primary" aria-hidden /> ML-assisted triage
              </span>
            }
            subtitle="XGBoost estimates incident priority from structured incident features. It is not a language model and it does not detect attacks."
          >
            {explanation ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <KeyValue label="Model" value={`${explanation.model}${explanation.model_version ? ` · ${explanation.model_version}` : ""}`} mono />
                  <KeyValue
                    label="Prediction"
                    value={<span className={severityMeta[explanation.prediction].text}>{severityMeta[explanation.prediction].label} PRIORITY</span>}
                  />
                  <KeyValue label="Priority score" value={`${explanation.priority_score} / 100`} mono />
                </div>
                <table className="mt-3 w-full text-left text-xs">
                  <thead>
                    <tr className="label-caps border-b border-border">
                      <th className="py-1.5 font-medium">Feature supplied to the model</th>
                      <th className="py-1.5 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explanation.features.map((f) => (
                      <tr key={f.key} className="border-b border-border/60 last:border-0">
                        <td className="py-1.5 text-foreground">{f.label}</td>
                        <td className="py-1.5 text-right font-mono text-muted-foreground">{String(f.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <AwaitingBackend label="No triage output returned" />
            )}
          </Panel>
        </div>
      </div>

      {/* SHAP */}
      <Panel
        title="Why was this incident prioritized?"
        subtitle="SHAP values show how individual features influenced the XGBoost prediction. SHAP itself performs no prediction."
        actions={<SourceBadge source={explanationQuery.data?.source} />}
      >
        {explanation ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={Math.max(180, explanation.shap_values.length * 34)}>
                <BarChart data={explanation.shap_values} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                  <YAxis type="category" dataKey="label" width={190} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <ReferenceLine x={0} stroke="var(--border-strong)" />
                  <RTooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border-strong)", borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(2)}`, "SHAP contribution"]}
                  />
                  <Bar dataKey="contribution" barSize={16} radius={[0, 3, 3, 0]}>
                    {explanation.shap_values.map((s) => (
                      <Cell key={s.feature} fill={s.contribution >= 0 ? "var(--critical)" : "var(--low)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <KeyValue label="Model prediction" value={severityMeta[explanation.prediction].label} />
              {explanation.base_value != null && <KeyValue label="Model base value" value={explanation.base_value.toFixed(2)} mono />}
              <ul className="space-y-1 border-t border-border pt-2">
                {explanation.shap_values.map((s) => (
                  <li key={s.feature} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">{s.label}</span>
                    <span className={`font-mono ${s.contribution >= 0 ? "text-critical" : "text-low"}`}>
                      {s.contribution > 0 ? "+" : ""}
                      {s.contribution.toFixed(2)}
                      <span className="ml-1 text-muted-foreground">
                        {"·".repeat(Math.max(1, Math.round((Math.abs(s.contribution) / shapMax) * 6)))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground">
                Positive values pushed the prediction towards a higher priority; negative values pulled it down.
              </p>
            </div>
          </div>
        ) : (
          <AwaitingBackend label="No explanation returned" />
        )}
      </Panel>

      {/* MITRE */}
      <Panel
        title="MITRE ATT&CK context"
        subtitle="Mappings are supplied by the SentinelIQ backend from alert evidence. The dashboard never infers techniques on its own."
        actions={
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled>
            <ExternalLink className="size-3.5" aria-hidden /> View in MITRE ATT&CK
          </Button>
        }
        bodyClassName="p-0"
      >
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-surface">
            <tr className="label-caps">
              <th className="px-4 py-2 font-medium">Technique</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Tactic</th>
              <th className="px-3 py-2 font-medium">Evidence</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {mitre.map((t) => (
              <tr key={t.technique_id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-primary">{t.technique_id}</td>
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.tactic}</td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">{t.evidence ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{t.confidence != null ? `${Math.round(t.confidence * 100)}%` : "—"}</td>
              </tr>
            ))}
            {mitre.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-xs text-muted-foreground">
                  No MITRE mappings returned for this incident.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      {/* Notes */}
      <Panel title="Analyst notes" subtitle="Investigation trail recorded against this incident">
        <div className="space-y-2">
          {incident.notes.map((n) => (
            <div key={n.id} className="rounded-sm border border-border bg-surface px-3 py-2">
              <p className="font-mono text-[11px] text-muted-foreground">
                {n.author} · {formatDateTime(n.created_at)}
              </p>
              <p className="mt-1 text-[13px] text-foreground">{n.body}</p>
            </div>
          ))}
          {incident.notes.length === 0 && <p className="text-xs text-muted-foreground">No notes recorded yet.</p>}
        </div>
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an investigation note…"
            className="min-h-20 text-sm"
          />
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!note.trim()}
            onClick={() =>
              actions.addNote.mutate(note.trim(), {
                onSuccess: () => {
                  setNote("");
                  toast.success("Note added");
                },
              })
            }
          >
            Add note
          </Button>
        </div>
      </Panel>
    </div>
  );
}
