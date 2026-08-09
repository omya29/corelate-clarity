import { useState } from "react";
import { ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Line({ k, value, depth }: { k: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isObject = value !== null && typeof value === "object";

  if (!isObject) {
    return (
      <div className="flex gap-2 py-0.5" style={{ paddingLeft: depth * 14 }}>
        <span className="text-primary">{k}:</span>
        <span className={cn(typeof value === "number" ? "text-medium" : "text-foreground")}>
          {value === null ? "null" : JSON.stringify(value)}
        </span>
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 py-0.5 text-left text-primary hover:text-foreground"
      >
        <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} aria-hidden />
        {k}
        <span className="text-muted-foreground">
          {Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open && entries.map(([ck, cv]) => <Line key={ck} k={ck} value={cv} depth={depth + 1} />)}
    </div>
  );
}

export function JsonViewer({ data, label = "View raw event" }: { data: Record<string, unknown>; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
          {label.toUpperCase()}
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[11px]"
          onClick={() => {
            void navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy className="size-3" aria-hidden />
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      {open && (
        <div className="max-h-80 overflow-auto border-t border-border px-3 py-2 font-mono text-[11px] leading-relaxed">
          {Object.entries(data).map(([k, v]) => (
            <Line key={k} k={k} value={v} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
