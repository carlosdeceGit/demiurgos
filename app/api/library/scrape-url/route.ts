import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import {
  cleanMarkdown,
  contentHash,
  deriveTitle,
  htmlToMarkdown,
} from "@/lib/library/convert";
import { CONTENT_LIST_COLUMNS, mapContentItem } from "@/lib/library/queries";

export const maxDuration = 30;

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

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new NextResponse("Solo se admiten URLs http o https", { status: 400 });
    }
  } catch {
    return new NextResponse("URL no válida", { status: 400 });
  }

  let html = "";
  let pageTitle = parsedUrl.hostname;
  try {
    const res = await fetch(rawUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return new NextResponse(
        `La URL devolvió ${res.status}. Comprueba que sea pública y accesible.`,
        { status: 422 }
      );
    }
    html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) pageTitle = titleMatch[1].trim().replace(/\s+/g, " ");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`No se pudo acceder a la URL: ${msg}`, {
      status: 422,
    });
  }

  const rawMd = htmlToMarkdown(html);
  const cleanMd = cleanMarkdown(rawMd);
  const title = deriveTitle(cleanMd, pageTitle);

  const { data, error } = await supabase
    .from("content_library")
    .insert({
      user_id: user.id,
      title,
      source_type: "manual_upload",
      source_url: rawUrl,
      markdown_content: cleanMd,
      markdown_size: cleanMd.length,
      content_hash: cleanMd ? contentHash(cleanMd) : null,
      status: cleanMd.length > 0 ? "completed" : "needs_review",
      conversion_tool: "html-to-md",
      conversion_error:
        cleanMd.length === 0 ? "La página no tiene texto extraíble." : null,
      metadata_json: {
        scraped_at: new Date().toISOString(),
        domain: parsedUrl.hostname,
      },
    })
    .select(CONTENT_LIST_COLUMNS)
    .single();

  if (error) {
    return new NextResponse(`No se pudo guardar: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({ item: mapContentItem(data) });
}
