import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  componentStateMeta,
  correlationMeta,
  severityMeta,
  statusMeta,
} from "@/lib/sentineliq/display";
import type { ComponentState, CorrelationStatus, IncidentStatus, Severity } from "@/lib/sentineliq/types";
import type { DataSource } from "@/lib/sentineliq/api";

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = severityMeta[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.bar)} aria-hidden />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 text-[11px] font-medium", meta.badge)}>
      {meta.label}
    </span>
  );
}

export function CorrelationBadge({ status }: { status: CorrelationStatus }) {
  const meta = correlationMeta[status];
  return (
    <span className={cn("inline-flex rounded-sm border px-1.5 py-0.5 text-[11px] font-medium", meta.badge)}>
      {meta.label}
    </span>
  );
}

export function StateIndicator({ state }: { state: ComponentState }) {
  const meta = componentStateMeta[state];
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider", meta.text)}>
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

/** Honest data-provenance marker. Never hide that a screen is showing synthetic data. */
export function SourceBadge({ source, error }: { source: DataSource | undefined; error?: string | undefined }) {
  if (!source) return null;
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-ok/40 bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-ok">
        LIVE BACKEND
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-medium/40 bg-medium-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-medium">
          DEMO DATA
          <Info className="size-3" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        Synthetic lab dataset rendered locally in the browser.
        {error ? ` Live request failed: ${error}` : " Switch to Live mode in the top bar once the FastAPI backend is running."}
      </TooltipContent>
    </Tooltip>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-3 py-2">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[13px] font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1 px-3 py-2.5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2.5">
      <div>
        {eyebrow && <p className="label-caps text-[10px]">{eyebrow}</p>}
        <h1 className="mt-0.5 text-lg font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AwaitingBackend({ label = "Awaiting backend data" }: { label?: string }) {
  const bars = [62, 88, 45, 74, 30, 56];
  return (
    <div className="flex h-full min-h-24 flex-col gap-3 py-1" role="status" aria-label={label}>
      <div className="flex flex-1 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-sm bg-secondary"
            style={{ height: `${h}%`, minHeight: 12, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-2/3 animate-pulse rounded-sm bg-secondary" />
        <div className="h-2 w-1/3 animate-pulse rounded-sm bg-secondary" />
      </div>
      <p className="font-mono text-[10px] tracking-wider text-muted-foreground">{label.toUpperCase()} · NO VALUE ESTIMATED</p>
    </div>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="label-caps">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm text-foreground", mono && "font-mono text-[13px]")}>{value}</p>
    </div>
  );
}

export function ScoreMeter({ score, severity }: { score: number; severity: Severity }) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="label-caps">Priority score</span>
        <span className="font-mono text-sm font-semibold text-foreground">{score}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", severityMeta[severity].bar)}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

/** Hairline-grid strip for KpiCard tiles, Splunk single-value style. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-px overflow-hidden border border-border bg-border", className)}>{children}</div>
  );
}

/** Splunk-style top-values list: mono label, proportional background bar, count. */
export function RankedList({
  items,
  emptyLabel = "No data reported yet",
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (!items.length) return <p className="py-6 text-center text-[11px] text-muted-foreground">{emptyLabel}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-px">
      {items.map((it) => (
        <li key={it.label} className="relative flex items-center justify-between gap-3 px-1.5 py-1">
          <span
            className="absolute inset-y-0 left-0 bg-secondary"
            style={{ width: `${Math.max(3, Math.round((it.count / max) * 100))}%` }}
            aria-hidden
          />
          <span className="relative min-w-0 truncate font-mono text-[11px] text-foreground">{it.label}</span>
          <span className="relative shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{it.count}</span>
        </li>
      ))}
    </ul>
  );
}
