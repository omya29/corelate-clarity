import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStage {
  name: string;
  detail?: string;
  owner: "wazuh" | "sentineliq" | "analyst";
}

export const SENTINELIQ_PIPELINE: PipelineStage[] = [
  { name: "Security events", detail: "Endpoint, auth and network telemetry in the lab", owner: "wazuh" },
  { name: "Wazuh", detail: "Detection engine — generates alerts", owner: "wazuh" },
  { name: "Wazuh API", detail: "Alerts pulled server-side by FastAPI only", owner: "wazuh" },
  { name: "FastAPI ingestion", detail: "Parsing and normalization", owner: "sentineliq" },
  { name: "Alert correlation", detail: "Groups related alerts into candidates", owner: "sentineliq" },
  { name: "XGBoost triage", detail: "Predicts incident priority", owner: "sentineliq" },
  { name: "SHAP", detail: "Explains that prediction", owner: "sentineliq" },
  { name: "MITRE ATT&CK context", detail: "Backend-provided technique mapping", owner: "sentineliq" },
  { name: "Ollama local LLM", detail: "Human-readable summary of processed incident", owner: "sentineliq" },
  { name: "PostgreSQL", detail: "Persists incidents and explanations", owner: "sentineliq" },
  { name: "React dashboard", detail: "Investigation workspace", owner: "analyst" },
  { name: "SOC analyst", detail: "Decision maker", owner: "analyst" },
];

const ownerStyles: Record<PipelineStage["owner"], string> = {
  wazuh: "border-low/40 bg-low-soft text-foreground",
  sentineliq: "border-primary/40 bg-primary/10 text-foreground",
  analyst: "border-ok/40 bg-ok-soft text-foreground",
};

const ownerLabel: Record<PipelineStage["owner"], string> = {
  wazuh: "Wazuh",
  sentineliq: "SentinelIQ",
  analyst: "Analyst",
};

export function PipelineFlow({ stages = SENTINELIQ_PIPELINE }: { stages?: PipelineStage[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(["wazuh", "sentineliq", "analyst"] as const).map((owner) => (
          <span key={owner} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-2 rounded-sm border", ownerStyles[owner])} aria-hidden />
            {ownerLabel[owner]}
          </span>
        ))}
      </div>
      <ol className="flex flex-wrap items-stretch gap-1.5">
        {stages.map((stage, i) => (
          <li key={stage.name} className="flex items-stretch gap-1.5">
            <div className={cn("min-w-36 max-w-48 rounded-md border px-2.5 py-2", ownerStyles[stage.owner])}>
              <p className="text-xs font-semibold leading-tight">{stage.name}</p>
              {stage.detail && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{stage.detail}</p>}
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="size-3.5 shrink-0 self-center text-muted-foreground" aria-hidden />
            )}
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-muted-foreground">
        The dashboard never contacts Wazuh directly and stores no Wazuh credentials — all reads go through the
        SentinelIQ FastAPI service.
      </p>
    </div>
  );
}
