import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { IdeasClient, type IdeaRow } from "@/components/ideas/ideas-client";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = { title: "Demiurgos · Banco de ideas" };

export default async function IdeasPage() {
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

  // Últimas 3 generaciones (30 ideas max) excluyendo las descartadas.
  // Traemos las 3 generation_ids más recientes y filtramos.
  const { data: latestGenIds } = await supabase
    .from("ideas")
    .select("generation_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const seen = new Set<string>();
  const top3: string[] = [];
  for (const row of latestGenIds ?? []) {
    if (!seen.has(row.generation_id)) {
      seen.add(row.generation_id);
      top3.push(row.generation_id);
    }
    if (top3.length === 3) break;
  }

  const { data: ideas } = top3.length > 0
    ? await supabase
        .from("ideas")
        .select("id, generation_id, idea, why_interesting, platform, content_type, status, created_at")
        .eq("user_id", user.id)
        .in("generation_id", top3)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="flex h-dvh">
      <AppRail
        active="ideas"
        displayName={profile.display_name}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto">
        <IdeasClient ideas={(ideas ?? []) as IdeaRow[]} />
      </main>
    </div>
  );
}
