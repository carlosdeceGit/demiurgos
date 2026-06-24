"use client";

import { Download, Clock } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import type { ProposalRow } from "@/components/propuestas/proposals-grid";

// ── Utilidades ─────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post de texto",
  post_image: "Post con imagen",
  carousel: "Carrusel",
  video_script: "Guión de vídeo",
  video_live: "Vídeo en directo",
  music: "Música",
  mixed: "Mezcla de formatos",
};

const CATEGORY_LABEL: Record<string, string> = {
  educational: "Educativo",
  informative: "Informativo",
  promotional: "Publicitario",
  awareness: "Concientización",
  entertainment: "Entretenimiento",
  trending: "Actualidad",
  curated: "De terceros",
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary rounded-full px-2 py-0.5 font-mono text-[11px]">
      {children}
    </span>
  );
}

// ── Generador de ZIP en el cliente (sin dependencias) ──────────

async function downloadZip(proposal: ProposalRow) {
  const based = proposal.based_on ?? {};
  const hook = typeof based.hook === "string" ? based.hook : proposal.idea ?? "sin-titulo";
  const safeName = hook.slice(0, 40).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "").trim().replace(/\s+/g, "-");

  // Construir proposal.md
  const lines: string[] = [];
  lines.push(`# ${hook}`);
  lines.push("");
  if (proposal.platform) lines.push(`**Plataforma:** ${proposal.platform}`);
  if (proposal.content_type) lines.push(`**Tipo:** ${TYPE_LABEL[proposal.content_type] ?? proposal.content_type}`);
  if (proposal.content_category) lines.push(`**Categoría:** ${CATEGORY_LABEL[proposal.content_category] ?? proposal.content_category}`);
  if (proposal.suggested_slot) lines.push(`**Slot sugerido:** ${proposal.suggested_slot}`);
  lines.push("");
  if (proposal.why_now) {
    lines.push("## Por qué ahora");
    lines.push(proposal.why_now);
    lines.push("");
  }
  if (proposal.idea) {
    lines.push("## Idea central");
    lines.push(proposal.idea);
    lines.push("");
  }
  if (proposal.script) {
    lines.push("## Guión / Copy");
    lines.push(proposal.script);
    lines.push("");
  }
  const caption = typeof based.caption === "string" ? based.caption : null;
  if (caption) {
    lines.push("## Caption");
    lines.push(caption);
    lines.push("");
  }
  const hashtags = Array.isArray(based.hashtags) ? based.hashtags as string[] : [];
  if (hashtags.length > 0) {
    lines.push("## Hashtags");
    lines.push(hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
    lines.push("");
  }

  const proposalMd = lines.join("\n");

  // Construir resources.md
  const resLines: string[] = ["# Recursos de producción", ""];
  if (proposal.image_prompt) {
    resLines.push("## Brief visual / Image prompt");
    resLines.push(proposal.image_prompt);
    resLines.push("");
  }
  const format = typeof based.format === "string" ? based.format : null;
  if (format) {
    resLines.push("## Formato");
    resLines.push(format);
    resLines.push("");
  }
  if (resLines.length === 2) {
    resLines.push("(Sin recursos adicionales para esta propuesta.)");
  }
  const resourcesMd = resLines.join("\n");

  // Construir ZIP mínimo en el cliente usando la API de Streams
  // Formato ZIP sin compresión (method=0) — sencillo y sin dependencias
  const encoder = new TextEncoder();
  const files: { name: string; data: Uint8Array }[] = [
    { name: "proposal.md", data: encoder.encode(proposalMd) },
    { name: "resources.md", data: encoder.encode(resourcesMd) },
  ];

  const zipBytes = buildZip(files);
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// ZIP sin compresión (store) — implementación mínima sin librerías
function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const header = localFileHeader(nameBytes, file.data);
    centralDir.push(centralDirEntry(nameBytes, file.data, localOffset));
    parts.push(header);
    parts.push(file.data);
    localOffset += header.length + file.data.length;
  }

  const cdBytes = concat(centralDir);
  const eocd = endOfCentralDir(files.length, cdBytes.length, localOffset);
  return concat([...parts, cdBytes, eocd]);
}

function u16le(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff]); }
function u32le(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]); }

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function localFileHeader(name: Uint8Array, data: Uint8Array): Uint8Array {
  const crc = crc32(data);
  return concat([
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // sig
    u16le(20), // version needed
    u16le(0),  // flags
    u16le(0),  // method: store
    u16le(0), u16le(0), // mod time, date
    u32le(crc),
    u32le(data.length), u32le(data.length), // compressed = uncompressed
    u16le(name.length), u16le(0), // name len, extra len
    name,
  ]);
}

function centralDirEntry(name: Uint8Array, data: Uint8Array, localOffset: number): Uint8Array {
  const crc = crc32(data);
  return concat([
    new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
    u16le(20), u16le(20),
    u16le(0), u16le(0),
    u16le(0), u16le(0),
    u32le(crc),
    u32le(data.length), u32le(data.length),
    u16le(name.length), u16le(0), u16le(0),
    u16le(0), u16le(0),
    u32le(0),
    u32le(localOffset),
    name,
  ]);
}

function endOfCentralDir(count: number, cdSize: number, cdOffset: number): Uint8Array {
  return concat([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16le(0), u16le(0),
    u16le(count), u16le(count),
    u32le(cdSize),
    u32le(cdOffset),
    u16le(0),
  ]);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) { out.set(a, pos); pos += a.length; }
  return out;
}

// ── Componente ─────────────────────────────────────────────────

export function ProposalDrawer({
  proposal,
  onClose,
}: {
  proposal: ProposalRow | null;
  onClose: () => void;
}) {
  if (!proposal) return null;

  const based = proposal.based_on ?? {};
  const hook = typeof based.hook === "string" ? based.hook : proposal.idea ?? "Sin título";
  const caption = typeof based.caption === "string" ? based.caption : null;
  const hashtags = Array.isArray(based.hashtags) ? based.hashtags as string[] : [];

  return (
    <Sheet open={!!proposal} onClose={onClose} title="Detalle de propuesta">
      <div className="space-y-6 p-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {proposal.platform && <Badge>{proposal.platform}</Badge>}
          {proposal.content_type && (
            <Badge>{TYPE_LABEL[proposal.content_type] ?? proposal.content_type}</Badge>
          )}
          {proposal.content_category && (
            <Badge>{CATEGORY_LABEL[proposal.content_category] ?? proposal.content_category}</Badge>
          )}
          {proposal.suggested_slot && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {proposal.suggested_slot}
            </span>
          )}
        </div>

        {/* Hook / Título */}
        <h2 className="font-serif text-2xl leading-snug">{hook}</h2>

        {/* Por qué ahora */}
        {proposal.why_now && (
          <div className="border-brand-amber/50 bg-brand-amber/5 rounded-lg border-l-2 px-4 py-3">
            <p className="font-mono text-[10px] tracking-wider text-amber-400 uppercase mb-1">
              Por qué ahora
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {proposal.why_now}
            </p>
          </div>
        )}

        {/* Idea central */}
        {proposal.idea && hook !== proposal.idea && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Idea central
            </h3>
            <p className="text-sm leading-relaxed">{proposal.idea}</p>
          </section>
        )}

        {/* Guión / copy */}
        {proposal.script && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guión / Copy
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-4">
              {proposal.script}
            </p>
          </section>
        )}

        {/* Caption */}
        {caption && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Caption
            </h3>
            <p className="text-sm leading-relaxed italic text-muted-foreground">{caption}</p>
          </section>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hashtags
            </h3>
            <p className="text-sm text-primary">
              {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
            </p>
          </section>
        )}

        {/* Brief visual */}
        {proposal.image_prompt && (
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Brief visual
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4">
              {proposal.image_prompt}
            </p>
          </section>
        )}

        {/* Descarga ZIP */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => downloadZip(proposal)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <Download className="size-4" />
            Descargar como ZIP
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
            Incluye proposal.md + resources.md
          </p>
        </div>
      </div>
    </Sheet>
  );
}
