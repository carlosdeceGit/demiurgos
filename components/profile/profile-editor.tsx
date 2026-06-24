"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/ai/platforms";

// ── Tipos ──────────────────────────────────────────────────────

type ProfileData = {
  display_name: string;
  offer: Record<string, unknown>;
  positioning: unknown;
  pillars: unknown;
  audience: unknown;
  voice: unknown;
  tacit: unknown;
  goals: unknown;
  platforms: Array<{ key: PlatformKey; status?: string; role?: string }>;
  referents: unknown;
};

// ── Helpers ────────────────────────────────────────────────────

function toText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    const v = val as Record<string, unknown>;
    return typeof v.text === "string" ? v.text : JSON.stringify(val, null, 2);
  }
  return JSON.stringify(val, null, 2);
}

function toLines(val: unknown): string {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const o = item as Record<string, unknown>;
          return typeof o.text === "string" ? o.text : JSON.stringify(o);
        }
        return String(item);
      })
      .join("\n");
  }
  return toText(val);
}

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X / Twitter",
  substack: "Substack",
};

// ── Sección UI ─────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="font-serif text-base">{title}</h2>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary";

// ── Componente principal ───────────────────────────────────────

export function ProfileEditor({ initial }: { initial: ProfileData }) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [offerText, setOfferText] = useState(
    typeof (initial.offer as Record<string, unknown>)?.description === "string"
      ? ((initial.offer as Record<string, unknown>).description as string)
      : ""
  );
  const [positioning, setPositioning] = useState(toText(initial.positioning));
  const [pillars, setPillars] = useState(toLines(initial.pillars));
  const [audience, setAudience] = useState(toText(initial.audience));
  const [voice, setVoice] = useState(toText(initial.voice));
  const [tacit, setTacit] = useState(toText(initial.tacit));
  const [goals, setGoals] = useState(toText(initial.goals));
  const [referents, setReferents] = useState(toLines(initial.referents));

  // Platforms as a set of active keys
  const initialActive = new Set(
    (initial.platforms ?? [])
      .filter((p) => p.status === "activo" || p.status === "active")
      .map((p) => p.key)
  );
  const [activePlatforms, setActivePlatforms] = useState<Set<PlatformKey>>(initialActive);

  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function togglePlatform(key: PlatformKey) {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSaved(false);
  }

  function handleChange() {
    setSaved(false);
  }

  async function handleSave() {
    const platforms = PLATFORM_KEYS.map((key) => ({
      key,
      status: activePlatforms.has(key) ? "activo" : "inactivo",
    }));

    const patch = {
      display_name: displayName.trim() || initial.display_name,
      offer: { description: offerText.trim() },
      positioning: positioning.trim() ? { text: positioning.trim() } : {},
      pillars: pillars
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      audience: audience.trim() ? { text: audience.trim() } : {},
      voice: voice.trim() ? { text: voice.trim() } : {},
      tacit: tacit.trim() ? { text: tacit.trim() } : {},
      goals: goals.trim() ? { text: goals.trim() } : {},
      platforms,
      referents: referents
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      {/* Sobre ti */}
      <Section
        title="Sobre ti"
        hint="Tu nombre y qué ofreces al mundo."
      >
        <Field label="Nombre">
          <input
            className={inputCls}
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); handleChange(); }}
          />
        </Field>
        <Field label="Qué ofreces / vendes">
          <textarea
            className={`${inputCls} min-h-[80px] resize-none`}
            placeholder="Ej: Consultoría de marketing para startups B2B en fase de crecimiento."
            value={offerText}
            onChange={(e) => { setOfferText(e.target.value); handleChange(); }}
          />
        </Field>
      </Section>

      {/* Posicionamiento */}
      <Section
        title="Posicionamiento"
        hint="Tu diferenciador, propuesta de valor, categoría en la que juegas."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Ej: El único consultor de IA que combina psicología del comportamiento con automatización. Mi misión es..."
          value={positioning}
          onChange={(e) => { setPositioning(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Pilares */}
      <Section
        title="Pilares de contenido"
        hint="Un pilar por línea. Son los grandes temas sobre los que siempre hablas."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder={"Liderazgo sin humo\nProductividad real\nNegocio y sistemas\nAprendizaje continuo"}
          value={pillars}
          onChange={(e) => { setPillars(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Audiencia */}
      <Section
        title="Audiencia"
        hint="Quién te lee, cuál es su dolor y qué aspira conseguir."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Ej: Fundadores de startups de 25-40 años que quieren crecer sin perder la cabeza. Su principal miedo es..."
          value={audience}
          onChange={(e) => { setAudience(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Voz y tono */}
      <Section
        title="Voz y tono"
        hint="Cómo hablas: directx, irónicx, formal, cercano, analítico... y qué evitas."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Ej: Directo y sin filtros. Uso el humor negro ocasionalmente. Nunca hablo de éxito fácil ni términos tipo 'mindset'. Evito emojis en LinkedIn..."
          value={voice}
          onChange={(e) => { setVoice(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Guía de estilo / Tácito */}
      <Section
        title="Guía de estilo"
        hint="Reglas específicas, palabras prohibidas, formatos favoritos, detalles que el Director debe recordar siempre."
      >
        <textarea
          className={`${inputCls} min-h-[120px] resize-none`}
          placeholder={"Ej:\n- Nunca empezar un post con 'Hoy'\n- Siempre incluir datos concretos\n- Máximo 3 puntos en un carrusel\n- Prohibido: 'disruptivo', 'ecosistema', 'sinergia'"}
          value={tacit}
          onChange={(e) => { setTacit(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Plataformas */}
      <Section
        title="Plataformas activas"
        hint="Dónde publicas de verdad. El Director solo generará contenido para estas redes."
      >
        <div className="flex flex-wrap gap-2">
          {PLATFORM_KEYS.map((key) => {
            const active = activePlatforms.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePlatform(key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {PLATFORM_LABEL[key]}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Referentes */}
      <Section
        title="Referentes"
        hint="Cuentas o creadores que admiras. Uno por línea."
      >
        <textarea
          className={`${inputCls} min-h-[80px] resize-none`}
          placeholder={"@paulgraham\nMorgan Housel\nAli Abdaal"}
          value={referents}
          onChange={(e) => { setReferents(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Objetivos */}
      <Section
        title="Objetivos"
        hint="Qué quieres conseguir con tu presencia en redes. A 3-6 meses vista."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Ej: Llegar a 5.000 seguidores en LinkedIn, generar 3 leads cualificados al mes desde contenido, posicionarme como referente en IA aplicada a negocios físicos..."
          value={goals}
          onChange={(e) => { setGoals(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Save */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t flex items-center justify-between gap-4">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-primary">
            <CheckCircle2 className="size-4" />
            Guardado
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={pending}
          className="ml-auto rounded-full gap-2"
        >
          <Save className="size-4" />
          {pending ? "Guardando…" : "Guardar perfil"}
        </Button>
      </div>
    </div>
  );
}
