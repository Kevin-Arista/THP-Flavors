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
  const direction: "up" | "down" = body?.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { error: "direction must be 'up' or 'down'" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Fetch the current step
  const { data: current, error: fetchError } = await admin
    .from("humor_flavor_steps")
    .select("id, humor_flavor_id, order_by")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  // Fetch all sibling steps in order
  const { data: siblings } = await admin
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("humor_flavor_id", current.humor_flavor_id)
    .order("order_by");

  if (!siblings || siblings.length < 2) {
    return NextResponse.json({ error: "Nothing to reorder" }, { status: 400 });
  }

  const currentIndex = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (swapIndex < 0 || swapIndex >= siblings.length) {
    return NextResponse.json({ error: "Already at boundary" }, { status: 400 });
  }

  const swapStep = siblings[swapIndex];
  const now = new Date().toISOString();

  // Swap order_by values
  const [r1, r2] = await Promise.all([
    admin
      .from("humor_flavor_steps")
      .update({ order_by: swapStep.order_by, modified_by_user_id: user.id, modified_datetime_utc: now })
      .eq("id", current.id),
    admin
      .from("humor_flavor_steps")
      .update({ order_by: current.order_by, modified_by_user_id: user.id, modified_datetime_utc: now })
      .eq("id", swapStep.id),
  ]);

  if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500 });
  if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
