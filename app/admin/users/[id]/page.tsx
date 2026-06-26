import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Clock, Activity } from "lucide-react";
import { createAdminClient } from "@/lib/db/admin";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { BarChart } from "@/components/admin/bar-chart";
import { UserActionClient } from "@/components/admin/user-action-client";

export const dynamic = "force-dynamic";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [authResult, profileResult, runsResult, proposalCount, msgCount] =
    await Promise.all([
      admin.auth.admin.getUserById(id),
      admin.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      admin
        .from("ai_runs")
        .select("id, model, role, tokens, cost, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id),
      admin
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id),
    ]);

  const u = authResult.data?.user;
  if (!u) notFound();

  const profile = profileResult.data;
  const runs = runsResult.data ?? [];

  let totalCost = 0;
  let totalTokens = 0;
  const byModel: Record<string, { runs: number; cost: number; tokens: number }> = {};

  for (const r of runs) {
    const cost = Number(r.cost ?? 0);
    const tokens = Number(r.tokens ?? 0);
    totalCost += cost;
    totalTokens += tokens;
    const model = (r.model as string) ?? "—";
    byModel[model] = byModel[model] ?? { runs: 0, cost: 0, tokens: 0 };
    byModel[model].runs += 1;
    byModel[model].cost += cost;
    byModel[model].tokens += tokens;
  }

  // Server Component (force-dynamic): se renderiza una vez por request, así que
  // `now` es estable durante el render. react-hooks/purity asume cliente/compiler.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const daysActive = Math.max(
    1,
    Math.round((now - new Date(u.created_at).getTime()) / 86400000)
  );

  // Actividad por día (últimos 14 días)
  const last14 = new Date(now - 14 * 86400000).toISOString();
  const actByDay: Record<string, number> = {};
  for (const r of runs) {
    if ((r.created_at as string) >= last14) {
      const day = (r.created_at as string).slice(0, 10);
      actByDay[day] = (actByDay[day] ?? 0) + 1;
    }
  }

  // Detección de picos (> 2x media)
  const counts = Object.values(actByDay);
  const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const peakDays = Object.entries(actByDay)
    .filter(([, n]) => n > avg * 2 && avg > 0)
    .sort((a, b) => b[1] - a[1]);

  const modelList = Object.entries(byModel)
    .map(([model, d]) => ({ model, ...d, cost: Number(d.cost.toFixed(4)) }))
    .sort((a, b) => b.cost - a.cost);

  const displayName =
    (profile?.display_name as string) ?? u.email?.split("@")[0] ?? "—";
  const status = (profile?.status as string) ?? "active";

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl">{displayName}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Mail className="size-3" /> {u.email}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3" /> Registro: {fmt(u.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> Último acceso:{" "}
              {fmt(u.last_sign_in_at ?? null)}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Runs totales" value={runs.length} />
        <MetricCard
          label="Coste total"
          value={`$${totalCost.toFixed(4)}`}
          accent
        />
        <MetricCard label="Tokens usados" value={totalTokens.toLocaleString("es-ES")} />
        <MetricCard
          label="Runs / día"
          value={(runs.length / daysActive).toFixed(2)}
          sub={`en ${daysActive} días activos`}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Propuestas" value={proposalCount.count ?? 0} />
        <MetricCard label="Mensajes" value={msgCount.count ?? 0} />
        <MetricCard
          label="Modelos distintos"
          value={Object.keys(byModel).length}
        />
        <MetricCard
          label="Onboarding"
          value={profile?.onboarding_completed ? "Completado" : "Pendiente"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Control de acceso */}
        <div className="lg:col-span-1">
          <UserActionClient
            user={{
              id: u.id,
              email: u.email ?? "—",
              displayName,
              status,
              usageLimit: (profile?.usage_limit as number | null) ?? null,
              spendLimit: (profile?.spend_limit as number | null) ?? null,
              blockedReason: (profile?.blocked_reason as string | null) ?? null,
              blockedBy: (profile?.blocked_by as string | null) ?? null,
              blockedAt: (profile?.blocked_at as string | null) ?? null,
            }}
          />
        </div>

        {/* Uso por modelo */}
        <div className="bg-card rounded-xl border p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Uso por modelo</h2>
          {modelList.length > 0 ? (
            <BarChart
              items={modelList.map((m) => ({
                label: m.model,
                value: m.cost,
                sub: `${m.runs} runs · ${m.tokens.toLocaleString("es-ES")} tokens`,
              }))}
              formatValue={(v) => `$${v.toFixed(4)}`}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin actividad de IA.</p>
          )}
        </div>
      </div>

      {/* Actividad últimos 14 días + picos */}
      {Object.keys(actByDay).length > 0 && (
        <section className="bg-card rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">
            <Activity className="mr-1 inline size-4" />
            Actividad últimos 14 días
          </h2>
          <div className="flex h-12 items-end gap-1">
            {Object.keys(actByDay)
              .sort()
              .map((day) => {
                const n = actByDay[day];
                const max = Math.max(...Object.values(actByDay), 1);
                const isPeak = n > avg * 2 && avg > 0;
                return (
                  <div
                    key={day}
                    title={`${day}: ${n} runs`}
                    className={[
                      "flex-1 rounded-t transition-colors",
                      isPeak ? "bg-brand-amber" : "bg-primary",
                    ].join(" ")}
                    style={{ height: `${(n / max) * 100}%`, minHeight: 2 }}
                  />
                );
              })}
          </div>
          {peakDays.length > 0 && (
            <div className="bg-brand-amber/10 border-brand-amber/20 mt-3 rounded-lg border p-2 text-xs">
              <span className="text-brand-amber font-medium">
                Picos detectados:{" "}
              </span>
              <span className="text-muted-foreground">
                {peakDays
                  .map(([d, n]) => `${d} (${n} runs)`)
                  .join(", ")}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Runs recientes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Actividad reciente</h2>
        <div className="bg-card overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground border-b text-xs">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Modelo</th>
                  <th className="px-4 py-2 text-left font-medium">Rol / función</th>
                  <th className="px-4 py-2 text-right font-medium">Tokens</th>
                  <th className="px-4 py-2 text-right font-medium">Coste</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 30).map((r) => (
                  <tr key={r.id as string} className="border-t">
                    <td className="text-muted-foreground whitespace-nowrap px-4 py-2 text-xs">
                      {fmtDateTime(r.created_at as string)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {(r.model as string) ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2 text-xs">
                      {(r.role as string) ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {(r.tokens as number)?.toLocaleString("es-ES") ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs tabular-nums">
                      ${Number(r.cost ?? 0).toFixed(6)}
                    </td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground py-6 text-center text-sm"
                    >
                      Sin actividad registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {runs.length > 30 && (
            <p className="text-muted-foreground border-t px-4 py-2 text-center text-xs">
              Mostrando los 30 más recientes de {runs.length} totales.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
