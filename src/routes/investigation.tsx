import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, SeverityBadge, SourceBadge, StatusBadge } from "@/components/soc/primitives";
import { PipelineFlow } from "@/components/soc/pipeline";
import { useIncidents } from "@/lib/sentineliq/hooks";
import { formatDateTime } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "Investigation Workspace — SentinelIQ" },
      { name: "description", content: "Pick a correlated incident and open the SentinelIQ investigation workspace with alerts, triage explanation and MITRE context." },
      { property: "og:title", content: "Investigation Workspace — SentinelIQ" },
      { property: "og:description", content: "Start an incident investigation from the correlated incident list." },
    ],
  }),
  component: InvestigationIndex,
});

function InvestigationIndex() {
  const { data } = useIncidents();
  const incidents = [...(data?.data ?? [])].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Analysis"
        title="Investigation"
        description="Select an incident to open its workspace: correlated alerts, correlation reasoning, XGBoost triage features, SHAP explanation, MITRE context and the AI-assisted summary."
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {incidents.map((inc) => (
          <Link
            key={inc.id}
            to="/incidents/$incidentId"
            params={{ incidentId: inc.id }}
            className="panel block p-3.5 transition-colors hover:border-border-strong hover:bg-accent/30"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-primary">{inc.id}</span>
              <SeverityBadge severity={inc.severity} />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{inc.title}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {inc.host} · {inc.source_ip ?? "—"} · {inc.alert_count} alerts · score {inc.priority_score}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{formatDateTime(inc.last_seen)}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={inc.status} />
              <span className="text-[11px] text-muted-foreground">{inc.assigned_analyst ?? "Unassigned"}</span>
            </div>
          </Link>
        ))}
      </div>
      <Panel title="What the workspace shows" subtitle="Responsibility of each stage">
        <PipelineFlow />
      </Panel>
    </div>
  );
}
