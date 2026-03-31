"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/flavors", label: "Flavors", icon: "◭" },
];

export function SideNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: "200px",
        flexShrink: 0,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "0 1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}
        >
          🎭 THP Flavors
        </div>
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--accent)",
            marginTop: "2px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Prompt Chain Tool
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0" }}>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.55rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--accent)" : "var(--text-muted)",
                background: active ? "var(--bg-hover)" : "transparent",
                borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
                transition: "all 0.15s",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme + user */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <ThemeToggle />
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={userEmail}
        >
          {userEmail}
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "0.4rem 0.75rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--error)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
