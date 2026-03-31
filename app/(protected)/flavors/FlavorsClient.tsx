"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Flavor = {
  id: string;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
};

function DuplicateInline({
  flavor,
  onDone,
  onError,
}: {
  flavor: Flavor;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(`${flavor.slug}-copy`);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!slug.trim()) return;
    setSaving(true);

    const res = await fetch(`/api/flavors/${flavor.id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim() }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      onError(body.error ?? "Failed to duplicate.");
      onDone();
      return;
    }

    const created = await res.json();
    router.push(`/flavors/${created.id}`);
    router.refresh();
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.5rem 0.75rem",
        background: "var(--bg-hover)",
        border: "1px solid var(--accent)",
        borderRadius: "8px",
      }}
    >
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        New slug:
      </span>
      <input
        autoFocus
        type="text"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
          if (e.key === "Escape") onDone();
        }}
        disabled={saving}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "0.25rem 0.5rem",
          fontSize: "0.8rem",
          color: "var(--text)",
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "5px",
          outline: "none",
          fontFamily: "monospace",
        }}
      />
      <button
        onClick={handleConfirm}
        disabled={saving || !slug.trim()}
        style={{
          padding: "0.25rem 0.6rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--accent-fg)",
          background: "var(--accent)",
          border: "none",
          borderRadius: "5px",
          cursor: saving ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {saving ? "…" : "Confirm"}
      </button>
      <button
        onClick={onDone}
        disabled={saving}
        style={{
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function FlavorsClient({ flavors }: { flavors: Flavor[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, slug: string) {
    if (!confirm(`Delete flavor "${slug}"? This will also delete all its steps.`)) return;
    setDeleting(id);
    setError(null);

    const res = await fetch(`/api/flavors/${id}`, { method: "DELETE" });
    setDeleting(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div
          style={{
            color: "var(--error)",
            background: "var(--error-bg)",
            border: "1px solid var(--error-border)",
            borderRadius: "8px",
            padding: "0.6rem 0.9rem",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 120px 170px",
            padding: "0.6rem 1rem",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          <span>Slug</span>
          <span>Description</span>
          <span>Created</span>
          <span></span>
        </div>

        {!flavors.length && (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: "0.875rem",
            }}
          >
            No flavors yet.{" "}
            <Link
              href="/flavors/new"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Create one
            </Link>
            .
          </div>
        )}

        {flavors.map((f, i) => (
          <div key={f.id}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 120px 170px",
                padding: "0.75rem 1rem",
                alignItems: "center",
                borderBottom:
                  i < flavors.length - 1 && duplicating !== f.id
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--accent)",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {f.slug}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: "1rem",
                }}
              >
                {f.description ?? "—"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                {new Date(f.created_datetime_utc).toLocaleDateString()}
              </span>
              <span style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                <Link
                  href={`/flavors/${f.id}/test`}
                  style={{
                    padding: "0.3rem 0.55rem",
                    fontSize: "0.75rem",
                    color: "var(--warning)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                >
                  Test
                </Link>
                <Link
                  href={`/flavors/${f.id}`}
                  style={{
                    padding: "0.3rem 0.55rem",
                    fontSize: "0.75rem",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                >
                  Edit
                </Link>
                <button
                  onClick={() =>
                    setDuplicating(duplicating === f.id ? null : f.id)
                  }
                  style={{
                    padding: "0.3rem 0.55rem",
                    fontSize: "0.75rem",
                    color:
                      duplicating === f.id ? "var(--accent)" : "var(--text-muted)",
                    background: "transparent",
                    border: `1px solid ${duplicating === f.id ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  title="Duplicate this flavor"
                >
                  ⎘ Dupe
                </button>
                <button
                  onClick={() => handleDelete(f.id, f.slug)}
                  disabled={deleting === f.id}
                  style={{
                    padding: "0.3rem 0.55rem",
                    fontSize: "0.75rem",
                    color: deleting === f.id ? "var(--text-dim)" : "var(--error)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: deleting === f.id ? "default" : "pointer",
                  }}
                >
                  {deleting === f.id ? "…" : "Del"}
                </button>
              </span>
            </div>

            {/* Inline duplicate form */}
            {duplicating === f.id && (
              <div
                style={{
                  padding: "0 1rem 0.75rem",
                  borderBottom:
                    i < flavors.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <DuplicateInline
                  flavor={f}
                  onDone={() => setDuplicating(null)}
                  onError={(msg) => {
                    setError(msg);
                    setDuplicating(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
