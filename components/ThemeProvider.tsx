"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  resolved: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  setMode: () => {},
  resolved: "dark",
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getResolved(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"dark" | "light">("dark");

  // On mount: read localStorage and apply
  useEffect(() => {
    const stored = (localStorage.getItem("thp-theme") as ThemeMode) ?? "system";
    setModeState(stored);
    const res = getResolved(stored);
    setResolved(res);
    document.documentElement.setAttribute("data-theme", res);

    // Watch system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      if (stored === "system") {
        const r = getResolved("system");
        setResolved(r);
        document.documentElement.setAttribute("data-theme", r);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    localStorage.setItem("thp-theme", m);
    const res = getResolved(m);
    setResolved(res);
    document.documentElement.setAttribute("data-theme", res);
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
