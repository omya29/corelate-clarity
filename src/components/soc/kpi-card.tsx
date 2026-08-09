import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  accent = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "neutral" | "critical" | "high" | "medium" | "low" | "ok";
  icon?: ReactNode;
}) {
  const accents: Record<string, string> = {
    neutral: "text-foreground",
    critical: "text-critical",
    high: "text-high",
    medium: "text-medium",
    low: "text-low",
    ok: "text-ok",
  };
  const rails: Record<string, string> = {
    neutral: "bg-border-strong",
    critical: "bg-critical",
    high: "bg-high",
    medium: "bg-medium",
    low: "bg-low",
    ok: "bg-ok",
  };

  return (
    <div className="panel relative overflow-hidden p-3.5 pl-4">
      <span className={cn("absolute inset-y-0 left-0 w-0.5", rails[accent])} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", accents[accent])}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
