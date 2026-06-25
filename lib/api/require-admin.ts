import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { isAdminEmail } from "@/lib/auth/admin";

type AdminGuardResult =
  | { user: { id: string; email: string }; error: null }
  | { user: null; error: NextResponse };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user: { id: user.id, email: user.email! }, error: null };
}
