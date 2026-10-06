import { AbstentionBadge } from "@/components/soc/abstention";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { Entity } from "@/components/soc/entity";
import { ArrowUpDown, ChevronRight, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Panel, SeverityBadge, SourceBadge, StatusBadge } from "@/components/soc/primitives";
import { useIncidents } from "@/lib/sentineliq/hooks";
import { INCIDENT_STATUSES, SEVERITY_ORDER, formatDateTime, severityMeta, statusMeta } from "@/lib/sentineliq/display";

export const Route = createFileRoute("/incidents/")({
  head: () => ({
    meta: [
      { title: "Incident Queue — SentinelIQ" },
      {
        name: "description",
        content:
          "Filter and triage correlated incidents: severity, status, host, source IP and MITRE technique, with XGBoost priority scores.",
      },
      { property: "og:title", content: "Incident Queue — SentinelIQ" },
      {
        property: "og:description",
        content: "Correlated Wazuh alerts grouped into incidents with priority scores for SOC triage.",
      },
    ],
  }),
  component: IncidentsPage,
});

type SortKey = "priority_score" | "last_seen" | "alert_count";

const TIME_WINDOWS = [
  { value: "all", label: "All time" },
  { value: "1h", label: "Last hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];

function withinWindow(iso: string, window: string, now: number) {
  if (window === "all") return true;
  const hours = window === "1h" ? 1 : window === "6h" ? 6 : window === "24h" ? 24 : 168;
  return now - new Date(iso).getTime() <= hours * 3600_000;
}

function IncidentsPage() {
  const { data, isLoading } = useIncidents();
  const incidents = data?.data ?? [];

  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [host, setHost] = useState("all");
  const [sourceIp, setSourceIp] = useState("all");
  const [technique, setTechnique] = useState("all");
  const [timeWindow, setTimeWindow] = useState("all");
  const [sort, setSort] = useState<SortKey>("priority_score");
  const [page, setPage] = useState(1);
  const [abstainedOnly, setAbstainedOnly] = useState(false);
  const perPage = 10;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const hosts = [...new Set(incidents.map((i) => i.host))];
  const ips = [...new Set(incidents.map((i) => i.source_ip).filter(Boolean) as string[])];
  const techniques = [...new Set(incidents.flatMap((i) => i.mitre_techniques))];

  // Demo dataset carries a fixed reference day; use the newest incident as "now"
  // so relative time filters behave predictably in both demo and live mode.
  const now = incidents.length
    ? Math.max(...incidents.map((i) => new Date(i.last_seen).getTime()))
    : Date.now();

  const filtered = useMemo(() => {
    const rows = incidents.filter((i) => {
      if (severity !== "all" && i.severity !== severity) return false;
      if (status !== "all" && i.status !== status) return false;
      if (host !== "all" && i.host !== host) return false;
      if (sourceIp !== "all" && i.source_ip !== sourceIp) return false;
      if (technique !== "all" && !i.mitre_techniques.includes(technique)) return false;
      if (abstainedOnly && i.ai_abstained !== true) return false;
      if (!withinWindow(i.last_seen, timeWindow, now)) return false;
      if (q) {
        const hay = `${i.id} ${i.title} ${i.host} ${i.source_ip ?? ""} ${i.mitre_techniques.join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    return rows.sort((a, b) =>
      sort === "last_seen"
        ? new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
        : sort === "alert_count"
          ? b.alert_count - a.alert_count
          : b.priority_score - a.priority_score,
    );
  }, [incidents, severity, status, host, sourceIp, technique, timeWindow, abstainedOnly, q, sort, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);

  const resetFilters = () => {
    setQ("");
    setSeverity("all");
    setStatus("all");
    setHost("all");
    setSourceIp("all");
    setTechnique("all");
    setTimeWindow("all");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Triage"
        title="Incident Queue"
        description="Each incident is a group of correlated Wazuh alerts. The priority score is produced by the XGBoost triage model from structured incident features."
        actions={<SourceBadge source={data?.source} error={data?.error} />}
      />

      <Panel title="Filters" className="sticky top-0 z-20 shadow-lg shadow-background/60" bodyClassName="p-3">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-7">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID, title, host, IP, technique"
              className="h-9 pl-8 text-xs"
            />
          </div>
          <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITY_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{severityMeta[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {INCIDENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeWindow} onValueChange={(v) => { setTimeWindow(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Time" /></SelectTrigger>
            <SelectContent>
              {TIME_WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-pressed={abstainedOnly}
            onClick={() => { setAbstainedOnly((v) => !v); setPage(1); }}
            className={`h-9 rounded-md border px-2 text-xs ${abstainedOnly ? "border-medium/50 bg-medium-soft text-medium" : "border-input text-muted-foreground hover:text-foreground"}`}
          >
            ⚠ Abstained only
          </button>
          <Select value={host} onValueChange={(v) => { setHost(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Host" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hosts</SelectItem>
              {hosts.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceIp} onValueChange={(v) => { setSourceIp(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Source IP" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All source IPs</SelectItem>
              {ips.map((ip) => (
                <SelectItem key={ip} value={ip}>{ip}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select value={technique} onValueChange={(v) => { setTechnique(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="MITRE technique" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All techniques</SelectItem>
              {techniques.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-52 text-xs">
              <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority_score">Sort: priority score</SelectItem>
              <SelectItem value="last_seen">Sort: last seen</SelectItem>
              <SelectItem value="alert_count">Sort: alert count</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
            Reset
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} of {incidents.length} incidents
          </span>
        </div>
      </Panel>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead className="border-b border-border bg-surface">
              <tr className="label-caps">
                <th className="w-8 py-2 pl-3" aria-label="Expand" />
                <th className="px-3 py-2 font-medium">Incident ID</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Incident title</th>
                <th className="px-3 py-2 font-medium">Alerts</th>
                <th className="px-3 py-2 font-medium">First seen</th>
                <th className="px-3 py-2 font-medium">Last seen</th>
                <th className="px-3 py-2 font-medium">Host</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">MITRE</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Loading incidents…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
              {rows.map((inc) => {
                const open = expanded.has(inc.id);
                return (
                <Fragment key={inc.id}>
                <tr className={`border-b border-border hover:bg-accent/40 ${open ? "bg-accent/30" : ""}`}>
                  <td className="py-2 pl-3">
                    <button
                      type="button"
                      onClick={() => toggle(inc.id)}
                      aria-expanded={open}
                      aria-label={open ? "Collapse incident" : "Expand incident"}
                      className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {inc.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2"><SeverityBadge severity={inc.severity} /><div className="mt-1"><AbstentionBadge incident={inc} compact /></div></td>
                  <td className="max-w-80 px-3 py-2">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="block truncate text-foreground hover:text-primary"
                    >
                      {inc.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{inc.alert_count}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{formatDateTime(inc.first_seen)}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{formatDateTime(inc.last_seen)}</td>
                  <td className="px-3 py-2"><Entity value={inc.host} kind="host" /></td>
                  <td className="px-3 py-2"><Entity value={inc.source_ip} kind="ip" /></td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{inc.mitre_techniques.join(", ") || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{inc.priority_score}</span>
                      <span className="h-1 w-14 overflow-hidden rounded-full bg-secondary">
                        <span
                          className={`block h-full ${severityMeta[inc.severity].bar}`}
                          style={{ width: `${inc.priority_score}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={inc.status} /></td>
                </tr>
                {open && (
                  <tr className="border-b border-border bg-surface">
                    <td colSpan={12} className="px-4 py-3">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <p className="label-caps flex items-center gap-1.5">
                            <Sparkles className="size-3 text-primary" aria-hidden /> AI-assisted summary
                            {inc.summary && <span className="normal-case tracking-normal">· {inc.summary.provider} / {inc.summary.model}</span>}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-foreground">
                            {inc.summary?.text ?? "No summary returned by the backend for this incident."}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">Model output — not an analyst decision.</p>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">XGBoost prediction</span>{inc.ml_prediction ? <SeverityBadge severity={inc.ml_prediction} /> : <span className="text-muted-foreground">—</span>}</div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Priority score</span><span className="font-mono font-semibold">{inc.priority_score}/100</span></div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Assigned</span><span>{inc.assigned_analyst ?? "Unassigned"}</span></div>
                          <Link to="/incidents/$incidentId" params={{ incidentId: inc.id }} className="inline-block text-primary hover:underline">
                            Open SHAP explanation and timeline →
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            Page {current} of {pageCount}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={current >= pageCount}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
