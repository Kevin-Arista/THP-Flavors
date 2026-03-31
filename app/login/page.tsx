"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = params.get("error");
  const errorMessages: Record<string, string> = {
    not_admin: "Access denied. This tool requires superadmin or matrix admin privileges.",
    unauthorized: "Your session expired. Please sign in again.",
  };

  useEffect(() => {
    // If already logged in, redirect
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/flavors");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/flavors");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Theme toggle top-right */}
      <div style={{ position: "fixed", top: "1rem", right: "1rem" }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2.5rem",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: "-0.02em",
              marginBottom: "0.25rem",
            }}
          >
            🎭 THP Flavors
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Humor flavor prompt chain manager
          </p>
        </div>

        {/* Error banner */}
        {(error || errorParam) && (
          <div
            style={{
              color: "var(--error)",
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              borderRadius: "8px",
              padding: "0.65rem 0.9rem",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            {error ?? errorMessages[errorParam!] ?? errorParam}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                fontSize: "0.9rem",
                color: "var(--text)",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                fontSize: "0.9rem",
                color: "var(--text)",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.7rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: loading ? "var(--text-dim)" : "var(--accent-fg)",
              background: loading ? "var(--border)" : "var(--accent)",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "default" : "pointer",
              transition: "all 0.15s",
              marginTop: "0.25rem",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
