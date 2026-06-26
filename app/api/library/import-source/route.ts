// POST /api/library/import-source
// Detecta la plataforma, llama a Apify (sync), y si es un perfil llama al
// Director para generar la síntesis. Todo en una sola petición (~60 s max).

import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { contentHash } from "@/lib/library/convert";
import { CONTENT_LIST_COLUMNS, mapContentItem } from "@/lib/library/queries";
import { detectSocialUrl, isProfileContentType } from "@/lib/apify/post/router";
import { scrapeSource } from "@/lib/apify/post/scrape-post";
import { synthesizeProfile } from "@/lib/apify/post/synthesize";
import { ScrapePostError } from "@/lib/apify/post/types";
import type { NormalizedPost } from "@/lib/apify/post/types";

export const maxDuration = 120;

function fmtNum(n: number | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return String(n);
}

function buildPostMarkdown(post: NormalizedPost, url: string): string {
  const lines: string[] = [`# ${post.author.name || "Post"}`, ""];

  const metaParts = [post.platform.toUpperCase()];
  if (post.author.handle) metaParts.push(post.author.handle);
  if (post.publishedAt) metaParts.push(post.publishedAt.split("T")[0]);
  lines.push(`> ${metaParts.join(" · ")}`);

  const stats: string[] = [];
  if (post.stats.views) stats.push(`${fmtNum(post.stats.views)} vistas`);
  if (post.stats.likes) stats.push(`${fmtNum(post.stats.likes)} likes`);
  if (post.stats.comments) stats.push(`${fmtNum(post.stats.comments)} comentarios`);
  if (post.stats.shares) stats.push(`${fmtNum(post.stats.shares)} compartidos`);
  if (stats.length) lines.push(`> ${stats.join(" · ")}`);

  lines.push(`> ${url}`, "");

  if (post.text) lines.push(post.text, "");

  if (post.transcript) {
    lines.push("## Transcripción");
    lines.push(post.transcript, "");
  }

  if (post.media.urls.length > 0) {
    lines.push("## Media");
    post.media.urls.forEach((u) => lines.push(`- ${u}`));
  }

  return lines.join("\n").trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("JSON inválido", { status: 400 });
  }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) return new NextResponse("Falta la URL", { status: 400 });

  const detected = detectSocialUrl(rawUrl);
  if (!detected) {
    return new NextResponse("URL no reconocida como red social soportada", { status: 400 });
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

  let title: string;
  let markdownContent: string;
  let metadataJson: Record<string, unknown>;
  let conversionTool: string;

  if (result.kind === "post") {
    const { post } = result;
    title = post.text.slice(0, 120).replace(/\n+/g, " ").trim() || post.author.name || "Post";
    markdownContent = buildPostMarkdown(post, rawUrl);
    conversionTool = `apify-${detected.platform}-post`;
    metadataJson = {
      platform: detected.platform,
      content_type: detected.contentType,
      author: post.author,
      stats: post.stats,
      media: { type: post.media.type, urls: post.media.urls },
      scraped_at: new Date().toISOString(),
    };
  } else {
    // Profile / channel / company / page
    const { posts } = result;
    const isProfile = isProfileContentType(detected.contentType);
    const handleLabel = detected.handle ?? detected.platform;

    // Fase 2: Director sintetiza
    const synthesis = isProfile
      ? await synthesizeProfile(posts, detected.platform, detected.handle)
      : posts.map((p) => `${p.text}`).join("\n\n---\n\n").slice(0, 8000);

    title = `${handleLabel} · ${detected.label}`;
    markdownContent = synthesis;
    conversionTool = `apify-${detected.platform}-profile`;

    const rawPosts = posts.map((p) => ({
      text: p.text.slice(0, 500),
      date: p.publishedAt,
      stats: p.stats,
      url: p.url,
    }));

    metadataJson = {
      platform: detected.platform,
      content_type: detected.contentType,
      handle: detected.handle,
      posts_analyzed: posts.length,
      last_scraped_at: new Date().toISOString(),
      scrape_count: 1,
      synthesis_updated_at: new Date().toISOString(),
      raw_posts: rawPosts,
    };
  }

  const { data, error } = await supabase
    .from("content_library")
    .insert({
      user_id: user.id,
      title,
      source_type: "manual_upload",
      source_url: rawUrl,
      markdown_content: markdownContent,
      markdown_size: markdownContent.length,
      content_hash: contentHash(markdownContent),
      status: "completed",
      conversion_tool: conversionTool,
      metadata_json: metadataJson,
    })
    .select(CONTENT_LIST_COLUMNS)
    .single();

  if (error) {
    return new NextResponse(`Error al guardar: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ item: mapContentItem(data) });
}
