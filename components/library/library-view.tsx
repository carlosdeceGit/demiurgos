"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Search,
  UploadCloud,
} from "lucide-react";

import { ContentDetail } from "./content-detail";
import { DrivePanel } from "./drive-panel";
import { StatusBadge } from "./status-badge";
import {
  SOURCE_LABELS,
  STATUS_LABELS,
  isImageExtension,
  type ContentItem,
  type ContentSource,
  type ContentStatus,
  type ContentSourceType,
  type SyncLog,
} from "@/lib/library/types";

const ACCEPT = ".md,.markdown,.txt,.html,.htm,.jpg,.jpeg,.png,.webp,.pdf,.docx,.rtf,.odt";

function fmtBytes(n: number | null): string {
  if (!n) return "—";
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

type UploadState = { name: string; status: "uploading" | "ok" | "error"; error?: string };

export function LibraryView({
  initialItems,
  initialSources,
  initialLogs,
  driveConfigured,
}: {
  initialItems: ContentItem[];
  initialSources: ContentSource[];
  initialLogs: SyncLog[];
  driveConfigured: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [sources, setSources] = useState(initialSources);
  const [logs, setLogs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ContentSourceType | "all">("all");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reconciliar con el servidor tras router.refresh().
  useEffect(() => setItems(initialItems), [initialItems]);
  useEffect(() => setSources(initialSources), [initialSources]);
  useEffect(() => setLogs(initialLogs), [initialLogs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (sourceFilter !== "all" && it.sourceType !== sourceFilter) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        (it.originalFileName ?? "").toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, statusFilter, sourceFilter]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      setUploads((u) => [...u, { name: file.name, status: "uploading" }]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/library/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        const { item } = await res.json();
        setItems((prev) => [item, ...prev]);
        setUploads((u) =>
          u.map((x) => (x.name === file.name ? { ...x, status: "ok" } : x))
        );
      } catch (e) {
        setUploads((u) =>
          u.map((x) =>
            x.name === file.name
              ? { ...x, status: "error", error: e instanceof Error ? e.message : String(e) }
              : x
          )
        );
      }
    }
    router.refresh();
    // Limpia los avisos correctos tras un momento.
    setTimeout(() => setUploads((u) => u.filter((x) => x.status !== "ok")), 4000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  const empty = items.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="font-serif text-2xl">Biblioteca de contenidos</h1>
        <p className="text-muted-foreground text-sm">
          Sube o sincroniza material; Demiurgos lo convierte a Markdown limpio,
          listo para alimentar a la IA. Solo tú ves tu biblioteca.
        </p>
      </header>

      {/* Zona de subida */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed p-6 text-center transition-colors ${
          dragging ? "border-brand-accent bg-brand-accent/5" : "border-input"
        }`}
      >
        <UploadCloud className="text-muted-foreground mx-auto size-7" />
        <p className="mt-2 text-sm font-medium">
          Arrastra archivos o{" "}
          <button
            className="text-brand-accent underline-offset-2 hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            selecciónalos
          </button>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Recomendado: <strong>.md, .txt</strong> e imágenes{" "}
          <strong>.jpg/.png</strong> (OCR). Otros formatos (.html, .pdf, .docx…)
          se intentan convertir a Markdown. Máx. 10 MB por archivo.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Progreso de subida */}
      {uploads.length > 0 && (
        <ul className="space-y-1">
          {uploads.map((u, i) => (
            <li key={`${u.name}-${i}`} className="flex items-center gap-2 text-xs">
              {u.status === "uploading" && <Loader2 className="size-3.5 animate-spin" />}
              {u.status === "ok" && <span className="text-brand-accent">✓</span>}
              {u.status === "error" && <span className="text-destructive">✕</span>}
              <span className="font-mono">{u.name}</span>
              {u.error && <span className="text-destructive">— {u.error}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Google Drive */}
      <DrivePanel
        sources={sources}
        logs={logs}
        driveConfigured={driveConfigured}
        onRefresh={() => router.refresh()}
      />

      {/* Buscador + filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, archivo o etiqueta…"
            className="bg-background focus-visible:ring-ring w-full rounded-md border py-2 pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | "all")}
          className="bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as ContentSourceType | "all")}
          className="bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">Todos los orígenes</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de contenidos */}
      {empty ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto size-8 opacity-50" />
          <p className="mt-3 text-sm">
            Tu biblioteca está vacía. Sube tu primer archivo o conecta una carpeta
            de Google Drive.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No hay contenidos que coincidan con el filtro.
        </p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((it) => {
            const isImg = isImageExtension(it.originalExtension ?? "");
            return (
              <li key={it.id}>
                <button
                  onClick={() => setSelected(it)}
                  className="bg-card hover:border-brand-accent/40 flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors"
                >
                  <span className="bg-brand-accent/10 text-brand-accent grid size-10 shrink-0 place-items-center rounded-lg">
                    {isImg ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {SOURCE_LABELS[it.sourceType]}
                      {it.originalExtension ? ` · .${it.originalExtension}` : ""} ·{" "}
                      {fmtDate(it.createdAt)} · {fmtBytes(it.originalSize)} ·{" "}
                      {it.markdownSize} car. MD
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
                  <StatusBadge status={it.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <ContentDetail
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={() => router.refresh()}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((x) => x.id !== id));
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
