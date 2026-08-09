import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AwaitingBackend, KeyValue, PageHeader, Panel, SeverityBadge, SourceBadge, StatusBadge } from "@/components/soc/primitives";
import { useIncidentAlerts, useIncidentCorrelation, useIncidentExplanation, useIncidentMitre, useIncidents } from "@/lib/sentineliq/hooks";
import { formatDateTime, formatTime, severityMeta } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Incident Reports — SentinelIQ" },
      { name: "description", content: "Generate a full incident report: correlated alerts, XGBoost priority, SHAP explanation, MITRE techniques, AI summary and analyst notes." },
      { property: "og:title", content: "Incident Reports — SentinelIQ" },
      { property: "og:description", content: "Printable incident report assembled from SentinelIQ backend data." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useIncidents();
  const incidents = data?.data ?? [];
  const [selected, setSelected] = useState<string>("");
  const id = selected || incidents[0]?.id || "";
  const incident = incidents.find((i) => i.id === id) ?? null;

  const alerts = useIncidentAlerts(id).data?.data ?? [];
  const explanation = useIncidentExplanation(id).data?.data ?? null;
  const mitre = useIncidentMitre(id).data?.data ?? [];
  const correlation = useIncidentCorrelation(id).data?.data ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Reporting"
        title="Incident Reports"
        description="A single-page record of one incident for handover, review or submission."
        actions={
          <div className="flex items-center gap-2">
            <SourceBadge source={data?.source} error={data?.error} />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => window.print()}>
              <Printer className="size-3.5" aria-hidden /> Print
            </Button>
          </div>
        }
      />

      <Panel bodyClassName="p-3">
        <Select value={id} onValueChange={setSelected}>
          <SelectTrigger className="h-9 w-full max-w-96 text-xs"><SelectValue placeholder="Select incident" /></SelectTrigger>
          <SelectContent>
            {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.id} — {i.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </Panel>

      {!incident ? (
        <Panel><AwaitingBackend label="No incident selected" /></Panel>
      ) : (
        <Panel title={`${incident.id} — ${incident.title}`} subtitle={`Report generated from ${data?.source === "live" ? "live backend data" : "the demo dataset"}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KeyValue label="Date / time" value={`${formatDateTime(incident.first_seen)} → ${formatDateTime(incident.last_seen)}`} mono />
            <KeyValue label="Affected host" value={incident.host} mono />
            <KeyValue label="Source" value={incident.source_ip ?? "—"} mono />
            <KeyValue label="Correlation group" value={incident.correlation_group ?? "—"} mono />
            <div><p className="label-caps">Severity</p><div className="mt-1"><SeverityBadge severity={incident.severity} /></div></div>
            <KeyValue label="Priority score" value={`${incident.priority_score}/100`} mono />
            <KeyValue label="XGBoost prediction" value={<span className={incident.ml_prediction ? severityMeta[incident.ml_prediction].text : ""}>{incident.ml_prediction ? severityMeta[incident.ml_prediction].label : "—"}</span>} />
            <div><p className="label-caps">Final status</p><div className="mt-1"><StatusBadge status={incident.status} /></div></div>
          </div>

          <section className="mt-5">
            <p className="label-caps">AI-assisted summary {incident.summary ? `(${incident.summary.provider})` : ""}</p>
            <p className="mt-1 text-sm text-foreground">{incident.summary?.text ?? "No summary returned by the backend."}</p>
          </section>

          <section className="mt-5">
            <p className="label-caps">Related alerts ({alerts.length})</p>
            <ul className="mt-1 space-y-1">
              {alerts.map((a) => (
                <li key={a.id} className="font-mono text-[11px] text-muted-foreground">
                  {formatTime(a.timestamp)} · {a.id} · rule {a.rule_id} · {a.severity} · {a.rule_description}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-5">
            <p className="label-caps">Correlation information</p>
            <ul className="mt-1 space-y-1 text-[12px] text-muted-foreground">
              {(correlation?.reasons ?? []).map((r) => (
                <li key={r.label}><span className="text-foreground">{r.label}:</span> {r.detail}</li>
              ))}
              {!correlation && <li>No correlation detail returned.</li>}
            </ul>
          </section>

          <section className="mt-5">
            <p className="label-caps">SHAP explanation of the XGBoost prediction</p>
            <ul className="mt-1 space-y-1 text-[12px]">
              {(explanation?.shap_values ?? []).map((s) => (
                <li key={s.feature} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={`font-mono ${s.contribution >= 0 ? "text-critical" : "text-low"}`}>
                    {s.contribution > 0 ? "+" : ""}{s.contribution.toFixed(2)}
                  </span>
                </li>
              ))}
              {!explanation && <li className="text-muted-foreground">No explanation returned.</li>}
            </ul>
          </section>

          <section className="mt-5">
            <p className="label-caps">MITRE ATT&CK techniques</p>
            <ul className="mt-1 space-y-1 text-[12px] text-muted-foreground">
              {mitre.map((t) => (
                <li key={t.technique_id}><span className="font-mono text-primary">{t.technique_id}</span> {t.name} — {t.tactic}</li>
              ))}
              {mitre.length === 0 && <li>No mappings returned.</li>}
            </ul>
          </section>

          <section className="mt-5">
            <p className="label-caps">Analyst notes</p>
            <ul className="mt-1 space-y-1 text-[12px] text-muted-foreground">
              {incident.notes.map((n) => <li key={n.id}>{formatDateTime(n.created_at)} · {n.author}: {n.body}</li>)}
              {incident.notes.length === 0 && <li>No notes recorded.</li>}
            </ul>
          </section>
        </Panel>
      )}
    </div>
  );
}
