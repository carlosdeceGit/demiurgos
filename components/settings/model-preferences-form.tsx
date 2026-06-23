"use client";

import { useState } from "react";

import { saveModelPreferences } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { TASK_GROUPS } from "@/lib/ai/model-catalog";
import type { UserModelPreferences } from "@/lib/ai/resolve-models";

export function ModelPreferencesForm({
  current,
}: {
  current: UserModelPreferences;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        setSaved(false);
        await saveModelPreferences(fd);
        setSaved(true);
      }}
      className="space-y-4"
    >
      {TASK_GROUPS.map((group) => (
        <div key={group.id} className="bg-card rounded-xl border p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={group.id} className="text-sm font-medium">
              {group.label}
            </label>
            <p className="text-muted-foreground text-xs">{group.description}</p>
          </div>

          <input
            id={group.id}
            name={group.id}
            defaultValue={current[group.id] ?? group.defaultModel}
            list={`opts-${group.id}`}
            spellCheck={false}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <datalist id={`opts-${group.id}`}>
            {group.options.map((o) => (
              <option key={o.id} value={o.id} />
            ))}
          </datalist>

          {/* Opciones recomendadas con precio orientativo */}
          <div className="mt-3 grid gap-1.5">
            {group.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(
                    group.id
                  ) as HTMLInputElement | null;
                  if (el) el.value = o.id;
                }}
                className="hover:bg-accent/60 flex items-center justify-between gap-3 rounded-md px-2 py-1 text-left text-xs"
              >
                <span>
                  <span className="font-medium">{o.label}</span>
                  <span className="text-muted-foreground ml-2 font-mono">
                    {o.id}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 font-mono">
                  {o.pricing}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar mis preferencias</Button>
        {saved && <span className="text-brand-accent text-sm">Guardado ✓</span>}
      </div>
      <p className="text-muted-foreground text-xs">
        Precios orientativos por millón de tokens (entrada/salida); confírmalos en
        tu AI Gateway. Puedes escribir cualquier id de modelo de tu gateway. Si un
        modelo no responde, esa parte se omite y el resto del calendario sigue.
      </p>
    </form>
  );
}
