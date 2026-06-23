import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { LibraryView } from "@/components/library/library-view";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  CONTENT_LIST_COLUMNS,
  mapContentItem,
  mapContentSource,
  mapSyncLog,
} from "@/lib/library/queries";
import { driveOAuthConfigured } from "@/lib/library/drive";

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

  const [{ data: items }, { data: sources }, { data: logs }] = await Promise.all([
    supabase
      .from("content_library")
      .select(CONTENT_LIST_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
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

  return (
    <div className="flex h-dvh">
      <AppRail
        active="biblioteca"
        displayName={profile?.display_name ?? user.email ?? "Tú"}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
      />
      <main className="flex-1 overflow-y-auto">
        <LibraryView
          initialItems={(items ?? []).map(mapContentItem)}
          initialSources={(sources ?? []).map(mapContentSource)}
          initialLogs={(logs ?? []).map(mapSyncLog)}
          driveConfigured={driveOAuthConfigured()}
        />
      </main>
    </div>
  );
}
