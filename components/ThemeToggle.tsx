"use client";

import { useTheme } from "./ThemeProvider";

const MODES = [
  { value: "dark", icon: "◑", label: "Dark" },
  { value: "light", icon: "◐", label: "Light" },
  { value: "system", icon: "◎", label: "System" },
] as const;

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        background: "var(--border)",
        borderRadius: "8px",
        padding: "2px",
      }}
    >
      {MODES.map((m) => {
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--accent-fg)" : "var(--text-muted)",
              background: active ? "var(--accent)" : "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
