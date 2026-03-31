import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlavorTestClient } from "./FlavorTestClient";

export default async function FlavorTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: flavor, error: flavorError }, { data: images }] =
    await Promise.all([
      supabase
        .from("humor_flavors")
        .select("id, slug, description")
        .eq("id", id)
        .single(),
      supabase
        .from("images")
        .select("id, url, image_description")
        .eq("is_common_use", true)
        .eq("is_public", true)
        .not("url", "is", null)
        .order("created_datetime_utc", { ascending: false })
        .limit(24),
    ]);

  if (flavorError || !flavor) {
    notFound();
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
        <Link href={`/flavors/${id}`} style={{ color: "var(--text-muted)" }}>
          {flavor.slug}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--warning)", fontWeight: 600 }}>Test</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
          Test: <span style={{ color: "var(--accent)", fontFamily: "monospace" }}>{flavor.slug}</span>
        </h1>
        {flavor.description && (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {flavor.description}
          </p>
        )}
      </div>

      <FlavorTestClient flavor={flavor} testImages={images ?? []} />
    </div>
  );
}
