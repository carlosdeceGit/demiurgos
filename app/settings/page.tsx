import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { ModelPreferencesForm } from "@/components/settings/model-preferences-form";
import { getUserModelPreferences } from "@/lib/db/user-settings";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = { title: "Demiurgos · Ajustes de IA" };

export default async function SettingsPage() {
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

  const prefs = await getUserModelPreferences(supabase, user.id);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="ajustes"
        displayName={profile?.display_name ?? user.email ?? "Tú"}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
          <div>
            <h1 className="font-serif text-2xl">Ajustes de IA</h1>
            <p className="text-muted-foreground text-sm">
              Elige qué IA usa cada parte del orquestador. Opus 4.8 dirige y
              reparte el trabajo; tú decides qué modelo hace cada tarea según
              calidad y precio.
            </p>
          </div>
          <ModelPreferencesForm current={prefs} />
        </div>
      </main>
    </div>
  );
}
