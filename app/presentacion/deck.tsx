"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/landing/logo";

/* ─── Browser window wrapper ───────────────────────────────────────────────── */
function BrowserWindow({
  src,
  label,
  className = "",
}: {
  src: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl ${className}`}
      style={{ boxShadow: "0 0 40px rgba(34,214,122,.08)" }}
    >
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2 shrink-0">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
        <div className="mx-2 flex flex-1 items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-0.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground shrink-0"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
          </svg>
          <span className="font-mono text-[9px] text-muted-foreground truncate">
            demiurgos.vercel.app{src === "/" ? "" : src}
          </span>
        </div>
      </div>
      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={src}
          title={label}
          className="h-full w-full border-0"
          style={{ pointerEvents: "none", transform: "scale(1)", transformOrigin: "top left" }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}

/* ─── Mini pill / badge ─────────────────────────────────────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 font-mono text-xs text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
      {children}
    </span>
  );
}

/* ─── Feature list item ─────────────────────────────────────────────────────── */
function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[clamp(.9rem,1.8vw,1.05rem)] leading-snug">
      <span className="mt-0.5 shrink-0 text-primary text-sm">▸</span>
      <span>{children}</span>
    </li>
  );
}

/* ─── Stack badge ───────────────────────────────────────────────────────────── */
function StackBadge({ icon, name, hi }: { icon: string; name: string; hi?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 font-mono text-xs transition-colors ${
        hi
          ? "border-primary/40 bg-primary/6 text-primary"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      {name}
    </div>
  );
}

/* ─── Step ──────────────────────────────────────────────────────────────────── */
function Step({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex w-full max-w-[680px] items-start gap-4 text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary font-mono text-base font-bold text-primary">
        {n}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Slides data ───────────────────────────────────────────────────────────── */
// Each slide renders its own JSX via the `content` prop.
// Speaker notes live in comments inside each slide component.

function S01() {
  /* Speaker: Arranca sin presentarte. La frase lo dice todo. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Pill>BOOTCAMP IA · 2026</Pill>
      <h1
        className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-extrabold leading-[1.04] tracking-[-0.045em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Bienvenidos a la era<br />
        de <span className="text-primary">TU</span> marca personal.
      </h1>
      <p className="max-w-lg text-[clamp(1rem,2.2vw,1.3rem)] text-muted-foreground">
        Y de quien te ayuda a construirla cada semana, sin agotarte.
      </p>
    </div>
  );
}

function S02() {
  /* Speaker: Dolor reconocible. Sin nombrar el producto todavía. */
  const items = [
    { e: "💡", t: "Inspiración", d: "¿De qué hablo hoy?" },
    { e: "✍️", t: "Guion", d: "¿Cómo lo cuento?" },
    { e: "🖼️", t: "Criterio visual", d: "¿Qué imagen pongo?" },
    { e: "📅", t: "Constancia", d: "Semana tras semana." },
    { e: "⏱️", t: "Tiempo", d: "Que nadie tiene." },
    { e: "🧩", t: "Todo a la vez.", d: "El verdadero problema.", hi: true },
  ];
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Crear contenido<br />
        <span className="text-primary">no es fácil.</span>
      </h2>
      <div className="grid w-full max-w-[820px] grid-cols-3 gap-3 sm:grid-cols-3">
        {items.map((x) => (
          <div
            key={x.t}
            className={`rounded-[18px] border p-4 text-left ${
              x.hi
                ? "border-primary/40 bg-primary/6"
                : "border-border bg-card"
            }`}
          >
            <p className="text-xl">{x.e}</p>
            <p className={`mt-1 font-semibold ${x.hi ? "text-primary" : "text-foreground"}`}>{x.t}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function S03() {
  /* Speaker: Pausa de 3s antes de entrar. Dejar que aterrice. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        El verdadero bloqueo
      </p>
      <blockquote
        className="font-display text-[clamp(1.4rem,3.8vw,2.4rem)] font-bold leading-[1.2] tracking-[-0.035em] max-w-[720px]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        No nos falta <span className="text-primary">talento.</span>
        <br />
        Nos falta <span className="text-primary">tiempo,</span>
        <br />
        <span className="text-primary">método</span> y{" "}
        <span className="text-primary">consistencia</span>
        <br />
        para hacerlo bien de forma sostenida.
      </blockquote>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="text-muted-foreground">Y eso tiene solución.</p>
    </div>
  );
}

function S04() {
  /* Speaker: Primer momento wow. Nombra el producto. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        La solución
      </p>
      <Logo size={64} />
      <h1
        className="font-display font-extrabold leading-none tracking-[-0.055em] text-primary text-[clamp(4rem,10vw,7.5rem)]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Demiurgos
      </h1>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="max-w-[52ch] text-[clamp(1.1rem,2.5vw,1.5rem)] leading-relaxed text-muted-foreground">
        Tu director creativo personal, construido con IA, que trabaja con tu voz, tus temas y tu contexto.
      </p>
      <Pill>No es ChatGPT. Es TU asistente de contenido.</Pill>
    </div>
  );
}

function S05() {
  /* Speaker: Énfasis en "TU". Personalización vs. genérico. */
  const items = [
    { e: "👤", t: "Tu perfil", d: "Experiencia, tono, sector" },
    { e: "📝", t: "Tus contenidos", d: "Lo que ya has publicado" },
    { e: "❤️", t: "Tus gustos", d: "Estilo, referentes, formatos" },
    { e: "📈", t: "Tendencias del sector", d: "Lo que está pasando ahora" },
    { e: "🌐", t: "Ideas frontera", d: "Lo que nadie ha dicho todavía" },
    { e: "📂", t: "Archivos y redes", d: "Drive, LinkedIn, X…" },
  ];
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué <span className="text-primary">analiza?</span>
      </h2>
      <div className="grid w-full max-w-[780px] grid-cols-3 gap-3">
        {items.map((x) => (
          <div key={x.t} className="rounded-[18px] border border-border bg-card p-4 text-left">
            <p className="text-xl">{x.e}</p>
            <p className="mt-1 font-semibold text-foreground">{x.t}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function S06() {
  /* Speaker: Lee el ejemplo en voz alta. Es el output concreto. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué <span className="text-primary">genera?</span>
      </h2>
      <div
        className="w-full max-w-[620px] rounded-[18px] border border-primary/30 bg-card p-5 text-left"
        style={{ boxShadow: "0 0 28px rgba(34,214,122,.12)" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Propuesta de contenido · ejemplo
        </p>
        <div className="mt-3 h-0.5 w-10 rounded-full bg-primary" />
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Idea</p>
            <p className="mt-1 font-semibold text-foreground">
              "Por qué la mayoría de los posts de LinkedIn fracasan en los primeros 3 segundos"
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Por qué ahora</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              El algoritmo prioriza retención. Los creadores no lo optimizan. Hay una ventana abierta.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Guion</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Hook → tensión → dato clave → solución → CTA. Adaptado a tu voz.
            </p>
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Propuestas interesantes, personalizadas, listas para publicar (o adaptar).
      </p>
    </div>
  );
}

function S07() {
  /* Speaker: Muestra las ventanas reales. "Esto es el producto." */
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        El recorrido <span className="text-primary">completo.</span>
      </h2>
      <div className="grid w-full max-w-[1000px] grid-cols-3 gap-4">
        {/* Landing */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary">
              1
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Landing</p>
              <p className="font-mono text-[10px] text-muted-foreground">Qué es y por qué importa</p>
            </div>
          </div>
          <BrowserWindow src="/" label="Landing" className="h-[240px]" />
        </div>
        {/* Onboarding — iframe a la página de login/onboarding pública */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary">
              2
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Onboarding</p>
              <p className="font-mono text-[10px] text-muted-foreground">Tu perfil, tu voz, tu sector</p>
            </div>
          </div>
          <BrowserWindow src="/onboarding" label="Onboarding" className="h-[240px]" />
        </div>
        {/* Demo/Panel */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary">
              3
            </div>
            <div>
              <p className="font-semibold text-primary text-sm">Panel</p>
              <p className="font-mono text-[10px] text-muted-foreground">Tu director creativo activo</p>
            </div>
          </div>
          <BrowserWindow src="/demo" label="Panel" className="h-[240px]" />
        </div>
      </div>
    </div>
  );
}

function S08() {
  /* Speaker: Señala bloques. No leas. Muestra la ventana del chat. */
  return (
    <div className="flex w-full max-w-[960px] flex-col items-center gap-5">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué puedes <span className="text-primary">hacer?</span>
      </h2>
      <div className="grid w-full grid-cols-[1fr_1.4fr] gap-5 items-start">
        <ul className="flex flex-col gap-3 text-left">
          <Feat>
            <strong>Chat con el Director Creativo</strong> — Conversación
            contextualizada con tu perfil e historial.
          </Feat>
          <Feat>
            <strong>Generación de propuestas</strong> — Ideas + por qué ahora +
            guion, listas para publicar.
          </Feat>
          <Feat>
            <strong>Conexión y subida de archivos</strong> — Google Drive, PDFs,
            notas propias como fuente de inspiración.
          </Feat>
          <Feat>
            <strong>Ideas frontera</strong> — Contenido en la frontera del
            conocimiento de tu sector.
          </Feat>
        </ul>
        <BrowserWindow src="/demo" label="Chat" className="h-[290px]" />
      </div>
    </div>
  );
}

function S09() {
  /* Speaker: Termina con "ajustes de costes" — despierta curiosidad técnica. */
  return (
    <div className="flex w-full max-w-[960px] flex-col items-center gap-5">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Y también <span className="text-primary">esto.</span>
      </h2>
      <div className="grid w-full grid-cols-[1.4fr_1fr] gap-5 items-start">
        <BrowserWindow src="/demo" label="Propuestas" className="h-[290px]" />
        <ul className="flex flex-col gap-3 text-left">
          <Feat>
            <strong>Perfil contextual</strong> — Tu tono, sector y audiencia en
            cada generación.
          </Feat>
          <Feat>
            <strong>Selección y scraping de redes</strong> — Conecta LinkedIn o
            X; analiza lo que ya has publicado.
          </Feat>
          <Feat>
            <strong>Tendencias en tiempo real</strong> — Lo que está pasando en
            tu sector, integrado como contexto.
          </Feat>
          <Feat>
            <strong>Ajustes de coste</strong> — Control granular sobre qué
            modelos y cuánto gastas.
          </Feat>
        </ul>
      </div>
    </div>
  );
}

function S10() {
  /* Speaker: "Aquí está todo lo que usé." Sin entrar en detalle. */
  const tools = [
    { e: "✦", n: "Claude Cowork", hi: true },
    { e: "⌨️", n: "Claude Code", hi: true },
    { e: "🎨", n: "Claude Design" },
    { e: "🤖", n: "ChatGPT" },
    { e: "🧩", n: "Codex" },
    { e: "▲", n: "Vercel" },
    { e: "🐙", n: "GitHub" },
    { e: "☁️", n: "Google Cloud" },
    { e: "📊", n: "TrendMCP" },
    { e: "🕷️", n: "Apify" },
    { e: "🗄️", n: "Supabase", hi: true },
    { e: "⚡", n: "…y lo que hiciera falta", hi: true },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        El <span className="text-primary">stack.</span>
      </h2>
      <div className="grid w-full max-w-[900px] grid-cols-4 gap-2.5 sm:grid-cols-4">
        {tools.map((t) => (
          <StackBadge key={t.n} icon={t.e} name={t.n} hi={t.hi} />
        ))}
      </div>
    </div>
  );
}

function S11() {
  /* Speaker: Honesto y humano. 3 pasos claros. */
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Cómo se <span className="text-primary">construyó.</span>
      </h2>
      <div className="flex w-full flex-col gap-4 items-center">
        <Step
          n={1}
          title="Construir el prompt"
          desc="Primero se levantó un GPT para diseñar un prompt sólido que definiera el comportamiento del director creativo."
        />
        <Step
          n={2}
          title="Levantar el proyecto"
          desc="Con el prompt como base, se inició la arquitectura completa con Claude Code: Next.js, Supabase, auth, API."
        />
        <Step
          n={3}
          title="Iterar (y pelearse con la IA)"
          desc="Debugging constante, decisiones en caliente y aprendizaje forzado de todo lo que hacía falta."
        />
      </div>
    </div>
  );
}

function S12() {
  /* Speaker: Momento de humor y honestidad. El equipo lo vivirá. */
  const blocks = [
    {
      t: "🔧 Bloqueos técnicos",
      d: "Merges rotos, pull requests conflictivos, builds que fallan sin razón aparente.",
    },
    {
      t: "🤯 Decisiones en caliente",
      d: "¿Cambio de arquitectura a mitad? ¿Descarto la feature? Con el reloj corriendo.",
    },
    {
      t: "💸 Control de costes",
      d: "Cada prompt cuesta. Aprender cuándo es eficiente y cuándo estás quemando dinero.",
    },
    {
      t: "🧠 Contexto que se pierde",
      d: "La IA no siempre recuerda. Tú sí tienes que recordar por los dos.",
    },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        La parte que nadie cuenta
      </p>
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        La <span className="text-primary">pelea</span> con la IA.
      </h2>
      <div className="grid w-full max-w-[760px] grid-cols-2 gap-3 text-left">
        {blocks.map((b) => (
          <div key={b.t} className="rounded-[18px] border border-border bg-card p-4">
            <p className="font-bold text-brand-amber">{b.t}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function S13() {
  /* Speaker: "Nada de esto sabía antes de empezar." */
  const tags = [
    "Vercel deploys", "GitHub flow", "Merges & PRs", "Supabase",
    "Bases de datos relacionales", "Google Cloud Console", "Google Drive API",
    "Scraping con Apify", "Tendencias en tiempo real", "Control de costes por LLM",
    "Prompting avanzado", "Arquitectura Next.js", "Auth con OAuth", "Debugging con IA",
  ];
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Aprendizajes <span className="text-primary">reales.</span>
      </h2>
      <div className="flex max-w-[780px] flex-wrap justify-center gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-primary/30 bg-primary/6 px-3 py-1 font-mono text-xs text-primary"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="text-muted-foreground">Todo sin saber de antemano que lo iba a necesitar.</p>
    </div>
  );
}

function S14() {
  /* Speaker: Pausa larga. Deja que respire. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Cierre</p>
      <blockquote
        className="font-display font-bold leading-[1.2] tracking-[-0.04em] max-w-[720px] text-[clamp(1.6rem,4vw,2.8rem)]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Demiurgos no es solo<br />
        <span className="text-primary">una herramienta.</span>
      </blockquote>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <blockquote
        className="font-display font-bold leading-[1.25] tracking-[-0.035em] max-w-[640px] text-[clamp(1.2rem,3vw,2rem)] text-muted-foreground"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Es aprender a construir <span className="text-primary">con IA</span>
        <br />
        mientras construyes.
      </blockquote>
      <Pill>El proceso es el producto.</Pill>
    </div>
  );
}

function S15() {
  /* Speaker: Reír. Gracias. Preguntas. */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Fin de la sesión
      </p>
      <div
        className="w-full max-w-[520px] rounded-[18px] border border-primary/20 bg-[#0a0e0c] p-6 text-left font-mono text-sm"
        style={{ boxShadow: "0 0 40px rgba(34,214,122,.07)" }}
      >
        <p className="text-muted-foreground">demiurgos@bootcamp ~ $</p>
        <br />
        <p className="text-primary">⠿ Generando propuesta de contenido…</p>
        <p className="text-primary">⠿ Conectando con tendencias…</p>
        <p className="text-primary">⠿ Analizando tu perfil…</p>
        <br />
        <p className="text-destructive">⚠ UsageLimitError [429]</p>
        <p className="text-destructive">&nbsp;&nbsp;Se ha alcanzado el límite de Claude.</p>
        <br />
        <p className="text-muted-foreground">Retry in: 3600s</p>
        <p className="text-muted-foreground">
          Session cost: $<span className="text-brand-amber">mucho</span>
        </p>
        <br />
        <p className="text-primary">
          $ <BlinkCursor />
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Gracias. Preguntas bienvenidas.{" "}
        <span className="text-primary">Demiurgos</span> sigue iterando.
      </p>
    </div>
  );
}

function BlinkCursor() {
  return (
    <span
      className="inline-block h-[1em] w-2 bg-primary align-middle"
      style={{ animation: "blink 1.1s step-end infinite" }}
    />
  );
}

/* ─── Slides registry ───────────────────────────────────────────────────────── */
const SLIDES: { component: React.FC; note: string }[] = [
  { component: S01, note: "Arranca sin presentarte. La frase lo dice todo." },
  { component: S02, note: "Dolor reconocible. No nombres el producto todavía." },
  { component: S03, note: "Pausa de 3s. Dejar que aterrice." },
  { component: S04, note: "Primer momento wow. Nombra Demiurgos." },
  { component: S05, note: "Énfasis en 'TU'. Personalización vs. genérico." },
  { component: S06, note: "Lee el ejemplo en voz alta. Es concreto." },
  { component: S07, note: "Muestra las ventanas reales. 'Esto es el producto.'" },
  { component: S08, note: "Señala bloques. No leas la lista." },
  { component: S09, note: "Termina con ajustes de costes. Curiosidad técnica." },
  { component: S10, note: "'Aquí está todo lo que usé.' Sin entrar en detalle." },
  { component: S11, note: "Honesto y humano. 3 pasos claros." },
  { component: S12, note: "'Esto es lo que nadie cuenta.' Momento humano." },
  { component: S13, note: "'Nada de esto sabía antes de empezar.'" },
  { component: S14, note: "Pausa larga. Deja que respire." },
  { component: S15, note: "Reír. Gracias. Preguntas." },
];

/* ─── Main deck component ───────────────────────────────────────────────────── */
export function PresentacionDeck() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<"fwd" | "bwd">("fwd");
  const [animating, setAnimating] = useState(false);

  const total = SLIDES.length;

  const goto = useCallback(
    (n: number) => {
      if (animating || n < 0 || n >= total) return;
      setDir(n > current ? "fwd" : "bwd");
      setAnimating(true);
      setTimeout(() => {
        setCurrent(n);
        setAnimating(false);
      }, 320);
    },
    [animating, current, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
        goto(current + 1);
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        goto(current - 1);
      }
      if (e.key === "f" || e.key === "F") {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
      }
      if (e.key === "Home") goto(0);
      if (e.key === "End") goto(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goto, total]);

  // Swipe support
  const [touchX, setTouchX] = useState(0);

  const SlideComponent = SLIDES[current].component;
  const speakerNote = SLIDES[current].note;

  const progressPct = ((current + 1) / total) * 100;

  return (
    <>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes slideInFwd {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInBwd {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .slide-enter-fwd { animation: slideInFwd .38s cubic-bezier(.2,.6,.3,1) both; }
        .slide-enter-bwd { animation: slideInBwd .38s cubic-bezier(.2,.6,.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .slide-enter-fwd, .slide-enter-bwd { animation: none; }
        }
      `}</style>

      {/* Full-screen wrapper */}
      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-background"
        style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 50) goto(dx < 0 ? current + 1 : current - 1);
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a, button, input, select, iframe")) return;
          goto(e.clientX > window.innerWidth / 2 ? current + 1 : current - 1);
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 10%, rgba(34,214,122,.07) 0%, transparent 60%)",
          }}
        />

        {/* Slide area */}
        <main className="flex flex-1 items-center justify-center overflow-hidden px-[clamp(1.5rem,8vw,8rem)] py-[clamp(2rem,5vh,4rem)]">
          <div
            key={current}
            className={`flex w-full items-center justify-center ${
              animating
                ? ""
                : dir === "fwd"
                  ? "slide-enter-fwd"
                  : "slide-enter-bwd"
            }`}
          >
            <SlideComponent />
          </div>
        </main>

        {/* Progress bar */}
        <div className="relative h-[3px] w-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-400 ease-out"
            style={{
              width: `${progressPct}%`,
              boxShadow: "0 0 10px var(--color-primary)",
              transition: "width .4s cubic-bezier(.2,.6,.3,1)",
            }}
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border/40 bg-background/80 px-4 py-2 text-xs backdrop-blur-sm">
          {/* Nav hint */}
          <div className="flex items-center gap-2 text-muted-foreground">
            {["←", "→"].map((k) => (
              <kbd
                key={k}
                className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground"
              >
                {k}
              </kbd>
            ))}
            <span>navegar</span>
            <span className="mx-1 text-border">|</span>
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground">
              F
            </kbd>
            <span>pantalla completa</span>
          </div>

          {/* Speaker note */}
          <p className="hidden max-w-[420px] truncate text-center font-mono text-[10px] text-muted-foreground/60 sm:block">
            💬 {speakerNote}
          </p>

          {/* Counter */}
          <p className="font-mono text-[10px] text-muted-foreground">
            {current + 1} / {total}
          </p>
        </div>
      </div>
    </>
  );
}
