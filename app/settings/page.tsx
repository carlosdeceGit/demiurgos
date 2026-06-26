import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { SettingsShell } from "@/components/settings/settings-shell";
import { getUserModelPreferences } from "@/lib/db/user-settings";
import { isAdminEmail } from "@/lib/auth/admin";
import { mapContentSource, mapSyncLog } from "@/lib/library/queries";
import { driveOAuthConfigured } from "@/lib/library/drive";

export const metadata = { title: "Demiurgos · Ajustes" };

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

  const [prefs, { data: sources }, { data: logs }] = await Promise.all([
    getUserModelPreferences(supabase, user.id),
    supabase
      .from("content_sources")
      .select(
        "id, provider, provider_folder_id, provider_folder_name, provider_account_email, sync_status, sync_error, last_sync_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("content_sync_logs")
      .select(
        "id, started_at, finished_at, status, files_found, files_imported, files_updated, files_failed, error_log"
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const displayName = profile?.display_name ?? user.email ?? "Tú";

  return (
    <div className="flex h-dvh">
      <AppRail
        active="ajustes"
        displayName={displayName}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
          <div>
            <h1 className="font-serif text-2xl">Ajustes</h1>
            <p className="text-muted-foreground text-sm">
              Gestiona tu cuenta, modelos de IA e integraciones.
            </p>
          </div>
          <SettingsShell
            displayName={displayName}
            email={user.email ?? ""}
            prefs={prefs}
            sources={(sources ?? []).map(mapContentSource)}
            logs={(logs ?? []).map(mapSyncLog)}
            driveConfigured={driveOAuthConfigured()}
          />
        </div>
      </main>
    </div>
  );
}
