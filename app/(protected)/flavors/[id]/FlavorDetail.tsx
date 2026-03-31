"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Flavor = {
  id: string;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
};

type Step = {
  id: string;
  humor_flavor_id: string;
  order_by: number;
  description: string | null;
  llm_temperature: number | null;
  llm_model_id: string | null;
  llm_input_type_id: number | null;
  llm_output_type_id: number | null;
  humor_flavor_step_type_id: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  created_datetime_utc: string;
};

type LlmModel = { id: string; name: string };
type LookupItem = { id: number; slug: string; description: string | null };

type Caption = {
  id: string;
  content: string;
  created_datetime_utc: string;
  image_id: string | null;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  fontSize: "0.875rem",
  color: "var(--text)",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "1rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Flavor edit section
// ──────────────────────────────────────────────────────────────
function FlavorEditForm({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const [slug, setSlug] = useState(flavor.slug);
  const [description, setDescription] = useState(flavor.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/flavors/${flavor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug.trim(),
        description: description.trim() || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save.");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form
      onSubmit={handleSave}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={labelStyle}>Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            required
            disabled={saving}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            placeholder="What makes this flavor unique…"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={saving || !slug.trim()}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: saving ? "var(--text-dim)" : "var(--accent-fg)",
            background: saving ? "var(--border)" : "var(--accent)",
            border: "none",
            borderRadius: "8px",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span style={{ fontSize: "0.82rem", color: "var(--success)" }}>
            ✓ Saved
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-dim)" }}>
          Created {new Date(flavor.created_datetime_utc).toLocaleString()}
        </span>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────
// Step row (view + inline edit)
// ──────────────────────────────────────────────────────────────
function StepRow({
  step,
  index,
  total,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
  onReorder,
  onDelete,
  onUpdate,
}: {
  step: Step;
  index: number;
  total: number;
  models: LlmModel[];
  inputTypes: LookupItem[];
  outputTypes: LookupItem[];
  stepTypes: LookupItem[];
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(step.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(step.llm_system_prompt ?? "");
  const [userPrompt, setUserPrompt] = useState(step.llm_user_prompt ?? "");
  const [temperature, setTemperature] = useState(
    step.llm_temperature != null ? String(step.llm_temperature) : "",
  );
  const [modelId, setModelId] = useState(step.llm_model_id ?? "");
  const [inputTypeId, setInputTypeId] = useState(
    step.llm_input_type_id != null ? String(step.llm_input_type_id) : "",
  );
  const [outputTypeId, setOutputTypeId] = useState(
    step.llm_output_type_id != null ? String(step.llm_output_type_id) : "",
  );
  const [stepTypeId, setStepTypeId] = useState(
    step.humor_flavor_step_type_id != null ? String(step.humor_flavor_step_type_id) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const modelName = models.find((m) => m.id === step.llm_model_id)?.name ?? null;
  const inputTypeName = inputTypes.find((t) => t.id === step.llm_input_type_id)?.slug ?? null;
  const outputTypeName = outputTypes.find((t) => t.id === step.llm_output_type_id)?.slug ?? null;
  const stepTypeName = stepTypes.find((t) => t.id === step.humor_flavor_step_type_id)?.slug ?? null;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/flavor-steps/${step.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim() || null,
        llm_system_prompt: systemPrompt.trim() || null,
        llm_user_prompt: userPrompt.trim() || null,
        llm_temperature: temperature !== "" ? parseFloat(temperature) : null,
        llm_model_id: modelId || null,
        llm_input_type_id: inputTypeId ? Number(inputTypeId) : null,
        llm_output_type_id: outputTypeId ? Number(outputTypeId) : null,
        humor_flavor_step_type_id: stepTypeId ? Number(stepTypeId) : null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save step.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    onUpdate();
  }

  async function handleReorder(direction: "up" | "down") {
    setMoving(true);
    await onReorder(step.id, direction);
    setMoving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete step ${index + 1}?`)) return;
    setRemoving(true);
    await onDelete(step.id);
    setRemoving(false);
  }

  if (editing) {
    return (
      <div
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--accent)",
          borderRadius: "10px",
          padding: "1.25rem",
          marginBottom: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            Step {index + 1}
          </span>
          <button
            onClick={() => setEditing(false)}
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕ Cancel
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "var(--error)",
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              fontSize: "0.82rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this step does…"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            placeholder="You are a helpful assistant…"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>User Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the image in detail…"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>Step Type *</label>
            <select
              value={stepTypeId}
              onChange={(e) => setStepTypeId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— select —</option>
              {stepTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.slug}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>Input Type *</label>
            <select
              value={inputTypeId}
              onChange={(e) => setInputTypeId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— select —</option>
              {inputTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.slug}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>Output Type *</label>
            <select
              value={outputTypeId}
              onChange={(e) => setOutputTypeId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— select —</option>
              {outputTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.slug}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>LLM Model *</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— select —</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={labelStyle}>Temperature (0–2)</label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              min="0"
              max="2"
              step="0.1"
              placeholder="e.g. 0.7"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: saving ? "var(--text-dim)" : "var(--accent-fg)",
              background: saving ? "var(--border)" : "var(--accent)",
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save Step"}
          </button>
        </div>
      </div>
    );
  }

  // Collapsed view
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        marginBottom: "0.75rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      {/* Order badge + reorder */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          {index + 1}
        </div>
        <button
          onClick={() => handleReorder("up")}
          disabled={index === 0 || moving}
          title="Move up"
          style={{
            width: "22px",
            height: "22px",
            fontSize: "0.65rem",
            color: index === 0 ? "var(--text-dim)" : "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            cursor: index === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ▲
        </button>
        <button
          onClick={() => handleReorder("down")}
          disabled={index === total - 1 || moving}
          title="Move down"
          style={{
            width: "22px",
            height: "22px",
            fontSize: "0.65rem",
            color: index === total - 1 ? "var(--text-dim)" : "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            cursor: index === total - 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ▼
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "0.3rem",
          }}
        >
          {step.description ?? (
            <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
              No description
            </span>
          )}
        </div>

        {/* Meta pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {stepTypeName && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "var(--bg-hover)",
                color: "var(--accent)",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              {stepTypeName}
            </span>
          )}
          {inputTypeName && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              in: {inputTypeName}
            </span>
          )}
          {outputTypeName && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              out: {outputTypeName}
            </span>
          )}
          {modelName && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "rgba(167,139,250,0.12)",
                color: "var(--purple)",
                borderRadius: "999px",
                border: "1px solid rgba(167,139,250,0.2)",
              }}
            >
              {modelName}
            </span>
          )}
          {step.llm_temperature != null && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "rgba(245,158,11,0.1)",
                color: "var(--warning)",
                borderRadius: "999px",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              temp {step.llm_temperature}
            </span>
          )}
          {step.llm_system_prompt && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              system ✓
            </span>
          )}
          {step.llm_user_prompt && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                borderRadius: "999px",
                border: "1px solid var(--border)",
              }}
            >
              user ✓
            </span>
          )}
        </div>

        {/* Prompt previews */}
        {step.llm_system_prompt && (
          <div style={{ marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600 }}>
              SYSTEM:{" "}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}
            >
              {step.llm_system_prompt.length > 120
                ? step.llm_system_prompt.slice(0, 120) + "…"
                : step.llm_system_prompt}
            </span>
          </div>
        )}
        {step.llm_user_prompt && (
          <div style={{ marginTop: "0.3rem" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600 }}>
              USER:{" "}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}
            >
              {step.llm_user_prompt.length > 120
                ? step.llm_user_prompt.slice(0, 120) + "…"
                : step.llm_user_prompt}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            color: "var(--accent)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={removing}
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            color: removing ? "var(--text-dim)" : "var(--error)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: removing ? "default" : "pointer",
          }}
        >
          {removing ? "…" : "Del"}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Add step form
// ──────────────────────────────────────────────────────────────
function AddStepForm({
  flavorId,
  nextOrder,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
  onAdded,
}: {
  flavorId: string;
  nextOrder: number;
  models: LlmModel[];
  inputTypes: LookupItem[];
  outputTypes: LookupItem[];
  stepTypes: LookupItem[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState("");
  const [modelId, setModelId] = useState("");
  const [inputTypeId, setInputTypeId] = useState("");
  const [outputTypeId, setOutputTypeId] = useState("");
  const [stepTypeId, setStepTypeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/flavor-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        humor_flavor_id: flavorId,
        order_by: nextOrder,
        description: description.trim() || null,
        llm_system_prompt: systemPrompt.trim() || null,
        llm_user_prompt: userPrompt.trim() || null,
        llm_temperature: temperature !== "" ? parseFloat(temperature) : null,
        llm_model_id: modelId || null,
        llm_input_type_id: inputTypeId ? Number(inputTypeId) : null,
        llm_output_type_id: outputTypeId ? Number(outputTypeId) : null,
        humor_flavor_step_type_id: stepTypeId ? Number(stepTypeId) : null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add step.");
      setSaving(false);
      return;
    }

    // Reset form
    setDescription("");
    setSystemPrompt("");
    setUserPrompt("");
    setTemperature("");
    setModelId("");
    setInputTypeId("");
    setOutputTypeId("");
    setStepTypeId("");
    setSaving(false);
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--accent)",
          background: "transparent",
          border: "2px dashed var(--border)",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        + Add Step {nextOrder}
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "2px dashed var(--accent)",
        borderRadius: "10px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          New Step {nextOrder}
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "var(--error)",
            background: "var(--error-bg)",
            border: "1px solid var(--error-border)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            fontSize: "0.82rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label style={labelStyle}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this step does…"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label style={labelStyle}>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          placeholder="You are a helpful assistant…"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label style={labelStyle}>User Prompt</label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={4}
          placeholder="Describe the image in detail…"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>Step Type *</label>
          <select
            value={stepTypeId}
            onChange={(e) => setStepTypeId(e.target.value)}
            required
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— select —</option>
            {stepTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>Input Type *</label>
          <select
            value={inputTypeId}
            onChange={(e) => setInputTypeId(e.target.value)}
            required
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— select —</option>
            {inputTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>Output Type *</label>
          <select
            value={outputTypeId}
            onChange={(e) => setOutputTypeId(e.target.value)}
            required
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— select —</option>
            {outputTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>LLM Model *</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            required
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— select —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={labelStyle}>Temperature (0–2)</label>
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            min="0"
            max="2"
            step="0.1"
            placeholder="e.g. 0.7"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={saving}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: saving ? "var(--text-dim)" : "var(--accent-fg)",
          background: saving ? "var(--border)" : "var(--accent)",
          border: "none",
          borderRadius: "8px",
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Adding…" : "Add Step"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main FlavorDetail component
// ──────────────────────────────────────────────────────────────
export function FlavorDetail({
  flavor,
  steps: initialSteps,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
  captions,
}: {
  flavor: Flavor;
  steps: Step[];
  models: LlmModel[];
  inputTypes: LookupItem[];
  outputTypes: LookupItem[];
  stepTypes: LookupItem[];
  captions: Caption[];
}) {
  const router = useRouter();
  const [reorderError, setReorderError] = useState<string | null>(null);

  async function handleReorder(id: string, direction: "up" | "down") {
    setReorderError(null);
    const res = await fetch(`/api/flavor-steps/${id}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setReorderError(body.error ?? "Failed to reorder.");
      return;
    }
    router.refresh();
  }

  async function handleDeleteStep(id: string) {
    const res = await fetch(`/api/flavor-steps/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setReorderError(body.error ?? "Failed to delete step.");
      return;
    }
    router.refresh();
  }

  const nextOrder =
    initialSteps.length > 0
      ? Math.max(...initialSteps.map((s) => s.order_by)) + 1
      : 1;

  return (
    <div>
      {/* Flavor edit */}
      <Section title="Flavor Details">
        <FlavorEditForm flavor={flavor} />
      </Section>

      {/* Steps */}
      <Section title={`Prompt Chain Steps (${initialSteps.length})`}>
        {reorderError && (
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
            {reorderError}
          </div>
        )}

        {initialSteps.length === 0 && (
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            No steps yet. Add the first step to define this prompt chain.
          </p>
        )}

        {initialSteps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            total={initialSteps.length}
            models={models}
            inputTypes={inputTypes}
            outputTypes={outputTypes}
            stepTypes={stepTypes}
            onReorder={handleReorder}
            onDelete={handleDeleteStep}
            onUpdate={() => router.refresh()}
          />
        ))}

        <AddStepForm
          flavorId={flavor.id}
          nextOrder={nextOrder}
          models={models}
          inputTypes={inputTypes}
          outputTypes={outputTypes}
          stepTypes={stepTypes}
          onAdded={() => router.refresh()}
        />
      </Section>

      {/* Captions produced */}
      <Section title={`Captions Produced (${captions.length}${captions.length === 50 ? "+" : ""})`}>
        {captions.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>
            No captions have been generated with this flavor yet.
          </p>
        ) : (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px",
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
              }}
            >
              <span>Caption</span>
              <span>Created</span>
            </div>
            {captions.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px",
                  padding: "0.65rem 1rem",
                  alignItems: "start",
                  borderBottom:
                    i < captions.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text)",
                    lineHeight: 1.5,
                    paddingRight: "1rem",
                  }}
                >
                  {c.content}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  {new Date(c.created_datetime_utc).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
