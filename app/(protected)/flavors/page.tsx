import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FlavorsClient } from "./FlavorsClient";

export default async function FlavorsPage() {
  const supabase = await createClient();

  const { data: flavors, error } = await supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, modified_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
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
        Error: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--text)",
            }}
          >
            Humor Flavors
          </h1>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-dim)",
              marginTop: "2px",
            }}
          >
            {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/flavors/new"
          style={{
            padding: "0.55rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--accent-fg)",
            background: "var(--accent)",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          + New Flavor
        </Link>
      </div>

      <FlavorsClient flavors={flavors ?? []} />
    </div>
  );
}
