"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2, Link, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/ai/platforms";

// ── Tipos ──────────────────────────────────────────────────────

type PlatformEntry = {
  key: PlatformKey;
  status: "activo" | "inactivo";
  url: string;
  reference_accounts: string; // newline-separated handles or URLs
  role?: string;
  format?: string;
};

type ProfileData = {
  display_name: string;
  offer: Record<string, unknown>;
  positioning: unknown;
  pillars: unknown;
  audience: unknown;
  voice: unknown;
  tacit: unknown;
  goals: unknown;
  platforms: Array<{
    key?: PlatformKey;
    platform?: PlatformKey;
    status?: string;
    role?: string;
    format?: string;
    url?: string;
    reference_accounts?: string | string[];
  }>;
  referents: unknown;
};

// ── Helpers ────────────────────────────────────────────────────

function toText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    const v = val as Record<string, unknown>;
    return typeof v.text === "string" ? v.text : "";
  }
  return "";
}

function toLines(val: unknown): string {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const o = item as Record<string, unknown>;
          return typeof o.text === "string" ? o.text : typeof o.name === "string" ? o.name : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return toText(val);
}

function refAccountsToString(val: string | string[] | undefined): string {
  if (!val) return "";
  if (Array.isArray(val)) return val.join("\n");
  return val;
}

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X / Twitter",
  substack: "Substack",
};

const PLATFORM_PLACEHOLDER: Record<PlatformKey, string> = {
  linkedin: "https://linkedin.com/in/tu-perfil",
  youtube: "https://youtube.com/@tucanal",
  tiktok: "https://tiktok.com/@tuusuario",
  instagram: "https://instagram.com/tuusuario",
  x: "https://x.com/tuusuario",
  substack: "https://tusubstack.substack.com",
};

const REFERENTS_PLACEHOLDER: Record<PlatformKey, string> = {
  linkedin: "https://linkedin.com/in/referente1\nhttps://linkedin.com/in/referente2",
  youtube: "https://youtube.com/@canal1\nhttps://youtube.com/@canal2",
  tiktok: "https://tiktok.com/@cuenta1\nhttps://tiktok.com/@cuenta2",
  instagram: "https://instagram.com/cuenta1\nhttps://instagram.com/cuenta2",
  x: "https://x.com/cuenta1\nhttps://x.com/cuenta2",
  substack: "https://autor1.substack.com\nhttps://autor2.substack.com",
};

function initPlatforms(raw: ProfileData["platforms"]): PlatformEntry[] {
  return PLATFORM_KEYS.map((key) => {
    const found = raw?.find((p) => (p.key ?? p.platform) === key);
    const isActive =
      found?.status === "activo" ||
      found?.status === "active" ||
      found?.status === "pending_analysis";
    return {
      key,
      status: isActive ? "activo" : "inactivo",
      url: found?.url ?? "",
      reference_accounts: refAccountsToString(found?.reference_accounts),
      role: found?.role,
      format: found?.format,
    };
  });
}

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
    <section className="space-y-3">
      <div>
        <h2 className="font-serif text-base">{title}</h2>
        {hint && <p className="text-muted-foreground text-xs mt-0.5">{hint}</p>}
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
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary";

// ── Bloque de plataforma ───────────────────────────────────────

function PlatformBlock({
  entry,
  onChange,
}: {
  entry: PlatformEntry;
  onChange: (updated: Partial<PlatformEntry>) => void;
}) {
  const active = entry.status === "activo";

  return (
    <div
      className={`rounded-xl border transition-all ${
        active ? "border-primary/30 bg-card" : "border-border bg-background/50"
      }`}
    >
      {/* Cabecera / toggle */}
      <button
        type="button"
        onClick={() => onChange({ status: active ? "inactivo" : "activo" })}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span
          className={`text-sm font-medium transition-colors ${
            active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {PLATFORM_LABEL[entry.key]}
        </span>
        <span
          className={`size-2 rounded-full transition-all ${
            active ? "bg-primary shadow-[0_0_6px_var(--color-primary)]" : "bg-border"
          }`}
          aria-hidden
        />
      </button>

      {/* Campos expandibles */}
      {active && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
          {/* URL propia */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Link className="size-3" aria-hidden />
              Tu perfil
            </label>
            <input
              type="url"
              className={inputCls}
              placeholder={PLATFORM_PLACEHOLDER[entry.key]}
              value={entry.url}
              onChange={(e) => onChange({ url: e.target.value })}
            />
          </div>

          {/* Referentes en esta red */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="size-3" aria-hidden />
              Perfiles que te inspiran en esta red
            </label>
            <textarea
              className={`${inputCls} min-h-[72px] resize-none`}
              placeholder={REFERENTS_PLACEHOLDER[entry.key]}
              value={entry.reference_accounts}
              onChange={(e) => onChange({ reference_accounts: e.target.value })}
            />
            <p className="text-xs text-muted-foreground/60">
              Un perfil por línea. Los analizamos en segundo plano para aprender de su estilo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const [platforms, setPlatforms] = useState<PlatformEntry[]>(() =>
    initPlatforms(initial.platforms ?? [])
  );

  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  function updatePlatform(key: PlatformKey, patch: Partial<PlatformEntry>) {
    setPlatforms((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
    setSaved(false);
  }

  function handleChange() {
    setSaved(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncDone(false);
    try {
      await fetch("/api/apify/scrape", { method: "POST" });
      setSyncDone(true);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    const platformsPayload = platforms.map((p) => ({
      key: p.key,
      status: p.status,
      url: p.url.trim(),
      role: p.role ?? "principal",
      format: p.format ?? "",
      reference_accounts: p.reference_accounts
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
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
      platforms: platformsPayload,
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
      <Section title="Sobre ti" hint="Tu nombre y qué ofreces al mundo.">
        <Field label="Nombre">
          <input
            className={inputCls}
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); handleChange(); }}
          />
        </Field>
        <Field label="Qué ofreces">
          <textarea
            className={`${inputCls} min-h-[80px] resize-none`}
            placeholder="Consultoría de marketing para startups B2B en fase de crecimiento. Ayudo a los fundadores a construir sistemas de captación que no dependen de su tiempo."
            value={offerText}
            onChange={(e) => { setOfferText(e.target.value); handleChange(); }}
          />
        </Field>
      </Section>

      {/* Posicionamiento */}
      <Section
        title="Posicionamiento"
        hint="Tu diferenciador, propuesta de valor, la categoría en la que juegas."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Soy el único consultor de IA que combina psicología del comportamiento con automatización real. No vendo promesas: vendo sistemas que ya funcionan en más de veinte empresas."
          value={positioning}
          onChange={(e) => { setPositioning(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Pilares */}
      <Section
        title="Pilares de contenido"
        hint="Los grandes temas sobre los que siempre hablas. Uno por línea."
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
          placeholder="Fundadores de startups de 25 a 40 años que quieren crecer sin perder la cabeza. Su principal miedo es escalar y perder el control de la calidad."
          value={audience}
          onChange={(e) => { setAudience(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Voz y tono */}
      <Section
        title="Voz y tono"
        hint="Cómo hablas: directo, irónico, formal, cercano, analítico... y qué evitas."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Directo y sin filtros. Uso el humor negro ocasionalmente. Nunca hablo de éxito fácil ni de términos tipo mindset. Evito emojis en LinkedIn y los posts que empiezan con una pregunta retórica."
          value={voice}
          onChange={(e) => { setVoice(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Guía de estilo */}
      <Section
        title="Guía de estilo"
        hint="Reglas específicas, palabras prohibidas, formatos favoritos."
      >
        <textarea
          className={`${inputCls} min-h-[120px] resize-none`}
          placeholder={"Nunca empezar un post con Hoy\nSiempre incluir datos concretos\nMáximo 3 puntos en un carrusel\nProhibido: disruptivo, ecosistema, sinergia"}
          value={tacit}
          onChange={(e) => { setTacit(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Plataformas */}
      <Section
        title="Redes sociales"
        hint="Activa las redes donde publicas, añade el enlace a tu perfil y los creadores que te inspiran en cada una."
      >
        <div className="space-y-2">
          {platforms.map((entry) => (
            <PlatformBlock
              key={entry.key}
              entry={entry}
              onChange={(patch) => updatePlatform(entry.key, patch)}
            />
          ))}
        </div>
      </Section>

      {/* Referentes generales */}
      <Section
        title="Referentes generales"
        hint="Creadores o cuentas que admiras más allá de una red concreta. Uno por línea."
      >
        <textarea
          className={`${inputCls} min-h-[80px] resize-none`}
          placeholder={"Paul Graham\nMorgan Housel\nAli Abdaal"}
          value={referents}
          onChange={(e) => { setReferents(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Objetivos */}
      <Section
        title="Objetivos"
        hint="Qué quieres conseguir con tu presencia en redes. A 3 o 6 meses vista."
      >
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Llegar a 5.000 seguidores en LinkedIn, generar 3 leads cualificados al mes desde contenido y posicionarme como referente en IA aplicada a negocios físicos."
          value={goals}
          onChange={(e) => { setGoals(e.target.value); handleChange(); }}
        />
      </Section>

      {/* Save */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Guardado
            </span>
          )}
          {syncDone && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Sincronización iniciada (5–10 min)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing || pending}
            className="rounded-full gap-2"
            title="Analiza tus perfiles y los referentes con Apify"
          >
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Iniciando…" : "Sincronizar redes"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={pending}
            className="rounded-full gap-2"
          >
            <Save className="size-4" />
            {pending ? "Guardando…" : "Guardar perfil"}
          </Button>
        </div>
      </div>
    </div>
  );
}
