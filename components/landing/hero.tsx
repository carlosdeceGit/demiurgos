"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";

const EASE = [0.21, 0.5, 0.25, 1] as const;

type Proposal = {
  platform: string;
  slot: string;
  idea: string;
  why: string;
  script: string[];
};

const PROPOSALS: Proposal[] = [
  {
    platform: "LinkedIn",
    slot: "LinkedIn · Martes",
    idea: "La métrica que todos enseñan y casi nadie entiende.",
    why: "Conecta tu pilar de criterio con una señal que guardaste esta semana. En LinkedIn el carrusel-documento rinde por «saves», no por likes.",
    script: ["Portada: la frase incómoda.", "5 láminas: el error, el dato, tu lectura.", "Cierre: una pregunta. Sin enlaces en el cuerpo."],
  },
  {
    platform: "YouTube",
    slot: "YouTube · Jueves",
    idea: "Lo que aprendí cerrando una ronda que no salió.",
    why: "Tu pilar de «lecciones de fundador» + interés alto del nicho. El vídeo-relato sostiene retención cuando hay tensión real.",
    script: ["Gancho (0–10s): el dato que duele.", "Nudo: 3 decisiones y su coste.", "Cierre: qué harías distinto."],
  },
  {
    platform: "X",
    slot: "X · Miércoles",
    idea: "Un hilo: 6 errores que cometí escalando, sin filtro.",
    why: "En X el hilo con tesis clara y datos propios circula. El primer post se lo juega todo: tiene que abrir un bucle.",
    script: ["Post 1: la promesa concreta del hilo.", "Posts 2–7: un error por tuit, con la lección.", "Cierre: el meta-aprendizaje + CTA suave."],
  },
  {
    platform: "Substack",
    slot: "Substack · Domingo",
    idea: "El análisis que nadie publica porque incomoda.",
    why: "La newsletter premia la profundidad. Aquí va tu criterio largo, el que no cabe en un post: tu wedge en formato editorial.",
    script: ["Apertura: una tesis con la que se pueda discrepar.", "Desarrollo: 3 argumentos con datos propios.", "Cierre: qué implica para el lector esta semana."],
  },
];

export function Hero() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

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

  const p = PROPOSALS[active];

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
            Publica con{" "}
            <span className="dmg-serif italic" style={{ color: "var(--green)" }}>
              criterio
            </span>
            .
            <br />
            No por inercia.
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            className="mt-6 text-lg leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Demiurgos aprende tu voz, la cruza con cómo funciona cada red y con lo
            que pasa esta semana, y te dice qué publicar, cuándo y por qué. Nada que
            pudiera haber escrito cualquiera.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
            className="mt-9 flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className="dmg-cta">
                Empieza con una conversación
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a href="#como-funciona" className="dmg-ghost">
                Ver cómo piensa
              </a>
            </div>
            <span className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Gratis para empezar · No necesitas tarjeta
            </span>
          </motion.div>
        </div>

        {/* Columna visual con tabs interactivas */}
        <div
          className="relative z-10 flex flex-col items-center lg:items-end"
          style={{ perspective: "1200px" }}
        >
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Plataforma de la propuesta">
            {PROPOSALS.map((prop, i) => (
              <button
                key={prop.platform}
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                style={
                  active === i
                    ? { background: "var(--green)", color: "var(--green-ink)", borderColor: "var(--green)" }
                    : { background: "rgba(255,255,255,0.035)", color: "var(--ink-soft)", borderColor: "var(--line)" }
                }
              >
                {prop.platform}
              </button>
            ))}
          </div>

          <div
            className="relative w-full max-w-sm"
            onPointerMove={handlePointer}
            onPointerLeave={reset}
          >
            <FloatingSignals />
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="dmg-card relative p-5 sm:p-6"
            >
              <ProposalCard proposal={p} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div style={{ transform: "translateZ(40px)" }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-wide" style={{ color: "var(--faint)" }}>
          PROPUESTA · 03
        </span>
        <span className="dmg-pill" style={{ padding: "0.25rem 0.65rem" }}>
          <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
          {proposal.slot}
        </span>
      </div>

      <motion.div key={proposal.platform} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Block label="Idea" color="var(--ink)">
          <p className="text-[0.95rem] leading-snug font-medium">{proposal.idea}</p>
        </Block>

        <Block label="Por qué ahora" color="var(--amber)">
          <p className="text-[0.82rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {proposal.why}
          </p>
        </Block>

        <Block label="Guion" color="var(--violet)">
          <ul className="space-y-1.5 text-[0.82rem]" style={{ color: "var(--ink-soft)" }}>
            {proposal.script.map((line) => (
              <li key={line} className="flex gap-2">
                <Dot /> {line}
              </li>
            ))}
          </ul>
        </Block>
      </motion.div>
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
    <div className="pointer-events-none absolute inset-0 z-20 hidden sm:block" aria-hidden>
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
            boxShadow: "0 12px 30px -16px rgba(0,0,0,0.6)",
          }}
        >
          <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
