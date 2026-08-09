import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { PageHeader, Panel, SourceBadge } from "@/components/soc/primitives";
import { useCorrelationGroups } from "@/lib/sentineliq/hooks";
import { eventTypeLabel, formatDateTime, formatDuration, formatTime } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/correlations")({
  head: () => ({
    meta: [
      { title: "Alert Correlation — SentinelIQ" },
      { name: "description", content: "See how SentinelIQ groups related Wazuh alerts into a single incident using shared source, host, account and time window." },
      { property: "og:title", content: "Alert Correlation — SentinelIQ" },
      { property: "og:description", content: "Correlation groups explained step by step for SOC analysts and reviewers." },
    ],
  }),
  component: CorrelationsPage,
});

function CorrelationsPage() {
  const { data } = useCorrelationGroups();
  const groups = data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Analysis"
        title="Alert Correlation"
        description="Correlation turns many low-context alerts into one reviewable incident. Each group below lists the exact conditions the backend used to join its alerts."
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((g) => (
          <Panel
            key={g.id}
            title={`Correlation group ${g.id}`}
            subtitle={`${g.alert_count} alerts · ${g.window_minutes}-minute window · ${formatDuration(g.first_seen, g.last_seen)} span`}
            actions={
              g.incident_id ? (
                <Link to="/incidents/$incidentId" params={{ incidentId: g.incident_id }} className="font-mono text-xs text-primary hover:underline">
                  {g.incident_id}
                </Link>
              ) : null
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ol className="space-y-1">
                {g.reasons.map((r, i) => (
                  <li key={r.label}>
                    <div className="rounded-sm border border-border bg-surface px-2.5 py-1.5">
                      <p className="text-xs font-medium text-foreground">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground">{r.detail}</p>
                    </div>
                    {i < g.reasons.length - 1 && <ArrowDown className="mx-auto my-0.5 size-3 text-muted-foreground" aria-hidden />}
                  </li>
                ))}
              </ol>
              <div>
                <p className="label-caps">Observed sequence</p>
                <ol className="mt-1.5 space-y-1.5">
                  {g.chain.map((step, i) => (
                    <li key={`${g.id}-${i}`} className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
                      <div>
                        <p className="text-xs text-foreground">{step.stage}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {formatTime(step.at)} · {eventTypeLabel(step.event_type)}
                          {step.alert_ids.length ? ` · ${step.alert_ids.join(", ")}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                  Hosts: {g.hosts.join(", ")} · Sources: {g.source_ips.join(", ")}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatDateTime(g.first_seen)} → {formatDateTime(g.last_seen)}
                </p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
