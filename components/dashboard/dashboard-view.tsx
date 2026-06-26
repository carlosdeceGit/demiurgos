import Link from "next/link";
import { Clock } from "lucide-react";
import type { PlatformKey } from "@/lib/ai/platforms";
import { FeatureDiscovery } from "@/components/dashboard/feature-discovery";

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

export type DashboardMetrics = {
  totalProposals: number;
  likedProposals: number;
  executedProposals: number;
  totalMessages: number;
};

export type DashboardData = {
  displayName: string;
  sector?: string | null;
  completeness: number;
  platforms: PlatformKey[];
  proposals: DashboardProposal[];
  metrics: DashboardMetrics;
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
      {p.slot && (
        <p className="text-muted-foreground mt-auto flex items-center gap-1 text-xs">
          <Clock className="size-3" aria-hidden />
          {p.slot}
        </p>
      )}
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-xl border p-4 text-center">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{label}</p>
    </div>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 pb-24 md:pb-6">
      {/* Feature discovery — dismissible, guardado en localStorage */}
      <FeatureDiscovery />

      {/* Métricas */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Propuestas totales" value={data.metrics.totalProposals} />
        <MetricCard label="Guardadas" value={data.metrics.likedProposals} />
        <MetricCard label="Ejecutadas" value={data.metrics.executedProposals} />
        <MetricCard label="Mensajes al Director" value={data.metrics.totalMessages} />
      </section>

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
            className="bg-brand-accent h-full rounded-full transition-[width] duration-700"
            style={{ width: `${data.completeness}%` }}
          />
        </div>
        {data.completeness < 100 && (
          <Link
            href="/profile"
            className="text-primary mt-2 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            Completar perfil →
          </Link>
        )}
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
            Aún no tienes propuestas.{" "}
            <Link href="/chat" className="text-primary underline-offset-4 hover:underline">
              Pídele al Director tu primera semana de contenido →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
