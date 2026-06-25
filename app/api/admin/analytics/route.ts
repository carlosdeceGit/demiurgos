import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/db/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();

  const [runsResult, profilesResult, authResult] = await Promise.all([
    admin
      .from("ai_runs")
      .select("user_id, model, role, tokens, cost, created_at"),
    admin.from("profiles").select("user_id, display_name, created_at"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const runs = runsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const authUsers = authResult.data?.users ?? [];

  const nameByUser = new Map(
    profiles.map((p) => [p.user_id as string, (p.display_name as string) ?? "—"])
  );

  // Registrations por día (últimos 30 días)
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const newUsersByDay: Record<string, number> = {};
  for (const u of authUsers) {
    if (u.created_at >= last30) {
      const day = u.created_at.slice(0, 10);
      newUsersByDay[day] = (newUsersByDay[day] ?? 0) + 1;
    }
  }

  // Runs por día (últimos 30 días)
  const runsByDay: Record<string, { runs: number; cost: number }> = {};
  // Runs por hora (distribución)
  const runsByHour: number[] = Array(24).fill(0);
  // Por modelo
  const byModel: Record<string, { runs: number; cost: number; tokens: number }> =
    {};
  // Por rol/feature
  const byRole: Record<string, number> = {};
  // Por usuario (para ranking)
  const byUser: Record<string, { runs: number; cost: number }> = {};

  for (const r of runs) {
    const createdAt = r.created_at as string;
    const cost = Number(r.cost ?? 0);
    const tokens = Number(r.tokens ?? 0);
    const model = (r.model as string) ?? "—";
    const role = (r.role as string) ?? "—";
    const uid = r.user_id as string;

    // Por día
    if (createdAt >= last30) {
      const day = createdAt.slice(0, 10);
      const d = runsByDay[day] ?? { runs: 0, cost: 0 };
      d.runs += 1;
      d.cost += cost;
      runsByDay[day] = d;
    }

    // Por hora
    const hour = new Date(createdAt).getUTCHours();
    runsByHour[hour] += 1;

    // Por modelo
    byModel[model] = byModel[model] ?? { runs: 0, cost: 0, tokens: 0 };
    byModel[model].runs += 1;
    byModel[model].cost += cost;
    byModel[model].tokens += tokens;

    // Por rol
    byRole[role] = (byRole[role] ?? 0) + 1;

    // Por usuario
    byUser[uid] = byUser[uid] ?? { runs: 0, cost: 0 };
    byUser[uid].runs += 1;
    byUser[uid].cost += cost;
  }

  const topUsers = Object.entries(byUser)
    .map(([uid, d]) => ({
      userId: uid,
      displayName: nameByUser.get(uid) ?? "—",
      runs: d.runs,
      cost: Number(d.cost.toFixed(4)),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  const modelList = Object.entries(byModel)
    .map(([model, d]) => ({
      model,
      runs: d.runs,
      cost: Number(d.cost.toFixed(4)),
      tokens: d.tokens,
    }))
    .sort((a, b) => b.runs - a.runs);

  const featureList = Object.entries(byRole)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const totalCost = runs.reduce((a, r) => a + Number(r.cost ?? 0), 0);
  const totalTokens = runs.reduce((a, r) => a + Number(r.tokens ?? 0), 0);

  // Usuarios activos (con al menos 1 run en los últimos 30 días)
  const activeUserIds = new Set(
    runs.filter((r) => (r.created_at as string) >= last30).map((r) => r.user_id)
  );

  return NextResponse.json({
    summary: {
      totalUsers: authUsers.length,
      activeUsers: activeUserIds.size,
      newUsersLast30: authUsers.filter((u) => u.created_at >= last30).length,
      totalRuns: runs.length,
      totalCost: Number(totalCost.toFixed(4)),
      totalTokens,
    },
    runsByDay,
    newUsersByDay,
    runsByHour,
    topUsers,
    modelList,
    featureList,
  });
}
