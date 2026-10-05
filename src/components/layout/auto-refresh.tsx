import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: 0, label: "Off" },
  { value: 30_000, label: "30s" },
  { value: 60_000, label: "1m" },
  { value: 300_000, label: "5m" },
];

export function AutoRefresh() {
  const qc = useQueryClient();
  const [interval, setIntervalMs] = useState(60_000);
  const [paused, setPaused] = useState(false);
  const [last, setLast] = useState<string>("");

  useEffect(() => {
    setLast(new Date().toLocaleTimeString([], { hour12: false }));
    if (!interval || paused) return;
    const t = setInterval(() => {
      void qc.invalidateQueries();
      setLast(new Date().toLocaleTimeString([], { hour12: false }));
    }, interval);
    return () => clearInterval(t);
  }, [interval, paused, qc]);

  const active = interval > 0 && !paused;

  return (
    <div
      className="hidden items-center gap-1 rounded-sm border border-border bg-background py-0.5 pl-2 pr-0.5 md:flex"
      title={last ? `Last refresh ${last}` : undefined}
    >
      <RefreshCw className={cn("size-3", active ? "text-ok" : "text-muted-foreground")} aria-hidden />
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground">AUTO</span>
      <select
        aria-label="Auto-refresh interval"
        value={interval}
        onChange={(e) => setIntervalMs(Number(e.target.value))}
        className="bg-transparent font-mono text-[10px] font-semibold text-foreground outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-popover">
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!interval}
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
        className="flex size-6 items-center justify-center rounded-[3px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
      >
        {paused ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
      </button>
    </div>
  );
}
