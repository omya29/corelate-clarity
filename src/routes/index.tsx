import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AbstentionBadge } from "@/components/soc/abstention";
import { KpiCard } from "@/components/soc/kpi-card";
import {
  AwaitingBackend,
  PageHeader,
  Panel,
  RankedList,
  SeverityBadge,
  SourceBadge,
  StatStrip,
  StatusBadge,
} from "@/components/soc/primitives";
import { useAlerts, useDashboardMetrics, useIncidents } from "@/lib/sentineliq/hooks";
import { SEVERITY_ORDER, formatTime, severityMeta } from "@/lib/sentineliq/display";
import type { Severity } from "@/lib/sentineliq/types";
import { cn } from "@/lib/utils";

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
  fontSize: 10,
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border-strong)",
    borderRadius: 4,
    fontSize: 11,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 10 },
};

function UtcClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () => new Date().toISOString().slice(11, 19);
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11px] tabular-nums text-muted-foreground" suppressHydrationWarning>
      {now ?? "--:--:--"} UTC
    </span>
  );
}

function SeverityMix({
  counts,
  ratio,
}: {
  counts: { severity: Severity; count: number }[];
  ratio: { correlated: number; uncorrelated: number } | undefined;
}) {
  const bySeverity = new Map(counts.map((c) => [c.severity, c.count]));
  const total = SEVERITY_ORDER.reduce((s, sev) => s + (bySeverity.get(sev) ?? 0), 0);

  if (!total) return <AwaitingBackend />;

  const correlated = ratio ? ratio.correlated : null;
  const uncorrelated = ratio ? ratio.uncorrelated : null;
  const corrPct = correlated != null && uncorrelated != null && correlated + uncorrelated > 0
    ? Math.round((correlated / (correlated + uncorrelated)) * 100)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex h-2 w-full gap-px overflow-hidden">
        {SEVERITY_ORDER.map((sev) => {
          const n = bySeverity.get(sev) ?? 0;
          if (!n) return null;
          return <span key={sev} className={cn("h-full", severityMeta[sev].bar)} style={{ width: `${(n / total) * 100}%` }} />;
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {SEVERITY_ORDER.map((sev) => (
          <div key={sev} className="flex items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-sm", severityMeta[sev].bar)} aria-hidden />
            <span className="label-caps flex-1 text-[9px]">{severityMeta[sev].label}</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{bySeverity.get(sev) ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[10px] tracking-wider text-muted-foreground">
        <span>{total} OPEN INCIDENTS</span>
        <span>{corrPct != null ? `${corrPct}% ALERTS CORRELATED` : "CORRELATION N/A"}</span>
      </div>
    </div>
  );
}

function OverviewPage() {
  const metricsQuery = useDashboardMetrics();
  const incidentsQuery = useIncidents();
  const alertsQuery = useAlerts();
  const m = metricsQuery.data?.data;
  const incidents = incidentsQuery.data?.data ?? [];
  const allAlerts = alertsQuery.data?.data ?? [];

  const feed = [...allAlerts]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 9);
  const queue = [...incidents].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Security Operations"
        title="SOC Overview"
        actions={
          <div className="flex items-center gap-3">
            <UtcClock />
            <SourceBadge source={metricsQuery.data?.source} error={metricsQuery.data?.error} />
          </div>
        }
      />

      <StatStrip className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Critical incidents" value={m?.critical_incidents ?? "—"} accent="critical" />
        <KpiCard label="High priority" value={m?.high_incidents ?? "—"} accent="high" />
        <KpiCard label="Open incidents" value={m?.open_incidents ?? "—"} accent="neutral" />
        <KpiCard label="Alerts today" value={m?.alerts_today ?? "—"} accent="low" />
        <KpiCard label="Correlated incidents" value={m?.correlated_incidents ?? "—"} accent="ok" />
        <KpiCard
          label="Avg triage time"
          value={m?.avg_triage_minutes != null ? `${m.avg_triage_minutes}m` : "—"}
          hint={m?.avg_triage_minutes == null ? "Awaiting backend data" : "Measured on closed incidents"}
          accent="medium"
        />
      </StatStrip>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          title="Alert volume"
          subtitle="Wazuh alerts ingested vs incidents created"
          className="xl:col-span-2"
          bodyClassName="px-1 py-2"
          actions={<SourceBadge source={metricsQuery.data?.source} />}
        >
          {m ? (
            <ResponsiveContainer width="100%" height={190}>
              <ComposedChart data={m.alerts_over_time} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bucket" {...axis} interval="preserveStartEnd" />
                <YAxis {...axis} width={26} allowDecimals={false} />
                <RTooltip {...tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="alerts" name="Alerts" fill="var(--chart-1)" barSize={9} radius={[1, 1, 0, 0]} />
                <Line
                  type="stepAfter"
                  dataKey="incidents"
                  name="Incidents"
                  stroke="var(--chart-3)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <AwaitingBackend />
          )}
        </Panel>

        <Panel
          title="Live alert feed"
          subtitle="Most recent normalized Wazuh alerts"
          bodyClassName="p-0"
          actions={
            <Link to="/alerts" className="text-[11px] text-primary hover:underline">
              All alerts
            </Link>
          }
        >
          {feed.length ? (
            <ul className="divide-y divide-border">
              {feed.map((a) => (
                <li key={a.id} className="flex items-center gap-2 px-3 py-[5px]">
                  <span className="w-14 shrink-0 font-mono text-[10px] text-muted-foreground">{formatTime(a.timestamp)}</span>
                  <span className={cn("size-1.5 shrink-0 rounded-full", severityMeta[a.severity].bar)} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground" title={a.rule_description}>
                    {a.rule_description}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground md:inline">{a.agent}</span>
                  {a.source_ip && (
                    <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:inline">{a.source_ip}</span>
                  )}
                  {a.incident_id && (
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: a.incident_id }}
                      className="shrink-0 font-mono text-[10px] text-primary hover:underline"
                    >
                      {a.incident_id}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3">
              <AwaitingBackend />
            </div>
          )}
          {feed.length > 0 && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-[10px] tracking-wider text-muted-foreground">
              LATEST {feed.length} OF {allAlerts.length} ALERTS
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <Panel title="Open incidents by severity">
          {m ? <SeverityMix counts={m.incidents_by_severity} ratio={m.correlation_ratio} /> : <AwaitingBackend />}
        </Panel>
        <Panel title="Top affected hosts" subtitle="Alert volume per agent">
          {m ? <RankedList items={m.top_hosts.map((h) => ({ label: h.host, count: h.alerts }))} /> : <AwaitingBackend />}
        </Panel>
        <Panel title="Top source IPs" subtitle="Most frequent alert sources">
          {m ? (
            <RankedList items={m.top_source_ips.map((i) => ({ label: i.source_ip, count: i.alerts }))} />
          ) : (
            <AwaitingBackend />
          )}
        </Panel>
        <Panel title="MITRE technique spread">
          {m ? (
            <div className="grid grid-cols-2 gap-1">
              {m.mitre_distribution.map((tech) => {
                const max = Math.max(...m.mitre_distribution.map((t) => t.count));
                const pct = Math.round(14 + (tech.count / max) * 70);
                return (
                  <div
                    key={tech.technique_id}
                    title={`${tech.technique_id} ${tech.name}: ${tech.count} alerts`}
                    className="rounded-sm border border-border px-1.5 py-1"
                    style={{ backgroundColor: `color-mix(in oklab, var(--critical) ${pct}%, var(--card))` }}
                  >
                    <div className="flex items-baseline justify-between gap-1 font-mono text-[10px] font-semibold text-foreground">
                      <span>{tech.technique_id}</span>
                      <span className="tabular-nums">{tech.count}</span>
                    </div>
                    <p className="mt-px truncate text-[9px] text-foreground/75">{tech.name}</p>
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
        subtitle="Ranked by XGBoost priority score"
        bodyClassName="p-0"
        actions={
          <Link to="/incidents" className="text-[11px] text-primary hover:underline">
            Open full queue
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="border-b border-border bg-surface">
              <tr className="label-caps text-[9px]">
                <th className="px-3 py-1.5 font-medium">Incident</th>
                <th className="px-3 py-1.5 font-medium">Time</th>
                <th className="px-3 py-1.5 font-medium">Severity</th>
                <th className="px-3 py-1.5 font-medium">Score</th>
                <th className="px-3 py-1.5 font-medium">Title</th>
                <th className="px-3 py-1.5 font-medium">Host</th>
                <th className="px-3 py-1.5 font-medium">Source IP</th>
                <th className="px-3 py-1.5 font-medium">Alerts</th>
                <th className="px-3 py-1.5 font-medium">MITRE</th>
                <th className="px-3 py-1.5 font-medium">Status</th>
                <th className="px-3 py-1.5 font-medium">Analyst</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((inc) => (
                <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="font-mono text-[11px] text-primary hover:underline"
                    >
                      {inc.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {formatTime(inc.last_seen)}
                  </td>
                  <td className="px-3 py-1.5">
                    <SeverityBadge severity={inc.severity} />
                    <div className="mt-0.5">
                      <AbstentionBadge incident={inc} compact />
                    </div>
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 font-mono text-[11px] font-semibold tabular-nums",
                      severityMeta[inc.severity].text,
                    )}
                  >
                    {inc.priority_score}
                  </td>
                  <td className="max-w-72 truncate px-3 py-1.5 text-foreground">{inc.title}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[11px]">{inc.host}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[11px]">{inc.source_ip ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] tabular-nums">{inc.alert_count}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-primary">{inc.mitre_techniques[0] ?? "—"}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[11px] text-muted-foreground">
                    {inc.assigned_analyst ?? "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
