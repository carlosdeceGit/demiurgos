// POST /api/library/[id]/renew
// Vuelve a scrapear la fuente y actualiza la síntesis del Director.
// Mantiene el historial de scrapes y enriquece (no sobreescribe) la síntesis.

import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { contentHash } from "@/lib/library/convert";
import { detectSocialUrl, isProfileContentType } from "@/lib/apify/post/router";
import { scrapeSource } from "@/lib/apify/post/scrape-post";
import { synthesizeProfile } from "@/lib/apify/post/synthesize";
import { ScrapePostError } from "@/lib/apify/post/types";

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  // Recuperar el ítem original
  const { data: item, error: fetchErr } = await supabase
    .from("content_library")
    .select("id, source_url, markdown_content, metadata_json")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return new NextResponse(fetchErr.message, { status: 500 });
  if (!item) return new NextResponse("No encontrado", { status: 404 });

  const rawUrl = item.source_url as string | null;
  if (!rawUrl) return new NextResponse("Este ítem no tiene URL fuente", { status: 400 });

  const detected = detectSocialUrl(rawUrl);
  if (!detected || !isProfileContentType(detected.contentType)) {
    return new NextResponse("Renovar solo está disponible para perfiles y canales", { status: 400 });
  }

  let result;
  try {
    result = await scrapeSource(rawUrl);
  } catch (err) {
    const msg = err instanceof ScrapePostError
      ? err.reason
      : err instanceof Error ? err.message : String(err);
    return new NextResponse(msg, { status: 422 });
  }

  if (result.kind !== "profile") {
    return new NextResponse("Error inesperado: se esperaba un perfil", { status: 500 });
  }

  const { posts } = result;
  const oldMeta = (item.metadata_json as Record<string, unknown>) ?? {};
  const existingSynthesis = (item.markdown_content as string | null) ?? undefined;
  const scrapeCount = Number(oldMeta.scrape_count ?? 1) + 1;

  // El Director actualiza la síntesis teniendo en cuenta la anterior
  const newSynthesis = await synthesizeProfile(
    posts,
    detected.platform,
    detected.handle,
    existingSynthesis
  );

  const rawPosts = posts.map((p) => ({
    text: p.text.slice(0, 500),
    date: p.publishedAt,
    stats: p.stats,
    url: p.url,
  }));

  const newMeta: Record<string, unknown> = {
    ...oldMeta,
    posts_analyzed: posts.length,
    last_scraped_at: new Date().toISOString(),
    scrape_count: scrapeCount,
    synthesis_updated_at: new Date().toISOString(),
    raw_posts: rawPosts,
  };

  const { error: updateErr } = await supabase
    .from("content_library")
    .update({
      markdown_content: newSynthesis,
      markdown_size: newSynthesis.length,
      content_hash: contentHash(newSynthesis),
      metadata_json: newMeta,
      status: "completed",
    })
    .eq("id", id);

  if (updateErr) return new NextResponse(updateErr.message, { status: 500 });

  return NextResponse.json({
    ok: true,
    posts_analyzed: posts.length,
    scrape_count: scrapeCount,
    synthesis: newSynthesis,
  });
}
