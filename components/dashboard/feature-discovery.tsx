"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Lightbulb,
  LayoutGrid,
  FolderOpen,
  ArrowRight,
  X,
} from "lucide-react";

const STORAGE_KEY = "dmg:feature-discovery-dismissed";

type Feature = {
  icon: typeof MessageSquare;
  label: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  accent: string;
};

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    label: "Director",
    title: "Tu estratega de contenido",
    description:
      "Pídele al Director tu plan de contenido semanal. Conoce tu posicionamiento, tono y plataformas.",
    cta: "Abrir Director",
    href: "/chat",
    accent: "text-primary",
  },
  {
    icon: Lightbulb,
    label: "Ideas",
    title: "Banco de ideas de nicho",
    description:
      "Ideas generadas en la frontera de tu sector. Deséchalas, guárdalas o conviértelas en propuestas.",
    cta: "Ver Ideas",
    href: "/ideas",
    accent: "text-[var(--brand-violet)]",
  },
  {
    icon: LayoutGrid,
    label: "Propuestas",
    title: "Contenido listo para publicar",
    description:
      "Guiones, horarios y calendario editorial. Cada propuesta tiene su «por qué ahora».",
    cta: "Ver Propuestas",
    href: "/propuestas",
    accent: "text-primary",
  },
  {
    icon: FolderOpen,
    label: "Biblioteca",
    title: "Tu base de conocimiento",
    description:
      "Sube artículos, vídeos o notas. El Director los usará como contexto para personalizar tus propuestas.",
    cta: "Ir a Biblioteca",
    href: "/library",
    accent: "text-[var(--brand-amber)]",
  },
];

export function FeatureDiscovery() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage solo existe en cliente: leerlo en el initializer de useState
    // provocaría hydration mismatch. Sincronizar este store externo en un effect
    // es el patrón correcto (la regla no distingue este caso legítimo).
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // SSR / private browsing — don't show
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section
      aria-label="Descubre las funciones de Demiurgos"
      className="bg-card rounded-xl border p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">¿Qué puedes hacer aquí?</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Demiurgos tiene cuatro áreas. Cada una tiene su rol.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar panel de funciones"
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded-lg p-1 transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, label, title, description, cta, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="group bg-background hover:border-primary/40 flex flex-col gap-2 rounded-xl border p-4 transition-colors"
          >
            <div className={`${accent} flex items-center gap-2`}>
              <Icon className="size-4" aria-hidden />
              <span className="font-mono text-[10px] tracking-wider uppercase">{label}</span>
            </div>

            <p className="text-sm font-semibold leading-snug">{title}</p>
            <p className="text-muted-foreground flex-1 text-xs leading-relaxed">
              {description}
            </p>

            <span className="text-primary mt-1 flex items-center gap-1 text-xs font-medium">
              {cta}
              <ArrowRight
                className="size-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
