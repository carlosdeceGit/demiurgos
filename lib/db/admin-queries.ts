import { createAdminClient } from "@/lib/db/admin";

export type AdminModelCost = {
  model: string;
  runs: number;
  tokens: number;
  cost: number;
};
export type AdminUserUsage = {
  userId: string;
  displayName: string;
  runs: number;
  cost: number;
};
export type AdminKnowledge = {
  platform: string;
  version: number;
  isCurrent: boolean;
  updatedAt: string;
};

export type AdminOverview = {
  users: number;
  proposals: number;
  messages: number;
  signals: number;
  aiCost: number;
  aiTokens: number;
  costByModel: AdminModelCost[];
  usageByUser: AdminUserUsage[];
  knowledge: AdminKnowledge[];
};

async function count(
  admin: ReturnType<typeof createAdminClient>,
  table: string
): Promise<number> {
  const { count } = await admin
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

// Lee agregados de todos los tenants con service role (solo servidor, solo /admin).
export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminClient();

  const [users, proposals, messages, signals] = await Promise.all([
    count(admin, "profiles"),
    count(admin, "proposals"),
    count(admin, "messages"),
    count(admin, "signals"),
  ]);

  const { data: profilesRows } = await admin
    .from("profiles")
    .select("user_id, display_name");
  const nameByUser = new Map<string, string>(
    (profilesRows ?? []).map((p) => [
      p.user_id as string,
      (p.display_name as string) ?? "—",
    ])
  );

  const { data: runs } = await admin
    .from("ai_runs")
    .select("user_id, model, tokens, cost");

  let aiCost = 0;
  let aiTokens = 0;
  const byModel = new Map<string, AdminModelCost>();
  const byUser = new Map<string, AdminUserUsage>();

  for (const r of runs ?? []) {
    const tokens = (r.tokens as number) ?? 0;
    const cost = Number(r.cost ?? 0);
    aiCost += cost;
    aiTokens += tokens;

    const model = (r.model as string) ?? "—";
    const m = byModel.get(model) ?? { model, runs: 0, tokens: 0, cost: 0 };
    m.runs += 1;
    m.tokens += tokens;
    m.cost += cost;
    byModel.set(model, m);

    const uid = (r.user_id as string) ?? "—";
    const u =
      byUser.get(uid) ??
      ({
        userId: uid,
        displayName: nameByUser.get(uid) ?? "—",
        runs: 0,
        cost: 0,
      } as AdminUserUsage);
    u.runs += 1;
    u.cost += cost;
    byUser.set(uid, u);
  }

  const { data: knowledgeRows } = await admin
    .from("ecosystem_knowledge")
    .select("platform, version, is_current, updated_at")
    .order("platform");

  return {
    users,
    proposals,
    messages,
    signals,
    aiCost: Number(aiCost.toFixed(2)),
    aiTokens,
    costByModel: [...byModel.values()]
      .map((m) => ({ ...m, cost: Number(m.cost.toFixed(2)) }))
      .sort((a, b) => b.cost - a.cost),
    usageByUser: [...byUser.values()]
      .map((u) => ({ ...u, cost: Number(u.cost.toFixed(2)) }))
      .sort((a, b) => b.cost - a.cost),
    knowledge: (knowledgeRows ?? []).map((k) => ({
      platform: k.platform as string,
      version: (k.version as number) ?? 1,
      isCurrent: Boolean(k.is_current),
      updatedAt: (k.updated_at as string) ?? "",
    })),
  };
}
