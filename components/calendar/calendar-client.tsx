"use client";

import { useRef, useState } from "react";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OrchestratorEvent } from "@/lib/ai/orchestrator";
import type { WeeklyCalendar } from "@/lib/ai/agents/schemas";

// Etiquetas legibles de cada fase del orquestador.
const PHASE_LABEL: Record<string, string> = {
  "trend-sources": "Tendencias en tiempo real",
  trends: "Análisis de tendencias",
  ideas: "Generación de ideas",
  selection: "Selección del orquestador",
  enrich: "Guion, imagen, vídeo y audio (en paralelo)",
  synthesis: "Síntesis y agenda",
};

type LogLine = { text: string; tone: "info" | "ok" | "warn" };

export function CalendarClient({ hasProfile }: { hasProfile: boolean }) {
  const [log, setLog] = useState<LogLine[]>([]);
  const [calendar, setCalendar] = useState<WeeklyCalendar | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  function push(line: LogLine) {
    setLog((prev) => [...prev, line]);
    queueMicrotask(() =>
      logEndRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }

  function handleEvent(ev: OrchestratorEvent) {
    switch (ev.type) {
      case "phase":
        if (ev.status === "start") {
          push({
            text: `▸ ${PHASE_LABEL[ev.phase] ?? ev.phase}…`,
            tone: "info",
          });
        }
        break;
      case "trend-sources":
        push({
          text: `  fuentes reales: ${ev.sources.join(", ")}`,
          tone: "ok",
        });
        break;
      case "trends":
        push({
          text: `  ${ev.report.trending_topics.length} temas calientes detectados`,
          tone: "ok",
        });
        break;
      case "ideas":
        push({ text: `  ${ev.count} ideas generadas`, tone: "ok" });
        break;
      case "selection":
        push({
          text: `  seleccionadas ${ev.selected} · tema: ${ev.weekly_theme}`,
          tone: "ok",
        });
        break;
      case "post":
        push({
          text: `  ✓ pieza ${ev.index + 1}: ${ev.hook ?? ""}${
            ev.degraded && ev.degraded.length
              ? ` (degradado: ${ev.degraded.join(", ")})`
              : ""
          }`,
          tone: ev.degraded && ev.degraded.length ? "warn" : "ok",
        });
        break;
      case "warning":
        push({ text: `  ⚠ ${ev.scope}: ${ev.message}`, tone: "warn" });
        break;
      case "done":
        setCalendar(ev.calendar);
        push({ text: "Calendario listo ✓", tone: "ok" });
        break;
      case "error":
        setError(ev.message);
        push({ text: `Error: ${ev.message}`, tone: "warn" });
        break;
    }
  }

  async function generate() {
    setRunning(true);
    setError(null);
    setCalendar(null);
    setLog([]);
    try {
      const res = await fetch("/api/generate-calendar", { method: "POST" });
      if (!res.ok || !res.body) {
        setError((await res.text()) || `Error ${res.status}`);
        setRunning(false);
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Calendario semanal</h1>
          <p className="text-muted-foreground text-sm">
            El orquestador cruza tu perfil con las tendencias y monta la semana:
            tendencias → ideas → selección → guiones e imágenes → agenda.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={running || !hasProfile}
          className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 shrink-0 gap-2 rounded-full"
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {running ? "Generando…" : "Generar calendario"}
        </Button>
      </header>

      {!hasProfile && (
        <p className="text-brand-amber bg-brand-amber/10 rounded-lg px-3 py-2 text-sm">
          Necesitas un perfil para generar el calendario. Completa el onboarding
          primero.
        </p>
      )}

      {error && (
        <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* Razonamiento en vivo */}
      {log.length > 0 && (
        <section className="bg-card rounded-xl border">
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <Loader2
              className={`size-3.5 ${running ? "animate-spin" : "opacity-0"}`}
            />
            <span className="text-xs font-medium">Razonamiento</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-4">
            <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {log.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.tone === "warn"
                      ? "text-brand-amber"
                      : l.tone === "ok"
                        ? "text-brand-accent"
                        : "text-muted-foreground"
                  }
                >
                  {l.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </pre>
          </div>
        </section>
      )}

      {/* Calendario final */}
      {calendar && (
        <section className="space-y-4">
          <div className="bg-secondary/50 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-brand-violet size-4" />
              <span className="text-sm font-medium">
                {calendar.week} · {calendar.weekly_theme}
              </span>
            </div>
            {calendar.notes && (
              <p className="text-muted-foreground mt-2 text-sm">
                {calendar.notes}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            {calendar.posts.map((p, i) => (
              <article key={i} className="bg-card rounded-xl border p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge>{p.platform}</Badge>
                  <Badge>{p.format}</Badge>
                  {p.day && (
                    <span className="text-muted-foreground">
                      {p.day}
                      {p.best_time ? ` · ${p.best_time}` : ""}
                    </span>
                  )}
                  {p.degraded.length > 0 && (
                    <span className="text-brand-amber ml-auto text-[10px]">
                      incompleto: {p.degraded.join(", ")}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg">{p.hook}</h3>
                {p.topic && (
                  <p className="text-muted-foreground text-xs">{p.topic}</p>
                )}
                {p.script && (
                  <p className="mt-2 text-sm whitespace-pre-wrap">{p.script}</p>
                )}
                {p.caption && (
                  <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                    {p.caption}
                  </p>
                )}
                {p.hashtags.length > 0 && (
                  <p className="text-brand-violet mt-2 text-xs">
                    {p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                  </p>
                )}
                {p.image_prompt && (
                  <details className="mt-2">
                    <summary className="text-muted-foreground cursor-pointer text-xs">
                      Brief visual
                    </summary>
                    <p className="text-muted-foreground mt-1 text-xs whitespace-pre-wrap">
                      {p.image_prompt}
                      {p.aspect_ratio ? `\n(ratio ${p.aspect_ratio})` : ""}
                    </p>
                  </details>
                )}
                {p.video_brief && (
                  <details className="mt-2">
                    <summary className="text-muted-foreground cursor-pointer text-xs">
                      Dirección de vídeo · {p.video_brief.total_seconds}s
                    </summary>
                    <div className="text-muted-foreground mt-1 space-y-1 text-xs">
                      {p.video_brief.shots.map((s, j) => (
                        <p key={j} className="whitespace-pre-wrap">
                          <span className="font-mono">{s.seconds}s</span> ·{" "}
                          {s.visual}
                          {s.on_screen_text ? ` — “${s.on_screen_text}”` : ""}
                        </p>
                      ))}
                      <p className="italic">{p.video_brief.format_notes}</p>
                    </div>
                  </details>
                )}
                {p.audio_brief && (
                  <details className="mt-2">
                    <summary className="text-muted-foreground cursor-pointer text-xs">
                      Guion de audio
                    </summary>
                    <div className="text-muted-foreground mt-1 space-y-1 text-xs">
                      <p className="whitespace-pre-wrap">
                        {p.audio_brief.voiceover}
                      </p>
                      <p className="italic">
                        Voz: {p.audio_brief.voice_tone} · Música:{" "}
                        {p.audio_brief.music}
                      </p>
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 font-mono text-[10px]">
      {children}
    </span>
  );
}
