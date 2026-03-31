import { NextResponse } from "next/server";
import { assertAdmin } from "@/app/api/_lib/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("humor_flavor_steps")
    .update({
      description: body.description ?? null,
      llm_system_prompt: body.llm_system_prompt ?? null,
      llm_user_prompt: body.llm_user_prompt ?? null,
      llm_temperature: body.llm_temperature != null ? Number(body.llm_temperature) : null,
      llm_model_id: body.llm_model_id ?? null,
      ...(body.llm_input_type_id != null && { llm_input_type_id: Number(body.llm_input_type_id) }),
      ...(body.llm_output_type_id != null && { llm_output_type_id: Number(body.llm_output_type_id) }),
      ...(body.humor_flavor_step_type_id != null && { humor_flavor_step_type_id: Number(body.humor_flavor_step_type_id) }),
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("humor_flavor_steps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
