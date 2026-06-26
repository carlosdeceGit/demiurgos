import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import {
  DashboardView,
  type DashboardProposal,
} from "@/components/dashboard/dashboard-view";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { activePlatformKeys, type ProfilePlatform } from "@/lib/ai/platforms";
import { isAdminEmail } from "@/lib/auth/admin";

// Calcula un % de completitud del perfil según los campos rellenos.
function completenessOf(profile: Record<string, unknown> | null): number {
  if (!profile) return 0;
  const checks = [
    profile.positioning,
    profile.pillars,
    profile.audience,
    profile.voice,
    profile.tacit,
    profile.goals,
    profile.platforms,
    profile.referents,
  ];
  const filled = checks.filter((v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  }).length;
  const base = Math.round((filled / checks.length) * 90);
  return Math.min(100, base + (profile.onboarding_completed ? 10 : 0));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, positioning, pillars, audience, voice, tacit, goals, platforms, referents, onboarding_completed"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // Usuarios nuevos o sin onboarding → al wizard.
  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [
    { data: proposalsRaw },
    { count: totalProposals },
    { count: likedProposals },
    { count: executedProposals },
    { count: totalMessages },
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, platform, idea, why_now, script, suggested_slot, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "liked"),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "ejecutada"),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user"),
  ]);

  const metrics = {
    totalProposals: totalProposals ?? 0,
    likedProposals: likedProposals ?? 0,
    executedProposals: executedProposals ?? 0,
    totalMessages: totalMessages ?? 0,
  };

  const proposals: DashboardProposal[] = (proposalsRaw ?? []).map((p) => ({
    id: p.id as string,
    platform: p.platform as string | null,
    idea: p.idea as string | null,
    whyNow: p.why_now as string | null,
    script: p.script as string | null,
    slot: p.suggested_slot as string | null,
    status: p.status as string | null,
  }));

  const platforms = activePlatformKeys(
    (profile?.platforms as ProfilePlatform[] | null) ?? null
  );

  return (
    <div className="flex h-dvh">
      <AppRail
        active="dashboard"
        displayName={profile?.display_name ?? user.email ?? "Tú"}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {welcome === "1" && (
          <WelcomeBanner name={profile?.display_name ?? user.email ?? "Tú"} />
        )}
        <DashboardView
          data={{
            displayName: profile?.display_name ?? user.email ?? "Tú",
            sector: null,
            completeness: completenessOf(profile),
            platforms,
            proposals,
            metrics,
          }}
        />
      </main>
    </div>
  );
}
