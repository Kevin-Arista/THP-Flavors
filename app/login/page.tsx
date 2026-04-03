"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const errorMessages: Record<string, string> = {
    not_admin: "Access denied. This tool requires superadmin or matrix admin privileges.",
    unauthorized: "Your session expired. Please sign in again.",
    auth_callback_failed: "Authentication failed. Please try again.",
  };

  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
        {errorParam && (
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
            {errorMessages[errorParam] ?? errorParam}
          </div>
        )}

        <button
          onClick={handleSignIn}
          style={{
            width: "100%",
            padding: "0.7rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#fff",
            background: "#4285F4",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(66,133,244,0.3)",
            transition: "box-shadow 0.2s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 0 25px rgba(66,133,244,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 0 15px rgba(66,133,244,0.3)";
          }}
        >
          Sign in with Google
        </button>
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
