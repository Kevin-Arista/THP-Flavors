import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlavorDetail } from "./FlavorDetail";

export default async function FlavorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: flavor, error: flavorError },
    { data: steps, error: stepsError },
    { data: models },
    { data: inputTypes },
    { data: outputTypes },
    { data: stepTypes },
    { data: captions },
  ] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description, created_datetime_utc, modified_datetime_utc")
      .eq("id", id)
      .single(),
    supabase
      .from("humor_flavor_steps")
      .select(
        "id, humor_flavor_id, order_by, description, llm_temperature, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, created_datetime_utc",
      )
      .eq("humor_flavor_id", id)
      .order("order_by"),
    supabase.from("llm_models").select("id, name").order("name"),
    supabase.from("llm_input_types").select("id, slug, description").order("id"),
    supabase.from("llm_output_types").select("id, slug, description").order("id"),
    supabase.from("humor_flavor_step_types").select("id, slug, description").order("id"),
    supabase
      .from("captions")
      .select("id, content, created_datetime_utc, image_id")
      .eq("humor_flavor_id", id)
      .order("created_datetime_utc", { ascending: false })
      .limit(50),
  ]);

  if (flavorError || !flavor) {
    notFound();
  }

  if (stepsError) {
    return (
      <div
        style={{
          color: "var(--error)",
          background: "var(--error-bg)",
          border: "1px solid var(--error-border)",
          borderRadius: "8px",
          padding: "1rem",
        }}
      >
        Error loading steps: {stepsError.message}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.75rem",
          fontSize: "0.85rem",
          color: "var(--text-dim)",
        }}
      >
        <Link href="/flavors" style={{ color: "var(--text-dim)" }}>
          ← Flavors
        </Link>
        <span>/</span>
        <span
          style={{
            color: "var(--accent)",
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          {flavor.slug}
        </span>
        <div style={{ marginLeft: "auto" }}>
          <Link
            href={`/flavors/${id}/test`}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--accent-fg)",
              background: "var(--warning)",
              borderRadius: "7px",
            }}
          >
            ▶ Test Flavor
          </Link>
        </div>
      </div>

      <FlavorDetail
        flavor={flavor}
        steps={steps ?? []}
        models={models ?? []}
        inputTypes={inputTypes ?? []}
        outputTypes={outputTypes ?? []}
        stepTypes={stepTypes ?? []}
        captions={captions ?? []}
      />
    </div>
  );
}
