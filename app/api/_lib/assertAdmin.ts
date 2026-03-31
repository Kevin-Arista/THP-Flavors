import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated user if they are a superadmin or matrix admin.
 * Returns null otherwise.
 */
export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) return null;

  return user;
}
