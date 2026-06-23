"use client";

import { useState } from "react";

import { saveTrendSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { TrendSettings } from "@/lib/db/settings";

const SOURCE_SUGGESTIONS = [
  "tiktok",
  "youtube",
  "google search",
  "reddit",
  "x",
  "instagram",
  "linkedin",
  "news",
];

export function TrendSettingsForm({
  current,
  hasKey,
}: {
  current: TrendSettings;
  hasKey: boolean;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        setSaved(false);
        await saveTrendSettings(fd);
        setSaved(true);
      }}
      className="bg-card space-y-4 rounded-xl border p-4"
    >
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="trendsEnabled"
          defaultChecked={current.enabled}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium">
          Activar tendencias en tiempo real
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Proveedor</span>
          <input
            name="trendsProvider"
            defaultValue={current.provider}
            spellCheck={false}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <span className="text-muted-foreground text-xs">
            trendsmcp (MCP remoto) o none.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Fuentes (máx. 4)</span>
          <input
            name="trendsSources"
            defaultValue={current.sources}
            list="trend-source-suggestions"
            spellCheck={false}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <datalist id="trend-source-suggestions">
            {SOURCE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <span className="text-muted-foreground text-xs">
            Separadas por comas. P. ej.: tiktok, youtube, google search.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar tendencias</Button>
        {saved && <span className="text-brand-accent text-sm">Guardado ✓</span>}
        {!hasKey && (
          <span className="text-brand-amber text-xs">
            Falta TRENDS_API_KEY en el entorno (Vercel) para que funcione.
          </span>
        )}
      </div>
    </form>
  );
}
