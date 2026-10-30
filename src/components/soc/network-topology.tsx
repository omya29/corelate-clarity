import { useMemo } from "react";
import { severityMeta, SEVERITY_ORDER } from "@/lib/sentineliq/display";
import type { Severity, WazuhAlert } from "@/lib/sentineliq/types";
import { cn } from "@/lib/utils";

/**
 * Bipartite attack-path graph: source IPs on the left, observed hosts on the
 * right, one edge per (source_ip, host) pair seen in the ingested alerts.
 * Every node, edge, color and width is derived from real alert data —
 * nothing here is invented or simulated.
 */

const SEV_RANK: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const SEV_COLOR: Record<Severity, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};

interface Pair {
  ip: string;
  host: string;
  count: number;
  worst: Severity;
  last: string;
}

const MAX_IPS = 6;
const MAX_HOSTS = 6;
const MAX_EDGES = 16;
const W = 640;
const H = 300;
const PAD = 26;

function truncateLabel(s: string, max = 20) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function columnY(n: number, i: number) {
  if (n === 1) return H / 2;
  const top = PAD + 14;
  const bottom = H - PAD - 14;
  return top + (i * (bottom - top)) / (n - 1);
}

export function NetworkTopology({ alerts }: { alerts: WazuhAlert[] }) {
  const graph = useMemo(() => {
    const pairs = new Map<string, Pair>();
    for (const a of alerts) {
      if (!a.source_ip) continue;
      const key = `${a.source_ip}|${a.host}`;
      const cur = pairs.get(key);
      if (!cur) {
        pairs.set(key, { ip: a.source_ip, host: a.host, count: 1, worst: a.severity, last: a.timestamp });
      } else {
        cur.count += 1;
        if (SEV_RANK[a.severity] > SEV_RANK[cur.worst]) cur.worst = a.severity;
        if (a.timestamp > cur.last) cur.last = a.timestamp;
      }
    }

    const all = [...pairs.values()].sort((a, b) => b.count - a.count);
    const ipTotals = new Map<string, number>();
    const hostTotals = new Map<string, number>();
    for (const p of all) {
      ipTotals.set(p.ip, (ipTotals.get(p.ip) ?? 0) + p.count);
      hostTotals.set(p.host, (hostTotals.get(p.host) ?? 0) + p.count);
    }
    const ips = [...ipTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_IPS).map(([ip]) => ip);
    const hosts = [...hostTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_HOSTS).map(([host]) => host);
    const ipSet = new Set(ips);
    const hostSet = new Set(hosts);
    const edges = all.filter((p) => ipSet.has(p.ip) && hostSet.has(p.host)).slice(0, MAX_EDGES);

    const worstByIp = new Map<string, Severity>();
    const worstByHost = new Map<string, Severity>();
    for (const e of edges) {
      const wi = worstByIp.get(e.ip);
      if (!wi || SEV_RANK[e.worst] > SEV_RANK[wi]) worstByIp.set(e.ip, e.worst);
      const wh = worstByHost.get(e.host);
      if (!wh || SEV_RANK[e.worst] > SEV_RANK[wh]) worstByHost.set(e.host, e.worst);
    }

    return {
      ips,
      hosts,
      edges,
      worstByIp,
      worstByHost,
      ipAlerts: ipTotals,
      hostAlerts: hostTotals,
      shownAlerts: edges.reduce((s, e) => s + e.count, 0),
    };
  }, [alerts]);

  const { ips, hosts, edges, worstByIp, worstByHost, ipAlerts, hostAlerts, shownAlerts } = graph;

  if (!edges.length) {
    return (
      <p className="py-8 text-center text-[11px] text-muted-foreground">
        No source-IP to host paths in the ingested alerts yet
      </p>
    );
  }

  const ipX = 118;
  const hostX = W - 118;
  const maxCount = Math.max(...edges.map((e) => e.count));

  return (
    <div className="flex h-full flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Alert source IP to host topology">
        <defs>
          <marker id="topo-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* column captions */}
        <text x={ipX} y={14} textAnchor="middle" className="fill-[var(--muted-foreground)]" fontSize="9" letterSpacing="1.5">
          SOURCE IPS
        </text>
        <text x={hostX} y={14} textAnchor="middle" className="fill-[var(--muted-foreground)]" fontSize="9" letterSpacing="1.5">
          HOSTS
        </text>

        {/* edges */}
        {edges.map((e) => {
          const yi = columnY(ips.length, ips.indexOf(e.ip));
          const yh = columnY(hosts.length, hosts.indexOf(e.host));
          const d = `M ${ipX + 10} ${yi} C ${ipX + 90} ${yi}, ${hostX - 90} ${yh}, ${hostX - 10} ${yh}`;
          const width = 1 + Math.min(3.5, (e.count / maxCount) * 3.5);
          return (
            <path
              key={`${e.ip}|${e.host}`}
              d={d}
              fill="none"
              stroke={SEV_COLOR[e.worst]}
              strokeWidth={width}
              strokeOpacity={0.4}
              markerEnd="url(#topo-arrow)"
              className="transition-[stroke-opacity] hover:stroke-opacity-90"
            >
              <title>
                {`${e.ip} → ${e.host} · ${e.count} alert${e.count === 1 ? "" : "s"} · worst severity ${severityMeta[e.worst].label} · last ${e.last}`}
              </title>
            </path>
          );
        })}

        {/* IP nodes */}
        {ips.map((ip, i) => {
          const sev = worstByIp.get(ip) ?? "low";
          const y = columnY(ips.length, i);
          return (
            <g key={ip}>
              <circle cx={ipX} cy={y} r={6.5} fill="var(--background)" stroke={SEV_COLOR[sev]} strokeWidth={2} />
              <text x={ipX - 14} y={y + 3.5} textAnchor="end" fontSize="10.5" className="fill-[var(--foreground)]" fontFamily="var(--font-mono)">
                {ip}
              </text>
              <text x={ipX - 14} y={y + 15} textAnchor="end" fontSize="9" className="fill-[var(--muted-foreground)]" fontFamily="var(--font-mono)">
                {ipAlerts.get(ip)} alerts
              </text>
            </g>
          );
        })}

        {/* host nodes */}
        {hosts.map((host, i) => {
          const sev = worstByHost.get(host) ?? "low";
          const y = columnY(hosts.length, i);
          return (
            <g key={host}>
              <rect
                x={hostX - 6.5}
                y={y - 6.5}
                width={13}
                height={13}
                rx={2}
                fill="var(--background)"
                stroke={SEV_COLOR[sev]}
                strokeWidth={2}
              />
              <text x={hostX + 14} y={y + 3.5} fontSize="10.5" className="fill-[var(--foreground)]" fontFamily="var(--font-mono)">
                {truncateLabel(host)}
              </text>
              <text x={hostX + 14} y={y + 15} fontSize="9" className="fill-[var(--muted-foreground)]" fontFamily="var(--font-mono)">
                {hostAlerts.get(host)} alerts
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="label-caps text-[9px]">Attack path severity</span>
          {SEVERITY_ORDER.map((sev) => (
            <span key={sev} className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", severityMeta[sev].bar)} aria-hidden />
              {severityMeta[sev].label}
            </span>
          ))}
        </div>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {edges.length} PATHS · {shownAlerts} ALERTS · {hosts.length} HOSTS
        </span>
      </div>
    </div>
  );
}
