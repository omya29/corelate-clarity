import { severityMeta } from "@/lib/sentineliq/display";
import type { DashboardMetrics, Incident } from "@/lib/sentineliq/types";
import { cn } from "@/lib/utils";

/**
 * Security posture gauge + AI-confidence meters, in the right-rail style of
 * the reference design. The score is a transparent, documented derivation
 * from real backend metrics — never a random or simulated value.
 *
 * Score = 100 − (critical×6 + high×3 + medium×1 + low×0.25), clamped to 0..100.
 */

const R = 78;
const CX = 100;
const CY = 100;
const ARC_LEN = Math.PI * R;

const WEIGHTS = { critical: 6, high: 3, medium: 1, low: 0.25 } as const;

function zoneFor(score: number) {
  if (score >= 80) return { label: "GOOD", color: "var(--ok)" };
  if (score >= 60) return { label: "WATCH", color: "var(--medium)" };
  if (score >= 40) return { label: "ELEVATED", color: "var(--high)" };
  return { label: "CRITICAL", color: "var(--critical)" };
}

function Meter({ label, pct, color, note }: { label: string; pct: number; color: string; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: color }} />
      </div>
      {note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm font-semibold tabular-nums text-foreground", accent)}>{value}</span>
    </div>
  );
}

export function SecurityPosture({ metrics, incidents }: { metrics: DashboardMetrics; incidents: Incident[] }) {
  const bySeverity = new Map(metrics.incidents_by_severity.map((c) => [c.severity, c.count]));
  const load =
    (bySeverity.get("critical") ?? 0) * WEIGHTS.critical +
    (bySeverity.get("high") ?? 0) * WEIGHTS.high +
    (bySeverity.get("medium") ?? 0) * WEIGHTS.medium +
    (bySeverity.get("low") ?? 0) * WEIGHTS.low;
  const score = Math.max(0, Math.min(100, Math.round(100 - load)));
  const zone = zoneFor(score);

  // Sweep from left (180°) to right (0°); positive sweep flag draws the top half.
  const arcDeg = (score / 100) * 180;
  const endX = CX - R * Math.cos((arcDeg * Math.PI) / 180);
  const endY = CY - R * Math.sin((arcDeg * Math.PI) / 180);
  const valueArc = score <= 0 ? null : `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${score >= 100 ? CX + R : endX} ${endY}`;

  const corrTotal = metrics.correlation_ratio.correlated + metrics.correlation_ratio.uncorrelated;
  const corrPct = corrTotal > 0 ? Math.round((metrics.correlation_ratio.correlated / corrTotal) * 100) : null;

  const abstainKnown = incidents.filter((i) => i.ai_abstained != null);
  const abstained = abstainKnown.filter((i) => i.ai_abstained).length;
  const abstainPct = abstainKnown.length ? Math.round((abstained / abstainKnown.length) * 100) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 118" className="w-44" role="img" aria-label={`Security posture score ${score} of 100`}>
          {/* zone ticks */}
          {[0, 25, 50, 75, 100].map((t) => {
            const rad = ((180 - t * 1.8) * Math.PI) / 180;
            const x1 = CX + (R - 9) * Math.cos(rad) * -1 * -1;
            const y1 = CY - (R - 9) * Math.sin(rad);
            const x2 = CX - (R - 15) * Math.cos(rad) * -1;
            const y2 = CY - (R - 15) * Math.sin(rad);
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-strong)" strokeWidth={1.5} />;
          })}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={11}
            strokeLinecap="round"
          />
          {valueArc && (
            <path d={valueArc} fill="none" stroke={zone.color} strokeWidth={11} strokeLinecap="round" />
          )}
          <text x={CX} y={CY - 18} textAnchor="middle" fontSize="30" fontWeight="600" className="fill-[var(--foreground)]" fontFamily="var(--font-mono)">
            {score}
            <tspan fontSize="13" className="fill-[var(--muted-foreground)]">
              /100
            </tspan>
          </text>
          <text x={CX} y={CY - 2} textAnchor="middle" fontSize="10" letterSpacing="2.5" fontWeight="600" fill={zone.color} fontFamily="var(--font-mono)">
            {zone.label}
          </text>
        </svg>
        <p className="mt-1 text-center text-[10px] leading-tight text-muted-foreground">
          Derived from open incident severity mix
          <br />
          (critical×6 + high×3 + medium×1 + low×0.25)
        </p>
      </div>

      <div className="mt-2">
        <StatRow label="Critical cases" value={bySeverity.get("critical") ?? 0} accent={bySeverity.get("critical") ? "text-critical" : undefined} />
        <StatRow label="High cases" value={bySeverity.get("high") ?? 0} accent={bySeverity.get("high") ? "text-high" : undefined} />
        <StatRow label="Open incidents" value={metrics.open_incidents} />
        <StatRow label="Alerts today" value={metrics.alerts_today} />
      </div>

      <div className="mt-auto space-y-2.5 border-t border-border pt-2.5">
        <p className="label-caps text-[9px]">AI confidence</p>
        <Meter
          label="Alert correlation rate"
          pct={corrPct ?? 0}
          color="var(--ok)"
          note={corrPct == null ? "No correlation data reported" : `${metrics.correlation_ratio.correlated} of ${corrTotal} alerts correlated`}
        />
        <Meter
          label="Model abstention"
          pct={abstainPct ?? 0}
          color="var(--warn)"
          note={
            abstainPct == null
              ? "Abstention not reported by backend"
              : `${abstained} of ${abstainKnown.length} scored incidents abstained`
          }
        />
        <p className="text-[10px] text-muted-foreground">
          Correlation and XGBoost abstention are reported by the backend; the posture score is a UI-derived summary.
        </p>
      </div>
    </div>
  );
}
