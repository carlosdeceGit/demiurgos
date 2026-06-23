import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = { title: "Demiurgos · Calendario" };

export default async function CalendarPage() {
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

  return (
    <div className="flex h-dvh">
      <AppRail
        active="calendario"
        displayName={profile?.display_name ?? user.email ?? "Tú"}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto">
        <CalendarClient hasProfile={Boolean(profile)} />
      </main>
    </div>
  );
}
