import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  CalendarClock,
  Check,
  Compass,
  EyeOff,
  Fingerprint,
  Globe,
  Layers,
  PenLine,
  Radio,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { Hero } from "@/components/landing/hero";
import { LandingHeader } from "@/components/landing/landing-header";
import { Reveal } from "@/components/landing/reveal";

const PLATFORMS = ["LinkedIn", "YouTube", "TikTok", "Instagram", "X", "Substack"];

export const metadata: Metadata = {
  title: "Tu director creativo para redes",
  description:
    "Demiurgos aprende tu voz y tu criterio, lo cruza con cómo funciona cada red y con lo que pasa esta semana, y decide qué publicar, cuándo y por qué. Sin posts genéricos.",
  alternates: { canonical: "/landing" },
  openGraph: {
    url: "/landing",
    title: "Demiurgos — Tu director creativo para redes",
    description:
      "Aprende quién eres, cómo funciona cada red y qué pasa esta semana. Y decide qué publicar, cuándo y por qué.",
  },
};

export default function Home() {
  return (
    <div className="dmg-landing flex flex-1 flex-col">
      <LandingHeader />

      <main>
        <Hero />
        <Platforms />
        <Problem />
        <Solution />
        <Benefits />
        <HowItWorks />
        <Difference />
        <Vision />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

/* ── Tira de plataformas ──────────────────────────────────────────── */
function Platforms() {
  return (
    <section aria-label="Redes que entiende" className="border-y" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <p className="mb-5 text-center text-xs font-medium tracking-[0.16em] uppercase" style={{ color: "var(--muted)" }}>
          Conoce cómo funciona cada red, ahora mismo
        </p>
        <div className="dmg-marquee-mask overflow-hidden">
          <div className="dmg-marquee gap-12 pr-12">
            {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="dmg-serif text-2xl whitespace-nowrap italic sm:text-3xl"
                style={{ color: "var(--ink-soft)" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Problema ─────────────────────────────────────────────────────── */
function Problem() {
  const pains = [
    {
      icon: EyeOff,
      title: "Publicas a ciegas",
      body: "No sabes qué rinde en cada red ni por qué. Pruebas, fallas y vuelves a empezar.",
    },
    {
      icon: Bot,
      title: "Suena a cualquiera",
      body: "La IA genérica escribe rápido, pero sin tu voz, sin tu historia y sin tu criterio.",
    },
    {
      icon: CalendarClock,
      title: "Manda el calendario",
      body: "Creas por inercia para rellenar huecos, no porque haya una buena razón para publicarlo.",
    },
  ];
  return (
    <Section id="problema">
      <Reveal>
        <Eyebrow>El problema</Eyebrow>
        <H2>
          Crear para redes se ha vuelto <Accent>ruido</Accent>.
        </H2>
        <Lead>
          Hay mil herramientas que generan contenido. Ninguna te conoce. Publicar
          más rápido no sirve de nada si lo que publicas no suena a ti ni mueve a tu
          audiencia.
        </Lead>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {pains.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <article className="dmg-card dmg-card-hover h-full p-6">
              <IconBadge tone="amber">
                <p.icon className="size-5" strokeWidth={1.7} />
              </IconBadge>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {p.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ── Solución ─────────────────────────────────────────────────────── */
function Solution() {
  const sources = [
    {
      icon: User,
      tag: "Tu perfil",
      title: "Quién eres",
      body: "Tu posicionamiento, tus pilares, tu audiencia y tu voz. Lo que ninguna API ve: tu criterio.",
      tone: "green" as const,
    },
    {
      icon: Globe,
      tag: "El ecosistema",
      title: "Cómo funciona cada red",
      body: "Formato, gancho, frecuencia y mejor momento en LinkedIn, YouTube, TikTok, Instagram, X y Substack.",
      tone: "violet" as const,
    },
    {
      icon: Radio,
      tag: "Las señales",
      title: "Lo que pasa ahora",
      body: "Las tendencias, ideas y referencias que le compartes esta semana. Contexto fresco, no plantillas.",
      tone: "amber" as const,
    },
  ];
  return (
    <Section id="solucion" alt>
      <Reveal>
        <Eyebrow>La solución</Eyebrow>
        <H2>
          Demiurgos no genera posts. <Accent>Dirige</Accent> tu contenido.
        </H2>
        <Lead>
          Es un director creativo personal que cruza tres fuentes antes de
          proponerte nada. De ahí salen decisiones con criterio, no texto de relleno.
        </Lead>
      </Reveal>

      <div className="relative mt-12 grid gap-5 md:grid-cols-3">
        {sources.map((s, i) => (
          <Reveal key={s.tag} delay={i * 0.1}>
            <article className="dmg-card dmg-card-hover h-full p-6">
              <div className="flex items-center gap-3">
                <IconBadge tone={s.tone}>
                  <s.icon className="size-5" strokeWidth={1.7} />
                </IconBadge>
                <span className="font-mono text-[0.72rem] tracking-wide uppercase" style={{ color: "var(--faint)" }}>
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {s.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-[0.95rem]" style={{ color: "var(--muted)" }}>
          <Sparkles className="size-4" style={{ color: "var(--green)" }} strokeWidth={1.8} />
          Tres fuentes, una decisión: <strong style={{ color: "var(--ink)" }}>qué publicar, cuándo y por qué.</strong>
        </p>
      </Reveal>
    </Section>
  );
}

/* ── Beneficios ───────────────────────────────────────────────────── */
function Benefits() {
  const items = [
    {
      icon: Fingerprint,
      title: "Suena a ti, no a una IA",
      body: "Respeta tu voz, tus reglas y tus líneas rojas. Si lo podría haber escrito cualquiera, no te lo propone.",
    },
    {
      icon: Layers,
      title: "Cada red, a su manera",
      body: "Adapta formato, gancho y momento a cómo funciona de verdad cada plataforma hoy.",
    },
    {
      icon: Compass,
      title: "Siempre con un porqué",
      body: "Cada propuesta llega justificada: por qué esto, para tu audiencia, en esta red, ahora.",
    },
    {
      icon: Brain,
      title: "Aprende contigo",
      body: "Tu perfil es un documento vivo. Cuanto más le cuentas, mejores y más tuyas son sus propuestas.",
    },
    {
      icon: PenLine,
      title: "De la idea al guion",
      body: "No te deja con un titular: te da el paquete listo para producir, adaptado al formato.",
    },
    {
      icon: Sparkles,
      title: "Anti-humo por diseño",
      body: "Culto, directo y con criterio. Si una idea es floja, te lo dice. Sin postureo ni palabras vacías.",
    },
  ];
  return (
    <Section>
      <Reveal>
        <Eyebrow>Beneficios</Eyebrow>
        <H2>
          Menos cantidad. Mucho más <Accent>criterio</Accent>.
        </H2>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={(i % 3) * 0.08}>
            <article className="dmg-card dmg-card-hover h-full p-6">
              <IconBadge tone="green">
                <it.icon className="size-5" strokeWidth={1.7} />
              </IconBadge>
              <h3 className="mt-5 text-[1.05rem] font-semibold tracking-tight">{it.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {it.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ── Cómo funciona ────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Te perfila",
      body: "Una entrevista, no un formulario. Captura tu voz, tus pilares y tu criterio: lo que de verdad te diferencia.",
    },
    {
      n: "02",
      title: "Cruza el contexto",
      body: "Tu perfil, por cómo funciona cada red, por las señales que le compartes esta semana. Ahí está la inteligencia.",
    },
    {
      n: "03",
      title: "Propone con criterio",
      body: "Un set de propuestas con idea, por qué ahora y guion listo para producir. Tú decides; él argumenta.",
    },
  ];
  return (
    <Section id="como-funciona" alt>
      <Reveal>
        <Eyebrow>Cómo funciona</Eyebrow>
        <H2>
          Del caos a una <Accent>estrategia</Accent>, en tres pasos.
        </H2>
      </Reveal>
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal as="li" key={s.n} delay={i * 0.1}>
            <div className="dmg-card dmg-card-hover h-full p-7">
              <span
                className="dmg-serif text-5xl leading-none italic"
                style={{ color: "transparent", WebkitTextStroke: "1px var(--line-strong)" }}
              >
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ── Diferencia ───────────────────────────────────────────────────── */
function Difference() {
  const rows = [
    { generic: "Parte de cero, en blanco", demiurgos: "Parte de tu perfil y tu criterio" },
    { generic: "Consejos de gurú de redes", demiurgos: "Cómo funciona cada plataforma hoy" },
    { generic: "“Esto es tendencia”", demiurgos: "“Publica esto porque a tu audiencia le mueve X”" },
    { generic: "Te entrega un texto suelto", demiurgos: "Te entrega idea, porqué y guion" },
  ];
  return (
    <Section id="diferencia">
      <Reveal>
        <Eyebrow>Por qué es distinto</Eyebrow>
        <H2>
          Si lo podría haber escrito <Accent>ChatGPT</Accent> sin conocerte, ha
          fallado.
        </H2>
        <Lead>
          Esa es la regla de oro de Demiurgos. Lo que lo separa de cualquier
          generador de contenido no es el modelo: es de dónde parte.
        </Lead>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="dmg-card mt-12 overflow-hidden">
          <div className="grid grid-cols-2 text-sm font-semibold" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2 px-5 py-4 sm:px-7" style={{ color: "var(--muted)" }}>
              <Bot className="size-4" strokeWidth={1.8} /> IA genérica
            </div>
            <div
              className="flex items-center gap-2 px-5 py-4 sm:px-7"
              style={{ color: "var(--green)", borderLeft: "1px solid var(--line)", background: "var(--green-soft)" }}
            >
              <Compass className="size-4" strokeWidth={1.8} /> Demiurgos
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.generic}
              className="grid grid-cols-2 text-[0.92rem]"
              style={i < rows.length - 1 ? { borderBottom: "1px solid var(--line)" } : undefined}
            >
              <div className="flex items-start gap-2.5 px-5 py-4 sm:px-7" style={{ color: "var(--muted)" }}>
                <X className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                <span>{r.generic}</span>
              </div>
              <div
                className="flex items-start gap-2.5 px-5 py-4 sm:px-7"
                style={{ borderLeft: "1px solid var(--line)" }}
              >
                <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--green)" }} strokeWidth={2.4} />
                <span style={{ color: "var(--ink)" }}>{r.demiurgos}</span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Visión / cita ────────────────────────────────────────────────── */
function Vision() {
  return (
    <Section alt>
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow center>La visión</Eyebrow>
          <p className="dmg-serif mt-4 text-3xl leading-[1.25] tracking-tight sm:text-[2.6rem]">
            “Tu marca personal no necesita más contenido. Necesita un{" "}
            <span className="italic" style={{ color: "var(--green)" }}>
              criterio
            </span>{" "}
            que decida qué merece la pena publicar.”
          </p>
          <p className="mt-7 text-[0.95rem]" style={{ color: "var(--muted)" }}>
            Demiurgos está en construcción, con la misma exigencia que pone en cada
            propuesta. Hoy ya dirige tu contenido desde el chat; el resto del taller
            llega paso a paso.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── CTA final ────────────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="dmg-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <span className="dmg-pill mx-auto">
            <Sparkles className="size-3.5" style={{ color: "var(--green)" }} strokeWidth={2} />
            Listo para conocerte
          </span>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Dale forma a tu <span className="dmg-serif italic" style={{ color: "var(--green)" }}>voz</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Empieza por una conversación. Cuéntale quién eres y deja que Demiurgos te
            diga qué publicar esta semana, y por qué.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="dmg-cta">
              Empezar gratis
              <ArrowRight className="size-4" strokeWidth={2.2} />
            </Link>
            <Link href="/chat" className="dmg-ghost">
              Abrir el chat
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-6 place-items-center rounded-[7px]"
            style={{ background: "linear-gradient(150deg, var(--green), var(--violet) 130%)" }}
            aria-hidden
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 4v10l-7 4-7-4V7z" />
            </svg>
          </span>
          <span className="text-sm font-semibold">Demiurgos</span>
          <span className="hidden text-sm sm:inline" style={{ color: "var(--faint)" }}>
            · el artesano que da forma al caos
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--muted)" }}>
          <a href="#solucion" className="transition-colors hover:text-[var(--green)]">
            La solución
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-[var(--green)]">
            Cómo funciona
          </a>
          <Link href="/login" className="transition-colors hover:text-[var(--green)]">
            Entrar
          </Link>
        </div>
      </div>
      <p className="pb-8 text-center text-xs" style={{ color: "var(--faint)" }}>
        © {new Date().getFullYear()} Demiurgos · Hecho con criterio.
      </p>
    </footer>
  );
}

/* ── Primitivas de sección ────────────────────────────────────────── */
function Section({
  id,
  alt,
  children,
}: {
  id?: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20"
      style={alt ? { background: "var(--paper-2)", borderBlock: "1px solid var(--line)" } : undefined}
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">{children}</div>
    </section>
  );
}

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold tracking-[0.16em] uppercase ${center ? "text-center" : ""}`}
      style={{ color: "var(--green)" }}
    >
      {children}
    </p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--ink-soft)" }}>
      {children}
    </p>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="dmg-serif italic" style={{ color: "var(--green)" }}>
      {children}
    </span>
  );
}

function IconBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "violet" | "amber";
}) {
  const bg = {
    green: "var(--green-soft)",
    violet: "var(--violet-soft)",
    amber: "color-mix(in oklab, var(--amber) 16%, transparent)",
  }[tone];
  const fg = { green: "var(--green)", violet: "var(--violet)", amber: "var(--amber)" }[tone];
  return (
    <span className="grid size-11 place-items-center rounded-[12px]" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}
