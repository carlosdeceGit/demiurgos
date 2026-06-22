import {
  getDemoProfile,
  proposalsFor,
  signalsFor,
  type DemoPlatformKey,
  type DemoProposal,
} from "@/demo/fixtures";

const PLATFORM_LABELS: Record<DemoPlatformKey, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  substack: "Substack",
};

const STATUS_STYLE: Record<DemoProposal["status"], string> = {
  nueva: "bg-brand-violet/10 text-brand-violet",
  aceptada: "bg-brand-accent/10 text-brand-accent",
  descartada: "bg-muted text-muted-foreground",
};

function ProposalCard({ p }: { p: DemoProposal }) {
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-secondary rounded-full px-2 py-0.5 font-medium">
          {PLATFORM_LABELS[p.platform]}
        </span>
        <span className="text-muted-foreground">{p.day}</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[p.status]}`}
        >
          {p.status}
        </span>
      </div>

      <h3 className="text-sm leading-snug font-semibold">{p.idea}</h3>

      <div className="border-brand-amber/60 bg-brand-amber/5 rounded-md border-l-2 px-3 py-2">
        <p className="text-brand-amber font-mono text-[10px] tracking-wider uppercase">
          Por qué ahora
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {p.whyNow}
        </p>
      </div>

      <p className="text-muted-foreground line-clamp-3 text-xs whitespace-pre-wrap">
        {p.script}
      </p>
      <p className="text-muted-foreground mt-auto text-xs">🕒 {p.slot}</p>
    </article>
  );
}

export function DemoDashboard({ profileId }: { profileId: string }) {
  const profile = getDemoProfile(profileId);
  const proposals = proposalsFor(profileId);
  const signals = signalsFor(profileId);
  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      {/* Estado del perfil */}
      <section className="bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl">{profile.displayName}</h2>
            <p className="text-muted-foreground text-sm">{profile.sector}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Perfil completo</p>
            <p className="text-2xl font-semibold">{profile.completeness}%</p>
          </div>
        </div>
        <div className="bg-secondary mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-brand-accent h-full rounded-full"
            style={{ width: `${profile.completeness}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.activePlatforms.map((k) => (
            <span
              key={k}
              className="bg-secondary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <span className="bg-brand-accent size-1.5 rounded-full" />
              {PLATFORM_LABELS[k]}
            </span>
          ))}
        </div>
      </section>

      {/* Propuestas de la semana */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Propuestas de la semana</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Señales recientes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Señales recientes</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {signals.map((s) => (
            <li key={s.id} className="bg-card rounded-lg border p-3 text-sm">
              <p>{s.content}</p>
              <span className="text-muted-foreground mt-1 inline-block font-mono text-[10px] tracking-wide uppercase">
                {s.source}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
