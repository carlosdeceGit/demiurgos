"use client";

import { useState } from "react";

import { saveModelSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { ModelSettings } from "@/lib/db/settings";

// Sugerencias de modelos del gateway. Es un campo libre con autocompletado:
// si tu AI Gateway expone otro id, puedes escribirlo directamente.
const MODEL_SUGGESTIONS = [
  "anthropic/claude-opus-4.8",
  "anthropic/claude-opus-4.7",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.5",
  "openai/gpt-5",
  "openai/gpt-4.1",
  "google/gemini-3.1-pro",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "xai/grok-4",
];

// Modelos del chat/demo (globales). Los modelos del ORQUESTADOR del calendario
// los elige cada usuario por grupo de tarea en /settings (no aquí).
const FIELDS: { name: keyof ModelSettings; label: string; hint: string }[] = [
  { name: "directorModel", label: "Director creativo", hint: "Genera las propuestas. Es el que usa el chat." },
  { name: "criticModel", label: "Crítico", hint: "Verifica y filtra (Hito 4)." },
  { name: "analystModel", label: "Analista", hint: "Analiza uploads (Hito 2)." },
  { name: "demoModel", label: "Chat de la demo", hint: "Modelo del /demo público." },
];

export function ModelSettingsForm({ current }: { current: ModelSettings }) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        setSaved(false);
        await saveModelSettings(fd);
        setSaved(true);
      }}
      className="bg-card space-y-4 rounded-xl border p-4"
    >
      <datalist id="model-suggestions">
        {MODEL_SUGGESTIONS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{f.label}</span>
            <input
              name={f.name}
              defaultValue={current[f.name]}
              list="model-suggestions"
              spellCheck={false}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
            />
            <span className="text-muted-foreground text-xs">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar preferencias</Button>
        {saved && (
          <span className="text-brand-accent text-sm">Guardado ✓</span>
        )}
      </div>
    </form>
  );
}
