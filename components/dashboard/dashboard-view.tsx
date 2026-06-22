import type { PlatformKey } from "@/lib/ai/platforms";

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  substack: "Substack",
};

export type DashboardProposal = {
  id: string;
  platform: string | null;
  idea: string | null;
  whyNow: string | null;
  script: string | null;
  slot: string | null;
  status: string | null;
};

export type DashboardSignal = { content: string; source: string | null };

export type DashboardData = {
  displayName: string;
  sector?: string | null;
  completeness: number;
  platforms: PlatformKey[];
  proposals: DashboardProposal[];
  signals: DashboardSignal[];
};

function ProposalCard({ p }: { p: DashboardProposal }) {
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs">
        {p.platform && (
          <span className="bg-secondary rounded-full px-2 py-0.5 font-medium">
            {p.platform}
          </span>
        )}
        {p.status && (
          <span className="text-muted-foreground ml-auto">{p.status}</span>
        )}
      </div>
      <h3 className="text-sm leading-snug font-semibold">{p.idea}</h3>
      {p.whyNow && (
        <div className="border-brand-amber/60 bg-brand-amber/5 rounded-md border-l-2 px-3 py-2">
          <p className="text-brand-amber font-mono text-[10px] tracking-wider uppercase">
            Por qué ahora
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {p.whyNow}
          </p>
        </div>
      )}
      {p.script && (
        <p className="text-muted-foreground line-clamp-3 text-xs whitespace-pre-wrap">
          {p.script}
        </p>
      )}
      {p.slot && <p className="text-muted-foreground mt-auto text-xs">🕒 {p.slot}</p>}
    </article>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <section className="bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl">{data.displayName}</h1>
            {data.sector && (
              <p className="text-muted-foreground text-sm">{data.sector}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Perfil completo</p>
            <p className="text-2xl font-semibold">{data.completeness}%</p>
          </div>
        </div>
        <div className="bg-secondary mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-brand-accent h-full rounded-full"
            style={{ width: `${data.completeness}%` }}
          />
        </div>
        {data.platforms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {data.platforms.map((k) => (
              <span
                key={k}
                className="bg-secondary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <span className="bg-brand-accent size-1.5 rounded-full" />
                {PLATFORM_LABELS[k] ?? k}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Propuestas de la semana</h2>
        {data.proposals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.proposals.map((p) => (
              <ProposalCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="bg-card text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            Aún no hay propuestas. Pídeselas al Director en el chat
            («propuestas de la semana») y aparecerán aquí.
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Señales recientes</h2>
        {data.signals.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.signals.map((s, i) => (
              <li key={i} className="bg-card rounded-lg border p-3 text-sm">
                <p>{s.content}</p>
                {s.source && (
                  <span className="text-muted-foreground mt-1 inline-block font-mono text-[10px] tracking-wide uppercase">
                    {s.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aún no hay señales. Comparte algo en el chat y Demiurgos lo recordará.
          </p>
        )}
      </section>
    </div>
  );
}
