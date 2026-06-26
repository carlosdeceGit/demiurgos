"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./status-badge";
import {
  SOURCE_LABELS,
  type ContentItem,
} from "@/lib/library/types";

type RawPost = {
  text: string;
  date?: string;
  stats?: Record<string, number>;
  url?: string;
};

type SocialMeta = {
  content_type?: string;
  platform?: string;
  handle?: string;
  posts_analyzed?: number;
  last_scraped_at?: string;
  scrape_count?: number;
  synthesis_updated_at?: string;
  raw_posts?: RawPost[];
};

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
  metadata_json: SocialMeta | null;
};

const PROFILE_TYPES = new Set(["profile", "company", "channel", "page"]);

function isSocialProfile(data: DetailData | null): boolean {
  return !!data?.metadata_json?.content_type && PROFILE_TYPES.has(data.metadata_json.content_type);
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function SocialProfileView({
  data,
  rawPostsOpen,
  renewMsg,
  onToggleRawPosts,
}: {
  data: DetailData;
  rawPostsOpen: boolean;
  renewMsg: string | null;
  onToggleRawPosts: () => void;
}) {
  const meta = data.metadata_json ?? {};
  const rawPosts = meta.raw_posts ?? [];

  return (
    <div className="space-y-6">
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {meta.posts_analyzed != null && <span>{meta.posts_analyzed} posts analizados</span>}
        {meta.last_scraped_at && <span>Último scrape: {fmtDate(meta.last_scraped_at)}</span>}
        {meta.scrape_count != null && <span>Scrape #{meta.scrape_count}</span>}
      </div>

      {renewMsg && (
        <p className="text-primary text-sm">{renewMsg}</p>
      )}

      <section>
        <h3 className="text-foreground mb-3 text-sm font-semibold">Análisis del Director</h3>
        {data.markdown_content ? (
          <pre className="text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {data.markdown_content}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm">Sin análisis todavía.</p>
        )}
      </section>

      {rawPosts.length > 0 && (
        <section>
          <button
            onClick={onToggleRawPosts}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium"
          >
            {rawPostsOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            Posts importados ({rawPosts.length})
          </button>
          {rawPostsOpen && (
            <ol className="mt-3 space-y-3">
              {rawPosts.map((p, i) => (
                <li key={i} className="bg-background rounded-lg border p-3 text-xs">
                  <p className="text-foreground line-clamp-4 leading-relaxed">{p.text}</p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                    {p.date && <span>{fmtDate(p.date)}</span>}
                    {p.stats &&
                      Object.entries(p.stats)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => (
                          <span key={k}>{k}: {v.toLocaleString()}</span>
                        ))}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver post
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

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
  const [renewBusy, setRenewBusy] = useState(false);
  const [renewMsg, setRenewMsg] = useState<string | null>(null);
  const [rawPostsOpen, setRawPostsOpen] = useState(false);
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

  async function renew() {
    setRenewBusy(true);
    setError(null);
    setRenewMsg(null);
    try {
      const res = await fetch(`/api/library/${item.id}/renew`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setRenewMsg(`${json.posts_analyzed} posts renovados (scrape #${json.scrape_count})`);
      onChanged();
      const r = await fetch(`/api/library/${item.id}`);
      if (r.ok) {
        const d = await r.json();
        setData(d.item);
        setDraftMd(d.item.markdown_content ?? "");
        setDraftTitle(d.item.title ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRenewBusy(false);
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
          {isSocialProfile(data) ? (
            <Button variant="outline" size="sm" onClick={renew} disabled={renewBusy || busy}>
              <RefreshCw className={`size-3.5 ${renewBusy ? "animate-spin" : ""}`} />
              {renewBusy ? "Renovando…" : "Renovar posts"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={reprocess} disabled={busy}>
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} /> Reprocesar
            </Button>
          )}
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
          ) : isSocialProfile(data) ? (
            <SocialProfileView
              data={data!}
              rawPostsOpen={rawPostsOpen}
              renewMsg={renewMsg}
              onToggleRawPosts={() => setRawPostsOpen((o) => !o)}
            />
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
