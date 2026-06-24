import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { ProposalsGrid } from "@/components/propuestas/proposals-grid";
import { isAdminEmail } from "@/lib/auth/admin";
import type { ProposalRow } from "@/components/propuestas/proposals-grid";

export const metadata = { title: "Demiurgos · Propuestas" };

export default async function PropuestasPage() {
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

  // Propuestas activas (excluimos las expiradas para no saturar).
  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      "id, platform, idea, why_now, script, image_prompt, suggested_slot, status, expires_at, content_type, content_category, based_on, created_at"
    )
    .eq("user_id", user.id)
    .not("status", "in", '("expired","descartada")')
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="propuestas"
        displayName={profile.display_name}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto">
        <ProposalsGrid proposals={(proposals ?? []) as ProposalRow[]} />
      </main>
    </div>
  );
}
