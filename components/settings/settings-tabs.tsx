"use client";

import { useState } from "react";
import { ModelPreferencesForm } from "@/components/settings/model-preferences-form";
import { DrivePanel } from "@/components/library/drive-panel";
import type { UserModelPreferences } from "@/lib/ai/resolve-models";
import type { ContentSource, SyncLog } from "@/lib/library/types";

type Tab = "cuenta" | "modelos" | "integraciones";

const TABS: { id: Tab; label: string }[] = [
  { id: "cuenta", label: "Cuenta" },
  { id: "modelos", label: "Modelos de IA" },
  { id: "integraciones", label: "Integraciones" },
];

export function SettingsTabs({
  displayName,
  email,
  prefs,
  sources,
  logs,
  driveConfigured,
  onDriveRefresh,
}: {
  displayName: string;
  email: string;
  prefs: UserModelPreferences;
  sources: ContentSource[];
  logs: SyncLog[];
  driveConfigured: boolean;
  onDriveRefresh: () => void;
}) {
  const [active, setActive] = useState<Tab>("cuenta");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              active === t.id
                ? "border-b-2 border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "cuenta" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-serif text-lg">Datos de la cuenta</h2>
            <p className="text-muted-foreground text-sm">
              Tu nombre e email están gestionados por Supabase Auth.
              Edita tu nombre e información de marca en{" "}
              <a href="/profile" className="text-primary underline-offset-2 hover:underline">
                Perfil
              </a>
              .
            </p>
            <div className="grid gap-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nombre</span>
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              <div className="border-t" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {active === "modelos" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-lg">Modelos de IA</h2>
            <p className="text-muted-foreground text-sm">
              Elige qué IA usa cada parte del orquestador. Opus 4.8 dirige y
              reparte el trabajo; tú decides qué modelo hace cada tarea según
              calidad y precio.
            </p>
          </div>
          <ModelPreferencesForm current={prefs} />
        </div>
      )}

      {active === "integraciones" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-lg">Integraciones</h2>
            <p className="text-muted-foreground text-sm">
              Conecta tus herramientas. El contenido importado aparece en tu
              Biblioteca, listo para la IA.
            </p>
          </div>
          <DrivePanel
            sources={sources}
            logs={logs}
            driveConfigured={driveConfigured}
            onRefresh={onDriveRefresh}
          />
        </div>
      )}
    </div>
  );
}
