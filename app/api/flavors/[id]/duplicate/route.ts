import { NextResponse } from "next/server";
import { assertAdmin } from "@/app/api/_lib/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch source flavor + its steps
  const [{ data: source, error: sourceError }, { data: steps, error: stepsError }] =
    await Promise.all([
      admin.from("humor_flavors").select("*").eq("id", id).single(),
      admin
        .from("humor_flavor_steps")
        .select("*")
        .eq("humor_flavor_id", id)
        .order("order_by"),
    ]);

  if (sourceError || !source) {
    return NextResponse.json({ error: "Source flavor not found" }, { status: 404 });
  }
  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 });
  }

  // Create the new flavor
  const { data: newFlavor, error: flavorError } = await admin
    .from("humor_flavors")
    .insert({
      slug: body.slug.trim(),
      description: source.description,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .select()
    .single();

  if (flavorError) {
    return NextResponse.json({ error: flavorError.message }, { status: 500 });
  }

  // Duplicate all steps under the new flavor
  if (steps && steps.length > 0) {
    const now = new Date().toISOString();
    const newSteps = steps.map(({ id: _id, created_datetime_utc: _c, ...rest }) => ({
      ...rest,
      humor_flavor_id: newFlavor.id,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
      modified_datetime_utc: now,
    }));

    const { error: stepsInsertError } = await admin
      .from("humor_flavor_steps")
      .insert(newSteps);

    if (stepsInsertError) {
      // Roll back the flavor we just created
      await admin.from("humor_flavors").delete().eq("id", newFlavor.id);
      return NextResponse.json({ error: stepsInsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json(newFlavor, { status: 201 });
}
