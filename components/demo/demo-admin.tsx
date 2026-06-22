import {
  costByModel,
  demoAdminSummary,
  usageByUser,
} from "@/demo/fixtures";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function DemoAdmin() {
  const summary = demoAdminSummary();
  const models = costByModel();
  const users = usageByUser();
  const maxCost = Math.max(...models.map((m) => m.cost), 0.0001);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <div>
        <h2 className="font-serif text-2xl">Panel de operador</h2>
        <p className="text-muted-foreground text-sm">
          Vista interna del sistema multi-tenant (datos de ejemplo).
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Usuarios" value={String(summary.users)} />
        <Kpi label="Propuestas" value={String(summary.proposals)} />
        <Kpi label="Coste IA (14 d)" value={`$${summary.aiCost}`} />
        <Kpi
          label="Tokens (14 d)"
          value={`${(summary.aiTokens / 1000).toFixed(0)}k`}
        />
      </section>

      {/* Coste por modelo */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">
          Coste por modelo del consejo
        </h3>
        <div className="bg-card space-y-3 rounded-xl border p-4">
          {models.map((m) => (
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
      </section>

      {/* Uso por usuario */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">Uso por usuario</h3>
        <div className="bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Sector</th>
                <th className="px-4 py-2 text-right font-medium">Runs</th>
                <th className="px-4 py-2 text-right font-medium">Coste</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.profileId} className="border-t">
                  <td className="px-4 py-2 font-medium">{u.displayName}</td>
                  <td className="text-muted-foreground px-4 py-2">{u.sector}</td>
                  <td className="px-4 py-2 text-right">{u.runs}</td>
                  <td className="px-4 py-2 text-right">${u.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
