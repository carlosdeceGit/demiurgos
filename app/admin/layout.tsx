import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { AppRail } from "@/components/app/app-rail";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = { title: "Demiurgos · Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/chat");

  return (
    <div className="flex h-dvh">
      <AppRail
        active="admin"
        displayName={user.email ?? "Admin"}
        email={user.email ?? ""}
        isAdmin
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminNav />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
