"use client";

import { useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock,
  Expand,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from "lucide-react";

import { fullProposalsFor, type DemoFullProposal } from "@/demo/fixtures";
import { ProposalDrawer } from "@/components/propuestas/proposal-drawer";
import type { ProposalRow } from "@/components/propuestas/proposals-grid";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  liked: "Guardada ♥",
  guardada: "Guardada",
  programada: "Programada",
  ejecutada: "Ejecutada",
  descartada: "Descartada",
};

const STATUS_STYLE: Record<string, string> = {
  nueva: "border-primary/30 text-primary bg-primary/5",
  liked: "border-primary/40 text-primary bg-primary/10",
  guardada: "border-primary/30 text-primary bg-primary/5",
  programada: "border-brand-violet/40 text-brand-violet bg-brand-violet/5",
  ejecutada: "border-border text-muted-foreground bg-muted/30",
};

const CATEGORY_LABEL: Record<string, string> = {
  educational: "Educativo",
  informative: "Informativo",
  promotional: "Publicitario",
  awareness: "Concientización",
  entertainment: "Entretenimiento",
  trending: "Actualidad",
};

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión vídeo",
  video_live: "Vídeo directo",
};

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "nueva", label: "Nuevas" },
  { id: "liked", label: "Guardadas" },
  { id: "ejecutada", label: "Ejecutadas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function ProposalCard({
  proposal,
  onUpdate,
  onOpen,
}: {
  proposal: DemoFullProposal;
  onUpdate: (id: string, status: string) => void;
  onOpen: (p: DemoFullProposal) => void;
}) {
  const [showReasons, setShowReasons] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hook = proposal.based_on?.hook ?? null;
  const title = hook ?? proposal.idea;
  const isExecuted = proposal.status === "ejecutada";
  const isLiked = proposal.status === "liked";

  return (
    <article
      className={`bg-card flex flex-col gap-3 rounded-xl border p-4 transition-opacity ${
        isExecuted ? "opacity-60" : ""
      } ${isLiked ? "border-primary/30" : "border-border"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            STATUS_STYLE[proposal.status] ?? "border-border text-muted-foreground"
          }`}
        >
          {STATUS_LABEL[proposal.status] ?? proposal.status}
        </span>
        <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
          {proposal.platform}
        </span>
        <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
          {TYPE_LABEL[proposal.content_type] ?? proposal.content_type}
        </span>
        {proposal.content_category && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[10px]">
            {CATEGORY_LABEL[proposal.content_category] ?? proposal.content_category}
          </span>
        )}
        <span className="text-muted-foreground ml-auto flex items-center gap-1 text-xs">
          <Clock className="size-3" aria-hidden />
          {proposal.suggested_slot}
        </span>
        <button
          type="button"
          aria-label="Ver detalle"
          onClick={() => onOpen(proposal)}
          className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Expand className="size-3.5" aria-hidden />
        </button>
      </div>

      <h3 className="font-serif text-base leading-snug">{title}</h3>

      <div className="border-brand-amber/50 bg-brand-amber/5 rounded-md border-l-2 px-3 py-2">
        <p className="text-brand-amber font-mono text-[9px] tracking-wider uppercase">
          Por qué ahora
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          {proposal.why_now}
        </p>
      </div>

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

      {!isExecuted && (
        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onUpdate(proposal.id, isLiked ? "nueva" : "liked")}
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
          <button
            type="button"
            onClick={() => onUpdate(proposal.id, "ejecutada")}
            aria-label="Marcar como ejecutada"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <CheckCircle2 className="size-3" aria-hidden />
            Ejecutada
          </button>
          <button
            type="button"
            onClick={() => onUpdate(proposal.id, "guardada")}
            aria-label="Guardar"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <Bookmark className="size-3" aria-hidden />
            Guardar
          </button>
          <div className="ml-auto">
            {showReasons ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs">¿Por qué?</span>
                {["El tema", "El tono", "El formato", "El canal"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onUpdate(proposal.id, "descartada");
                      setShowReasons(false);
                    }}
                    className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
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

      {isExecuted && (
        <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
          <CheckCircle2 className="size-4 text-primary" aria-hidden />
          <span className="text-sm text-muted-foreground">Marcada como ejecutada</span>
          <button
            type="button"
            onClick={() => onUpdate(proposal.id, "nueva")}
            className="text-muted-foreground ml-auto text-xs underline-offset-2 hover:underline"
          >
            Deshacer
          </button>
        </div>
      )}
    </article>
  );
}

export function DemoPropuestas({ profileId }: { profileId: string }) {
  const [proposals, setProposals] = useState(fullProposalsFor(profileId));
  const [filter, setFilter] = useState<FilterId>("todas");
  const [drawerProposal, setDrawerProposal] = useState<DemoFullProposal | null>(null);

  const platforms = Array.from(new Set(proposals.map((p) => p.platform)));
  const [platformFilter, setPlatformFilter] = useState("todas");

  const newCount = proposals.filter((p) => p.status === "nueva").length;

  function handleUpdate(id: string, status: string) {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  const visible = proposals.filter((p) => {
    const matchesStatus =
      filter === "todas" ||
      p.status === filter ||
      (filter === "liked" && (p.status === "liked" || p.status === "guardada"));
    const matchesPlatform =
      platformFilter === "todas" || p.platform === platformFilter;
    return matchesStatus && matchesPlatform && p.status !== "descartada";
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
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
        <button
          disabled
          title="No disponible en modo demo"
          className="flex cursor-not-allowed items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary opacity-50"
        >
          <Wand2 className="size-4" aria-hidden />
          Generar propuestas
        </button>
      </header>

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

      {visible.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-lg text-muted-foreground">
            Sin propuestas en esta categoría.
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
        proposal={drawerProposal as ProposalRow | null}
        onClose={() => setDrawerProposal(null)}
      />
    </div>
  );
}
