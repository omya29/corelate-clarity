import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Mode } from "./api";

const STORAGE_KEY = "sentineliq.mode";
const ANALYST_KEY = "sentineliq.analyst";

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  analyst: string;
}

const ModeContext = createContext<ModeContextValue>({ mode: "demo", setMode: () => {}, analyst: "analyst.rk" });

export function ModeProvider({ children }: { children: ReactNode }) {
  // Default to demo so the UI renders identically on the server and first client paint.
  const [mode, setModeState] = useState<Mode>("demo");
  const [analyst, setAnalyst] = useState("analyst.rk");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "live" || stored === "demo") setModeState(stored);
    const storedAnalyst = window.localStorage.getItem(ANALYST_KEY);
    if (storedAnalyst) setAnalyst(storedAnalyst);
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ mode, setMode, analyst }), [mode, setMode, analyst]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
