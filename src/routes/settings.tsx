import { createFileRoute } from "@tanstack/react-router";
import { KeyValue, PageHeader, Panel } from "@/components/soc/primitives";
import { useMode } from "@/lib/sentineliq/mode";
import { API_BASE_URL } from "@/lib/sentineliq/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SentinelIQ" },
      { name: "description", content: "Configure the SentinelIQ dashboard data source, backend base URL and analyst identity for the lab environment." },
      { property: "og:title", content: "Settings — SentinelIQ" },
      { property: "og:description", content: "Data source mode, backend URL and environment settings for the SentinelIQ console." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, setMode, analyst } = useMode();

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Platform" title="Settings" description="Frontend configuration only. No Wazuh or database credentials are ever stored in the browser." />

      <Panel title="Data source" subtitle="Demo mode renders a synthetic dataset locally; live mode calls the SentinelIQ FastAPI backend.">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={mode === "demo" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setMode("demo")}>
            Demo data
          </Button>
          <Button variant={mode === "live" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setMode("live")}>
            Live API
          </Button>
          <span className="text-xs text-muted-foreground">
            In live mode, failed requests fall back to demo data and are labelled as such — never presented as real.
          </span>
        </div>
      </Panel>

      <Panel title="Environment">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Environment" value="LAB" />
          <KeyValue label="Backend base URL" value={API_BASE_URL} mono />
          <KeyValue label="Configured via" value="VITE_SENTINELIQ_API_URL" mono />
          <KeyValue label="Current analyst" value={analyst} mono />
        </div>
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          SentinelIQ is an analysis and incident-triage layer on top of Wazuh. It does not replace Wazuh and is not a
          SIEM, XDR, EDR or SOAR platform. Wazuh performs event collection and alert generation; SentinelIQ performs
          ingestion, normalization, correlation, triage, explainability and MITRE context for the analyst.
        </p>
      </Panel>
    </div>
  );
}
