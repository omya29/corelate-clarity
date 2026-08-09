import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SourceBadge, StateIndicator } from "@/components/soc/primitives";
import { PipelineFlow } from "@/components/soc/pipeline";
import { useHealth } from "@/lib/sentineliq/hooks";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/sentineliq/api";
import { formatDateTime } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/system-status")({
  head: () => ({
    meta: [
      { title: "System Status — SentinelIQ" },
      { name: "description", content: "Component health for Wazuh API, FastAPI, PostgreSQL, the XGBoost model, SHAP, Ollama and the React frontend." },
      { property: "og:title", content: "System Status — SentinelIQ" },
      { property: "og:description", content: "Live component health as reported by the SentinelIQ backend health endpoint." },
    ],
  }),
  component: SystemStatusPage,
});

function SystemStatusPage() {
  const { data } = useHealth();
  const health = data?.data;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Platform"
        title="System Status"
        description={`Component states are read from GET /api/health on the SentinelIQ backend (${API_BASE_URL}). Nothing here is hardcoded as connected.`}
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />

      <Panel bodyClassName="p-0" subtitle={health ? `Last checked ${formatDateTime(health.checked_at)}` : undefined}>
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-surface">
            <tr className="label-caps">
              <th className="px-4 py-2 font-medium">Component</th>
              <th className="px-3 py-2 font-medium">Responsibility</th>
              <th className="px-3 py-2 font-medium">State</th>
              <th className="px-3 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {(health?.components ?? []).map((c) => (
              <tr key={c.key} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{c.role}</td>
                <td className="px-3 py-2"><StateIndicator state={c.state} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{c.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Architecture" subtitle="React talks only to FastAPI; Wazuh is reached server-side">
        <PipelineFlow />
      </Panel>

      <Panel title="Backend endpoints expected by this dashboard" bodyClassName="p-0">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-surface">
            <tr className="label-caps">
              <th className="px-4 py-2 font-medium">Method</th>
              <th className="px-3 py-2 font-medium">Path</th>
              <th className="px-3 py-2 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {API_ENDPOINTS.map((e) => (
              <tr key={`${e.method}-${e.path}`} className="border-b border-border last:border-0">
                <td className="px-4 py-1.5 font-mono text-xs text-primary">{e.method}</td>
                <td className="px-3 py-1.5 font-mono text-xs">{e.path}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground">{e.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
