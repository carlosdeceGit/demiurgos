import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { encryptSecret } from "@/lib/library/crypto";
import {
  exchangeCodeForTokens,
  fetchAccountEmail,
} from "@/lib/library/drive";

// GET — callback OAuth. Canjea el código, cifra el refresh token y crea/actualiza
// la fila de content_sources del usuario (cuenta conectada, carpeta pendiente).
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(siteUrl("/login"));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(siteUrl(`/library?drive_error=${encodeURIComponent(oauthError)}`));
  }

  // Valida el state contra la cookie (CSRF).
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("drive_oauth_state="))
    ?.split("=")[1];
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(siteUrl("/library?drive_error=state_mismatch"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google no devuelve refresh token si ya se concedió antes sin revocar.
      return NextResponse.redirect(
        siteUrl("/library?drive_error=no_refresh_token")
      );
    }
    const email = await fetchAccountEmail(tokens.access_token);

    await supabase.from("content_sources").insert({
      user_id: user.id,
      source_type: "google_drive",
      provider: "google_drive",
      provider_account_email: email,
      token_ref: encryptSecret(tokens.refresh_token),
      sync_status: "connected",
    });

    const res = NextResponse.redirect(siteUrl("/library?connected=1"));
    res.cookies.delete("drive_oauth_state");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      siteUrl(`/library?drive_error=${encodeURIComponent(message)}`)
    );
  }
}

function siteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://demiurgos.vercel.app";
  return new URL(path, base).toString();
}
