"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/landing/logo";
import Image from "next/image";

/* ─── Browser window wrapper (iframes usables/clickables) ──────────────────── */
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
      {/* iframe clickable — sin pointer-events: none */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={src}
          title={label}
          className="h-full w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ─── Pill ──────────────────────────────────────────────────────────────────── */
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
        hi ? "border-primary/40 bg-primary/6 text-primary" : "border-border bg-card text-muted-foreground"
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      {name}
    </div>
  );
}

/* ─── Chat bubble ───────────────────────────────────────────────────────────── */
function ChatBubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
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
function CarouselCard({ n, title, body, accent }: { n: number; title: string; body: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[12px] border p-3 text-left ${accent ? "border-primary/40 bg-primary/6" : "border-border bg-card/60"}`}>
      <span className={`font-mono text-[9px] font-bold ${accent ? "text-primary" : "text-muted-foreground"}`}>{n}/4</span>
      <p className={`font-semibold text-xs leading-snug ${accent ? "text-primary" : "text-foreground"}`}>{title}</p>
      <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ─── ImageStep: bullet activo muestra imagen a la derecha ──────────────────── */
function ImageStep({ active, imgSrc, bullet }: { active: boolean; imgSrc: string; bullet: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[860px] items-center gap-6">
      {/* Bullet */}
      <div className={`flex flex-1 items-start gap-3 rounded-2xl border p-4 transition-all duration-300 ${
        active ? "border-primary/40 bg-primary/6" : "border-border bg-card/40 opacity-45"
      }`}>
        <span className="mt-0.5 text-primary shrink-0">▸</span>
        <p className="text-[clamp(.88rem,1.6vw,1rem)] leading-relaxed">{bullet}</p>
      </div>
      {/* Imagen — solo slide activa */}
      <div className={`w-[380px] shrink-0 transition-all duration-400 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ animation: active ? "fadeSlideIn .38s cubic-bezier(.2,.6,.3,1) both" : "none" }}
      >
        <div className="overflow-hidden rounded-[12px] border border-border shadow-xl"
          style={{ boxShadow: active ? "0 0 30px rgba(34,214,122,.12)" : "none" }}>
          <Image
            src={imgSrc}
            alt=""
            width={760}
            height={500}
            className="h-auto w-full object-cover"
            style={{ maxHeight: 240 }}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SLIDES
═══════════════════════════════════════════════════════════════════════════════ */

function S01() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Pill>BOOTCAMP IA · 2026</Pill>
      <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-extrabold leading-[1.04] tracking-[-0.045em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
      <h2 className="font-display text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
      <blockquote className="font-display text-[clamp(1.4rem,3.8vw,2.4rem)] font-bold leading-[1.2] tracking-[-0.035em] max-w-[720px]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
      <h1 className="font-display font-extrabold leading-none tracking-[-0.055em] text-primary text-[clamp(4rem,10vw,7.5rem)]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        Demiurgos
      </h1>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <p className="max-w-[52ch] text-[clamp(1rem,2.2vw,1.35rem)] leading-relaxed text-muted-foreground">
        Tu director creativo personal, construido con IA, que trabaja con tu voz, tus temas y tu contexto.
      </p>
      <div className="mt-1 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4"
        style={{ boxShadow: "0 0 30px rgba(34,214,122,.10)" }}>
        <p className="font-display text-[clamp(1rem,2.4vw,1.5rem)] font-extrabold tracking-[-0.03em] leading-snug"
          style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
    { icon: "👤", phase: "Tu perfil", what: "Defines quién eres", detail: "Sector, experiencia, tono, audiencia objetivo, referentes y lo que te diferencia. Esta es la base que calibra todo lo demás." },
    { icon: "📡", phase: "Tu contexto", what: "Lo que rodea a tu contenido", detail: "Tendencias actuales de tu sector, ideas en la frontera del conocimiento, lo que ya has publicado, tus archivos de Google Drive y tus redes." },
    { icon: "⚡", phase: "La generación", what: "Propuestas listas para publicar", detail: "Idea + por qué encaja ahora + guion completo + formato recomendado. Todo en tu voz, no en la voz genérica de ChatGPT." },
    { icon: "🔁", phase: "El ciclo", what: "Itera y mejora cada semana", detail: "Cada contenido que publicas se convierte en aprendizaje. El sistema se afina contigo a medida que lo usas." },
  ];
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <h2 className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
      <h2 className="font-display text-[clamp(1.6rem,4vw,2.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        ¿Qué <span className="text-primary">genera?</span> Míralo en vivo.
      </h2>
      <div className="w-full max-w-[780px] rounded-[20px] border border-border bg-card overflow-hidden"
        style={{ boxShadow: "0 0 40px rgba(34,214,122,.09)" }}>
        <div className="flex items-center gap-3 border-b border-border bg-background/60 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="text-primary text-[10px] font-bold">D</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-xs text-foreground">Director Creativo · Demiurgos</p>
            <p className="font-mono text-[9px] text-primary">● online</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <ChatBubble role="user">Oye, ¿qué me recomiendas publicar esta semana sobre IA para startups?</ChatBubble>
          <ChatBubble role="ai">
            <p className="font-semibold mb-1">Propuesta: Carrusel para LinkedIn 🎯</p>
            <p className="text-muted-foreground text-[11px] mb-2">
              <strong className="text-foreground">«Cómo montar un Bootcamp de IA con Startup Institute en 4 semanas»</strong>
            </p>
            <p className="text-muted-foreground text-[11px] mb-3">
              Encaja ahora: el interés por IA aplicada a negocio está en máximos. Tu contexto en ecosistema startup lo hace auténtico, no genérico.
            </p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              <CarouselCard n={1} title="El reto" body="De 0 a producto funcional usando solo IA como copiloto." accent />
              <CarouselCard n={2} title="La metodología" body="Prompt → prototipo → iteración. Claude Code, Gamma, Vercel." />
              <CarouselCard n={3} title="Lo que aprendes" body="No herramientas. Criterio. Cuándo confiar en la IA y cuándo dirigirla." />
              <CarouselCard n={4} title="El resultado" body="Producto real, proceso documentado, confianza para repetirlo." />
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">Formato: 4 slides · Tono: directo + inspiracional · CTA: «¿Quieres el template?»</p>
          </ChatBubble>
        </div>
      </div>
    </div>
  );
}

/* ── S07a/b/c — iframes grandes y clickables ─────────────────────────────── */
function S07a() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">1</div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Fase 1 · Landing</p>
          <p className="font-mono text-xs text-muted-foreground">La primera impresión — qué es y por qué importa</p>
        </div>
      </div>
      <BrowserWindow src="/home-demo" label="Landing" className="w-full max-w-[960px] h-[460px]" />
    </div>
  );
}

function S07b() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">2</div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Fase 2 · Onboarding</p>
          <p className="font-mono text-xs text-muted-foreground">Tu perfil, tu voz, tu sector — el motor se calibra aquí</p>
        </div>
      </div>
      <BrowserWindow src="/onboarding-demo" label="Onboarding" className="w-full max-w-[960px] h-[460px]" />
    </div>
  );
}

function S07c() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary font-mono font-bold text-primary">3</div>
        <div className="text-left">
          <p className="font-semibold text-primary">Fase 3 · Panel demo</p>
          <p className="font-mono text-xs text-muted-foreground">Tu director creativo activo — interactúa en vivo</p>
        </div>
      </div>
      <BrowserWindow src="/demo" label="Panel demo" className="w-full max-w-[960px] h-[460px]" />
    </div>
  );
}

/* ── S08/S09 — iframe /demo clickable ───────────────────────────────────── */
function S08() {
  return (
    <div className="flex w-full max-w-[980px] flex-col items-center gap-4">
      <h2 className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        ¿Qué puedes <span className="text-primary">hacer?</span>
      </h2>
      <div className="grid w-full grid-cols-[1fr_1.5fr] gap-5 items-stretch">
        <ul className="flex flex-col justify-center gap-3 text-left">
          <Feat><strong>Chat con el Director Creativo</strong> — Conversación contextualizada con tu perfil e historial.</Feat>
          <Feat><strong>Generación de propuestas</strong> — Ideas + por qué ahora + guion, listas para publicar.</Feat>
          <Feat><strong>Conexión y subida de archivos</strong> — Google Drive, PDFs, notas propias como contexto.</Feat>
          <Feat><strong>Ideas frontera</strong> — Contenido en la frontera del conocimiento de tu sector.</Feat>
        </ul>
        <BrowserWindow src="/demo" label="Chat" className="h-[340px]" />
      </div>
    </div>
  );
}

function S09() {
  return (
    <div className="flex w-full max-w-[980px] flex-col items-center gap-4">
      <h2 className="font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        Y también <span className="text-primary">esto.</span>
      </h2>
      <div className="grid w-full grid-cols-[1.5fr_1fr] gap-5 items-stretch">
        <BrowserWindow src="/demo" label="Propuestas" className="h-[340px]" />
        <ul className="flex flex-col justify-center gap-3 text-left">
          <Feat><strong>Perfil contextual</strong> — Tu tono, sector y audiencia en cada generación.</Feat>
          <Feat><strong>Selección y scraping de redes</strong> — Conecta LinkedIn o X; analiza lo publicado.</Feat>
          <Feat><strong>Tendencias en tiempo real</strong> — Lo que pasa en tu sector, integrado como contexto.</Feat>
          <Feat><strong>Ajustes de coste</strong> — Control granular sobre modelos y gasto.</Feat>
        </ul>
      </div>
    </div>
  );
}

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
      <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        El <span className="text-primary">stack.</span>
      </h2>
      <p className="font-mono text-xs text-muted-foreground -mt-2">
        4 pilares principales · el resto son piezas del ecosistema
      </p>
      <div className="grid w-full max-w-[900px] grid-cols-4 gap-2.5">
        {tools.map((t) => (
          <StackBadge key={t.n} icon={t.e} name={t.n} hi={t.hi} />
        ))}
      </div>
    </div>
  );
}

/* ── S11 — wizard animado con imágenes ──────────────────────────────────── */
function S11({ step }: { step: number }) {
  const steps = [
    {
      img: "/presentacion/slide11a.png",
      bullet: <><strong>Construir el prompt</strong> — Primero un GPT para diseñar el prompt sólido que define el comportamiento del director creativo. El prompt es la arquitectura invisible de todo.</>,
    },
    {
      img: "/presentacion/slide11b.png",
      bullet: <><strong>Levantar el proyecto</strong> — Arquitectura completa con Claude Code: Next.js, Supabase, auth y gateway de IA multi-modelo.</>,
    },
    {
      img: "/presentacion/slide11c.png",
      bullet: <><strong>Deploy y conexiones</strong> — Vercel + GitHub, variables de entorno, migraciones de base de datos. Todo conectado y desplegado automáticamente.</>,
    },
    {
      img: "/presentacion/slide11d.png",
      bullet: <><strong>Iterar (y pelearse con la IA)</strong> — Debugging constante, decisiones en caliente y aprendizaje forzado de todo lo que hace falta. El producto real sale de aquí.</>,
    },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        Cómo se <span className="text-primary">construyó.</span>
      </h2>
      <div className="flex w-full flex-col gap-2.5 items-center">
        {steps.map((s, i) => (
          <ImageStep key={i} active={i === step} imgSrc={s.img} bullet={s.bullet} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">{step + 1} / {steps.length} · → para avanzar</p>
    </div>
  );
}

/* ── S12 — wizard animado con imágenes ──────────────────────────────────── */
function S12({ step }: { step: number }) {
  const steps = [
    {
      img: "/presentacion/slide12a.png",
      bullet: <><strong className="text-brand-amber">Bloqueos técnicos</strong> — Merges rotos, pull requests conflictivos, builds que fallan sin razón aparente. El flujo se rompe y hay que diagnosticarlo en caliente.</>,
    },
    {
      img: "/presentacion/slide12b.png",
      bullet: <><strong className="text-brand-amber">Decisiones en caliente</strong> — ¿Cambio de arquitectura a mitad? ¿Descarto la feature? Con el reloj corriendo y el contexto de la IA a medias.</>,
    },
    {
      img: "/presentacion/slide12c.png",
      bullet: <><strong className="text-brand-amber">Control de costes</strong> — Cada prompt cuesta. Aprender cuándo es eficiente y cuándo estás quemando dinero es parte del aprendizaje.</>,
    },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">La parte que nadie cuenta</p>
      <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-center"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        La <span className="text-primary">pelea</span> con la IA.
      </h2>
      <div className="flex w-full flex-col gap-2.5 items-center">
        {steps.map((s, i) => (
          <ImageStep key={i} active={i === step} imgSrc={s.img} bullet={s.bullet} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">{step + 1} / {steps.length} · → para avanzar</p>
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
      <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
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
      <blockquote className="font-display font-bold leading-[1.2] tracking-[-0.04em] max-w-[720px] text-[clamp(1.6rem,4vw,2.8rem)]"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        Demiurgos no es solo<br /><span className="text-primary">una herramienta.</span>
      </blockquote>
      <div className="h-0.5 w-12 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
      <blockquote className="font-display font-bold leading-[1.25] tracking-[-0.035em] max-w-[640px] text-[clamp(1.2rem,3vw,2rem)] text-muted-foreground"
        style={{ fontFamily: "var(--font-bricolage, var(--font-display))" }}>
        Es aprender a construir <span className="text-primary">con IA</span><br />mientras construyes.
      </blockquote>
      <Pill>El proceso es el producto.</Pill>
    </div>
  );
}

/* ── S15 — imagen real + overlay de terminal ──────────────────────────── */
function S15() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Fin de la sesión</p>

      <div className="relative w-full max-w-[700px]">
        {/* Imagen real slide15 */}
        <div className="overflow-hidden rounded-[16px] border border-border shadow-2xl">
          <Image
            src="/presentacion/slide15.png"
            alt="Límite de uso alcanzado durante el build"
            width={1400}
            height={900}
            className="h-auto w-full object-cover"
            style={{ maxHeight: 380 }}
            unoptimized
          />
        </div>

        {/* Overlay con la barra de estado de Claude */}
        <div className="absolute bottom-4 right-4 rounded-[12px] border border-destructive/40 bg-background/95 px-4 py-3 font-mono text-xs text-left shadow-xl backdrop-blur-sm"
          style={{ minWidth: 220 }}>
          <p className="text-destructive font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Límite de uso alcanzado
          </p>
          <p className="text-muted-foreground mt-1">Se restablece a las 22:50</p>
          <div className="mt-2 h-px w-full bg-border" />
          <p className="mt-2 text-brand-amber">66,94 € gastados · 67% usado</p>
          <p className="text-muted-foreground text-[9px]">Saldo: 3,92 € · Recarga: deshabilitada</p>
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
    <span className="inline-block h-[1em] w-2 bg-primary align-middle" style={{ animation: "blink 1.1s step-end infinite" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SLIDES REGISTRY
═══════════════════════════════════════════════════════════════════════════════ */
type SlideEntry =
  | { component: React.FC; note: string; subSteps?: undefined }
  | { component: React.FC<{ step: number }>; note: string; subSteps: number };

const SLIDES: SlideEntry[] = [
  { component: S01, note: "Arranca sin presentarte. La frase lo dice todo." },
  { component: S02, note: "Dolor reconocible. No nombres el producto todavía." },
  { component: S03, note: "Pausa de 3s. Dejar que aterrice." },
  { component: S04, note: "Primer wow. 'No es un GPT, es TU voz.'" },
  { component: S05, note: "4 partes: perfil, contexto, generación, ciclo." },
  { component: S06, note: "Lee el chat en voz alta. Muestra el carrusel propuesto." },
  { component: S07a, note: "Fase 1 — Landing real. Iframe clickable." },
  { component: S07b, note: "Fase 2 — Onboarding real. Aquí se define la voz." },
  { component: S07c, note: "Fase 3 — Panel demo real. Úsalo en vivo si puedes." },
  { component: S08, note: "Señala el iframe. No leas la lista — señala." },
  { component: S09, note: "Termina con ajustes de costes. Despierta curiosidad técnica." },
  { component: S10, note: "4 pilares en verde: Claude Code, Vercel, GitHub, Supabase." },
  { component: S11, note: "→ avanza sub-paso con imagen. 4 pasos.", subSteps: 4 },
  { component: S12, note: "→ avanza sub-paso con imagen. 3 bloqueos.", subSteps: 3 },
  { component: S13, note: "'Nada de esto sabía antes de empezar.'" },
  { component: S14, note: "Pausa larga. Deja que respire." },
  { component: S15, note: "La imagen real del límite. Reír. Gracias. Preguntas." },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DECK
═══════════════════════════════════════════════════════════════════════════════ */
export function PresentacionDeck() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [subStep, setSubStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "bwd">("fwd");
  const [animating, setAnimating] = useState(false);
  const [touchX, setTouchX] = useState(0);

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
    setTimeout(() => { setSlideIdx((i) => i + 1); setSubStep(0); setAnimating(false); }, 320);
  }, [slideIdx, subStep, total]);

  const retreat = useCallback(() => {
    if (subStep > 0) { setSubStep((s) => s - 1); return; }
    if (slideIdx <= 0) return;
    setDir("bwd");
    setAnimating(true);
    setTimeout(() => { setSlideIdx((i) => i - 1); setSubStep(0); setAnimating(false); }, 320);
  }, [slideIdx, subStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); advance(); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); retreat(); }
      if (e.key === "f" || e.key === "F") {
        document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      }
      if (e.key === "Home") { setSlideIdx(0); setSubStep(0); }
      if (e.key === "End") { setSlideIdx(total - 1); setSubStep(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, retreat, total]);

  const entry = SLIDES[slideIdx];
  const progressPct = ((slideIdx + 1) / total) * 100;
  const SlideEl = entry.subSteps
    ? () => (entry.component as React.FC<{ step: number }>)({ step: subStep })
    : () => (entry.component as React.FC)({});

  return (
    <>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(28px); }
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
          .slide-enter-fwd, .slide-enter-bwd { animation: none; }
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
          if (target.closest("a, button, input, select, textarea, iframe")) return;
          e.clientX > window.innerWidth / 2 ? advance() : retreat();
        }}
      >
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 10%, rgba(34,214,122,.07) 0%, transparent 60%)" }} />

        <main className="flex flex-1 items-center justify-center overflow-hidden px-[clamp(1.5rem,6vw,6rem)] py-[clamp(1.5rem,4vh,3.5rem)]">
          <div key={`${slideIdx}-${subStep}`}
            className={`flex w-full items-center justify-center ${animating ? "" : dir === "fwd" ? "slide-enter-fwd" : "slide-enter-bwd"}`}>
            <SlideEl />
          </div>
        </main>

        <div className="relative h-[3px] w-full bg-border">
          <div className="h-full bg-primary" style={{ width: `${progressPct}%`, boxShadow: "0 0 10px var(--color-primary)", transition: "width .4s cubic-bezier(.2,.6,.3,1)" }} />
        </div>

        <div className="flex items-center justify-between border-t border-border/40 bg-background/80 px-4 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {["←", "→"].map((k) => (
              <kbd key={k} className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground">{k}</kbd>
            ))}
            <span>navegar</span>
            <span className="mx-1 text-border">|</span>
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-[10px] text-muted-foreground">F</kbd>
            <span>pantalla completa</span>
          </div>
          <p className="hidden max-w-[420px] truncate text-center font-mono text-[10px] text-muted-foreground/60 sm:block">
            💬 {entry.note}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {slideIdx + 1} / {total}{entry.subSteps ? ` · ${subStep + 1}/${entry.subSteps}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}
