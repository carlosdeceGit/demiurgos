import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import {
  DriveNotConfiguredError,
  getDriveAccessToken,
  listUserFolders,
} from "@/lib/library/drive";

type Ctx = { params: Promise<{ id: string }> };

// GET — lista las carpetas de Drive de la cuenta conectada, para elegir cuál
// sincronizar.
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  try {
    const { data: source } = await supabase
      .from("content_sources")
      .select("token_ref")
      .eq("id", id)
      .maybeSingle();
    const token = await getDriveAccessToken(source?.token_ref as string | null);
    const folders = await listUserFolders(token);
    return NextResponse.json({ folders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = err instanceof DriveNotConfiguredError ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
