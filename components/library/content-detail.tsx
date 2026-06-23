"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./status-badge";
import {
  SOURCE_LABELS,
  type ContentItem,
} from "@/lib/library/types";

type DetailData = {
  id: string;
  title: string;
  tags: string[];
  markdown_content: string | null;
  status: ContentItem["status"];
  conversion_tool: string | null;
  conversion_error: string | null;
  original_file_name: string | null;
  original_extension: string | null;
  source_type: ContentItem["sourceType"];
  source_url: string | null;
};

export function ContentDetail({
  item,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: ContentItem;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: (id: string) => void;
}) {
  const [data, setData] = useState<DetailData | null>(null);
  // El componente se monta con key={item.id}, así que cada apertura arranca en
  // loading=true sin necesidad de setState síncrono dentro del efecto.
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMd, setDraftMd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/library/${item.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        setData(json.item);
        setDraftTitle(json.item.title ?? "");
        setDraftMd(json.item.markdown_content ?? "");
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [item.id]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle, markdown_content: draftMd }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditing(false);
      onChanged();
      setData((d) =>
        d ? { ...d, title: draftTitle, markdown_content: draftMd, status: "completed" } : d
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function reprocess() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/${item.id}/reprocess`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged();
      // Recarga el detalle.
      const r = await fetch(`/api/library/${item.id}`);
      if (r.ok) {
        const json = await r.json();
        setData(json.item);
        setDraftMd(json.item.markdown_content ?? "");
        setDraftTitle(json.item.title ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este contenido de la biblioteca?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/library/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onDeleted(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Cerrar"
        className="bg-background/70 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="bg-card relative flex h-full w-full max-w-2xl flex-col border-l shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div className="min-w-0">
            <h2 className="font-serif text-xl break-words">{data?.title ?? item.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge status={data?.status ?? item.status} />
              <span className="text-muted-foreground">
                {SOURCE_LABELS[item.sourceType]}
              </span>
              {item.originalExtension && (
                <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 font-mono text-[10px]">
                  .{item.originalExtension}
                </span>
              )}
              {item.conversionTool && (
                <span className="text-muted-foreground font-mono text-[10px]">
                  {item.conversionTool}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={busy || loading}
            >
              <Pencil className="size-3.5" /> Editar
            </Button>
          ) : (
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Guardar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={reprocess} disabled={busy}>
            <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} /> Reprocesar
          </Button>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-accent ml-1 text-sm hover:underline"
            >
              Ver original
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={busy}
            className="text-destructive hover:text-destructive ml-auto"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <p className="text-destructive bg-destructive/10 mb-4 rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}
          {(data?.conversion_error || item.conversionError) && (
            <p className="text-brand-amber bg-brand-amber/10 mb-4 rounded-lg px-3 py-2 text-sm">
              {data?.conversion_error ?? item.conversionError}
            </p>
          )}

          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Cargando…
            </div>
          ) : editing ? (
            <div className="space-y-3">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="Título"
              />
              <Textarea
                value={draftMd}
                onChange={(e) => setDraftMd(e.target.value)}
                className="min-h-[50vh] font-mono text-xs"
                placeholder="Contenido en Markdown…"
              />
            </div>
          ) : data?.markdown_content ? (
            <pre className="text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {data.markdown_content}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sin contenido Markdown todavía. Edítalo a mano o reprocesa el
              archivo.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
