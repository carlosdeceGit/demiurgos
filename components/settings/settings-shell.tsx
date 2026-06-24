"use client";

import { useRouter } from "next/navigation";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import type { UserModelPreferences } from "@/lib/ai/resolve-models";
import type { ContentSource, SyncLog } from "@/lib/library/types";

export function SettingsShell({
  displayName,
  email,
  prefs,
  sources,
  logs,
  driveConfigured,
}: {
  displayName: string;
  email: string;
  prefs: UserModelPreferences;
  sources: ContentSource[];
  logs: SyncLog[];
  driveConfigured: boolean;
}) {
  const router = useRouter();
  return (
    <SettingsTabs
      displayName={displayName}
      email={email}
      prefs={prefs}
      sources={sources}
      logs={logs}
      driveConfigured={driveConfigured}
      onDriveRefresh={() => router.refresh()}
    />
  );
}
