import { NextResponse } from "next/server";
import { assertAdmin } from "@/app/api/_lib/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.humor_flavor_id) {
    return NextResponse.json({ error: "humor_flavor_id is required" }, { status: 400 });
  }
  if (!body?.llm_input_type_id) {
    return NextResponse.json({ error: "llm_input_type_id is required" }, { status: 400 });
  }
  if (!body?.llm_output_type_id) {
    return NextResponse.json({ error: "llm_output_type_id is required" }, { status: 400 });
  }
  if (!body?.humor_flavor_step_type_id) {
    return NextResponse.json({ error: "humor_flavor_step_type_id is required" }, { status: 400 });
  }
  if (!body?.llm_model_id) {
    return NextResponse.json({ error: "llm_model_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // If no order_by given, place at end
  let orderBy: number = body.order_by ?? 1;
  if (body.order_by == null) {
    const { data: existing } = await admin
      .from("humor_flavor_steps")
      .select("order_by")
      .eq("humor_flavor_id", body.humor_flavor_id)
      .order("order_by", { ascending: false })
      .limit(1);
    orderBy = existing && existing.length > 0 ? (existing[0].order_by ?? 0) + 1 : 1;
  }

  const { data, error } = await admin
    .from("humor_flavor_steps")
    .insert({
      humor_flavor_id: body.humor_flavor_id,
      order_by: orderBy,
      description: body.description?.trim() ?? null,
      llm_system_prompt: body.llm_system_prompt?.trim() ?? null,
      llm_user_prompt: body.llm_user_prompt?.trim() ?? null,
      llm_temperature: body.llm_temperature != null ? Number(body.llm_temperature) : null,
      llm_model_id: body.llm_model_id,
      llm_input_type_id: Number(body.llm_input_type_id),
      llm_output_type_id: Number(body.llm_output_type_id),
      humor_flavor_step_type_id: Number(body.humor_flavor_step_type_id),
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
