"use client";

import { useState } from "react";
import { Bookmark, Lightbulb, Trash2 } from "lucide-react";

import { ideasFor } from "@/demo/fixtures";

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión",
  video_live: "Directo",
  music: "Música",
  mixed: "Mezcla",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DemoIdeas({ profileId }: { profileId: string }) {
  const initial = ideasFor(profileId);
  const [ideas, setIdeas] = useState(initial);

  const groups = Array.from(
    new Map(ideas.map((i) => [i.generation_id, i.created_at])).entries()
  )
    .sort((a, b) => (a[1] < b[1] ? 1 : -1))
    .map(([gid, date]) => ({
      id: gid,
      date,
      ideas: ideas.filter((i) => i.generation_id === gid),
    }));

  const savedCount = ideas.filter((i) => i.status === "guardada").length;

  function toggle(id: string, status: "nueva" | "guardada" | "descartada") {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">
            Banco de ideas
            {savedCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">
                {savedCount} guardadas
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ideas exploratorias generadas por el Director. Guarda las que te interesen.
          </p>
        </div>
        <button
          disabled
          title="No disponible en modo demo"
          className="flex cursor-not-allowed items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground opacity-50"
        >
          <Lightbulb className="size-4" aria-hidden />
          Generar 10 ideas
        </button>
      </header>

      <div className="space-y-10">
        {groups.map((group, gi) => {
          const visible = group.ideas.filter((i) => i.status !== "descartada");
          if (visible.length === 0) return null;
          return (
            <section key={group.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {formatDate(group.date)}
                </span>
                {gi === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                    Última generación
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">
                  ({visible.length} ideas)
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((idea) => {
                  const isSaved = idea.status === "guardada";
                  return (
                    <article
                      key={idea.id}
                      className={`bg-card flex flex-col gap-2 rounded-xl border p-4 transition-opacity ${
                        isSaved ? "border-primary/30" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
                          {idea.platform}
                        </span>
                        <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
                          {TYPE_LABEL[idea.content_type] ?? idea.content_type}
                        </span>
                        {isSaved && (
                          <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            Guardada
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-snug">{idea.idea}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {idea.why_interesting}
                      </p>
                      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => toggle(idea.id, isSaved ? "nueva" : "guardada")}
                          aria-label={isSaved ? "Quitar guardado" : "Guardar idea"}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                            isSaved
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <Bookmark className="size-3" aria-hidden />
                          {isSaved ? "Guardada" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(idea.id, "descartada")}
                          aria-label="Descartar idea"
                          className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-destructive/30 hover:text-destructive"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          Descartar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
