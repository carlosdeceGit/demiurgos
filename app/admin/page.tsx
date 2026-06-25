import { getAdminOverview } from "@/lib/db/admin-queries";
import { getModelSettings, getTrendSettings } from "@/lib/db/settings";
import { ModelSettingsForm } from "@/components/admin/model-settings-form";
import { TrendSettingsForm } from "@/components/admin/trend-settings-form";
import { MetricCard } from "@/components/admin/metric-card";
import { BarChart } from "@/components/admin/bar-chart";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const [o, settings, trendSettings] = await Promise.all([
    getAdminOverview(),
    getModelSettings(),
    getTrendSettings(),
  ]);
  const hasTrendsKey = Boolean(process.env.TRENDS_API_KEY);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl">Panel de operador</h1>
        <p className="text-muted-foreground text-sm">
          Vista interna del sistema multi-tenant · datos reales en tiempo real.
        </p>
      </div>

      {/* KPIs principales */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Usuarios" value={String(o.users)} />
        <MetricCard label="Propuestas" value={String(o.proposals)} />
        <MetricCard label="Mensajes" value={String(o.messages)} />
        <MetricCard label="Coste IA" value={`$${o.aiCost}`} accent />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coste por modelo */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Coste por modelo</h2>
          {o.costByModel.length > 0 ? (
            <BarChart
              items={o.costByModel.map((m) => ({
                label: m.model,
                value: m.cost,
                sub: `${m.runs} runs`,
              }))}
              formatValue={(v) => `$${v.toFixed(2)}`}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos todavía.</p>
          )}
        </section>

        {/* Top usuarios */}
        <section className="bg-card rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top usuarios por coste</h2>
            <Link
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </div>
          {o.usageByUser.length > 0 ? (
            <BarChart
              color="amber"
              items={o.usageByUser.slice(0, 8).map((u) => ({
                label: u.displayName,
                value: u.cost,
                sub: `${u.runs} runs`,
              }))}
              formatValue={(v) => `$${v.toFixed(2)}`}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos todavía.</p>
          )}
        </section>
      </div>

      {/* Conocimiento ecosistema */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Conocimiento del ecosistema</h2>
        <div className="bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b text-left text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Plataforma</th>
                <th className="px-4 py-2 font-medium">Versión</th>
                <th className="px-4 py-2 font-medium">Vigente</th>
              </tr>
            </thead>
            <tbody>
              {o.knowledge.map((k) => (
                <tr key={k.platform} className="border-t">
                  <td className="px-4 py-2 font-medium">{k.platform}</td>
                  <td className="text-muted-foreground px-4 py-2">v{k.version}</td>
                  <td className="px-4 py-2">
                    {k.isCurrent ? (
                      <span className="bg-brand-accent-tint text-brand-accent border-brand-accent-tint-border rounded-full border px-2 py-0.5 text-xs">
                        vigente
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Configuración IA */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Preferencias de IA</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          Modelo de cada rol del consejo. Campo libre: escribe cualquier id
          válido de tu AI Gateway.
        </p>
        <ModelSettingsForm current={settings} />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Tendencias en tiempo real</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          Fuente de datos para el Analista de tendencias. Opcional: sin key el
          analista trabaja solo con su conocimiento base.
        </p>
        <TrendSettingsForm current={trendSettings} hasKey={hasTrendsKey} />
      </section>
    </div>
  );
}
