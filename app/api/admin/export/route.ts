import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/db/admin";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "users";

  const admin = createAdminClient();
  let csv = "";
  let filename = "";

  if (type === "users") {
    const [authResult, profilesResult, runsResult] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin
        .from("profiles")
        .select("user_id, display_name, status, usage_limit, spend_limit"),
      admin.from("ai_runs").select("user_id, cost, tokens"),
    ]);

    const profileMap = new Map(
      (profilesResult.data ?? []).map((p) => [p.user_id as string, p])
    );
    const runsByUser = new Map<string, { runs: number; cost: number }>();
    for (const r of runsResult.data ?? []) {
      const uid = r.user_id as string;
      const a = runsByUser.get(uid) ?? { runs: 0, cost: 0 };
      a.runs += 1;
      a.cost += Number(r.cost ?? 0);
      runsByUser.set(uid, a);
    }

    const rows = (authResult.data?.users ?? []).map((u) => {
      const p = profileMap.get(u.id);
      const r = runsByUser.get(u.id) ?? { runs: 0, cost: 0 };
      return {
        id: u.id,
        email: u.email ?? "",
        display_name: (p?.display_name as string) ?? "",
        status: (p?.status as string) ?? "active",
        created_at: u.created_at,
        last_login_at: u.last_sign_in_at ?? "",
        total_runs: r.runs,
        total_cost_usd: r.cost.toFixed(6),
        usage_limit: (p?.usage_limit as number | null) ?? "",
        spend_limit: (p?.spend_limit as number | null) ?? "",
      };
    });

    csv = toCsv(rows);
    filename = "usuarios.csv";
  } else if (type === "usage") {
    const { data: runs } = await admin
      .from("ai_runs")
      .select("user_id, model, role, tokens, cost, created_at")
      .order("created_at", { ascending: false });

    csv = toCsv(
      (runs ?? []).map((r) => ({
        user_id: r.user_id,
        model: r.model,
        role: r.role,
        tokens: r.tokens,
        cost_usd: Number(r.cost ?? 0).toFixed(6),
        created_at: r.created_at,
      }))
    );
    filename = "uso_ia.csv";
  } else if (type === "audit") {
    const { data } = await admin
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false });

    csv = toCsv(
      (data ?? []).map((a) => ({
        id: a.id,
        admin_email: a.admin_email,
        target_user_id: a.target_user_id,
        action_type: a.action_type,
        reason: a.reason ?? "",
        created_at: a.created_at,
      }))
    );
    filename = "auditoria.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
