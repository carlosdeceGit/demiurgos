import { createHash } from "node:crypto";

import {
  CONVERTIBLE_EXTENSIONS,
  EXTERNAL_CONVERSION_EXTENSIONS,
  IMAGE_EXTENSIONS,
  NATIVE_EXTENSIONS,
  type ContentStatus,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Conversión a Markdown. Reglas (HANDOFF / spec):
//  - No inventar contenido, no resumir: se preserva el original al máximo.
//  - Se limpia ruido técnico (espacios sobrantes, líneas en blanco repetidas).
//  - El Markdown final es la representación principal para los modelos de IA.
// Funciones puras y sin red → fáciles de testear (la OCR vive aparte en ocr.ts).
// ─────────────────────────────────────────────────────────────

export type ConversionKind =
  | "native-md"
  | "native-txt"
  | "html"
  | "image"
  | "external"
  | "unknown";

export type ConversionOutcome = {
  status: ContentStatus;
  markdown: string | null;
  tool: string | null;
  error: string | null;
  title: string;
};

export function classifyExtension(ext: string): ConversionKind {
  const e = ext.toLowerCase();
  if (e === "md" || e === "markdown") return "native-md";
  if (e === "txt") return "native-txt";
  if ((CONVERTIBLE_EXTENSIONS as readonly string[]).includes(e)) return "html";
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(e)) return "image";
  if ((EXTERNAL_CONVERSION_EXTENSIONS as readonly string[]).includes(e))
    return "external";
  return "unknown";
}

export function isSupportedExtension(ext: string): boolean {
  const e = ext.toLowerCase();
  return (
    (NATIVE_EXTENSIONS as readonly string[]).includes(e) ||
    (IMAGE_EXTENSIONS as readonly string[]).includes(e) ||
    (CONVERTIBLE_EXTENSIONS as readonly string[]).includes(e) ||
    (EXTERNAL_CONVERSION_EXTENSIONS as readonly string[]).includes(e)
  );
}

// Hash estable del Markdown: detecta cambios y evita duplicados al sincronizar.
export function contentHash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// Normaliza saltos de línea, recorta espacios al final de cada línea y colapsa
// 3+ líneas en blanco a 2. No toca el contenido semántico.
export function cleanMarkdown(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Deriva un título: primer encabezado Markdown, o primera línea no vacía.
export function deriveTitle(markdown: string, fallback: string): string {
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) return truncateTitle(heading[1].trim());
    return truncateTitle(line.replace(/^[#>*\-\s]+/, "").trim());
  }
  return fallback;
}

function truncateTitle(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t || "Sin título";
}

// .txt → Markdown básico conservando la estructura de párrafos.
export function normalizeTxtToMarkdown(text: string): string {
  return cleanMarkdown(text);
}

// .md → validar (que no esté vacío) y limpiar.
export function validateMarkdown(text: string): string {
  const cleaned = cleanMarkdown(text);
  if (!cleaned) throw new Error("El archivo Markdown está vacío.");
  return cleaned;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z#0-9]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m);
}

// Conversor HTML → Markdown ligero (sin dependencias pesadas). Cubre los casos
// habituales; el resto de etiquetas se eliminan preservando el texto.
export function htmlToMarkdown(html: string): string {
  let s = html;

  // Quita bloques no textuales por completo.
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|head|nav|footer)[\s\S]*?<\/\1>/gi, "");

  // Encabezados.
  for (let i = 1; i <= 6; i++) {
    const re = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi");
    s = s.replace(re, (_, inner) => `\n\n${"#".repeat(i)} ${strip(inner)}\n\n`);
  }

  // Negrita / cursiva / código en línea.
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${strip(t)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${strip(t)}*`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => `\`${strip(t)}\``);

  // Enlaces e imágenes.
  s = s.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, t) => `[${strip(t)}](${href})`
  );
  s = s.replace(
    /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi,
    (_, alt, src) => `![${alt}](${src})`
  );
  s = s.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, (_, src) => `![](${src})`);

  // Listas.
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${strip(t)}`);
  s = s.replace(/<\/(ul|ol)>/gi, "\n\n");

  // Saltos y párrafos.
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => `\n> ${strip(t)}\n`);

  // Cualquier otra etiqueta: se elimina conservando el texto.
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);

  return cleanMarkdown(s);
}

function strip(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

// Convierte el contenido textual (md/txt/html) a Markdown. No cubre imágenes
// (OCR) ni formatos externos (pdf/docx): esos los gestiona la ruta de subida.
export function convertText({
  text,
  ext,
  fileName,
}: {
  text: string;
  ext: string;
  fileName: string;
}): ConversionOutcome {
  const kind = classifyExtension(ext);
  try {
    let markdown: string;
    let tool: string;
    if (kind === "native-md") {
      markdown = validateMarkdown(text);
      tool = "markdown-validate";
    } else if (kind === "native-txt") {
      markdown = normalizeTxtToMarkdown(text);
      tool = "txt-normalize";
    } else if (kind === "html") {
      markdown = htmlToMarkdown(text);
      tool = "html-to-md";
    } else {
      return {
        status: "failed",
        markdown: null,
        tool: null,
        error: `Formato .${ext} no convertible como texto.`,
        title: fileName,
      };
    }
    if (!markdown.trim()) {
      return {
        status: "needs_review",
        markdown: "",
        tool,
        error: "La conversión no produjo texto. Revisa el archivo original.",
        title: fileName,
      };
    }
    return {
      status: "completed",
      markdown,
      tool,
      error: null,
      title: deriveTitle(markdown, fileName),
    };
  } catch (err) {
    return {
      status: "failed",
      markdown: null,
      tool: null,
      error: err instanceof Error ? err.message : String(err),
      title: fileName,
    };
  }
}
