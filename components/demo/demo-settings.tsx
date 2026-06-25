"use client";

import { useState } from "react";
import { TASK_GROUPS, COMPETITION_GROUPS } from "@/lib/ai/model-catalog";
import type { TaskGroupId } from "@/lib/ai/model-catalog";

const COMPETES = new Set<TaskGroupId>(COMPETITION_GROUPS);
type Tab = "cuenta" | "modelos" | "integraciones";

const TABS: { id: Tab; label: string }[] = [
  { id: "cuenta", label: "Cuenta" },
  { id: "modelos", label: "Modelos de IA" },
  { id: "integraciones", label: "Integraciones" },
];

export function DemoSettings({ displayName }: { displayName: string }) {
  const [active, setActive] = useState<Tab>("modelos");
  const [competeOn, setCompeteOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COMPETITION_GROUPS.map((g) => [g, TASK_GROUPS.find((t) => t.id === g)?.competition ?? false]))
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Ajustes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestiona tu cuenta, los modelos de IA y las integraciones.
        </p>
      </div>

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

      {/* ── Cuenta ── */}
      {active === "cuenta" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-serif text-lg">Datos de la cuenta</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre</label>
                <input
                  readOnly
                  value={displayName}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm opacity-70"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correo</label>
                <input
                  readOnly
                  value="demo@demiurgos.app"
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm opacity-70"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-muted-foreground text-xs">
              Modo demo · los cambios de cuenta no están disponibles aquí.
            </p>
          </div>
        </div>
      )}

      {/* ── Modelos de IA ── */}
      {active === "modelos" && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Demiurgos usa un orquestador que reparte cada tarea al modelo más adecuado.
            Puedes elegir qué modelo usa cada agente, e incluso activar el modo{" "}
            <strong className="text-foreground">competición</strong>: dos modelos hacen
            la misma tarea y el orquestador se queda con el mejor resultado.
          </p>

          {TASK_GROUPS.map((group) => {
            const canCompete = COMPETES.has(group.id);
            const isOn = competeOn[group.id] ?? false;

            return (
              <div key={group.id} className="bg-card rounded-xl border p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{group.label}</p>
                  <p className="text-muted-foreground text-xs">{group.description}</p>
                </div>

                {/* Campo del modelo (read-only en demo) */}
                <input
                  readOnly
                  value={group.defaultModel}
                  className="border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs opacity-70"
                />

                {/* Opciones recomendadas */}
                <div className="mt-3 grid gap-1.5">
                  {group.options.map((o) => (
                    <div
                      key={o.id}
                      className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs ${
                        o.id === group.defaultModel ? "bg-accent/40" : ""
                      }`}
                    >
                      <span>
                        <span className="font-medium">{o.label}</span>
                        <span className="text-muted-foreground ml-2 font-mono">{o.id}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0 font-mono">{o.pricing}</span>
                    </div>
                  ))}
                </div>

                {/* Sección de competición */}
                {canCompete && (
                  <div className="border-border/60 mt-3 border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={(e) =>
                          setCompeteOn((prev) => ({ ...prev, [group.id]: e.target.checked }))
                        }
                        className="accent-brand-accent size-3.5"
                      />
                      Competición: dos IAs compiten y el orquestador elige la mejor
                    </label>
                    {isOn && (
                      <>
                        <input
                          readOnly
                          value={group.competeWith ?? ""}
                          placeholder={`2.º modelo (vacío = ${group.competeWith ?? "auto"})`}
                          className="border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs opacity-70"
                        />
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          Rival del modelo de arriba. Duplica el coste de esta tarea (dos llamadas + el juez).
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-muted-foreground text-xs">
              Modo demo · los cambios de modelo no se guardan aquí. En tu cuenta real
              puedes personalizar cada grupo y activar la competición.
            </p>
          </div>
        </div>
      )}

      {/* ── Integraciones ── */}
      {active === "integraciones" && (
        <div className="space-y-4">
          <h2 className="font-serif text-lg">Integraciones</h2>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Google Drive</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Sincroniza documentos de Drive con tu Biblioteca automáticamente.
                </p>
              </div>
              <span className="text-muted-foreground rounded-full border border-border px-3 py-1 text-xs">
                No conectado
              </span>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Substack</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Importa tus newsletters pasadas como señales de contexto.
                </p>
              </div>
              <span className="text-muted-foreground rounded-full border border-border px-3 py-1 text-xs">
                Próximamente
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-muted-foreground text-xs">
              Modo demo · las integraciones no están disponibles aquí.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
