"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Clock,
  ChevronDown,
  Expand,
  Wand2,
  Loader2,
} from "lucide-react";

import { ProposalDrawer } from "@/components/propuestas/proposal-drawer";

// ── Tipos ──────────────────────────────────────────────────────

export type ProposalRow = {
  id: string;
  platform: string | null;
  idea: string | null;
  why_now: string | null;
  script: string | null;
  image_prompt: string | null;
  suggested_slot: string | null;
  status: string;
  expires_at: string | null;
  content_type: string | null;
  content_category: string | null;
  based_on: Record<string, unknown> | null;
  created_at: string;
};

// ── Utilidades ─────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  liked: "Guardada ♥",
  guardada: "Guardada",
  programada: "Programada",
  ejecutada: "Ejecutada",
  descartada: "Descartada",
  draft: "Nueva",
};

const STATUS_STYLE: Record<string, string> = {
  nueva: "border-primary/30 text-primary bg-primary/5",
  liked: "border-primary/40 text-primary bg-primary/10",
  guardada: "border-primary/30 text-primary bg-primary/5",
  programada: "border-brand-violet/40 text-brand-violet bg-brand-violet/5",
  ejecutada: "border-border text-muted-foreground bg-muted/30",
  draft: "border-primary/30 text-primary bg-primary/5",
};

const CATEGORY_LABEL: Record<string, string> = {
  educational: "Educativo",
  informative: "Informativo",
  promotional: "Publicitario",
  awareness: "Concientización",
  entertainment: "Entretenimiento",
  trending: "Actualidad",
  curated: "De terceros",
};

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión vídeo",
  video_live: "Vídeo directo",
  music: "Música",
  mixed: "Mezcla",
};

function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Reasons para el dislike ────────────────────────────────────

const DISLIKE_REASONS = ["El tema", "El tono", "El formato", "El canal", "El momento"];

// ── Card individual ────────────────────────────────────────────

function ProposalCard({ proposal, onUpdate, onOpen }: {
  proposal: ProposalRow;
  onUpdate: (id: string, status: string, reason?: string) => void;
  onOpen: (p: ProposalRow) => void;
}) {
  const [showReasons, setShowReasons] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const days = daysUntilExpiry(proposal.expires_at);
  const expiringSoon = days !== null && days <= 5 && days > 0;
  const basedOn = proposal.based_on ?? {};
  const hook = typeof basedOn.hook === "string" ? basedOn.hook : null;
  const caption = typeof basedOn.caption === "string" ? basedOn.caption : null;
  const format = typeof basedOn.format === "string" ? basedOn.format : null;

  const title = hook ?? proposal.idea ?? "Sin título";
  const isExecuted = proposal.status === "ejecutada";
  const isLiked = proposal.status === "liked";

  function act(status: string, reason?: string) {
    startTransition(() => {
      onUpdate(proposal.id, status, reason);
    });
  }

  return (
    <article
      className={`bg-card flex flex-col gap-3 rounded-xl border p-4 transition-opacity ${
        isExecuted ? "opacity-60" : ""
      } ${isLiked ? "border-primary/30" : "border-border"}`}
    >
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status badge */}
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            STATUS_STYLE[proposal.status] ?? "border-border text-muted-foreground"
          }`}
        >
          {STATUS_LABEL[proposal.status] ?? proposal.status}
        </span>

        {/* Platform */}
        {proposal.platform && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {proposal.platform}
          </span>
        )}

        {/* Type/Category */}
        {(proposal.content_type ?? format) && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {TYPE_LABEL[proposal.content_type ?? ""] ?? format}
          </span>
        )}
        {proposal.content_category && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {CATEGORY_LABEL[proposal.content_category] ?? proposal.content_category}
          </span>
        )}

        {/* Slot */}
        {proposal.suggested_slot && (
          <span className="text-muted-foreground ml-auto flex items-center gap-1 text-xs">
            <Clock className="size-3" aria-hidden />
            {proposal.suggested_slot}
          </span>
        )}

        {/* Expiry */}
        {expiringSoon && (
          <span className="text-brand-amber ml-auto text-xs">
            Expira en {days}d
          </span>
        )}

        {/* Abrir drawer */}
        <button
          type="button"
          onClick={() => onOpen(proposal)}
          aria-label="Ver detalle"
          className="ml-auto rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Expand className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Título */}
      <h3 className="font-serif text-base leading-snug">{title}</h3>

      {/* Por qué ahora */}
      {proposal.why_now && (
        <div className="border-brand-amber/50 bg-brand-amber/5 rounded-md border-l-2 px-3 py-2">
          <p className="text-brand-amber font-mono text-[9px] tracking-wider uppercase">
            Por qué ahora
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {proposal.why_now}
          </p>
        </div>
      )}

      {/* Script preview / expandible */}
      {proposal.script && (
        <div>
          <p
            className={`text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {proposal.script}
          </p>
          {proposal.script.length > 180 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground mt-1 flex items-center gap-1 text-xs hover:text-foreground"
            >
              <ChevronDown
                className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      )}

      {/* Caption si existe */}
      {caption && !expanded && (
        <p className="text-muted-foreground line-clamp-2 text-xs italic">{caption}</p>
      )}

      {/* Botones de feedback */}
      {!isExecuted && (
        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {/* Like */}
          <button
            type="button"
            disabled={pending}
            onClick={() => act(isLiked ? "nueva" : "liked")}
            aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
              isLiked
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <ThumbsUp className="size-3" aria-hidden />
            {isLiked ? "Guardada" : "Me gusta"}
          </button>

          {/* Ejecutada */}
          <button
            type="button"
            disabled={pending}
            onClick={() => act("ejecutada")}
            aria-label="Marcar como ejecutada"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <CheckCircle2 className="size-3" aria-hidden />
            Ejecutada
          </button>

          {/* Guardar */}
          <button
            type="button"
            disabled={pending}
            onClick={() => act("guardada")}
            aria-label="Guardar"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <Bookmark className="size-3" aria-hidden />
            Guardar
          </button>

          {/* Dislike — muestra razones inline */}
          <div className="ml-auto">
            {showReasons ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs">¿Por qué?</span>
                {DISLIKE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      act("disliked", r);
                      setShowReasons(false);
                    }}
                    className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    act("disliked");
                    setShowReasons(false);
                  }}
                  className="text-muted-foreground text-[10px] underline-offset-2 hover:underline"
                >
                  Descartar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowReasons(true)}
                aria-label="No me gusta"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-destructive/30 hover:text-destructive"
              >
                <ThumbsDown className="size-3" aria-hidden />
                No me gusta
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ejecutada — estado final */}
      {isExecuted && (
        <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
          <CheckCircle2 className="size-4 text-primary" aria-hidden />
          <span className="text-sm text-muted-foreground">Marcada como ejecutada</span>
          <button
            type="button"
            onClick={() => act("nueva")}
            className="text-muted-foreground ml-auto text-xs underline-offset-2 hover:underline"
          >
            Deshacer
          </button>
        </div>
      )}
    </article>
  );
}

// ── Grid principal ─────────────────────────────────────────────

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "nueva", label: "Nuevas" },
  { id: "liked", label: "Guardadas" },
  { id: "ejecutada", label: "Ejecutadas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function ProposalsGrid({ proposals: initial }: { proposals: ProposalRow[] }) {
  const [proposals, setProposals] = useState(initial);
  const [filter, setFilter] = useState<FilterId>("todas");
  const [platformFilter, setPlatformFilter] = useState<string>("todas");
  const [drawerProposal, setDrawerProposal] = useState<ProposalRow | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const router = useRouter();

  // Plataformas únicas presentes
  const platforms = Array.from(
    new Set(proposals.map((p) => p.platform).filter(Boolean) as string[])
  );

  async function handleGenerate() {
    setGenerating(true);
    setGenStatus("Iniciando...");
    try {
      const res = await fetch("/api/generate-calendar", { method: "POST" });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as { type?: string; agent?: string };
            if (ev.type === "agent_start" && ev.agent) setGenStatus(`${ev.agent}…`);
            if (ev.type === "done") setGenStatus("Listo");
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setGenStatus("Error al generar");
    } finally {
      setGenerating(false);
      router.refresh();
    }
  }

  async function handleUpdate(id: string, status: string, reason?: string) {
    // Actualizar UI optimistamente
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );

    try {
      await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback_reason: reason }),
      });
    } catch {
      // Si falla, revertir
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: p.status } : p))
      );
    }
  }

  const visible = proposals.filter((p) => {
    const matchesStatus =
      filter === "todas" ||
      p.status === filter ||
      // 'guardada' y 'liked' se muestran en el filtro "Guardadas"
      (filter === "liked" && (p.status === "liked" || p.status === "guardada"));
    const matchesPlatform =
      platformFilter === "todas" || p.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const newCount = proposals.filter((p) => p.status === "nueva" || p.status === "draft").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {/* Cabecera */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">
            Propuestas{" "}
            {newCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">
                {newCount} nuevas
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recomendaciones generadas por el Director para tu semana.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-all hover:bg-primary/20 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            Generar propuestas
          </button>
          {genStatus && (
            <span className="text-[11px] text-muted-foreground">{genStatus}</span>
          )}
        </div>
      </header>

      {/* Filtros de estado */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
              filter === f.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Filtro de plataforma */}
        {platforms.length > 1 && (
          <>
            <span className="bg-border mx-1 h-4 w-px" aria-hidden />
            {["todas", ...platforms].map((pl) => (
              <button
                key={pl}
                type="button"
                onClick={() => setPlatformFilter(pl)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-all ${
                  platformFilter === pl
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {pl === "todas" ? "Todas las redes" : pl}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Sparkles className="size-8 text-primary/30" aria-hidden />
          <p className="font-serif text-lg text-muted-foreground">
            {filter === "todas"
              ? "Sin propuestas aún. Ve al Calendario y genera tu semana."
              : "Sin propuestas en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProposalCard key={p.id} proposal={p} onUpdate={handleUpdate} onOpen={setDrawerProposal} />
          ))}
        </div>
      )}

      <ProposalDrawer
        proposal={drawerProposal}
        onClose={() => setDrawerProposal(null)}
      />
    </div>
  );
}
