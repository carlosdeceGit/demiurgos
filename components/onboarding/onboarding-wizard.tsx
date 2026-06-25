"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Plus, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";

// ── Constantes ─────────────────────────────────────────────────

const CREATOR_TYPES = ["Emprendedor", "Creador", "Profesional", "Marca", "Otro"] as const;

const TONE_CHIPS = [
  "Directo",
  "Reflexivo",
  "Provocador",
  "Cercano",
  "Técnico",
  "Irónico",
  "Educativo",
  "Inspirador",
] as const;

const FREQUENCIES = ["Cada día", "3× semana", "Semanal", "Aún no sé"] as const;

// ── Tipos ──────────────────────────────────────────────────────

type Pillar = { topic: string; why_you: string };

// ── Chip auxiliar ──────────────────────────────────────────────

function Chip({
  label,
  selected,
  onToggle,
  multi = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  multi?: boolean;
}) {
  void multi;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1.5 text-sm transition-all duration-150 ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ── Subcomponentes de cada paso ────────────────────────────────

function StepWho({
  displayName,
  setDisplayName,
  positioningDesc,
  setPositioningDesc,
  creatorType,
  setCreatorType,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  positioningDesc: string;
  setPositioningDesc: (v: string) => void;
  creatorType: string;
  setCreatorType: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl leading-snug">
          Hola. ¿Cómo te <em className="text-primary not-italic">llamas</em>?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo tu nombre o el nombre con el que publicas.
        </p>
      </div>

      <input
        type="text"
        placeholder="Tu nombre"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="w-full rounded-xl border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          ¿A qué te dedicas y en qué quieres que te recuerden?
        </label>
        <p className="text-xs text-muted-foreground">
          Esto ayuda al Director a no proponerte lo mismo que le propone a cualquiera.
        </p>
        <textarea
          placeholder="Ej: Soy consultor de estrategia digital para pymes. Quiero que me recuerden como el que desmonta el humo y da pasos reales."
          value={positioningDesc}
          onChange={(e) => setPositioningDesc(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          ¿Con qué te identificas más?
        </label>
        <div className="flex flex-wrap gap-2">
          {CREATOR_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={creatorType === t}
              onToggle={() => setCreatorType(creatorType === t ? "" : t)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepPillars({
  pillars,
  setPillars,
}: {
  pillars: Pillar[];
  setPillars: (p: Pillar[]) => void;
}) {
  function update(i: number, field: keyof Pillar, val: string) {
    const next = pillars.map((p, idx) => (idx === i ? { ...p, [field]: val } : p));
    setPillars(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl leading-snug">
          ¿De qué <em className="text-primary not-italic">hablas</em>?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          3 temas sobre los que publicas. El tercero es opcional.
        </p>
      </div>

      {pillars.map((p, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-foreground">
              {i < 2 ? "Tema" : "Tema (opcional)"}
            </span>
          </div>
          <input
            type="text"
            placeholder={
              i === 0
                ? "Ej: Marketing de contenidos"
                : i === 1
                  ? "Ej: Productividad para freelancers"
                  : "Ej: Finanzas personales"
            }
            value={p.topic}
            onChange={(e) => update(i, "topic", e.target.value)}
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {p.topic.trim() && (
            <input
              type="text"
              placeholder="¿Por qué tú y no otro que habla de lo mismo?"
              value={p.why_you}
              onChange={(e) => update(i, "why_you", e.target.value)}
              className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepVoice({
  toneChips,
  setToneChips,
  neverDo,
  setNeverDo,
}: {
  toneChips: string[];
  setToneChips: (v: string[]) => void;
  neverDo: string;
  setNeverDo: (v: string) => void;
}) {
  function toggleChip(chip: string) {
    setToneChips(
      toneChips.includes(chip)
        ? toneChips.filter((c) => c !== chip)
        : [...toneChips, chip]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl leading-snug">
          ¿Cómo es tu <em className="text-primary not-italic">voz</em>?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige las palabras que mejor describen cómo escribes o hablas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TONE_CHIPS.map((chip) => (
          <Chip
            key={chip}
            label={chip}
            selected={toneChips.includes(chip)}
            onToggle={() => toggleChip(chip)}
            multi
          />
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          ¿Qué nunca harías en tu contenido?
        </label>
        <p className="text-xs text-muted-foreground">
          Líneas rojas, temas que evitas, formatos que rechazas. Lo que nadie más sabe de ti.
        </p>
        <textarea
          placeholder="Ej: Nunca haría contenido motivacional vacío. No uso frases como 'salir de tu zona de confort'. No vendo cursos de hacerse rico."
          value={neverDo}
          onChange={(e) => setNeverDo(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

function StepNetworks({
  networkUrls,
  setNetworkUrls,
  frequency,
  setFrequency,
}: {
  networkUrls: string[];
  setNetworkUrls: (v: string[]) => void;
  frequency: string;
  setFrequency: (v: string) => void;
}) {
  function updateUrl(i: number, val: string) {
    const next = networkUrls.map((u, idx) => (idx === i ? val : u));
    setNetworkUrls(next);
  }

  function addUrl() {
    setNetworkUrls([...networkUrls, ""]);
  }

  function removeUrl(i: number) {
    if (networkUrls.length <= 1) return;
    setNetworkUrls(networkUrls.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl leading-snug">
          ¿Dónde <em className="text-primary not-italic">publicas</em>?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pega las URLs de tus perfiles. El sistema los analizará en segundo plano.
        </p>
      </div>

      <div className="space-y-2">
        {networkUrls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://instagram.com/tuperfil"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {networkUrls.length > 1 && (
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Eliminar"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addUrl}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3.5" />
          Añadir otra red
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          ¿Con qué frecuencia quieres publicar?
        </label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <Chip
              key={f}
              label={f}
              selected={frequency === f}
              onToggle={() => setFrequency(frequency === f ? "" : f)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              Análisis en segundo plano
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Analizaremos tus perfiles públicos para detectar temas, formatos y
              patrones. Te avisaremos cuando esté listo (5–10 min).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wizard principal ───────────────────────────────────────────

const TOTAL_STEPS = 4;

export function OnboardingWizard({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [positioningDesc, setPositioningDesc] = useState("");
  const [creatorType, setCreatorType] = useState("");

  // Step 2
  const [pillars, setPillars] = useState<Pillar[]>([
    { topic: "", why_you: "" },
    { topic: "", why_you: "" },
    { topic: "", why_you: "" },
  ]);

  // Step 3
  const [toneChips, setToneChips] = useState<string[]>([]);
  const [neverDo, setNeverDo] = useState("");

  // Step 4
  const [networkUrls, setNetworkUrls] = useState<string[]>(["", ""]);
  const [frequency, setFrequency] = useState("");

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canContinue(): boolean {
    if (step === 0) return displayName.trim().length > 0 && positioningDesc.trim().length > 0;
    if (step === 1) return pillars[0].topic.trim().length > 0;
    if (step === 2) return toneChips.length > 0 || neverDo.trim().length > 0;
    if (step === 3) return true; // el paso 4 siempre permite avanzar (campos opcionales)
    return false;
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      void handleSubmit();
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  async function handleSubmit() {
    if (demoMode) {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 800));
      setSaving(false);
      setStep(TOTAL_STEPS); // estado "completado" en demo
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          positioning: {
            description: positioningDesc.trim(),
            creator_type: creatorType,
          },
          pillars: pillars
            .filter((p) => p.topic.trim())
            .map((p) => ({ topic: p.topic.trim(), why_you: p.why_you.trim() })),
          voice: {
            tone_chips: toneChips,
            never_do: neverDo.trim(),
          },
          network_urls: networkUrls.filter((u) => u.trim()),
          goals: { frequency },
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Algo ha fallado. Inténtalo de nuevo.");
        return;
      }

      router.push("/dashboard?welcome=1");
    } catch {
      setError("Sin conexión. Comprueba tu red e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
  };

  if (demoMode && step === TOTAL_STEPS) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
        <Logo size={36} />
        <div className="mt-10 flex size-14 items-center justify-center rounded-full bg-primary/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h2 className="dmg-serif mt-6 text-2xl font-semibold">¡Perfil creado!</h2>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Así terminaría el onboarding real. En producción el usuario aterrizaría en el dashboard con su sesión activa.
        </p>
        <button
          type="button"
          onClick={() => { setStep(0); setDisplayName(""); setPositioningDesc(""); setCreatorType(""); setPillars([{ topic: "", why_you: "" }, { topic: "", why_you: "" }, { topic: "", why_you: "" }]); setToneChips([]); setNeverDo(""); setNetworkUrls(["", ""]); setFrequency(""); }}
          className="mt-8 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
        >
          ← Volver a empezar la demo
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10">
        <Logo size={36} />
      </div>

      {/* Barra de progreso */}
      <div className="mb-8 flex w-full max-w-sm gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemax={TOTAL_STEPS}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="w-full max-w-sm overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.21, 0.5, 0.25, 1] }}
          >
            {step === 0 && (
              <StepWho
                displayName={displayName}
                setDisplayName={setDisplayName}
                positioningDesc={positioningDesc}
                setPositioningDesc={setPositioningDesc}
                creatorType={creatorType}
                setCreatorType={setCreatorType}
              />
            )}
            {step === 1 && (
              <StepPillars pillars={pillars} setPillars={setPillars} />
            )}
            {step === 2 && (
              <StepVoice
                toneChips={toneChips}
                setToneChips={setToneChips}
                neverDo={neverDo}
                setNeverDo={setNeverDo}
              />
            )}
            {step === 3 && (
              <StepNetworks
                networkUrls={networkUrls}
                setNetworkUrls={setNetworkUrls}
                frequency={frequency}
                setFrequency={setFrequency}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 w-full max-w-sm text-sm text-destructive">{error}</p>
      )}

      {/* Navegación */}
      <div className="mt-8 flex w-full max-w-sm items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Atrás
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {/* "Ahora no" solo en pasos 2 y 3 */}
          {(step === 2 || step === 3) && step < TOTAL_STEPS - 1 && (
            <button
              type="button"
              onClick={() => {
                setDirection(1);
                setStep((s) => s + 1);
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ahora no
            </button>
          )}

          <Button
            onClick={goNext}
            disabled={!canContinue() || saving}
            className="gap-2 rounded-full px-6"
          >
            {step === TOTAL_STEPS - 1
              ? saving
                ? "Guardando…"
                : "Empezar"
              : "Continuar"}
            {step < TOTAL_STEPS - 1 && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Tiempo estimado solo en el primer paso */}
      {step === 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Listo en menos de 5 minutos.
        </p>
      )}
    </div>
  );
}
