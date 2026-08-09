import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JsonViewer } from "@/components/soc/json-viewer";
import { CorrelationBadge, PageHeader, Panel, SeverityBadge, SourceBadge } from "@/components/soc/primitives";
import { useAlerts } from "@/lib/sentineliq/hooks";
import { SEVERITY_ORDER, eventTypeLabel, formatDateTime, severityMeta } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Wazuh Alerts — SentinelIQ" },
      { name: "description", content: "Normalized Wazuh alerts ingested by SentinelIQ with correlation status and raw event inspection." },
      { property: "og:title", content: "Wazuh Alerts — SentinelIQ" },
      { property: "og:description", content: "Raw Wazuh alerts received by the SentinelIQ backend, filterable by severity, host and correlation status." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data } = useAlerts();
  const alerts = data?.data ?? [];
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("all");
  const [corr, setCorr] = useState("all");
  const [host, setHost] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  const hosts = [...new Set(alerts.map((a) => a.host))];

  const rows = useMemo(
    () =>
      alerts
        .filter((a) => (severity === "all" || a.severity === severity))
        .filter((a) => (corr === "all" || a.correlation_status === corr))
        .filter((a) => (host === "all" || a.host === host))
        .filter((a) =>
          q
            ? `${a.id} ${a.rule_id} ${a.rule_description} ${a.host} ${a.source_ip ?? ""} ${a.username ?? ""}`
                .toLowerCase()
                .includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [alerts, severity, corr, host, q],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ingestion"
        title="Wazuh Alerts"
        description="Alerts are pulled from the Wazuh API by the SentinelIQ FastAPI service and normalized before correlation. The browser never contacts Wazuh."
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />

      <Panel bodyClassName="p-3">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts" className="h-9 pl-8 text-xs" />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITY_ORDER.map((s) => <SelectItem key={s} value={s}>{severityMeta[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={corr} onValueChange={setCorr}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Correlation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All correlation states</SelectItem>
              <SelectItem value="part_of_incident">Part of incident</SelectItem>
              <SelectItem value="correlated">Correlated</SelectItem>
              <SelectItem value="uncorrelated">Uncorrelated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={host} onValueChange={setHost}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Host" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hosts</SelectItem>
              {hosts.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <Panel bodyClassName="p-0" subtitle={`${rows.length} alerts`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface">
              <tr className="label-caps">
                <th className="px-4 py-2 font-medium">Alert ID</th>
                <th className="px-3 py-2 font-medium">Timestamp</th>
                <th className="px-3 py-2 font-medium">Rule</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Host</th>
                <th className="px-3 py-2 font-medium">Source IP</th>
                <th className="px-3 py-2 font-medium">Event type</th>
                <th className="px-3 py-2 font-medium">Correlation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <>
                  <tr
                    key={a.id}
                    onClick={() => setOpen(open === a.id ? null : a.id)}
                    className="cursor-pointer border-b border-border hover:bg-accent/40"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-primary">{a.id}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{formatDateTime(a.timestamp)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.rule_id}</td>
                    <td className="px-3 py-2"><SeverityBadge severity={a.severity} /></td>
                    <td className="px-3 py-2 font-mono text-xs">{a.agent}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.host}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.source_ip ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{eventTypeLabel(a.event_type)}</td>
                    <td className="px-3 py-2"><CorrelationBadge status={a.correlation_status} /></td>
                  </tr>
                  {open === a.id && (
                    <tr key={`${a.id}-detail`} className="border-b border-border bg-surface/60">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid gap-3 text-xs md:grid-cols-4">
                          <p><span className="label-caps block">Rule description</span>{a.rule_description}</p>
                          <p><span className="label-caps block">Username</span>{a.username ?? "—"}</p>
                          <p><span className="label-caps block">Destination IP</span>{a.destination_ip ?? "—"}</p>
                          <p>
                            <span className="label-caps block">Incident</span>
                            {a.incident_id ? (
                              <Link to="/incidents/$incidentId" params={{ incidentId: a.incident_id }} className="text-primary hover:underline">
                                {a.incident_id}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </p>
                        </div>
                        <div className="mt-3"><JsonViewer data={a.raw} /></div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
