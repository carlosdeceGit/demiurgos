import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { LibraryView } from "@/components/library/library-view";
import { isAdminEmail } from "@/lib/auth/admin";
import { CONTENT_LIST_COLUMNS, mapContentItem } from "@/lib/library/queries";

export const metadata = { title: "Demiurgos · Biblioteca" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: items } = await supabase
    .from("content_library")
    .select(CONTENT_LIST_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="biblioteca"
        displayName={profile?.display_name ?? user.email ?? "Tú"}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <LibraryView initialItems={(items ?? []).map(mapContentItem)} />
      </main>
    </div>
  );
}
