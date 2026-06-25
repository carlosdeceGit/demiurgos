import { Check, Target, Users, Volume2 } from "lucide-react";
import { getDemoProfile } from "@/demo/fixtures";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  substack: "Substack",
};

export function DemoPerfil({ profileId }: { profileId: string }) {
  const profile = getDemoProfile(profileId);
  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">{profile.displayName}</h1>
          <p className="text-muted-foreground text-sm">{profile.sector}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Perfil completo</p>
          <p className="text-2xl font-semibold">{profile.completeness}%</p>
        </div>
      </header>

      {/* Completitud */}
      <div className="bg-secondary h-2 overflow-hidden rounded-full">
        <div
          className="bg-brand-accent h-full rounded-full"
          style={{ width: `${profile.completeness}%` }}
        />
      </div>

      {/* Posicionamiento */}
      <section className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <Target className="size-3.5" aria-hidden />
          Posicionamiento
        </div>
        <p className="text-sm leading-relaxed">{profile.positioning}</p>
      </section>

      {/* Audiencia */}
      <section className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <Users className="size-3.5" aria-hidden />
          Audiencia
        </div>
        <p className="text-sm leading-relaxed">{profile.audience}</p>
      </section>

      {/* Pilares */}
      <section className="bg-card rounded-xl border p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Pilares de contenido
        </p>
        <div className="space-y-4">
          {profile.pillars.map((p, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{p.why}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voz */}
      <section className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <Volume2 className="size-3.5" aria-hidden />
          Reglas de voz
        </div>
        <ul className="space-y-2">
          {profile.voice.map((v, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              {v}
            </li>
          ))}
        </ul>
      </section>

      {/* Plataformas */}
      <section className="bg-card rounded-xl border p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Plataformas activas
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.activePlatforms.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium"
            >
              <span className="bg-brand-accent size-1.5 rounded-full" />
              {PLATFORM_LABELS[k] ?? k}
            </span>
          ))}
        </div>
      </section>

      <p className="text-muted-foreground text-center text-xs">
        Edición de perfil no disponible en modo demo.
      </p>
    </div>
  );
}
