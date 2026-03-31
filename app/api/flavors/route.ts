import { NextResponse } from "next/server";
import { assertAdmin } from "@/app/api/_lib/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("humor_flavors")
    .insert({
      slug: body.slug.trim(),
      description: body.description?.trim() ?? null,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
