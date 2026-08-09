import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useMode } from "./mode";
import type { IncidentStatus } from "./types";

const STALE = 15_000;

export function useHealth() {
  const { mode } = useMode();
  return useQuery({
    queryKey: ["health", mode],
    queryFn: () => api.getHealth(mode),
    refetchInterval: mode === "live" ? 20_000 : false,
  });
}

export function useDashboardMetrics() {
  const { mode } = useMode();
  return useQuery({ queryKey: ["metrics", mode], queryFn: () => api.getDashboardMetrics(mode), staleTime: STALE });
}

export function useAnalytics() {
  const { mode } = useMode();
  return useQuery({ queryKey: ["analytics", mode], queryFn: () => api.getAnalytics(mode), staleTime: STALE });
}

export function useAlerts() {
  const { mode } = useMode();
  return useQuery({ queryKey: ["alerts", mode], queryFn: () => api.listAlerts(mode), staleTime: STALE });
}

export function useIncidents() {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incidents", mode], queryFn: () => api.listIncidents(mode), staleTime: STALE });
}

export function useIncident(id: string) {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incident", mode, id], queryFn: () => api.getIncident(mode, id) });
}

export function useIncidentAlerts(id: string) {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incident-alerts", mode, id], queryFn: () => api.getIncidentAlerts(mode, id) });
}

export function useIncidentExplanation(id: string) {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incident-explanation", mode, id], queryFn: () => api.getIncidentExplanation(mode, id) });
}

export function useIncidentMitre(id: string) {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incident-mitre", mode, id], queryFn: () => api.getIncidentMitre(mode, id) });
}

export function useIncidentCorrelation(id: string) {
  const { mode } = useMode();
  return useQuery({ queryKey: ["incident-correlation", mode, id], queryFn: () => api.getIncidentCorrelation(mode, id) });
}

export function useCorrelationGroups() {
  const { mode } = useMode();
  return useQuery({ queryKey: ["correlations", mode], queryFn: () => api.listCorrelationGroups(mode), staleTime: STALE });
}

export function useIncidentActions(id: string) {
  const { mode, analyst } = useMode();
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["incident", mode, id] });
    void qc.invalidateQueries({ queryKey: ["incidents", mode] });
  };

  const setStatus = useMutation({
    mutationFn: (status: IncidentStatus) => api.updateIncidentStatus(mode, id, status),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: (body: string) => api.addIncidentNote(mode, id, body, analyst),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (name: string) => api.assignIncident(mode, id, name),
    onSuccess: invalidate,
  });

  return { setStatus, addNote, assign };
}
