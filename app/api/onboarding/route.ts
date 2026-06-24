import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";

// Esquema esperado del wizard. Todos los campos son opcionales excepto display_name.
type OnboardingBody = {
  display_name: string;
  positioning?: {
    description?: string;
    creator_type?: string;
  };
  pillars?: Array<{ topic: string; why_you: string }>;
  voice?: {
    tone_chips?: string[];
    never_do?: string;
  };
  network_urls?: string[];
  goals?: { frequency?: string };
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: OnboardingBody;
  try {
    body = (await request.json()) as OnboardingBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.display_name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  // Construir el objeto de plataformas a partir de las URLs pegadas.
  // En esta fase solo guardamos las URLs; el análisis con Apify llega después.
  const platforms = (body.network_urls ?? [])
    .filter((u) => u.trim())
    .map((url) => ({
      url: url.trim(),
      platform: guessPlatform(url),
      role: "principal",
      format: "",
      status: "pending_analysis",
    }));

  const profileData = {
    user_id: user.id,
    display_name: body.display_name.trim(),
    positioning: body.positioning ?? {},
    pillars: body.pillars ?? [],
    audience: {},
    voice: body.voice ?? {},
    tacit: {},
    goals: body.goals ?? {},
    platforms,
    performance_patterns: [],
    referents: [],
    onboarding_completed: true,
  };

  // Upsert: si ya existe el perfil (re-onboarding) lo actualiza; si no, lo crea.
  const { error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "user_id" });

  if (error) {
    console.error("[onboarding] upsert error:", error);
    return NextResponse.json({ error: "Error al guardar el perfil" }, { status: 500 });
  }

  // Guardar las URLs de redes como señales para que el motor las tenga disponibles.
  if (platforms.length > 0) {
    const signals = platforms.map((p) => ({
      user_id: user.id,
      content: `Red social del usuario: ${p.platform} — ${p.url}`,
      type: "social_profile",
      source: "onboarding",
    }));

    // No bloqueamos la respuesta si falla la inserción de señales.
    await supabase.from("signals").insert(signals).then(({ error: sigErr }) => {
      if (sigErr) console.error("[onboarding] signals insert error:", sigErr);
    });
  }

  return NextResponse.json({ ok: true });
}

// Detecta la plataforma a partir de la URL para etiquetar la señal.
function guessPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.com") || u.includes("x.com")) return "x";
  if (u.includes("substack.com")) return "substack";
  return "otro";
}
