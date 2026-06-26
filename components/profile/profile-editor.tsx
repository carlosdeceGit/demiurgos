"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/ai/platforms";
import type { ContentItem } from "@/lib/library/types";
import { detectSocialUrl, isProfileContentType } from "@/lib/apify/post/router";
import type { DetectedUrl } from "@/lib/apify/post/types";

// ── Tipos ──────────────────────────────────────────────────────

type PlatformEntry = {
  key: PlatformKey;
  status: "activo" | "inactivo";
  url: string;
  reference_accounts: string;
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

type Tab = "sobre-mi" | "mis-redes" | "fuentes";

const TABS: { id: Tab; label: string }[] = [
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "mis-redes", label: "Mis redes" },
  { id: "fuentes", label: "Fuentes" },
];

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
          return typeof o.text === "string"
            ? o.text
            : typeof o.name === "string"
              ? o.name
              : "";
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Constantes de plataforma ───────────────────────────────────

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

// ── Estilos ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary";

// ── Componentes de UI ──────────────────────────────────────────

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
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
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
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

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

      {active && (
        <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <LinkIcon className="size-3" aria-hidden />
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

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
              Un perfil por línea. Los analizamos para aprender de su estilo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pestaña Fuentes ────────────────────────────────────────────

type ImportPhase =
  | { tag: "idle" }
  | { tag: "confirming"; detected: DetectedUrl; url: string }
  | { tag: "loading"; label: string; isProfile: boolean }
  | { tag: "error"; message: string };

function FuentesTab({ initialItems }: { initialItems: ContentItem[] }) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ImportPhase>({ tag: "idle" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = url.trim();
    if (!trimmed || phase.tag === "loading") return;
    const detected = detectSocialUrl(trimmed);
    if (detected) {
      setPhase({ tag: "confirming", detected, url: trimmed });
    } else {
      importUrl(trimmed, false);
    }
  }

  async function importUrl(rawUrl: string, isSocial: boolean) {
    const label = isSocial && phase.tag === "confirming"
      ? phase.detected.label
      : rawUrl;
    const isProfile = isSocial && phase.tag === "confirming"
      ? isProfileContentType(phase.detected.contentType)
      : false;

    setPhase({ tag: "loading", label, isProfile });

    const endpoint = isSocial ? "/api/library/import-source" : "/api/library/scrape-url";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
      });
      if (!res.ok) {
        setPhase({ tag: "error", message: await res.text() });
        return;
      }
      const { item } = (await res.json()) as { item: ContentItem };
      setItems((prev) => [item, ...prev]);
      setUrl("");
      setPhase({ tag: "idle" });
    } catch {
      setPhase({ tag: "error", message: "Error de red. Inténtalo de nuevo." });
    }
  }

  function confirmImport() {
    if (phase.tag !== "confirming") return;
    importUrl(phase.url, true);
  }

  function cancelConfirm() {
    setPhase({ tag: "idle" });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const inputDisabled = phase.tag === "loading" || phase.tag === "confirming";

  return (
    <div className="space-y-6">
      {/* Explicación */}
      <div className="rounded-xl border bg-card p-4 space-y-1">
        <p className="text-sm font-medium">¿Para qué sirven las fuentes?</p>
        <p className="text-xs text-muted-foreground">
          Artículos, creadores que sigues, vídeos de referencia, perfiles de LinkedIn…
          El Director analiza el contenido y lo tiene en cuenta al generar tus propuestas.
          También puedes pegar texto directamente en el{" "}
          <Link href="/chat" className="text-primary underline-offset-2 hover:underline">
            chat con el Director
          </Link>
          .
        </p>
      </div>

      {/* Input de URL */}
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Añadir fuente por URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            disabled={inputDisabled}
            onChange={(e) => {
              setUrl(e.target.value);
              if (phase.tag === "error") setPhase({ tag: "idle" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !inputDisabled) handleAdd();
            }}
            placeholder="https://linkedin.com/in/alguien, https://youtube.com/@canal, https://artículo.com…"
            className={`${inputCls} flex-1 disabled:opacity-50`}
          />
          {phase.tag !== "confirming" && phase.tag !== "loading" && (
            <Button
              onClick={handleAdd}
              disabled={!url.trim()}
              className="shrink-0 gap-1.5"
            >
              <Plus className="size-4" />
              Añadir
            </Button>
          )}
        </div>

        {/* Estado: confirmación */}
        {phase.tag === "confirming" && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{phase.detected.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {phase.detected.description}
              </p>
              {phase.detected.limitedAccess && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-[color:var(--brand-amber)]">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Facebook limita el acceso sin login. El resultado puede estar vacío o incompleto.
                </p>
              )}
              {isProfileContentType(phase.detected.contentType) && (
                <p className="mt-1.5 text-xs text-muted-foreground/70">
                  Puede tardar hasta 60 segundos. El Director analizará los posts automáticamente.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelConfirm} className="gap-1.5">
                Cancelar
              </Button>
              <Button size="sm" onClick={confirmImport} className="gap-1.5">
                {isProfileContentType(phase.detected.contentType)
                  ? "Importar 40 posts →"
                  : "Importar →"}
              </Button>
            </div>
          </div>
        )}

        {/* Estado: cargando */}
        {phase.tag === "loading" && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {phase.isProfile ? "Importando y analizando…" : "Leyendo fuente…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phase.isProfile
                    ? "Apify lee los posts · el Director genera el análisis. Hasta 60 s."
                    : "Extrayendo el contenido de la página."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado: error */}
        {phase.tag === "error" && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2">
            <p className="text-xs text-destructive">{phase.message}</p>
            <button
              type="button"
              onClick={() => setPhase({ tag: "idle" })}
              className="ml-auto shrink-0 text-destructive/60 hover:text-destructive"
              aria-label="Cerrar error"
            >
              ×
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground/70">
          Detecta automáticamente LinkedIn, Instagram, TikTok, YouTube, X y Facebook.
          Para el resto de URLs, extrae el texto de la página.
        </p>
      </div>

      {/* Lista de fuentes */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <LinkIcon className="mx-auto size-7 mb-3 opacity-40" aria-hidden />
          <p className="text-sm">Sin fuentes todavía.</p>
          <p className="text-xs mt-1">Añade la primera URL arriba.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/20"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium leading-tight line-clamp-1">
                  {item.title}
                </p>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                    <span className="truncate max-w-[300px]">{item.sourceUrl}</span>
                  </a>
                )}
                <p className="text-xs text-muted-foreground/60">
                  {fmtDate(item.createdAt)}
                  {item.markdownSize > 0 && ` · ${item.markdownSize.toLocaleString("es")} car.`}
                  {item.status === "needs_review" && " · Sin texto extraíble"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                aria-label="Eliminar fuente"
                className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-30"
              >
                {deletingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Para PDFs o documentos, usa la{" "}
        <Link href="/library" className="text-primary underline-offset-2 hover:underline">
          Biblioteca
        </Link>
        . Las fuentes también aparecen allí.
      </p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────

export function ProfileEditor({
  initial,
  initialUrlSources = [],
}: {
  initial: ProfileData;
  initialUrlSources?: ContentItem[];
}) {
  const [tab, setTab] = useState<Tab>("sobre-mi");

  // ── Estado del perfil ──
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
    setPlatforms((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
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
    <div className="space-y-0">
      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sobre mí ── */}
      {tab === "sobre-mi" && (
        <div className="space-y-8 pt-6">
          <Section title="Sobre ti" hint="Tu nombre y qué ofreces al mundo.">
            <Field label="Nombre">
              <input
                className={inputCls}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSaved(false);
                }}
              />
            </Field>
            <Field label="Qué ofreces">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                placeholder="Consultoría de marketing para startups B2B en fase de crecimiento."
                value={offerText}
                onChange={(e) => {
                  setOfferText(e.target.value);
                  setSaved(false);
                }}
              />
            </Field>
          </Section>

          <Section
            title="Posicionamiento"
            hint="Tu diferenciador, propuesta de valor, la categoría en la que juegas."
          >
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Soy el único consultor de IA que combina psicología del comportamiento con automatización real."
              value={positioning}
              onChange={(e) => {
                setPositioning(e.target.value);
                setSaved(false);
              }}
            />
          </Section>

          <Section
            title="Pilares de contenido"
            hint="Los grandes temas sobre los que siempre hablas. Uno por línea."
          >
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder={"Liderazgo sin humo\nProductividad real\nNegocio y sistemas"}
              value={pillars}
              onChange={(e) => {
                setPillars(e.target.value);
                setSaved(false);
              }}
            />
          </Section>

          <Section
            title="Audiencia"
            hint="Quién te lee, cuál es su dolor y qué aspira conseguir."
          >
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Fundadores de startups de 25 a 40 años que quieren crecer sin perder la cabeza."
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value);
                setSaved(false);
              }}
            />
          </Section>

          <Section
            title="Voz y tono"
            hint="Cómo hablas: directo, irónico, formal, cercano, analítico… y qué evitas."
          >
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Directo y sin filtros. Uso el humor negro ocasionalmente. Nunca hablo de éxito fácil."
              value={voice}
              onChange={(e) => {
                setVoice(e.target.value);
                setSaved(false);
              }}
            />
          </Section>

          <Section
            title="Guía de estilo"
            hint="Reglas específicas, palabras prohibidas, formatos favoritos."
          >
            <textarea
              className={`${inputCls} min-h-[120px] resize-none`}
              placeholder={"Nunca empezar un post con Hoy\nSiempre incluir datos concretos\nProhibido: disruptivo, ecosistema, sinergia"}
              value={tacit}
              onChange={(e) => {
                setTacit(e.target.value);
                setSaved(false);
              }}
            />
          </Section>

          <Section
            title="Objetivos"
            hint="Qué quieres conseguir con tu presencia en redes. A 3 o 6 meses vista."
          >
            <textarea
              className={`${inputCls} min-h-[100px] resize-none`}
              placeholder="Llegar a 5.000 seguidores en LinkedIn y generar 3 leads cualificados al mes desde contenido."
              value={goals}
              onChange={(e) => {
                setGoals(e.target.value);
                setSaved(false);
              }}
            />
          </Section>
        </div>
      )}

      {/* ── Mis redes ── */}
      {tab === "mis-redes" && (
        <div className="space-y-8 pt-6">
          <Section
            title="Redes sociales"
            hint="Activa las redes donde publicas, añade el enlace a tu perfil y los creadores que te inspiran en cada una."
          >
            <div className="space-y-2">
              {platforms.map((entry) => (
                <PlatformBlock
                  key={entry.key}
                  entry={entry}
                  onChange={(patch) => {
                    updatePlatform(entry.key, patch);
                    setSaved(false);
                  }}
                />
              ))}
            </div>
          </Section>

          <Section
            title="Referentes generales"
            hint="Creadores o cuentas que admiras más allá de una red concreta. Uno por línea."
          >
            <textarea
              className={`${inputCls} min-h-[80px] resize-none`}
              placeholder={"Paul Graham\nMorgan Housel\nAli Abdaal"}
              value={referents}
              onChange={(e) => {
                setReferents(e.target.value);
                setSaved(false);
              }}
            />
          </Section>
        </div>
      )}

      {/* ── Fuentes ── */}
      {tab === "fuentes" && (
        <div className="pt-6">
          <FuentesTab initialItems={initialUrlSources} />
        </div>
      )}

      {/* ── Barra de guardado (Sobre mí y Mis redes) ── */}
      {tab !== "fuentes" && (
        <div className="sticky bottom-0 border-t bg-background/80 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="size-4" />
                  Guardado
                </span>
              )}
              {tab === "mis-redes" && syncDone && (
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="size-4" />
                  Sincronización iniciada (5–10 min)
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {tab === "mis-redes" && (
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncing || pending}
                  className="gap-2 rounded-full"
                  title="Analiza tus perfiles y los referentes con Apify"
                >
                  <RefreshCw
                    className={`size-4 ${syncing ? "animate-spin" : ""}`}
                  />
                  {syncing ? "Iniciando…" : "Sincronizar redes"}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={pending}
                className="gap-2 rounded-full"
              >
                <Save className="size-4" />
                {pending ? "Guardando…" : "Guardar perfil"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
