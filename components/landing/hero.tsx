"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";

const EASE = [0.21, 0.5, 0.25, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  // Parallax de la tarjeta según el puntero.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [9, -9]), { stiffness: 120, damping: 14 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 14 });

  function handlePointer(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <section className="relative overflow-hidden">
      <div className="dmg-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="dmg-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Columna de texto */}
        <div className="relative z-10 max-w-xl">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="dmg-pill"
          >
            <span className="relative flex size-2">
              <span
                className="absolute inline-flex size-full rounded-full opacity-60"
                style={{ background: "var(--green)", animation: "dmg-pulse-dot 2.4s ease-in-out infinite" }}
              />
              <span className="relative inline-flex size-2 rounded-full" style={{ background: "var(--green)" }} />
            </span>
            Inteligencia creativa para tu marca en redes
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE }}
            className="mt-6 text-[2.6rem] leading-[1.04] font-semibold tracking-tight sm:text-6xl"
          >
            Tu director creativo.
            <br />
            Que de verdad sabe{" "}
            <span className="dmg-serif italic" style={{ color: "var(--green)" }}>
              quién eres
            </span>
            .
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            className="mt-6 text-lg leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Demiurgos aprende tu voz y tu criterio, lo cruza con cómo funciona cada
            red y con lo que pasa esta semana, y decide qué publicar, cuándo y por
            qué. Nada de posts que podría haber escrito cualquiera.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/login" className="dmg-cta">
              Empezar gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a href="#como-funciona" className="dmg-ghost">
              Ver cómo piensa
            </a>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-7 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Del griego <span className="dmg-serif italic">dēmiourgós</span>: el artesano
            que da forma al mundo a partir del caos.
          </motion.p>
        </div>

        {/* Columna visual */}
        <div
          className="relative z-10 flex justify-center lg:justify-end"
          style={{ perspective: "1200px" }}
          onPointerMove={handlePointer}
          onPointerLeave={reset}
        >
          <FloatingSignals />
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="dmg-card relative w-full max-w-sm p-5 sm:p-6"
          >
            <ProposalCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Tarjeta de propuesta de ejemplo: ilustra el formato real del Director. */
function ProposalCard() {
  return (
    <div style={{ transform: "translateZ(40px)" }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-wide" style={{ color: "var(--faint)" }}>
          PROPUESTA · 03
        </span>
        <span className="dmg-pill" style={{ padding: "0.25rem 0.65rem" }}>
          <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
          LinkedIn · Martes
        </span>
      </div>

      <Block label="Idea" color="var(--ink)">
        <p className="text-[0.95rem] leading-snug font-medium">
          La métrica que todos enseñan y casi nadie entiende.
        </p>
      </Block>

      <Block label="Por qué ahora" color="var(--amber)">
        <p className="text-[0.82rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Conecta tu pilar de criterio con una señal que guardaste esta semana. En
          LinkedIn el carrusel-documento rinde por <em>saves</em>, no por likes: el
          formato ideal para desmontar una idea con calma.
        </p>
      </Block>

      <Block label="Guion" color="var(--violet)">
        <ul className="space-y-1.5 text-[0.82rem]" style={{ color: "var(--ink-soft)" }}>
          <li className="flex gap-2">
            <Dot /> Portada: la frase incómoda.
          </li>
          <li className="flex gap-2">
            <Dot /> 5 láminas: el error, el dato, tu lectura.
          </li>
          <li className="flex gap-2">
            <Dot /> Cierre: una pregunta. Sin enlaces en el cuerpo.
          </li>
        </ul>
      </Block>
    </div>
  );
}

function Block({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
      <p className="mb-1.5 text-[0.68rem] font-semibold tracking-[0.12em] uppercase" style={{ color }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 size-1 shrink-0 rounded-full" style={{ background: "var(--violet)" }} />;
}

/** Señales sueltas (el "caos") que orbitan la tarjeta y le dan forma. */
function FloatingSignals() {
  const signals: Array<{
    label: string;
    delay: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  }> = [
    { label: "Artículo guardado", top: "4%", left: "-6%", delay: "0s" },
    { label: "Tendencia", top: "30%", right: "-8%", delay: "1.2s" },
    { label: "Idea suelta", bottom: "8%", left: "-9%", delay: "2.4s" },
    { label: "Referencia", bottom: "-3%", right: "4%", delay: "0.6s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden>
      {signals.map((s) => (
        <span
          key={s.label}
          className="dmg-pill dmg-float absolute text-[0.72rem] whitespace-nowrap"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            animationDelay: s.delay,
            boxShadow: "0 12px 30px -16px rgba(28,25,23,0.4)",
          }}
        >
          <span className="size-1.5 rounded-full" style={{ background: "var(--violet)" }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
