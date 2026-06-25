import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/db/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();

  const [authResult, profileResult, runsResult, proposalCount, msgCount] =
    await Promise.all([
      admin.auth.admin.getUserById(id),
      admin
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle(),
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
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = profileResult.data;
  const runs = runsResult.data ?? [];

  let totalCost = 0;
  let totalTokens = 0;
  const byModel: Record<string, { runs: number; cost: number; tokens: number }> =
    {};

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

  // Actividad por día (últimos 30 días)
  const now = Date.now();
  const dayMs = 86400000;
  const activityByDay: Record<string, number> = {};
  for (const r of runs) {
    const dayKey = new Date(r.created_at as string)
      .toISOString()
      .slice(0, 10);
    activityByDay[dayKey] = (activityByDay[dayKey] ?? 0) + 1;
  }

  // Pico de uso (anomalía simple: días con > 2x la media)
  const dayCounts = Object.values(activityByDay);
  const avgDay =
    dayCounts.length > 0
      ? dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length
      : 0;
  const peakDays = Object.entries(activityByDay)
    .filter(([, n]) => n > avgDay * 2 && avgDay > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const daysActive = Math.max(
    1,
    Math.round((now - new Date(u.created_at).getTime()) / dayMs)
  );

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email ?? "—",
      displayName:
        (profile?.display_name as string) ?? u.email?.split("@")[0] ?? "—",
      status: (profile?.status as string) ?? "active",
      createdAt: u.created_at,
      lastLoginAt: u.last_sign_in_at ?? null,
      usageLimit: (profile?.usage_limit as number | null) ?? null,
      spendLimit: (profile?.spend_limit as number | null) ?? null,
      blockedReason: (profile?.blocked_reason as string | null) ?? null,
      blockedBy: (profile?.blocked_by as string | null) ?? null,
      blockedAt: (profile?.blocked_at as string | null) ?? null,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
      totalRuns: runs.length,
      totalCost: Number(totalCost.toFixed(4)),
      totalTokens,
      avgRunsPerDay: Number((runs.length / daysActive).toFixed(2)),
      byModel: Object.entries(byModel)
        .map(([model, d]) => ({
          model,
          ...d,
          cost: Number(d.cost.toFixed(4)),
        }))
        .sort((a, b) => b.cost - a.cost),
      recentRuns: runs.slice(0, 30).map((r) => ({
        id: r.id,
        model: r.model,
        role: r.role,
        tokens: r.tokens,
        cost: r.cost,
        createdAt: r.created_at,
      })),
      proposals: proposalCount.count ?? 0,
      messages: msgCount.count ?? 0,
      peakDays,
      activityByDay,
    },
  });
}

const PatchSchema = z.object({
  action: z.enum(["block", "unblock", "suspend", "activate", "set_limits"]),
  reason: z.string().max(500).optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  spendLimit: z.number().positive().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, reason, usageLimit, spendLimit } = parsed.data;

  const { data: current } = await admin
    .from("profiles")
    .select("status, usage_limit, spend_limit")
    .eq("user_id", id)
    .maybeSingle();

  let updates: Record<string, unknown> = {};

  switch (action) {
    case "block":
      updates = {
        status: "blocked",
        blocked_reason: reason ?? null,
        blocked_by: user.email,
        blocked_at: new Date().toISOString(),
      };
      break;
    case "suspend":
      updates = {
        status: "suspended",
        blocked_reason: reason ?? null,
        blocked_by: user.email,
        blocked_at: new Date().toISOString(),
      };
      break;
    case "unblock":
    case "activate":
      updates = {
        status: "active",
        blocked_reason: null,
        blocked_by: null,
        blocked_at: null,
      };
      break;
    case "set_limits":
      updates = {
        status: "limited",
        usage_limit: usageLimit ?? null,
        spend_limit: spendLimit ?? null,
        blocked_reason: reason ?? null,
        blocked_by: user.email,
        blocked_at: new Date().toISOString(),
      };
      break;
  }

  await admin.from("profiles").update(updates).eq("user_id", id);

  // Registro de auditoría
  await admin.from("admin_actions").insert({
    admin_user_id: user.id,
    admin_email: user.email,
    target_user_id: id,
    action_type: action,
    previous_value: {
      status: current?.status ?? "active",
      usage_limit: current?.usage_limit ?? null,
      spend_limit: current?.spend_limit ?? null,
    },
    new_value: updates,
    reason: reason ?? null,
  });

  return NextResponse.json({ success: true });
}
