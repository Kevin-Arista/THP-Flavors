"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  fontSize: "0.875rem",
  color: "var(--text)",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function NewFlavorPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/flavors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug.trim(),
        description: description.trim() || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create flavor.");
      setSaving(false);
      return;
    }

    const created = await res.json();
    router.push(`/flavors/${created.id}`);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.75rem",
        }}
      >
        <Link href="/flavors" style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
          ← Flavors
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
          New Flavor
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {error && (
          <div
            style={{
              color: "var(--error)",
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              borderRadius: "8px",
              padding: "0.6rem 0.9rem",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <Field label="Slug *">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            required
            disabled={saving}
            placeholder="e.g. dry-wit"
            style={inputStyle}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
            Lowercase, hyphens only. Used as the flavor identifier.
          </span>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            placeholder="What makes this flavor unique…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </Field>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            disabled={saving || !slug.trim()}
            style={{
              flex: 1,
              padding: "0.65rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: saving || !slug.trim() ? "var(--text-dim)" : "var(--accent-fg)",
              background: saving || !slug.trim() ? "var(--border)" : "var(--accent)",
              border: "none",
              borderRadius: "8px",
              cursor: saving || !slug.trim() ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {saving ? "Creating…" : "Create Flavor"}
          </button>
          <Link
            href="/flavors"
            style={{
              padding: "0.65rem 1.25rem",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
