import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { isAdminEmail } from "@/lib/auth/admin";
import type { CalendarProposal } from "@/components/calendar/calendar-client";

export const metadata = { title: "Demiurgos · Calendario" };

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Últimas 8 semanas de propuestas (sin expiradas ni descartadas).
  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      "id, idea, why_now, platform, status, suggested_slot, week_of, based_on, content_type, content_category, expires_at"
    )
    .eq("user_id", user.id)
    .not("status", "in", '("expired","descartada")')
    .order("week_of", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(120);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="calendario"
        displayName={profile.display_name}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-hidden">
        <CalendarClient proposals={(proposals ?? []) as CalendarProposal[]} />
      </main>
    </div>
  );
}
