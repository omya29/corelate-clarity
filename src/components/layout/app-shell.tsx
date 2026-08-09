import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  FileText,
  Gauge,
  Grid3x3,
  LayoutDashboard,
  Network,
  Search,
  Server,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/lib/sentineliq/hooks";
import { useMode } from "@/lib/sentineliq/mode";
import { API_BASE_URL } from "@/lib/sentineliq/api";
import { componentStateMeta } from "@/lib/sentineliq/display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, group: "Operations" },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert, group: "Operations" },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle, group: "Operations" },
  { to: "/investigation", label: "Investigation", icon: Search, group: "Analysis" },
  { to: "/correlations", label: "Correlations", icon: Network, group: "Analysis" },
  { to: "/mitre", label: "MITRE ATT&CK", icon: Grid3x3, group: "Analysis" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, group: "Reporting" },
  { to: "/reports", label: "Reports", icon: FileText, group: "Reporting" },
  { to: "/system-status", label: "System Status", icon: Server, group: "Platform" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Platform" },
];

const GROUPS = ["Operations", "Analysis", "Reporting", "Platform"];

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-7 items-center justify-center rounded-sm border border-primary/40 bg-primary/12">
          <Gauge className="size-4 text-primary" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-foreground">SentinelIQ</p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">TRIAGE CONSOLE</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {GROUPS.map((group) => (
          <div key={group} className="mb-3">
            <p className="label-caps px-2 pb-1">{group}</p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === group).map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <p className="label-caps">Scope</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Analysis and triage layer on top of Wazuh. Not a SIEM, XDR, EDR or SOAR platform.
        </p>
      </div>
    </aside>
  );
}

function StatusPill({
  name,
  state,
  detail,
}: {
  name: string;
  state: keyof typeof componentStateMeta;
  detail: string;
}) {
  const meta = componentStateMeta[state];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[11px]">
          <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
          <span className="text-muted-foreground">{name}</span>
          <span className={cn("font-mono font-semibold tracking-wider", meta.text)}>{meta.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{detail}</TooltipContent>
    </Tooltip>
  );
}

function TopBar() {
  const { mode, setMode, analyst } = useMode();
  const { data } = useHealth();
  const health = data?.data;
  const wazuh = health?.components.find((c) => c.key === "wazuh");
  const backend = health?.components.find((c) => c.key === "fastapi");

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2 lg:hidden">
        <Gauge className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-semibold">SentinelIQ</span>
      </div>

      <span className="flex items-center gap-1.5 rounded-sm border border-border-strong bg-background px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground">
        ENV: LAB
      </span>

      <div className="hidden items-center gap-2 md:flex">
        <StatusPill
          name="Wazuh"
          state={wazuh?.state ?? "unknown"}
          detail={wazuh?.detail ?? "Status is reported by the SentinelIQ backend; the browser never contacts Wazuh."}
        />
        <StatusPill
          name="API"
          state={backend?.state ?? "unknown"}
          detail={backend?.detail ?? `SentinelIQ FastAPI at ${API_BASE_URL}`}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center rounded-sm border border-border bg-background p-0.5">
          {(["demo", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-[3px] px-2 py-1 font-mono text-[10px] font-semibold tracking-widest transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "demo" ? "DEMO DATA" : "LIVE API"}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8" aria-label="Notifications">
              <Bell className="size-4" aria-hidden />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-critical" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="label-caps">Queue notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="text-xs font-medium">INC-2026-0043 escalated</span>
              <span className="text-[11px] text-muted-foreground">Critical priority — win-workstation-02</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="text-xs font-medium">INC-2026-0045 unassigned</span>
              <span className="text-[11px] text-muted-foreground">High priority — db-node-01</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/incidents" className="text-xs">
                Open incident queue
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 border-l border-border pl-2">
          <span className="flex size-7 items-center justify-center rounded-sm border border-border bg-background font-mono text-[10px] font-semibold text-muted-foreground">
            {analyst.slice(-2).toUpperCase()}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium text-foreground">{analyst}</p>
            <p className="text-[10px] text-muted-foreground">Tier 2 analyst</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-1.5 lg:hidden">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-xs",
              active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-3.5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { mode } = useMode();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <MobileNav />
        {mode === "demo" && (
          <div className="flex items-center gap-2 border-b border-medium/30 bg-medium-soft px-4 py-1.5 text-[11px] text-medium">
            <Activity className="size-3.5" aria-hidden />
            <span>
              <strong className="font-semibold">DEMO DATA</strong> — synthetic lab dataset. No live Wazuh alerts, no
              measured performance figures. Switch to LIVE API once the SentinelIQ FastAPI backend is running.
            </span>
          </div>
        )}
        <main className="min-w-0 flex-1 space-y-4 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
