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
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2 shrink-0">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
        <div className="mx-2 flex flex-1 items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
          </svg>
          <span className="font-mono text-[9px] text-muted-foreground truncate">
            demiurgos.vercel.app{src === "/" ? "" : src}
          </span>
        </div>
      </div>
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

/* ─── Chat bubble ───────────────────────────────────────────────────────────── */
function ChatBubble({
  role,
  children,
}: {
  role: "user" | "ai";
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "ai" && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <span className="text-primary text-[10px] font-bold">D</span>
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          role === "user"
            ? "bg-primary/15 text-foreground border border-primary/20"
            : "bg-card border border-border text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Carousel card ─────────────────────────────────────────────────────────── */
function CarouselCard({
  n,
  title,
  body,
  accent,
}: {
  n: number;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-[14px] border p-3 text-left ${
        accent
          ? "border-primary/40 bg-primary/6"
          : "border-border bg-card"
      }`}
      style={{ minWidth: 0 }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`font-mono text-[10px] font-bold ${accent ? "text-primary" : "text-muted-foreground"}`}>
          {n}/4
        </span>
        {accent && <span className="h-1 w-1 rounded-full bg-primary" />}
      </div>
      <p className={`font-semibold text-xs leading-snug ${accent ? "text-primary" : "text-foreground"}`}>
        {title}
      </p>
      <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ─── Image step (for S11/S12) ──────────────────────────────────────────────── */
function ImageStep({
  active,
  imgSrc,
  bullet,
}: {
  active: boolean;
  imgSrc: string;
  bullet: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[900px] items-center gap-8">
      <div className="flex-1 text-left">
        <div
          className={`flex items-start gap-3 rounded-2xl border p-5 transition-all duration-400 ${
            active ? "border-primary/40 bg-primary/6" : "border-border bg-card opacity-50"
          }`}
        >
          <span className="mt-0.5 text-primary">▸</span>
          <p className="text-[clamp(.95rem,2vw,1.1rem)] leading-relaxed">{bullet}</p>
        </div>
      </div>
      {active && (
        <div
          className="w-[420px] shrink-0 overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl"
          style={{ animation: "fadeSlideIn .38s cubic-bezier(.2,.6,.3,1) both" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover"
            style={{ maxHeight: 260 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Slides ─────────────────────────────────────────────────────────────────── */

function S01() {
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
              x.hi ? "border-primary/40 bg-primary/6" : "border-border bg-card"
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
      {/* Updated: más gancho */}
      <div className="mt-2 flex flex-col items-center gap-2">
        <p
          className="font-display text-[clamp(1.1rem,2.8vw,1.7rem)] font-extrabold tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
        >
          No es una skill. No es un GPT.<br />
          <span className="text-primary">Es TU voz. TU marca.</span><br />
          <span className="text-muted-foreground font-normal text-[.85em]">Eres TÚ haciendo contenido.</span>
        </p>
      </div>
    </div>
  );
}

function S05() {
  const parts = [
    {
      icon: "👤",
      phase: "Tu perfil",
      what: "Defines quién eres",
      detail: "Sector, experiencia, tono, audiencia objetivo, referentes y lo que te diferencia. Esta es la base que tiega todo lo demás.",
    },
    {
      icon: "📡",
      phase: "Tu contexto",
      what: "Lo que rodea a tu contenido",
      detail: "Tendencias actuales de tu sector, ideas en la frontera del conocimiento, lo que ya has publicado, tus archivos de Google Drive y tus redes.",
    },
    {
      icon: "⚡",
      phase: "La generación",
      what: "Propuestas listas para publicar",
      detail: "Idea + por qué encaja ahora + guion completo + formato recomendado. Todo en tu voz, no en la voz genérica de ChatGPT.",
    },
    {
      icon: "🔁",
      phase: "El ciclo",
      what: "Itera y mejora cada semana",
      detail: "Cada contenido que publicas se convierte en aprendizaje. El sistema se afina contigo a medida que usas la herramienta.",
    },
  ];
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Cómo <span className="text-primary">funciona</span> por dentro?
      </h2>
      <div className="grid w-full max-w-[900px] grid-cols-2 gap-3">
        {parts.map((p) => (
          <div key={p.phase} className="rounded-[18px] border border-border bg-card p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="font-semibold text-foreground text-sm">{p.phase}</p>
                <p className="font-mono text-[10px] text-primary">{p.what}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function S06() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué <span className="text-primary">genera?</span> Míralo en vivo.
      </h2>
      <div
        className="w-full max-w-[760px] rounded-[20px] border border-border bg-card overflow-hidden"
        style={{ boxShadow: "0 0 40px rgba(34,214,122,.09)" }}
      >
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="text-primary text-[10px] font-bold">D</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-xs text-foreground">Director Creativo · Demiurgos</p>
            <p className="font-mono text-[9px] text-primary">● online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-3 p-4">
          <ChatBubble role="user">
            Oye, ¿qué me recomiendas publicar esta semana sobre IA para startups?
          </ChatBubble>

          <ChatBubble role="ai">
            <p className="font-semibold mb-1">Propuesta: Carrusel para LinkedIn 🎯</p>
            <p className="text-muted-foreground text-[11px] mb-2">
              <strong className="text-foreground">«Cómo montar un Bootcamp de IA con Startup Institute en 4 semanas»</strong>
            </p>
            <p className="text-muted-foreground text-[11px] mb-3">
              Encaja ahora: el interés por IA aplicada a negocio está en máximos. Tu contexto en ecosistema startup lo hace auténtico, no genérico.
            </p>

            {/* Mini carousel preview */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              <CarouselCard
                n={1}
                title="El reto"
                body="Tomar un proyecto de 0 a producto funcional usando solo IA como copiloto."
                accent
              />
              <CarouselCard
                n={2}
                title="La metodología"
                body="Prompt → prototipo → iteración. Claude Code para código, Gamma para presentar, Vercel para desplegar."
              />
              <CarouselCard
                n={3}
                title="Lo que aprendes"
                body="No herramientas. Criterio. Cuándo confiar en la IA y cuándo dirigirla tú."
              />
              <CarouselCard
                n={4}
                title="El resultado"
                body="Un producto real, un proceso documentado y la confianza de que puedes repetirlo."
              />
            </div>

            <p className="font-mono text-[9px] text-muted-foreground">
              Formato: 4 slides · Tono: directo + inspiracional · CTA: «¿Quieres el template?»
            </p>
          </ChatBubble>
        </div>
      </div>
    </div>
  );
}

/* Slide 7 split en 3: Landing, Onboarding, Panel */
function S07a() {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">1</div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Fase 1 · Landing</p>
          <p className="font-mono text-xs text-muted-foreground">La primera impresión — qué es y por qué importa</p>
        </div>
      </div>
      <BrowserWindow src="/" label="Landing" className="w-full max-w-[900px] h-[420px]" />
      <p className="font-mono text-xs text-muted-foreground max-w-[560px] text-center">
        Sin login. Cualquiera puede ver qué hace Demiurgos, el propósito y el CTA de acceso.
      </p>
    </div>
  );
}

function S07b() {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">2</div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Fase 2 · Onboarding</p>
          <p className="font-mono text-xs text-muted-foreground">Tu perfil, tu voz, tu sector — el motor se calibra aquí</p>
        </div>
      </div>
      <BrowserWindow src="/onboarding" label="Onboarding" className="w-full max-w-[900px] h-[420px]" />
      <p className="font-mono text-xs text-muted-foreground max-w-[560px] text-center">
        Aquí defines quién eres. Experiencia, tono, audiencia, referentes. Una sola vez — el sistema lo recuerda.
      </p>
    </div>
  );
}

function S07c() {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">3</div>
        <div className="text-left">
          <p className="font-semibold text-primary">Fase 3 · Panel / Demo</p>
          <p className="font-mono text-xs text-muted-foreground">Tu director creativo activo — el producto en acción</p>
        </div>
      </div>
      <BrowserWindow src="/demo" label="Panel demo" className="w-full max-w-[900px] h-[420px]" />
      <p className="font-mono text-xs text-muted-foreground max-w-[560px] text-center">
        Sin login. Modo demo abierto para probar el chat y ver cómo responde el director creativo.
      </p>
    </div>
  );
}

function S08() {
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
            <strong>Chat con el Director Creativo</strong> — Conversación contextualizada con tu perfil e historial.
          </Feat>
          <Feat>
            <strong>Generación de propuestas</strong> — Ideas + por qué ahora + guion, listas para publicar.
          </Feat>
          <Feat>
            <strong>Conexión y subida de archivos</strong> — Google Drive, PDFs, notas propias como fuente de inspiración.
          </Feat>
          <Feat>
            <strong>Ideas frontera</strong> — Contenido en la frontera del conocimiento de tu sector.
          </Feat>
        </ul>
        <BrowserWindow src="/demo" label="Chat" className="h-[320px]" />
      </div>
    </div>
  );
}

function S09() {
  return (
    <div className="flex w-full max-w-[960px] flex-col items-center gap-5">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Y también <span className="text-primary">esto.</span>
      </h2>
      <div className="grid w-full grid-cols-[1.4fr_1fr] gap-5 items-start">
        <BrowserWindow src="/demo" label="Propuestas" className="h-[320px]" />
        <ul className="flex flex-col gap-3 text-left">
          <Feat>
            <strong>Perfil contextual</strong> — Tu tono, sector y audiencia en cada generación.
          </Feat>
          <Feat>
            <strong>Selección y scraping de redes</strong> — Conecta LinkedIn o X; analiza lo que ya has publicado.
          </Feat>
          <Feat>
            <strong>Tendencias en tiempo real</strong> — Lo que está pasando en tu sector, integrado como contexto.
          </Feat>
          <Feat>
            <strong>Ajustes de coste</strong> — Control granular sobre qué modelos y cuánto gastas.
          </Feat>
        </ul>
      </div>
    </div>
  );
}

function S10() {
  const tools = [
    { e: "✦", n: "Claude Code", hi: true },
    { e: "▲", n: "Vercel", hi: true },
    { e: "🐙", n: "GitHub", hi: true },
    { e: "🗄️", n: "Supabase", hi: true },
    { e: "✦", n: "Claude Cowork" },
    { e: "🎨", n: "Claude Design" },
    { e: "🤖", n: "ChatGPT" },
    { e: "☁️", n: "Google Cloud" },
    { e: "📊", n: "TrendMCP" },
    { e: "🕷️", n: "Apify" },
    { e: "🧩", n: "Codex" },
    { e: "⚡", n: "…y más" },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        El <span className="text-primary">stack.</span>
      </h2>
      <p className="font-mono text-xs text-muted-foreground -mt-3">
        Los cuatro pilares principales + el ecosistema completo
      </p>
      <div className="grid w-full max-w-[900px] grid-cols-4 gap-2.5">
        {tools.map((t) => (
          <StackBadge key={t.n} icon={t.e} name={t.n} hi={t.hi} />
        ))}
      </div>
    </div>
  );
}

/* ─── S11 with animated image steps ──────────────────────────────────────────── */
function S11({ step }: { step: number }) {
  const steps = [
    {
      img: "/presentacion/slide11a.png",
      bullet: (
        <>
          <strong>Construir el prompt</strong> — Primero se levantó un GPT para diseñar un prompt sólido que definiera el comportamiento del director creativo. El prompt es la arquitectura invisible de todo.
        </>
      ),
    },
    {
      img: "/presentacion/slide11b.png",
      bullet: (
        <>
          <strong>Levantar el proyecto</strong> — Con el prompt como base, se inició la arquitectura completa con Claude Code: Next.js, Supabase, auth, gateway de IA y API.
        </>
      ),
    },
    {
      img: "/presentacion/slide11c.png",
      bullet: (
        <>
          <strong>Levantar el proyecto</strong> (cont.) — Deploy automático en Vercel desde GitHub, variables de entorno, migraciones de base de datos. Todo conectado.
        </>
      ),
    },
    {
      img: "/presentacion/slide11d.png",
      bullet: (
        <>
          <strong>Iterar (y pelearse con la IA)</strong> — Debugging constante, decisiones en caliente y aprendizaje forzado de todo lo que hacía falta. El producto real sale de aquí.
        </>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Cómo se <span className="text-primary">construyó.</span>
      </h2>
      <div className="flex w-full flex-col gap-3 items-center">
        {steps.map((s, i) => (
          <ImageStep key={i} active={i === step} imgSrc={s.img} bullet={s.bullet} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {step + 1} / {steps.length} · navega con → para avanzar
      </p>
    </div>
  );
}

/* ─── S12 with animated image steps ──────────────────────────────────────────── */
function S12({ step }: { step: number }) {
  const steps = [
    {
      img: "/presentacion/slide12a.png",
      emoji: "🔧",
      bullet: (
        <>
          <strong className="text-brand-amber">Bloqueos técnicos</strong> — Merges rotos, pull requests conflictivos, builds que fallan sin razón aparente. El flujo se rompe y hay que diagnosticarlo en caliente.
        </>
      ),
    },
    {
      img: "/presentacion/slide12b.png",
      emoji: "🤯",
      bullet: (
        <>
          <strong className="text-brand-amber">Decisiones en caliente</strong> — ¿Cambio de arquitectura a mitad? ¿Descarto la feature? Con el reloj corriendo y el contexto de la IA a medias.
        </>
      ),
    },
    {
      img: "/presentacion/slide12c.png",
      emoji: "💸",
      bullet: (
        <>
          <strong className="text-brand-amber">Control de costes</strong> — Cada prompt cuesta. Aprender cuándo es eficiente y cuándo estás quemando dinero es parte del aprendizaje.
        </>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">La parte que nadie cuenta</p>
      <h2
        className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        La <span className="text-primary">pelea</span> con la IA.
      </h2>
      <div className="flex w-full flex-col gap-3 items-center">
        {steps.map((s, i) => (
          <ImageStep key={i} active={i === step} imgSrc={s.img} bullet={s.bullet} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {step + 1} / {steps.length} · navega con → para avanzar
      </p>
    </div>
  );
}

function S13() {
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
          <span key={t} className="rounded-full border border-primary/30 bg-primary/6 px-3 py-1 font-mono text-xs text-primary">
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
  /* Interpretación visual del límite de uso alcanzado: terminal real */
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Fin de la sesión
      </p>

      {/* Terminal card — inspired by the actual usage limit screen */}
      <div
        className="w-full max-w-[560px] rounded-[20px] border border-primary/20 bg-[#050a07] overflow-hidden"
        style={{ boxShadow: "0 0 50px rgba(34,214,122,.10)" }}
      >
        {/* Terminal chrome bar */}
        <div className="flex items-center gap-1.5 border-b border-border/40 bg-[#0a100c] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-amber/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
          <span className="mx-auto font-mono text-[9px] text-muted-foreground/50">demiurgos — bootcamp@ia ~ bash</span>
        </div>

        <div className="px-5 py-4 font-mono text-sm text-left">
          <p className="text-muted-foreground/60">demiurgos@bootcamp ~ $</p>
          <br />
          <p className="text-primary">⠿ Generando propuesta de contenido…</p>
          <p className="text-primary">⠿ Conectando con tendencias del sector…</p>
          <p className="text-primary">⠿ Analizando perfil de usuario…</p>
          <br />
          {/* Usage limit error — referencing the actual screen shown */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 mb-2">
            <p className="text-destructive font-bold">⊘  Límite de uso alcanzado</p>
            <p className="text-destructive/80 text-xs mt-0.5">Se restablece a las 22:50 · UsageLimitError [429]</p>
          </div>
          <div className="rounded-lg border border-brand-amber/20 bg-brand-amber/5 px-3 py-2 mb-3">
            <p className="text-brand-amber text-xs">💳  Créditos gastados: <span className="font-bold">66,94 €</span> de 100 €/mes</p>
            <p className="text-brand-amber/70 text-[10px] mt-0.5">Saldo actual: 3,92 € · Recarga automática: deshabilitada</p>
          </div>
          <p className="text-muted-foreground text-xs">Retry in: 3600s</p>
          <p className="text-muted-foreground text-xs">
            Session cost: $<span className="text-brand-amber">mucho</span>
          </p>
          <br />
          <p className="text-primary">
            $ <BlinkCursor />
          </p>
        </div>
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
// Slides with sub-steps use a "steps" count; the deck advances sub-steps before moving to next slide.
type SlideEntry =
  | { component: React.FC; note: string; subSteps?: undefined }
  | { component: React.FC<{ step: number }>; note: string; subSteps: number };

const SLIDES: SlideEntry[] = [
  { component: S01, note: "Arranca sin presentarte. La frase lo dice todo." },
  { component: S02, note: "Dolor reconocible. No nombres el producto todavía." },
  { component: S03, note: "Pausa de 3s. Dejar que aterrice." },
  { component: S04, note: "Primer momento wow. Nombra Demiurgos. 'No es un GPT, es TU voz.'" },
  { component: S05, note: "Explica las 4 partes: perfil, contexto, generación, ciclo." },
  { component: S06, note: "Lee el chat en voz alta. Muestra el carrusel propuesto." },
  { component: S07a, note: "Fase 1 — Landing. Muestra el iframe real sin login." },
  { component: S07b, note: "Fase 2 — Onboarding. Aquí se define la voz del usuario." },
  { component: S07c, note: "Fase 3 — Panel demo. El producto en acción, sin login." },
  { component: S08, note: "Señala el chat en el iframe. No leas la lista." },
  { component: S09, note: "Termina con ajustes de costes. Curiosidad técnica." },
  { component: S10, note: "Destaca Claude Code, Vercel, GitHub y Supabase como los 4 pilares." },
  { component: S11, note: "Construir el prompt → Levantar → Iterar. Imágenes reales.", subSteps: 4 },
  { component: S12, note: "Bloqueos → Decisiones → Costes. La parte que nadie cuenta.", subSteps: 3 },
  { component: S13, note: "'Nada de esto sabía antes de empezar.'" },
  { component: S14, note: "Pausa larga. Deja que respire." },
  { component: S15, note: "Terminal con el límite real. Reír. Gracias. Preguntas." },
];

/* ─── Main deck component ───────────────────────────────────────────────────── */
export function PresentacionDeck() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [subStep, setSubStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "bwd">("fwd");
  const [animating, setAnimating] = useState(false);

  const total = SLIDES.length;

  const advance = useCallback(() => {
    const current = SLIDES[slideIdx];
    if (current.subSteps && subStep < current.subSteps - 1) {
      setSubStep((s) => s + 1);
      return;
    }
    if (slideIdx >= total - 1) return;
    setDir("fwd");
    setAnimating(true);
    setTimeout(() => {
      setSlideIdx((i) => i + 1);
      setSubStep(0);
      setAnimating(false);
    }, 320);
  }, [slideIdx, subStep, total]);

  const retreat = useCallback(() => {
    if (subStep > 0) {
      setSubStep((s) => s - 1);
      return;
    }
    if (slideIdx <= 0) return;
    setDir("bwd");
    setAnimating(true);
    setTimeout(() => {
      setSlideIdx((i) => i - 1);
      setSubStep(0);
      setAnimating(false);
    }, 320);
  }, [slideIdx, subStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); advance(); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); retreat(); }
      if (e.key === "f" || e.key === "F") {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
      }
      if (e.key === "Home") { setSlideIdx(0); setSubStep(0); }
      if (e.key === "End") { setSlideIdx(total - 1); setSubStep(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, retreat, total]);

  const [touchX, setTouchX] = useState(0);

  const entry = SLIDES[slideIdx];
  const speakerNote = entry.note;
  const progressPct = ((slideIdx + 1) / total) * 100;

  const SlideEl = entry.subSteps
    ? () => (entry.component as React.FC<{ step: number }>)({ step: subStep })
    : () => (entry.component as React.FC)({});

  return (
    <>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFwd {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInBwd {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-enter-fwd { animation: slideInFwd .38s cubic-bezier(.2,.6,.3,1) both; }
        .slide-enter-bwd { animation: slideInBwd .38s cubic-bezier(.2,.6,.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .slide-enter-fwd, .slide-enter-bwd, [style*="fadeSlideIn"] { animation: none; }
        }
      `}</style>

      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-background"
        style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 50) dx < 0 ? advance() : retreat();
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a, button, input, select, iframe")) return;
          e.clientX > window.innerWidth / 2 ? advance() : retreat();
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 10%, rgba(34,214,122,.07) 0%, transparent 60%)" }}
        />

        {/* Slide area */}
        <main className="flex flex-1 items-center justify-center overflow-hidden px-[clamp(1.5rem,8vw,8rem)] py-[clamp(2rem,5vh,4rem)]">
          <div
            key={`${slideIdx}-${subStep}`}
            className={`flex w-full items-center justify-center ${
              animating ? "" : dir === "fwd" ? "slide-enter-fwd" : "slide-enter-bwd"
            }`}
          >
            <SlideEl />
          </div>
        </main>

        {/* Progress bar */}
        <div className="relative h-[3px] w-full bg-border">
          <div
            className="h-full bg-primary"
            style={{
              width: `${progressPct}%`,
              boxShadow: "0 0 10px var(--color-primary)",
              transition: "width .4s cubic-bezier(.2,.6,.3,1)",
            }}
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border/40 bg-background/80 px-4 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {["←", "→"].map((k) => (
              <kbd key={k} className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground">
                {k}
              </kbd>
            ))}
            <span>navegar</span>
            <span className="mx-1 text-border">|</span>
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground">F</kbd>
            <span>pantalla completa</span>
          </div>

          <p className="hidden max-w-[420px] truncate text-center font-mono text-[10px] text-muted-foreground/60 sm:block">
            💬 {speakerNote}
          </p>

          <p className="font-mono text-[10px] text-muted-foreground">
            {slideIdx + 1} / {total}
            {entry.subSteps ? ` · ${subStep + 1}/${entry.subSteps}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}
