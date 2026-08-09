import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, SourceBadge } from "@/components/soc/primitives";
import { useDashboardMetrics, useIncidents } from "@/lib/sentineliq/hooks";
import { demoMitre } from "@/lib/sentineliq/demo-data";
import { useMode } from "@/lib/sentineliq/mode";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/mitre")({
  head: () => ({
    meta: [
      { title: "MITRE ATT&CK Context — SentinelIQ" },
      { name: "description", content: "Observed MITRE ATT&CK techniques and tactics for correlated incidents, using backend-provided mappings only." },
      { property: "og:title", content: "MITRE ATT&CK Context — SentinelIQ" },
      { property: "og:description", content: "Techniques, tactics and incident relationships observed in the lab environment." },
    ],
  }),
  component: MitrePage,
});

function MitrePage() {
  const metricsQuery = useDashboardMetrics();
  const { data: incidentData } = useIncidents();
  const { mode } = useMode();
  const incidents = incidentData?.data ?? [];
  const distribution = metricsQuery.data?.data?.mitre_distribution ?? [];

  // Technique detail (tactic/evidence) is only available per incident from the backend.
  const detail = mode === "demo" ? Object.values(demoMitre).flat() : [];
  const tactics = [...new Set(detail.map((t) => t.tactic))];
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Analysis"
        title="MITRE ATT&CK"
        description="Only techniques returned by the SentinelIQ backend are shown. This is contextual mapping for observed incidents, not a full ATT&CK implementation."
        actions={<SourceBadge source={metricsQuery.data?.source} error={metricsQuery.data?.error} />}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Technique frequency" subtitle="Across current incidents" className="xl:col-span-2">
          <ul className="space-y-2">
            {distribution.map((t) => (
              <li key={t.technique_id}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate"><span className="font-mono text-primary">{t.technique_id}</span> {t.name}</span>
                  <span className="font-mono text-muted-foreground">{t.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(t.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
            {distribution.length === 0 && <li className="text-xs text-muted-foreground">No techniques returned.</li>}
          </ul>
        </Panel>
        <Panel title="Tactics observed" subtitle="Derived from mapped techniques">
          <ul className="flex flex-wrap gap-1.5">
            {tactics.map((t) => (
              <li key={t} className="rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-foreground">{t}</li>
            ))}
            {tactics.length === 0 && <li className="text-xs text-muted-foreground">Tactic detail comes from per-incident mappings.</li>}
          </ul>
          <Button variant="outline" size="sm" className="mt-3 h-7 gap-1.5 text-xs" disabled>
            <ExternalLink className="size-3.5" aria-hidden /> View in MITRE ATT&CK
          </Button>
        </Panel>
      </div>

      <Panel title="Incident ↔ technique matrix" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface">
              <tr className="label-caps">
                <th className="px-4 py-2 font-medium">Incident</th>
                {distribution.map((t) => (
                  <th key={t.technique_id} className="px-3 py-2 font-mono font-medium">{t.technique_id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <Link to="/incidents/$incidentId" params={{ incidentId: inc.id }} className="font-mono text-xs text-primary hover:underline">
                      {inc.id}
                    </Link>
                  </td>
                  {distribution.map((t) => (
                    <td key={t.technique_id} className="px-3 py-2">
                      {inc.mitre_techniques.includes(t.technique_id) ? (
                        <span className="inline-block size-3 rounded-sm bg-primary" aria-label="mapped" />
                      ) : (
                        <span className="inline-block size-3 rounded-sm border border-border" aria-hidden />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
