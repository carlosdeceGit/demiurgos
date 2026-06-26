"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Logo } from "@/components/landing/logo";

/* ════════════════════════════════════════════════════════════
   PRIMITIVOS COMPARTIDOS
════════════════════════════════════════════════════════════ */

/** Ventana de browser con iframe clickable */
function BrowserWindow({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[16px] border border-border bg-card ${className}`}
      style={{ boxShadow: "0 0 60px rgba(34,214,122,.10), 0 24px 48px rgba(0,0,0,.5)" }}
    >
      {/* Chrome bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-amber/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
        <div className="mx-2 flex flex-1 items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-2 py-0.5">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground" aria-hidden>
            <circle cx="12" cy="12" r="3" /><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
          </svg>
          <span className="truncate font-mono text-[9px] text-muted-foreground">
            demiurgos.vercel.app{src === "/" ? "" : src}
          </span>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <iframe src={src} title={label} className="h-full w-full border-0" loading="lazy" />
      </div>
    </div>
  );
}

/** Pildora semántica */
function Pill({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] ${
      dim
        ? "border-border text-muted-foreground"
        : "border-primary/25 bg-primary/8 text-primary"
    }`}>
      {!dim && <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />}
      {children}
    </span>
  );
}

/** Item de feature con bullet verde */
function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[clamp(.9rem,1.6vw,1rem)] leading-snug">
      <span className="mt-0.5 shrink-0 text-primary">▸</span>
      <span className="text-foreground">{children}</span>
    </li>
  );
}

/** Badge de stack */
function StackBadge({ icon, name, hi }: { icon: string; name: string; hi?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 font-mono text-xs transition-all ${
      hi
        ? "border-primary/35 bg-primary/6 text-primary shadow-[0_0_20px_rgba(34,214,122,.12)]"
        : "border-border bg-card text-muted-foreground"
    }`}>
      <span className="text-2xl leading-none">{icon}</span>
      <span className="text-center leading-tight">{name}</span>
    </div>
  );
}

/** Slide de imagen individual: ocupa casi toda la pantalla */
function ImageSlide({
  stepLabel,
  title,
  caption,
  imgSrc,
  accent,
}: {
  stepLabel: string;
  title: string;
  caption?: string;
  imgSrc: string;
  accent?: string;
}) {
  return (
    <div className="flex w-full max-w-[960px] flex-col items-center gap-4">
      {/* Header compacto */}
      <div className="flex w-full items-center justify-between">
        <Pill dim>{stepLabel}</Pill>
        {accent && <Pill>{accent}</Pill>}
      </div>

      <h2
        className="w-full text-left font-display text-[clamp(1.4rem,3.2vw,2.2rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        {title}
      </h2>

      {/* Imagen grande */}
      <div
        className="w-full overflow-hidden rounded-[16px] border border-border"
        style={{ boxShadow: "0 0 50px rgba(34,214,122,.10), 0 20px 40px rgba(0,0,0,.6)" }}
      >
        <Image
          src={imgSrc}
          alt={title}
          width={1920}
          height={1080}
          className="h-auto w-full object-cover"
          style={{ maxHeight: "52vh", objectPosition: "top" }}
          priority
          unoptimized
        />
      </div>

      {caption && (
        <p className="w-full font-mono text-xs text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}

/** Chat bubble */
function ChatBubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "ai" && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <span className="text-[10px] font-bold text-primary">D</span>
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        role === "user"
          ? "border border-primary/20 bg-primary/12 text-foreground"
          : "border border-border bg-card text-foreground"
      }`}>
        {children}
      </div>
    </div>
  );
}

/** Tarjeta de carrusel */
function CarouselCard({ n, title, body, accent }: { n: number; title: string; body: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[12px] border p-3 text-left ${
      accent ? "border-primary/40 bg-primary/6" : "border-border bg-card/60"
    }`}>
      <span className={`font-mono text-[9px] font-bold ${accent ? "text-primary" : "text-muted-foreground"}`}>{n}/4</span>
      <p className={`text-xs font-semibold leading-snug ${accent ? "text-primary" : "text-foreground"}`}>{title}</p>
      <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SLIDES
════════════════════════════════════════════════════════════ */

function S01() {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <Pill>BOOTCAMP IA · 2026</Pill>
      <h1
        className="font-display text-[clamp(2.8rem,7.5vw,6rem)] font-extrabold leading-[1.02] tracking-[-0.048em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Bienvenidos a la era<br />de <span className="text-primary">TU</span> marca personal.
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
        Crear contenido<br /><span className="text-primary">no es fácil.</span>
      </h2>
      <div className="grid w-full max-w-[820px] grid-cols-3 gap-3">
        {items.map((x) => (
          <div key={x.t} className={`rounded-[18px] border p-4 text-left ${x.hi ? "border-primary/40 bg-primary/6" : "border-border bg-card"}`}>
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
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">El verdadero bloqueo</p>
      <blockquote
        className="max-w-[720px] font-display text-[clamp(1.4rem,3.8vw,2.4rem)] font-bold leading-[1.2] tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        No nos falta <span className="text-primary">talento.</span><br />
        Nos falta <span className="text-primary">tiempo,</span><br />
        <span className="text-primary">método</span> y <span className="text-primary">consistencia</span><br />
        para hacerlo bien de forma sostenida.
      </blockquote>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="text-muted-foreground">Y eso tiene solución.</p>
    </div>
  );
}

function S04() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">La solución</p>
      <Logo size={64} />
      <h1
        className="font-display font-extrabold leading-none tracking-[-0.055em] text-primary text-[clamp(4rem,10vw,7.5rem)]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Demiurgos
      </h1>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="max-w-[52ch] text-[clamp(1rem,2.2vw,1.35rem)] leading-relaxed text-muted-foreground">
        Tu director creativo personal, construido con IA, que trabaja con tu voz, tus temas y tu contexto.
      </p>
      <div
        className="mt-1 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4"
        style={{ boxShadow: "0 0 30px rgba(34,214,122,.10)" }}
      >
        <p
          className="font-display text-[clamp(1rem,2.4vw,1.5rem)] font-extrabold leading-snug tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
        >
          No es una skill. No es un GPT.<br />
          <span className="text-primary">Es TU voz. TU marca.</span><br />
          <span className="text-[.85em] font-normal text-muted-foreground">Eres TÚ haciendo contenido.</span>
        </p>
      </div>
    </div>
  );
}

function S05() {
  const parts = [
    { icon: "👤", phase: "Tu perfil", what: "Defines quién eres", detail: "Sector, experiencia, tono, audiencia, referentes y lo que te diferencia. La base que calibra todo lo demás." },
    { icon: "📡", phase: "Tu contexto", what: "Lo que rodea tu contenido", detail: "Tendencias actuales, ideas en la frontera, lo que ya publicaste, tus archivos de Drive y tus redes." },
    { icon: "⚡", phase: "La generación", what: "Propuestas listas para publicar", detail: "Idea + por qué ahora + guion completo. Todo en tu voz, no en la voz genérica de ChatGPT." },
    { icon: "🔁", phase: "El ciclo", what: "Mejora semana a semana", detail: "Cada contenido que publicas se convierte en aprendizaje. El sistema se afina contigo." },
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
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{p.phase}</p>
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
        className="font-display text-[clamp(1.6rem,4vw,2.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué <span className="text-primary">genera?</span> Míralo en vivo.
      </h2>
      <div
        className="w-full max-w-[780px] overflow-hidden rounded-[20px] border border-border bg-card"
        style={{ boxShadow: "0 0 40px rgba(34,214,122,.09)" }}
      >
        <div className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="text-[10px] font-bold text-primary">D</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Director Creativo · Demiurgos</p>
            <p className="font-mono text-[9px] text-primary">● online</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <ChatBubble role="user">Oye, ¿qué me recomiendas publicar esta semana sobre IA para startups?</ChatBubble>
          <ChatBubble role="ai">
            <p className="mb-1 font-semibold">Propuesta: Carrusel para LinkedIn 🎯</p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              <strong className="text-foreground">«Cómo montar un Bootcamp de IA con Startup Institute en 4 semanas»</strong>
            </p>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Encaja ahora: el interés por IA aplicada a negocio está en máximos. Tu contexto en ecosistema startup lo hace auténtico.
            </p>
            <div className="mb-2 grid grid-cols-4 gap-1.5">
              <CarouselCard n={1} title="El reto" body="De 0 a producto funcional usando IA como copiloto." accent />
              <CarouselCard n={2} title="La metodología" body="Prompt → prototipo → iteración. Claude Code, Gamma, Vercel." />
              <CarouselCard n={3} title="Lo que aprendes" body="Criterio. Cuándo confiar en la IA y cuándo dirigirla." />
              <CarouselCard n={4} title="El resultado" body="Producto real, proceso documentado, confianza." />
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">4 slides · Tono: directo + inspiracional · CTA: «¿Quieres el template?»</p>
          </ChatBubble>
        </div>
      </div>
    </div>
  );
}

/* ── Fases: iframes grandes ─────────────────────────────────────────────── */
function S07a() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <Pill dim>Fase 1 de 3</Pill>
        <Pill>Landing</Pill>
      </div>
      <h2
        className="w-full font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        La primera impresión — <span className="text-primary">sin login</span>
      </h2>
      <BrowserWindow src="/home-demo" label="Landing" className="w-full h-[520px]" />
    </div>
  );
}

function S07b() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <Pill dim>Fase 2 de 3</Pill>
        <Pill>Onboarding</Pill>
      </div>
      <h2
        className="w-full font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Tu perfil, tu voz, tu sector — <span className="text-primary">una sola vez</span>
      </h2>
      <BrowserWindow src="/onboarding-demo" label="Onboarding" className="w-full h-[520px]" />
    </div>
  );
}

function S07c() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <Pill dim>Fase 3 de 3</Pill>
        <Pill>Panel demo</Pill>
      </div>
      <h2
        className="w-full font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        El director creativo en acción — <span className="text-primary">pruébalo</span>
      </h2>
      <BrowserWindow src="/demo" label="Panel demo" className="w-full h-[520px]" />
    </div>
  );
}

/* ── Demo con texto lateral (S08/S09) ──────────────────────────────────── */
function S08() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h2
        className="w-full font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        ¿Qué puedes <span className="text-primary">hacer?</span>
      </h2>
      <div className="grid w-full grid-cols-[1fr_2.6fr] gap-4 items-stretch">
        <ul className="flex flex-col justify-center gap-3 text-left">
          <Feat><strong>Chat con el Director Creativo</strong> — conversación contextualizada con tu perfil e historial.</Feat>
          <Feat><strong>Generación de propuestas</strong> — idea + por qué ahora + guion, listos para publicar.</Feat>
          <Feat><strong>Subida de archivos</strong> — Google Drive, PDFs, notas como fuente de inspiración.</Feat>
          <Feat><strong>Ideas frontera</strong> — contenido en la frontera del conocimiento de tu sector.</Feat>
        </ul>
        <BrowserWindow src="/demo" label="Demo — qué puedes hacer" className="h-[480px]" />
      </div>
    </div>
  );
}

function S09() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h2
        className="w-full font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Y también <span className="text-primary">esto.</span>
      </h2>
      <div className="grid w-full grid-cols-[2.6fr_1fr] gap-4 items-stretch">
        <BrowserWindow src="/demo" label="Demo — más funciones" className="h-[480px]" />
        <ul className="flex flex-col justify-center gap-3 text-left">
          <Feat><strong>Perfil contextual</strong> — tu tono, sector y audiencia en cada generación.</Feat>
          <Feat><strong>Scraping de redes</strong> — conecta LinkedIn o X y analiza lo que ya publicaste.</Feat>
          <Feat><strong>Tendencias en tiempo real</strong> — lo que pasa en tu sector, integrado como contexto.</Feat>
          <Feat><strong>Ajustes de coste</strong> — elige qué modelo IA usa para cada tarea y cuánto gastas.</Feat>
        </ul>
      </div>
    </div>
  );
}

/* ── Stack ──────────────────────────────────────────────────────────────── */
function S10() {
  const tools = [
    { e: "⌨️", n: "Claude Code", hi: true },
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
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h2
        className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        El <span className="text-primary">stack.</span>
      </h2>
      <p className="font-mono text-xs text-muted-foreground -mt-2">
        4 pilares principales · el resto son piezas del ecosistema
      </p>
      <div className="grid w-full max-w-[920px] grid-cols-4 gap-3">
        {tools.map((t) => (
          <StackBadge key={t.n} icon={t.e} name={t.n} hi={t.hi} />
        ))}
      </div>
    </div>
  );
}

/* ── S11: 4 slides independientes (una imagen por slide) ────────────────── */
function S11a() {
  return (
    <ImageSlide
      stepLabel="Cómo se construyó · 1 de 4"
      title="Construir el prompt"
      caption="Primero un GPT para diseñar el prompt que define el director creativo. El prompt es la arquitectura invisible de todo."
      imgSrc="/presentacion/slide11a.png"
      accent="El prompt como arquitectura"
    />
  );
}

function S11b() {
  return (
    <ImageSlide
      stepLabel="Cómo se construyó · 2 de 4"
      title="Levantar el proyecto"
      caption="Claude Code + Next.js + Supabase + auth + gateway de IA multi-modelo. De cero a proyecto funcional."
      imgSrc="/presentacion/slide11b.png"
      accent="Claude Code + Next.js + Supabase"
    />
  );
}

function S11c() {
  return (
    <ImageSlide
      stepLabel="Cómo se construyó · 3 de 4"
      title="Deploy y conexiones"
      caption="Vercel + GitHub, variables de entorno, migraciones de base de datos. Push = deploy automático en producción."
      imgSrc="/presentacion/slide11c.png"
      accent="Vercel + GitHub"
    />
  );
}

function S11d() {
  return (
    <ImageSlide
      stepLabel="Cómo se construyó · 4 de 4"
      title="Iterar (y pelearse con la IA)"
      caption="Debugging constante, decisiones en caliente y aprendizaje forzado de todo lo necesario. El producto real sale de aquí."
      imgSrc="/presentacion/slide11d.png"
      accent="El ciclo real"
    />
  );
}

/* ── S12: 3 slides independientes (una imagen por slide) ────────────────── */
function S12a() {
  return (
    <ImageSlide
      stepLabel="La pelea con la IA · 1 de 3"
      title="Bloqueos técnicos"
      caption="Merges rotos, pull requests conflictivos, builds que fallan sin razón aparente. Esto pasa. No es fracaso, es el proceso."
      imgSrc="/presentacion/slide12a.png"
      accent="🔧 Merges · builds · conflictos"
    />
  );
}

function S12b() {
  return (
    <ImageSlide
      stepLabel="La pelea con la IA · 2 de 3"
      title="Decisiones en caliente"
      caption="¿Cambio la arquitectura ahora? ¿Descarto la feature? Con el reloj corriendo y el contexto de la IA a medias."
      imgSrc="/presentacion/slide12b.png"
      accent="🤯 Con el reloj corriendo"
    />
  );
}

function S12c() {
  return (
    <ImageSlide
      stepLabel="La pelea con la IA · 3 de 3"
      title="Control de costes"
      caption="Cada prompt cuesta. Aprender cuándo es eficiente y cuándo estás quemando dinero es parte del aprendizaje."
      imgSrc="/presentacion/slide12c.png"
      accent="💸 Cada prompt cuesta"
    />
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
          <span key={t} className="rounded-full border border-primary/30 bg-primary/6 px-3 py-1 font-mono text-xs text-primary">{t}</span>
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
        className="max-w-[720px] font-display text-[clamp(1.6rem,4vw,2.8rem)] font-bold leading-[1.2] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Demiurgos no es solo<br /><span className="text-primary">una herramienta.</span>
      </blockquote>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <blockquote
        className="max-w-[640px] font-display text-[clamp(1.2rem,3vw,2rem)] font-bold leading-[1.25] tracking-[-0.035em] text-muted-foreground"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
      >
        Es aprender a construir <span className="text-primary">con IA</span><br />mientras construyes.
      </blockquote>
      <Pill>El proceso es el producto.</Pill>
    </div>
  );
}

/* ── SPrompt: alerta — esta presentación también fue prompteada ─────────── */
function SPrompt() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3">
        <Pill>⚠️ Alerta</Pill>
        <span
          className="font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-[-0.035em]"
          style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}
        >
          Esta presentación también ha sido{" "}
          <span className="text-primary">prompteada.</span>
        </span>
      </div>
      <div
        className="w-full max-w-[860px] overflow-hidden rounded-[16px] border border-border"
        style={{ boxShadow: "0 0 60px rgba(34,214,122,.08), 0 24px 48px rgba(0,0,0,.6)" }}
      >
        <Image
          src="/presentacion/slideprompt.png"
          alt="El prompt de esta presentación"
          width={1680}
          height={1050}
          className="h-auto w-full object-cover"
          style={{ maxHeight: "68vh" }}
          priority
          unoptimized
        />
      </div>
    </div>
  );
}

/* ── S15: solo la imagen ────────────────────────────────────────────────── */
function S15() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="w-full max-w-[860px] overflow-hidden rounded-[16px] border border-border"
        style={{ boxShadow: "0 0 60px rgba(34,214,122,.08), 0 24px 48px rgba(0,0,0,.6)" }}
      >
        <Image
          src="/presentacion/slide15.png"
          alt="Fin de la sesión"
          width={1680}
          height={1050}
          className="h-auto w-full object-cover"
          style={{ maxHeight: "72vh" }}
          priority
          unoptimized
        />
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Gracias. Preguntas bienvenidas. <span className="text-primary">Demiurgos</span> sigue iterando.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   REGISTRO DE SLIDES
════════════════════════════════════════════════════════════ */
const SLIDES: { component: React.FC; note: string }[] = [
  { component: S01,  note: "Arranca sin presentarte. La frase lo dice todo." },
  { component: S02,  note: "Dolor reconocible. No nombres el producto todavía." },
  { component: S03,  note: "Pausa de 3s. Deja que aterrice." },
  { component: S04,  note: "Primer wow. Nombra Demiurgos. 'No es un GPT, es TU voz.'" },
  { component: S05,  note: "4 partes: perfil, contexto, generación, ciclo." },
  { component: S06,  note: "Lee el chat en voz alta. Señala el mini-carrusel." },
  { component: S07a, note: "Fase 1 — Landing real. Sin login." },
  { component: S07b, note: "Fase 2 — Onboarding real. Aquí se define la voz." },
  { component: S07c, note: "Fase 3 — Panel demo real. Úsalo en vivo si puedes." },
  { component: S08,  note: "Señala el iframe. 'Probadlo ahora mismo.'" },
  { component: S09,  note: "Termina con ajustes de costes. Curiosidad técnica." },
  { component: S10,  note: "4 pilares en verde. El resto en gris." },
  { component: S11a, note: "El prompt como arquitectura invisible." },
  { component: S11b, note: "De cero a proyecto funcional con Claude Code." },
  { component: S11c, note: "Push = deploy automático. GitHub + Vercel." },
  { component: S11d, note: "El producto real sale de iterar, no de planificar." },
  { component: S12a, note: "Bloqueos técnicos. Normalízalos." },
  { component: S12b, note: "Decisiones en caliente. Con el reloj corriendo." },
  { component: S12c, note: "Cada prompt cuesta. Aprende cuándo merece la pena." },
  { component: S13,  note: "'Nada de esto sabía antes de empezar.'" },
  { component: S14,     note: "Pausa larga. Deja que respire." },
  { component: SPrompt, note: "Sorpresa: esta propia presentación fue generada con Claude Code. Señala el prompt." },
  { component: S15,     note: "La imagen real. Reír. Gracias. Preguntas." },
];

/* ════════════════════════════════════════════════════════════
   DECK PRINCIPAL
════════════════════════════════════════════════════════════ */
export function PresentacionDeck() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<"fwd" | "bwd">("fwd");
  const [animating, setAnimating] = useState(false);
  const [touchX, setTouchX] = useState(0);
  const total = SLIDES.length;

  const goto = useCallback(
    (n: number) => {
      if (animating || n < 0 || n >= total) return;
      setDir(n > current ? "fwd" : "bwd");
      setAnimating(true);
      setTimeout(() => { setCurrent(n); setAnimating(false); }, 320);
    },
    [animating, current, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); goto(current + 1); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); goto(current - 1); }
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
      if (e.key === "Home") goto(0);
      if (e.key === "End") goto(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goto, total]);

  const SlideComponent = SLIDES[current].component;
  const note = SLIDES[current].note;
  const pct = ((current + 1) / total) * 100;

  return (
    <>
      <style>{`
        @keyframes slideInFwd  { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:none } }
        @keyframes slideInBwd  { from { opacity:0; transform:translateY(-22px) } to { opacity:1; transform:none } }
        .slide-fwd { animation: slideInFwd .36s cubic-bezier(.2,.6,.3,1) both }
        .slide-bwd { animation: slideInBwd .36s cubic-bezier(.2,.6,.3,1) both }
        @media (prefers-reduced-motion:reduce) { .slide-fwd,.slide-bwd { animation:none } }
      `}</style>

      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-background"
        style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 50) goto(dx < 0 ? current + 1 : current - 1);
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a,button,input,select,textarea,iframe")) return;
          goto(e.clientX > window.innerWidth / 2 ? current + 1 : current - 1);
        }}
      >
        {/* Glow ambiente */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 55% 45% at 85% 8%, rgba(34,214,122,.07) 0%, transparent 60%)" }} />

        {/* Área de slide */}
        <main className="flex flex-1 items-center justify-center overflow-hidden px-[clamp(2rem,7vw,7rem)] py-[clamp(1.5rem,4vh,3.5rem)]">
          <div
            key={current}
            className={`flex w-full max-w-[1100px] items-center justify-center ${animating ? "" : dir === "fwd" ? "slide-fwd" : "slide-bwd"}`}
          >
            <SlideComponent />
          </div>
        </main>

        {/* Barra de progreso */}
        <div className="relative h-[3px] w-full bg-border/40">
          <div className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, boxShadow: "0 0 8px var(--color-primary)" }} />
        </div>

        {/* Barra inferior */}
        <div className="flex items-center justify-between border-t border-border/30 bg-background/80 px-5 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {["←", "→"].map((k) => (
              <kbd key={k} className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px]">{k}</kbd>
            ))}
            <span>navegar</span>
            <span className="mx-1 opacity-30">|</span>
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px]">F</kbd>
            <span>fullscreen</span>
          </div>
          <p className="hidden max-w-[420px] truncate font-mono text-[10px] text-muted-foreground/50 sm:block">💬 {note}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{current + 1} / {total}</p>
        </div>
      </div>
    </>
  );
}
