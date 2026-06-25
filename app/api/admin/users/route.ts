import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/db/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();

  const [authResult, profilesResult, runsResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select(
      "user_id, display_name, status, usage_limit, spend_limit, blocked_reason, blocked_by, blocked_at, onboarding_completed, created_at"
    ),
    admin
      .from("ai_runs")
      .select("user_id, model, tokens, cost, created_at"),
  ]);

  const authUsers = authResult.data?.users ?? [];

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.user_id as string, p])
  );

  type RunAgg = {
    count: number;
    cost: number;
    tokens: number;
    models: Set<string>;
    lastRun: string;
  };
  const runsByUser = new Map<string, RunAgg>();
  for (const r of runsResult.data ?? []) {
    const uid = r.user_id as string;
    const agg = runsByUser.get(uid) ?? {
      count: 0,
      cost: 0,
      tokens: 0,
      models: new Set<string>(),
      lastRun: "",
    };
    agg.count += 1;
    agg.cost += Number(r.cost ?? 0);
    agg.tokens += Number(r.tokens ?? 0);
    if (r.model) agg.models.add(r.model as string);
    if (!agg.lastRun || (r.created_at as string) > agg.lastRun)
      agg.lastRun = r.created_at as string;
    runsByUser.set(uid, agg);
  }

  const users = authUsers.map((u) => {
    const profile = profileMap.get(u.id);
    const usage = runsByUser.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "—",
      displayName:
        (profile?.display_name as string) ??
        u.email?.split("@")[0] ??
        "—",
      status: (profile?.status as string) ?? "active",
      createdAt: u.created_at,
      lastLoginAt: u.last_sign_in_at ?? null,
      usageLimit: (profile?.usage_limit as number | null) ?? null,
      spendLimit: (profile?.spend_limit as number | null) ?? null,
      blockedReason: (profile?.blocked_reason as string | null) ?? null,
      blockedBy: (profile?.blocked_by as string | null) ?? null,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
      totalRuns: usage?.count ?? 0,
      totalCost: Number((usage?.cost ?? 0).toFixed(4)),
      totalTokens: usage?.tokens ?? 0,
      modelsUsed: usage ? [...usage.models] : [],
      lastActivity: usage?.lastRun ?? null,
    };
  });

  return NextResponse.json({ users });
}
