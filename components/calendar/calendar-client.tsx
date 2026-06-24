"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OrchestratorEvent } from "@/lib/ai/orchestrator";

// ── Tipo exportado (consumido por app/calendar/page.tsx) ───────

export type CalendarProposal = {
  id: string;
  idea: string | null;
  why_now: string | null;
  platform: string | null;
  status: string;
  suggested_slot: string | null; // "lunes 18:00"
  week_of: string | null;        // "2026-06-22" (lunes)
  based_on: Record<string, unknown> | null;
  content_type: string | null;
  content_category: string | null;
  expires_at: string | null;
};

// ── Constantes de día ──────────────────────────────────────────

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PHASE_LABEL: Record<string, string> = {
  "trend-sources": "Consultando fuentes de tendencias…",
  trends: "Analizando tendencias de la semana…",
  ideas: "Generando ideas para tu perfil…",
  selection: "El Director elige las mejores ideas…",
  hooks: "Revisando y afinando los ganchos…",
  enrich: "Redactando guiones, imágenes, vídeo y audio…",
  synthesis: "Construyendo la agenda semanal…",
};

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión",
  video_live: "Directo",
  music: "Música",
  mixed: "Mezcla",
};

// ── Utilidades de fecha ────────────────────────────────────────

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function dayFromSlot(slot: string | null): number | null {
  if (!slot) return null;
  const lower = slot.toLowerCase();
  const idx = DAY_NAMES.findIndex((d) => lower.startsWith(d));
  return idx >= 0 ? idx : null;
}

function timeFromSlot(slot: string | null): string | null {
  if (!slot) return null;
  const m = slot.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : null;
}

function proposalDate(p: CalendarProposal): string | null {
  if (!p.week_of) return null;
  const dayIdx = dayFromSlot(p.suggested_slot);
  if (dayIdx === null) return null;
  const monday = new Date(p.week_of + "T00:00:00");
  return toISO(addDays(monday, dayIdx));
}

// ── Mini-card de propuesta en la cuadrícula ────────────────────

function ProposalMiniCard({
  proposal,
  onUpdate,
}: {
  proposal: CalendarProposal;
  onUpdate: (id: string, status: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const based = proposal.based_on ?? {};
  const hook = typeof based.hook === "string" ? based.hook : proposal.idea ?? "Sin título";
  const isLiked = proposal.status === "liked";
  const isExecuted = proposal.status === "ejecutada";
  const time = timeFromSlot(proposal.suggested_slot);

  function act(status: string) {
    startTransition(() => {
      onUpdate(proposal.id, status);
    });
  }

  return (
    <div
      className={`group relative flex flex-col gap-1 rounded-lg border p-2 text-xs transition-opacity ${
        isExecuted ? "opacity-50" : ""
      } ${isLiked ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
    >
      {/* Platform + time */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {proposal.platform && (
          <span className="font-mono">{proposal.platform}</span>
        )}
        {proposal.content_type && (
          <span className="font-mono">· {TYPE_LABEL[proposal.content_type] ?? proposal.content_type}</span>
        )}
        {time && <span className="ml-auto">{time}</span>}
      </div>

      {/* Hook */}
      <p className="font-serif text-[11px] leading-tight line-clamp-2">{hook}</p>

      {/* Hover actions */}
      {!isExecuted && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 rounded-b-lg bg-card/90 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            disabled={pending}
            onClick={() => act(isLiked ? "nueva" : "liked")}
            aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
            className={`rounded p-0.5 transition-colors ${
              isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <ThumbsUp className="size-3" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("ejecutada")}
            aria-label="Ejecutada"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <CheckCircle2 className="size-3" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("disliked")}
            aria-label="No me gusta"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
          >
            <ThumbsDown className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Panel de generación (SSE) ──────────────────────────────────

type LogLine = { text: string; tone: "info" | "ok" | "warn" };

function GenerationPanel({
  log,
  running,
  error,
  onGenerate,
}: {
  log: LogLine[];
  running: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  const [open, setOpen] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-card rounded-xl border">
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-3 select-none"
        onClick={() => setOpen((v) => !v)}
      >
        {running ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <Sparkles className="size-3.5 text-primary" />
        )}
        <span className="text-xs font-medium flex-1">
          {running ? "Generando calendario…" : "Director creativo"}
        </span>
        <Button
          size="sm"
          disabled={running}
          onClick={(e) => {
            e.stopPropagation();
            onGenerate();
          }}
          className="h-7 gap-1.5 rounded-full px-3 text-xs"
        >
          <Sparkles className="size-3" />
          {running ? "Generando…" : "Generar semana"}
        </Button>
      </div>

      {open && log.length > 0 && (
        <div className="border-t">
          <div className="max-h-48 overflow-y-auto p-4">
            <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {log.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.tone === "warn"
                      ? "text-amber-400"
                      : l.tone === "ok"
                        ? "text-primary"
                        : "text-muted-foreground"
                  }
                >
                  {l.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </pre>
          </div>
        </div>
      )}

      {error && (
        <p className="border-t px-4 py-2 text-xs text-destructive">{error}</p>
      )}
    </section>
  );
}

// ── Componente principal ───────────────────────────────────────

export function CalendarClient({ proposals: initial }: { proposals: CalendarProposal[] }) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initial);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));

  // SSE generation state
  const [log, setLog] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Week days
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekISO = toISO(weekStart);
  const todayISO = toISO(new Date());

  // ── Agrupar propuestas por día ──────────────────────────────

  const byDay: Record<string, CalendarProposal[]> = {};
  const unslotted: CalendarProposal[] = [];

  for (const p of proposals) {
    const date = proposalDate(p);
    if (date) {
      byDay[date] = [...(byDay[date] ?? []), p];
    } else if (!p.week_of || p.week_of === weekISO) {
      unslotted.push(p);
    }
  }

  // ── Feedback optimista ──────────────────────────────────────

  async function handleUpdate(id: string, status: string) {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // silently fail — optimistic state stays
    }
  }

  // ── SSE generation ──────────────────────────────────────────

  function pushLog(line: LogLine) {
    setLog((prev) => [...prev, line]);
  }

  function handleEvent(ev: OrchestratorEvent) {
    switch (ev.type) {
      case "phase":
        if (ev.status === "start") {
          pushLog({ text: `▸ ${PHASE_LABEL[ev.phase] ?? ev.phase}`, tone: "info" });
        } else if (ev.status === "done" && ev.detail) {
          pushLog({ text: `  ${ev.detail}`, tone: "ok" });
        }
        break;
      case "trends":
        pushLog({ text: `  ${ev.report.trending_topics.length} temas detectados`, tone: "ok" });
        break;
      case "ideas":
        pushLog({ text: `  ${ev.count} ideas generadas`, tone: "ok" });
        break;
      case "selection":
        pushLog({ text: `  seleccionadas ${ev.selected} · tema: ${ev.weekly_theme}`, tone: "ok" });
        break;
      case "post":
        pushLog({ text: `  ✓ pieza ${ev.index + 1}: ${ev.hook ?? ""}`, tone: "ok" });
        break;
      case "warning":
        pushLog({ text: `  ⚠ ${ev.message}`, tone: "warn" });
        break;
      case "done":
        pushLog({ text: "Calendario listo ✓", tone: "ok" });
        router.refresh();
        break;
      case "error":
        setError(ev.message);
        pushLog({ text: `Error: ${ev.message}`, tone: "warn" });
        break;
    }
  }

  async function generate() {
    setRunning(true);
    setError(null);
    setLog([]);
    try {
      const res = await fetch("/api/generate-calendar", { method: "POST" });
      if (!res.ok || !res.body) {
        setError((await res.text()) || `Error ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            handleEvent(JSON.parse(line.slice(5).trim()) as OrchestratorEvent);
          } catch {
            /* ignora líneas no-JSON */
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  // ── Propuestas totales en la semana mostrada ────────────────

  const weekProposals = proposals.filter((p) => {
    if (p.week_of === weekISO) return true;
    const date = proposalDate(p);
    return date && date >= weekISO && date < toISO(addDays(weekStart, 7));
  });

  const isEmpty = weekProposals.length === 0 && unslotted.length === 0;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Cabecera */}
      <header className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(mondayOf(new Date()))}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="font-serif text-lg">
            {formatDayHeader(weekStart)} — {formatDayHeader(addDays(weekStart, 6))}
          </span>
          {weekProposals.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
              {weekProposals.length} propuestas
            </span>
          )}
        </div>

        <div className="ml-auto">
          <Button
            size="sm"
            disabled={running}
            onClick={generate}
            className="h-8 gap-1.5 rounded-full px-4 text-xs"
          >
            {running ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            {running ? "Generando…" : "Generar semana"}
          </Button>
        </div>
      </header>

      {/* Log SSE si está activo */}
      {(log.length > 0 || error) && (
        <div className="shrink-0">
          <GenerationPanel log={log} running={running} error={error} onGenerate={generate} />
        </div>
      )}

      {/* Grid semanal */}
      <div className="min-h-0 flex-1 overflow-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="size-10 text-primary/20" />
            <div>
              <p className="font-serif text-xl text-muted-foreground">Esta semana está vacía</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pulsa «Generar semana» y el Director montará el calendario.
              </p>
            </div>
            <Button
              onClick={generate}
              disabled={running}
              className="gap-2 rounded-full"
            >
              <Sparkles className="size-4" />
              Generar semana
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cuadrícula 7 días */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                const iso = toISO(day);
                const isToday = iso === todayISO;
                const dayProposals = byDay[iso] ?? [];

                return (
                  <div key={iso} className="flex flex-col gap-1.5">
                    {/* Cabecera del día */}
                    <div
                      className={`flex flex-col items-center rounded-lg py-1.5 text-center text-xs ${
                        isToday
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className="font-medium">{DAY_SHORT[i]}</span>
                      <span className={`font-mono text-[10px] ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
                        {formatDayHeader(day)}
                      </span>
                    </div>

                    {/* Propuestas del día */}
                    <div className="flex flex-col gap-1.5 min-h-[80px]">
                      {dayProposals.map((p) => (
                        <ProposalMiniCard key={p.id} proposal={p} onUpdate={handleUpdate} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Propuestas sin slot asignado */}
            {unslotted.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Sin fecha asignada</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unslotted.map((p) => (
                    <ProposalMiniCard key={p.id} proposal={p} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
