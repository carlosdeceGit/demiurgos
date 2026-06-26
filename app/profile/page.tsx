import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = { title: "Demiurgos · Perfil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, positioning, pillars, audience, voice, tacit, goals, platforms, referents, offer"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email ?? "Tú";

  return (
    <div className="flex h-dvh">
      <AppRail
        active="perfil"
        displayName={displayName}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
          <div className="flex items-center gap-4">
            <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-full text-lg font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-serif text-2xl">{displayName}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <ProfileEditor
            initial={{
              display_name: displayName,
              offer: (profile?.offer as Record<string, unknown>) ?? {},
              positioning: profile?.positioning ?? {},
              pillars: profile?.pillars ?? [],
              audience: profile?.audience ?? {},
              voice: profile?.voice ?? {},
              tacit: profile?.tacit ?? {},
              goals: profile?.goals ?? {},
              platforms: (profile?.platforms as Array<{ key: import("@/lib/ai/platforms").PlatformKey; status?: string; role?: string }>) ?? [],
              referents: profile?.referents ?? [],
            }}
          />
        </div>
      </main>
    </div>
  );
}
