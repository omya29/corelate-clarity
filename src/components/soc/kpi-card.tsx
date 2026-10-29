import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact SOC stat tile. Designed to sit inside a StatStrip hairline grid:
 * no own border, radius or icon — small caps label, mono value, severity accent.
 */
export function KpiCard({
  label,
  value,
  hint,
  accent = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "neutral" | "critical" | "high" | "medium" | "low" | "ok";
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
    <div className="flex h-full flex-col bg-card px-3 py-2.5">
      <p className="label-caps text-[10px]">{label}</p>
      <p className={cn("mt-1.5 font-mono text-xl font-semibold leading-none tabular-nums", accents[accent])}>{value}</p>
      <span className={cn("mt-2 h-0.5 w-6", rails[accent])} aria-hidden />
      {hint && <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}
