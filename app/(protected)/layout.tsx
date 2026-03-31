import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "./components/SideNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin, email")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect("/login?error=not_admin");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <SideNav userEmail={profile.email ?? user.email ?? ""} />
      <main
        style={{
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
