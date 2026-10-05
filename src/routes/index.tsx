import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock, Layers, ShieldAlert, ShieldCheck, Siren } from "lucide-react";
import { KpiCard } from "@/components/soc/kpi-card";
import { PipelineFlow } from "@/components/soc/pipeline";
import {
  AwaitingBackend,
  PageHeader,
  Panel,
  SeverityBadge,
  SourceBadge,
  StatusBadge,
} from "@/components/soc/primitives";
import { useDashboardMetrics, useIncidents } from "@/lib/sentineliq/hooks";
import { formatTime, severityMeta } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOC Overview — SentinelIQ Triage Console" },
      {
        name: "description",
        content:
          "Live SOC overview: correlated incident queue, alert volume, severity distribution and MITRE technique spread from the SentinelIQ backend.",
      },
      { property: "og:title", content: "SOC Overview — SentinelIQ Triage Console" },
      {
        property: "og:description",
        content: "Correlated incident queue, alert volume and MITRE technique spread for SOC analysts.",
      },
    ],
  }),
  component: OverviewPage,
});

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border-strong)",
    borderRadius: 6,
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11 },
};

function OverviewPage() {
  const metricsQuery = useDashboardMetrics();
  const incidentsQuery = useIncidents();
  const m = metricsQuery.data?.data;
  const incidents = incidentsQuery.data?.data ?? [];

  const queue = [...incidents].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Security Operations Center"
        title="SOC Overview"
        description="SentinelIQ correlates Wazuh alerts into incidents, scores them with XGBoost, explains the score with SHAP and adds MITRE ATT&CK context for the analyst."
        actions={<SourceBadge source={metricsQuery.data?.source} error={metricsQuery.data?.error} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Critical incidents" value={m?.critical_incidents ?? "—"} accent="critical" icon={<Siren className="size-4" />} />
        <KpiCard label="High priority" value={m?.high_incidents ?? "—"} accent="high" icon={<ShieldAlert className="size-4" />} />
        <KpiCard label="Open incidents" value={m?.open_incidents ?? "—"} accent="neutral" icon={<Layers className="size-4" />} />
        <KpiCard label="Alerts today" value={m?.alerts_today ?? "—"} accent="low" icon={<AlertTriangle className="size-4" />} />
        <KpiCard
          label="Correlated incidents"
          value={m?.correlated_incidents ?? "—"}
          accent="ok"
          icon={<ShieldCheck className="size-4" />}
        />
        <KpiCard
          label="Avg triage time"
          value={m?.avg_triage_minutes != null ? `${m.avg_triage_minutes}m` : "—"}
          hint={m?.avg_triage_minutes == null ? "Awaiting backend data" : "Measured on closed incidents"}
          accent="medium"
          icon={<Clock className="size-4" />}
        />
      </div>

      <Panel title="Processing pipeline" subtitle="Where each stage runs and who owns it">
        <PipelineFlow />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Alerts and incidents over time"
          subtitle="Wazuh alerts ingested vs incidents created"
          className="xl:col-span-2"
          actions={<SourceBadge source={metricsQuery.data?.source} />}
        >
          {m ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={m.alerts_over_time}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bucket" {...axis} />
                <YAxis {...axis} width={28} />
                <RTooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  name="Alerts"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  name="Incidents"
                  stroke="var(--chart-3)"
                  fill="var(--chart-3)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>

        <Panel title="Incidents by severity" subtitle="Current open incident mix">
          {m ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={m.incidents_by_severity} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="severity" {...axis} width={64} />
                <RTooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Incidents" radius={[0, 3, 3, 0]} barSize={18}>
                  {m.incidents_by_severity.map((d) => (
                    <Cell key={d.severity} fill={severityMeta[d.severity].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Panel title="Alert-to-incident correlation" subtitle="Share of ingested alerts grouped into incidents">
          {m ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Correlated", value: m.correlation_ratio.correlated },
                    { name: "Uncorrelated", value: m.correlation_ratio.uncorrelated },
                  ]}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="var(--card)"
                >
                  <Cell fill="var(--chart-1)" />
                  <Cell fill="var(--border-strong)" />
                </Pie>
                <RTooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>

        <Panel title="Top affected hosts" subtitle="Alert volume per Wazuh agent host">
          {m ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.top_hosts} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="host" {...axis} width={110} />
                <RTooltip {...tooltipStyle} />
                <Bar dataKey="alerts" name="Alerts" fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>

        <Panel title="Top source IPs" subtitle="Most frequent alert sources">
          {m ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.top_source_ips} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="source_ip" {...axis} width={100} />
                <RTooltip {...tooltipStyle} />
                <Bar dataKey="alerts" name="Alerts" fill="var(--chart-3)" radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>

        <Panel title="MITRE technique heatmap" subtitle="From backend-provided mappings only">
          {m ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {m.mitre_distribution.map((tech) => {
                const max = Math.max(...m.mitre_distribution.map((t) => t.count));
                const pct = Math.round(15 + (tech.count / max) * 70);
                return (
                  <div
                    key={tech.technique_id}
                    title={`${tech.technique_id} ${tech.name}: ${tech.count} alerts`}
                    className="rounded-sm border border-border p-2"
                    style={{ backgroundColor: `color-mix(in oklab, var(--critical) ${pct}%, var(--card))` }}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-mono text-[11px] font-semibold text-foreground">{tech.technique_id}</span>
                      <span className="font-mono text-[11px] text-foreground">{tech.count}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-foreground/80">{tech.name}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>
      </div>

      <Panel
        title="Priority incident queue"
        subtitle="Ordered by XGBoost priority score"
        bodyClassName="p-0"
        actions={
          <Link to="/incidents" className="text-xs text-primary hover:underline">
            Open full queue
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface">
              <tr className="label-caps">
                <th className="px-4 py-2 font-medium">Incident</th>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Host</th>
                <th className="px-3 py-2 font-medium">Source IP</th>
                <th className="px-3 py-2 font-medium">Alerts</th>
                <th className="px-3 py-2 font-medium">MITRE</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Analyst</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((inc) => (
                <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-2">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {inc.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{formatTime(inc.last_seen)}</td>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="max-w-72 truncate px-3 py-2 text-foreground">{inc.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">{inc.host}</td>
                  <td className="px-3 py-2 font-mono text-xs">{inc.source_ip ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{inc.alert_count}</td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{inc.mitre_techniques[0] ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{inc.assigned_analyst ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
