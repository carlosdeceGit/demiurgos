import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { createClient } from "@/lib/db/server";
import { buildConsentUrl, driveOAuthConfigured } from "@/lib/library/drive";
import { tokenCryptoConfigured } from "@/lib/library/crypto";

// GET — inicia el consent flow de Google Drive PARA EL USUARIO ACTUAL.
// Cada usuario autoriza su propia cuenta; el callback guarda su refresh token
// cifrado en su propia fila de content_sources.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(siteUrl("/login"));

  if (!driveOAuthConfigured() || !tokenCryptoConfigured()) {
    return NextResponse.redirect(siteUrl("/library?drive_error=not_configured"));
  }

  // CSRF: nonce en cookie httpOnly que se valida en el callback.
  const state = randomBytes(16).toString("base64url");
  const res = NextResponse.redirect(buildConsentUrl(state));
  res.cookies.set("drive_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

function siteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://demiurgos.vercel.app";
  return new URL(path, base).toString();
}
