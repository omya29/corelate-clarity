import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AwaitingBackend, Panel } from "@/components/soc/primitives";
import { useIncidentFeedback, useSubmitFeedback } from "@/lib/sentineliq/hooks";
import { useMode } from "@/lib/sentineliq/mode";
import { formatDateTime } from "@/lib/sentineliq/display";
import type { FeedbackAction } from "@/lib/sentineliq/types";

const LABEL: Record<FeedbackAction, string> = {
  confirmed: "Confirm — True Positive",
  dismissed: "Dismiss — False Positive",
};

export function FeedbackPanel({ incidentId }: { incidentId: string }) {
  const { analyst } = useMode();
  const feedback = useIncidentFeedback(incidentId);
  const submit = useSubmitFeedback(incidentId);
  const [open, setOpen] = useState<FeedbackAction | null>(null);
  const [comment, setComment] = useState("");
  const history = feedback.data?.data ?? null;
  const latest = history && history.length ? history[history.length - 1] : null;

  const send = () => {
    if (!open) return;
    submit.mutate(
      { action: open, comment: comment.trim() },
      {
        onSuccess: () => {
          toast.success(`Feedback recorded: ${open === "confirmed" ? "true positive" : "false positive"}`);
          setOpen(null);
          setComment("");
        },
        onError: (e) => toast.error(`Feedback not saved — backend unavailable (${e instanceof Error ? e.message : "error"})`),
      },
    );
  };

  return (
    <Panel
      title="Analyst feedback"
      subtitle="Analyst decision on the AI triage — used as ground truth, not an AI output."
      actions={latest ? (
        <span className="rounded-sm border border-ok/40 bg-ok-soft px-1.5 py-0.5 text-[10px] font-medium text-ok">
          Reviewed by {latest.analyst}
        </span>
      ) : undefined}
      bodyClassName="p-3 space-y-3"
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen("confirmed")}>
          <CheckCircle2 className="size-3.5" aria-hidden /> {LABEL.confirmed}
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen("dismissed")}>
          <XCircle className="size-3.5" aria-hidden /> {LABEL.dismissed}
        </Button>
      </div>

      {history === null ? (
        <AwaitingBackend label="Feedback history — awaiting backend data" />
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No feedback recorded for this incident yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {[...history].reverse().map((f, i) => (
            <li key={f.id ?? i} className="rounded-sm border border-border p-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className={f.action === "confirmed" ? "font-medium text-critical" : "font-medium text-muted-foreground"}>
                  {f.action === "confirmed" ? "True positive" : "False positive"}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{f.analyst}</span>
                {f.created_at && <span className="font-mono text-[11px] text-muted-foreground">{formatDateTime(f.created_at)}</span>}
              </div>
              {f.comment && <p className="mt-1 text-foreground">{f.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{open ? LABEL[open] : ""}</DialogTitle>
            <DialogDescription className="text-xs">
              Submitting as <span className="font-mono">{analyst}</span> for {incidentId}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className="min-h-20 text-xs"
            maxLength={1000}
          />
          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            <Button size="sm" onClick={send} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
