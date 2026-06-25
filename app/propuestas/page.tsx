import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { PropuestasShell } from "@/components/propuestas/propuestas-shell";
import { isAdminEmail } from "@/lib/auth/admin";
import type { ProposalRow } from "@/components/propuestas/proposals-grid";
import type { CalendarProposal } from "@/components/calendar/calendar-client";

export const metadata = { title: "Demiurgos · Propuestas" };

export default async function PropuestasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;
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

  const [{ data: proposals }, { data: calendarProposals }] = await Promise.all([
    supabase
      .from("proposals")
      .select(
        "id, platform, idea, why_now, script, image_prompt, suggested_slot, status, expires_at, content_type, content_category, based_on, created_at"
      )
      .eq("user_id", user.id)
      .not("status", "in", '("expired","descartada")')
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("proposals")
      .select(
        "id, idea, why_now, platform, status, suggested_slot, week_of, based_on, content_type, content_category, expires_at"
      )
      .eq("user_id", user.id)
      .not("status", "in", '("expired","descartada")')
      .order("week_of", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(120),
  ]);

  return (
    <div className="flex h-dvh pb-16 md:pb-0">
      <AppRail
        active="propuestas"
        displayName={profile.display_name}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PropuestasShell
          proposals={(proposals ?? []) as ProposalRow[]}
          calendarProposals={(calendarProposals ?? []) as CalendarProposal[]}
          defaultTab={vista === "calendario" ? "calendario" : "grid"}
        />
      </main>
    </div>
  );
}
