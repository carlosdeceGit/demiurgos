import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { AppRail } from "@/components/app/app-rail";
import { getAdminOverview } from "@/lib/db/admin-queries";
import { getModelSettings, getTrendSettings } from "@/lib/db/settings";
import { ModelSettingsForm } from "@/components/admin/model-settings-form";
import { TrendSettingsForm } from "@/components/admin/trend-settings-form";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = { title: "Demiurgos · Admin" };

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  // Doble comprobación (además del proxy): sesión + email en allowlist.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/chat");

  const [o, settings, trendSettings] = await Promise.all([
    getAdminOverview(),
    getModelSettings(),
    getTrendSettings(),
  ]);
  const hasTrendsKey = Boolean(process.env.TRENDS_API_KEY);
  const maxCost = Math.max(...o.costByModel.map((m) => m.cost), 0.0001);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="admin"
        displayName={user.email ?? "Admin"}
        email={user.email ?? ""}
        isAdmin
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
          <div>
            <h1 className="font-serif text-2xl">Panel de operador</h1>
            <p className="text-muted-foreground text-sm">
              Vista interna del sistema multi-tenant (datos reales).
            </p>
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Usuarios" value={String(o.users)} />
            <Kpi label="Propuestas" value={String(o.proposals)} />
            <Kpi label="Mensajes" value={String(o.messages)} />
            <Kpi label="Coste IA" value={`$${o.aiCost}`} />
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold">Preferencias de IA</h2>
            <p className="text-muted-foreground mb-3 text-xs">
              Elige el modelo de cada rol del consejo. El chat usa el del
              Director. Campo libre con sugerencias: escribe cualquier id válido
              de tu AI Gateway.
            </p>
            <ModelSettingsForm current={settings} />
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold">
              Tendencias en tiempo real
            </h2>
            <p className="text-muted-foreground mb-3 text-xs">
              Alimenta al Analista de tendencias con datos reales de redes
              (TikTok, YouTube, Google, Reddit…) vía un proveedor de tendencias.
              Opcional: si está apagado o sin key, el analista trabaja solo con su
              conocimiento. La key va en el entorno (TRENDS_API_KEY), no aquí.
            </p>
            <TrendSettingsForm current={trendSettings} hasKey={hasTrendsKey} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">
              Coste por modelo del consejo
            </h2>
            {o.costByModel.length > 0 ? (
              <div className="bg-card space-y-3 rounded-xl border p-4">
                {o.costByModel.map((m) => (
                  <div key={m.model}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{m.model}</span>
                      <span className="text-muted-foreground">
                        ${m.cost.toFixed(2)} · {m.runs} runs
                      </span>
                    </div>
                    <div className="bg-secondary mt-1 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-brand-violet h-full rounded-full"
                        style={{ width: `${(m.cost / maxCost) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin corridas de IA registradas todavía (la tabla ai_runs se llena
                en el Hito 4).
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Uso por usuario</h2>
            <div className="bg-card overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="px-4 py-2 font-medium">Usuario</th>
                    <th className="px-4 py-2 text-right font-medium">Runs</th>
                    <th className="px-4 py-2 text-right font-medium">Coste</th>
                  </tr>
                </thead>
                <tbody>
                  {o.usageByUser.length > 0 ? (
                    o.usageByUser.map((u) => (
                      <tr key={u.userId} className="border-t">
                        <td className="px-4 py-2 font-medium">
                          {u.displayName}
                        </td>
                        <td className="px-4 py-2 text-right">{u.runs}</td>
                        <td className="px-4 py-2 text-right">
                          ${u.cost.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t">
                      <td
                        className="text-muted-foreground px-4 py-3 text-center"
                        colSpan={3}
                      >
                        Sin uso registrado todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">
              Conocimiento del ecosistema
            </h2>
            <div className="bg-card overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
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
                      <td className="text-muted-foreground px-4 py-2">
                        v{k.version}
                      </td>
                      <td className="px-4 py-2">
                        {k.isCurrent ? (
                          <span className="bg-brand-accent/10 text-brand-accent rounded-full px-2 py-0.5 text-xs">
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
        </div>
      </main>
    </div>
  );
}
