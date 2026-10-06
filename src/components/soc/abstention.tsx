import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { Incident } from "@/lib/sentineliq/types";

/** Conformal-prediction abstention badge. Falls back to "awaiting backend" when fields are absent. */
export function AbstentionBadge({ incident, compact }: { incident: Pick<Incident, "ai_abstained" | "prediction_set">; compact?: boolean }) {
  const { ai_abstained, prediction_set } = incident;
  if (ai_abstained === undefined || ai_abstained === null) {
    return (
      <span className="inline-flex items-center rounded-sm border border-dashed border-border-strong px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        AI: awaiting backend data
      </span>
    );
  }
  if (!ai_abstained) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3" aria-hidden /> AI Confident
      </span>
    );
  }
  return (
    <span className={compact ? "inline-flex flex-col gap-0.5" : "inline-flex flex-wrap items-center gap-1.5"}>
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-sm border border-medium/50 bg-medium-soft px-1.5 py-0.5 text-[10px] font-semibold text-medium">
        <AlertTriangle className="size-3" aria-hidden /> AI Abstained — Review Required
      </span>
      <span className="text-[10px] text-muted-foreground">
        Possible: {prediction_set ? prediction_set : "awaiting backend data"}
      </span>
    </span>
  );
}
