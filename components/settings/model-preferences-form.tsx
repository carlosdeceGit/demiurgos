"use client";

import { useState } from "react";

import { saveModelPreferences } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import {
  catalogCompetesByDefault,
  catalogCompetitor,
  COMPETITION_GROUPS,
  TASK_GROUPS,
  type TaskGroupId,
} from "@/lib/ai/model-catalog";
import {
  COMPETE_OFF,
  type UserModelPreferences,
} from "@/lib/ai/resolve-models";

const COMPETES = new Set<TaskGroupId>(COMPETITION_GROUPS);

// Estado inicial de la competición de un grupo a partir de las preferencias
// guardadas: si no hay nada configurado, manda el default del catálogo.
function competeState(
  group: TaskGroupId,
  saved: string | undefined
): { enabled: boolean; value: string } {
  if (saved === undefined) {
    return { enabled: catalogCompetesByDefault(group), value: "" };
  }
  if (saved === COMPETE_OFF) return { enabled: false, value: "" };
  if (saved === "auto" || saved === "") return { enabled: true, value: "" };
  return { enabled: true, value: saved };
}

export function ModelPreferencesForm({
  current,
}: {
  current: UserModelPreferences;
}) {
  const [saved, setSaved] = useState(false);
  // Mostrar/ocultar el campo del rival según la casilla, en vivo.
  const [competeOn, setCompeteOn] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of COMPETITION_GROUPS) {
      init[g] = competeState(g, current.competitors[g]).enabled;
    }
    return init;
  });

  return (
    <form
      action={async (fd) => {
        setSaved(false);
        await saveModelPreferences(fd);
        setSaved(true);
      }}
      className="space-y-4"
    >
      {TASK_GROUPS.map((group) => {
        const competes = COMPETES.has(group.id);
        const state = competeState(group.id, current.competitors[group.id]);
        const recommended = catalogCompetitor(group.id) ?? group.defaultModel;

        return (
          <div key={group.id} className="bg-card rounded-xl border p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={group.id} className="text-sm font-medium">
                {group.label}
              </label>
              <p className="text-muted-foreground text-xs">
                {group.description}
              </p>
            </div>

            <input
              id={group.id}
              name={group.id}
              defaultValue={current.models[group.id] ?? group.defaultModel}
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

            {/* Competición: dos IAs hacen la misma tarea y el orquestador juzga */}
            {competes && (
              <div className="border-border/60 mt-3 border-t pt-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    name={`${group.id}__compete_enabled`}
                    defaultChecked={state.enabled}
                    onChange={(e) =>
                      setCompeteOn((prev) => ({
                        ...prev,
                        [group.id]: e.target.checked,
                      }))
                    }
                    className="accent-brand-accent size-3.5"
                  />
                  Competición: dos IAs compiten y el orquestador elige la mejor
                </label>
                {competeOn[group.id] && (
                  <>
                    <input
                      name={`${group.id}__compete`}
                      defaultValue={state.value}
                      placeholder={`2.º modelo (vacío = ${recommended})`}
                      list={`opts-${group.id}`}
                      spellCheck={false}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
                    />
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Rival del modelo de arriba. Déjalo vacío para el recomendado
                      o escribe cualquier id de tu gateway. Duplica el coste de
                      esta tarea (dos llamadas + el juez).
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar mis preferencias</Button>
        {saved && <span className="text-brand-accent text-sm">Guardado ✓</span>}
      </div>
      <p className="text-muted-foreground text-xs">
        Las opciones de cada grupo son sugerencias: puedes escribir{" "}
        <span className="font-medium">cualquier id de modelo</span> de tu AI
        Gateway, tanto para el modelo principal como para el rival. Precios
        orientativos por millón de tokens (entrada/salida); confírmalos en tu
        gateway. Si un modelo no responde, esa parte se omite y el resto del
        calendario sigue.
      </p>
    </form>
  );
}
