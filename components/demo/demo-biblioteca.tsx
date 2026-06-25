"use client";

import { useState } from "react";
import { FileText, FolderOpen, Image as ImageIcon, Search } from "lucide-react";

import { libraryFor, type DemoLibraryItem } from "@/demo/fixtures";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<DemoLibraryItem["status"], string> = {
  completed: "Convertido",
  synced: "Sincronizado",
};

const SOURCE_LABELS: Record<DemoLibraryItem["sourceType"], string> = {
  manual_upload: "Subida manual",
  google_drive: "Google Drive",
};

function isImage(ext: string): boolean {
  return ["jpg", "jpeg", "png", "webp"].includes(ext);
}

export function DemoBiblioteca({ profileId }: { profileId: string }) {
  const items = libraryFor(profileId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DemoLibraryItem | null>(null);

  const filtered = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      it.tags.some((t) => t.toLowerCase().includes(q)) ||
      it.originalFileName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="font-serif text-2xl">Biblioteca de contenidos</h1>
        <p className="text-muted-foreground text-sm">
          Sube o sincroniza material; Demiurgos lo convierte a Markdown limpio,
          listo para alimentar a la IA. Solo tú ves tu biblioteca.
        </p>
      </header>

      {/* Zona de subida — deshabilitada en demo */}
      <div className="rounded-xl border border-dashed border-input p-6 text-center opacity-50">
        <p className="text-sm font-medium text-muted-foreground">
          Subida de archivos no disponible en modo demo
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, archivo o etiqueta…"
          className="bg-background focus-visible:ring-ring w-full rounded-md border py-2 pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto size-8 opacity-50" />
          <p className="mt-3 text-sm">No hay resultados para esa búsqueda.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((it) => {
            const img = isImage(it.originalExtension);
            return (
              <li key={it.id}>
                <button
                  onClick={() => setSelected(selected?.id === it.id ? null : it)}
                  className="bg-card hover:border-brand-accent/40 flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors"
                >
                  <span className="bg-brand-accent/10 text-brand-accent grid size-10 shrink-0 place-items-center rounded-lg">
                    {img ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {SOURCE_LABELS[it.sourceType]} · .{it.originalExtension} ·{" "}
                      {fmtDate(it.createdAt)} · {fmtBytes(it.originalSize)} ·{" "}
                      {it.markdownSize.toLocaleString("es")} car. MD
                    </p>
                    {it.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {it.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      it.status === "synced"
                        ? "border-brand-violet/40 bg-brand-violet/10 text-brand-violet"
                        : "border-primary/30 bg-primary/5 text-primary"
                    }`}
                  >
                    {STATUS_LABELS[it.status]}
                  </span>
                </button>
                {selected?.id === it.id && (
                  <div className="bg-card mt-1 rounded-xl border border-border p-4 text-sm">
                    <h3 className="font-medium">{it.title}</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {SOURCE_LABELS[it.sourceType]} · {it.originalFileName} ·{" "}
                      {fmtBytes(it.originalSize)} · Convertido a {it.markdownSize.toLocaleString("es")} caracteres de Markdown.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {it.tags.map((t) => (
                        <span
                          key={t}
                          className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground mt-3 text-xs italic">
                      Vista previa del contenido no disponible en modo demo.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
