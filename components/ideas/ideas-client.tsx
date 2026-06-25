"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, Sparkles, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Tipo ──────────────────────────────────────────────────────

export type IdeaRow = {
  id: string;
  generation_id: string;
  idea: string;
  why_interesting: string | null;
  platform: string | null;
  content_type: string | null;
  status: string;
  created_at: string;
};

// ── Utilidades ────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión",
  video_live: "Directo",
  music: "Música",
  mixed: "Mezcla",
};

function groupByGeneration(ideas: IdeaRow[]): { id: string; date: string; ideas: IdeaRow[] }[] {
  const map = new Map<string, IdeaRow[]>();
  for (const idea of ideas) {
    const arr = map.get(idea.generation_id) ?? [];
    arr.push(idea);
    map.set(idea.generation_id, arr);
  }
  return Array.from(map.entries()).map(([id, items]) => ({
    id,
    date: items[0].created_at,
    ideas: items,
  }));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ── Card ──────────────────────────────────────────────────────

function IdeaCard({
  idea,
  onUpdate,
}: {
  idea: IdeaRow;
  onUpdate: (id: string, status: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const isSaved = idea.status === "guardada";
  const isDiscarded = idea.status === "descartada";

  function act(status: string) {
    startTransition(() => onUpdate(idea.id, status));
  }

  return (
    <article
      className={`bg-card flex flex-col gap-2 rounded-xl border p-4 transition-opacity ${
        isDiscarded ? "opacity-40" : ""
      } ${isSaved ? "border-primary/30" : "border-border"}`}
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {idea.platform && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {idea.platform}
          </span>
        )}
        {idea.content_type && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {TYPE_LABEL[idea.content_type] ?? idea.content_type}
          </span>
        )}
        {isSaved && (
          <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
            Guardada
          </span>
        )}
      </div>

      {/* Idea */}
      <p className="text-sm leading-snug">{idea.idea}</p>

      {/* Why interesting */}
      {idea.why_interesting && (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {idea.why_interesting}
        </p>
      )}

      {/* Actions */}
      {!isDiscarded && (
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => act(isSaved ? "nueva" : "guardada")}
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
            disabled={pending}
            onClick={() => act("descartada")}
            aria-label="Descartar idea"
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-destructive/30 hover:text-destructive"
          >
            <Trash2 className="size-3" aria-hidden />
            Descartar
          </button>
        </div>
      )}
    </article>
  );
}

// ── Cliente principal ─────────────────────────────────────────

export function IdeasClient({ ideas: initial }: { ideas: IdeaRow[] }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = groupByGeneration(ideas.filter((i) => i.status !== "descartada" || ideas.filter(x => x.generation_id === i.generation_id && x.status !== "descartada").length > 0));
  const savedCount = ideas.filter((i) => i.status === "guardada").length;

  async function handleUpdate(id: string, status: string) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-ideas", { method: "POST" });
      if (!res.ok) {
        setError((await res.text()) || `Error ${res.status}`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      {/* Cabecera */}
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
        <Button
          onClick={generate}
          disabled={generating}
          className="shrink-0 gap-2 rounded-full"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {generating ? "Generando…" : "Generar 10 ideas"}
        </Button>
      </header>

      {error && (
        <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* Generando indicator */}
      {generating && (
        <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            El Director está generando 10 ideas para tu perfil…
          </span>
        </div>
      )}

      {/* Grupos por generación */}
      {groups.length === 0 && !generating ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Lightbulb className="size-10 text-primary/20" />
          <div>
            <p className="font-serif text-xl text-muted-foreground">Sin ideas todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pulsa «Generar 10 ideas» y el Director explorará posibilidades para tu perfil.
            </p>
          </div>
          <Button onClick={generate} disabled={generating} className="gap-2 rounded-full">
            <Sparkles className="size-4" />
            Generar 10 ideas
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group, gi) => {
            const groupIdeas = ideas.filter((i) => i.generation_id === group.id);
            const visible = groupIdeas.filter((i) => i.status !== "descartada");
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
                  {visible.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} onUpdate={handleUpdate} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
