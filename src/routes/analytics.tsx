import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AwaitingBackend, PageHeader, Panel, SourceBadge } from "@/components/soc/primitives";
import { KpiCard } from "@/components/soc/kpi-card";
import { useAnalytics } from "@/lib/sentineliq/hooks";
import { severityMeta } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Historical Analytics — SentinelIQ" },
      { name: "description", content: "Historical alert and incident volume, severity distribution, correlation rate and analyst triage time from the SentinelIQ backend." },
      { property: "og:title", content: "Historical Analytics — SentinelIQ" },
      { property: "og:description", content: "Trends measured by the SentinelIQ backend — unavailable metrics are shown as awaiting data." },
    ],
  }),
  component: AnalyticsPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: { stroke: "var(--border)" } };
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border-strong)", borderRadius: 6, fontSize: 12 } };

function AnalyticsPage() {
  const { data } = useAnalytics();
  const a = data?.data;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Reporting"
        title="Analytics"
        description="All figures come from the SentinelIQ backend. No performance claims are estimated or extrapolated in the frontend."
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Correlation rate"
          value={a?.correlation_rate != null ? `${Math.round(a.correlation_rate * 100)}%` : "—"}
          hint={a?.correlation_rate == null ? "Awaiting backend data" : "Alerts grouped into incidents"}
          accent="ok"
        />
        <KpiCard
          label="False-positive rate"
          value={a?.false_positive_rate != null ? `${Math.round(a.false_positive_rate * 100)}%` : "—"}
          hint={a?.false_positive_rate == null ? "Awaiting backend data" : "Analyst-confirmed false positives"}
          accent="medium"
        />
        <KpiCard
          label="Latest triage time"
          value={a?.triage_time_minutes?.length ? `${a.triage_time_minutes.at(-1)!.minutes}m` : "—"}
          hint={a?.triage_time_minutes?.length ? "Median per incident, most recent day" : "Awaiting backend data"}
          accent="low"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Alerts per day">
          {a ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.alerts_per_day}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} width={28} />
                <RTooltip {...tip} />
                <Bar dataKey="alerts" name="Alerts" fill="var(--chart-1)" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <AwaitingBackend />}
        </Panel>
        <Panel title="Incidents per day">
          {a ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.incidents_per_day}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} width={28} allowDecimals={false} />
                <RTooltip {...tip} />
                <Bar dataKey="incidents" name="Incidents" fill="var(--chart-3)" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <AwaitingBackend />}
        </Panel>
        <Panel title="Severity distribution">
          {a ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.severity_distribution} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="severity" {...axis} width={70} />
                <RTooltip {...tip} />
                <Bar dataKey="count" name="Incidents" barSize={18} radius={[0, 3, 3, 0]}>
                  {a.severity_distribution.map((d) => <Cell key={d.severity} fill={severityMeta[d.severity].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <AwaitingBackend />}
        </Panel>
        <Panel title="Analyst triage time" subtitle="Minutes from incident creation to first status change">
          {a?.triage_time_minutes ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={a.triage_time_minutes}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} width={28} />
                <RTooltip {...tip} />
                <Line type="monotone" dataKey="minutes" stroke="var(--chart-5)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <AwaitingBackend />}
        </Panel>
      </div>
    </div>
  );
}
