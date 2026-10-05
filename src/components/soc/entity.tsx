import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Search } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export type EntityKind = "ip" | "host" | "hash" | "id" | "technique";

const KIND_LABEL: Record<EntityKind, string> = {
  ip: "IP address",
  host: "Host",
  hash: "File hash",
  id: "Identifier",
  technique: "MITRE technique",
};

function isPrivateIp(ip: string) {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/entity:opacity-100",
        done && "text-ok opacity-100",
        className,
      )}
    >
      {done ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
    </button>
  );
}

/** Monospace data token with hover context and click-to-copy. */
export function Entity({
  value,
  kind,
  className,
}: {
  value: string | null | undefined;
  kind: EntityKind;
  className?: string;
}) {
  if (!value) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  return (
    <span className={cn("group/entity inline-flex max-w-full items-center gap-1", className)}>
      <HoverCard openDelay={350} closeDelay={80}>
        <HoverCardTrigger asChild>
          <span className="cursor-default truncate font-mono text-xs underline decoration-border-strong decoration-dotted underline-offset-4">
            {value}
          </span>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 p-3">
          <p className="label-caps">{KIND_LABEL[kind]}</p>
          <p className="mt-0.5 break-all font-mono text-sm text-foreground">{value}</p>
          {kind === "ip" && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Scope: <span className="text-foreground">{isPrivateIp(value) ? "Internal (RFC1918)" : "External"}</span>
              <br />
              Reputation: <span className="text-foreground">not provided by backend</span>
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-2">
            <Link
              to="/investigation"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Search className="size-3" aria-hidden /> Search this {kind === "ip" ? "IP" : kind}
            </Link>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(value)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3" aria-hidden /> Copy
            </button>
          </div>
        </HoverCardContent>
      </HoverCard>
      <CopyButton value={value} />
    </span>
  );
}

export function PulseDot({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex size-1.5 shrink-0">
      <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", className)} />
      <span className={cn("relative inline-flex size-1.5 rounded-full", className)} />
    </span>
  );
}
