"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CloudOff,
  FolderSync,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContentSource, SyncLog } from "@/lib/library/types";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DrivePanel({
  sources,
  logs,
  driveConfigured,
  onRefresh,
}: {
  sources: ContentSource[];
  logs: SyncLog[];
  driveConfigured: boolean;
  onRefresh: () => void;
}) {
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    if (!folderId.trim()) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/library/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderId.trim(), folderName: folderName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setFolderId("");
      setFolderName("");
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(id: string) {
    if (!confirm("¿Desconectar esta carpeta? El contenido ya importado se conserva."))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/library/sources?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sync(id: string) {
    setSyncingId(id);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/library/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          json.error ??
            "No se pudo sincronizar. Revisa la configuración de Google Drive."
        );
      } else {
        const c = json.counters ?? {};
        setMsg(
          `Sincronizado: ${c.filesImported ?? 0} nuevos, ${c.filesUpdated ?? 0} actualizados, ${c.filesFailed ?? 0} con error.`
        );
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <section className="bg-card rounded-xl border p-5">
      <div className="flex items-center gap-2">
        <FolderSync className="text-brand-accent size-4" />
        <h2 className="font-medium">Google Drive</h2>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        Conecta una carpeta de Drive y actualiza la biblioteca cuando quieras. Se
        importan solo los archivos nuevos o modificados.
      </p>

      {!driveConfigured && (
        <p className="text-brand-amber bg-brand-amber/10 mt-3 rounded-lg px-3 py-2 text-xs">
          OAuth de Google aún no está configurado en este entorno. Puedes
          registrar la carpeta para dejarlo listo; la sincronización pedirá
          autorización cuando se añadan las credenciales (ver
          docs/CONTENT_LIBRARY.md).
        </p>
      )}

      {error && (
        <p className="text-destructive bg-destructive/10 mt-3 rounded-lg px-3 py-2 text-xs">
          {error}
        </p>
      )}
      {msg && (
        <p className="text-brand-accent bg-brand-accent/10 mt-3 rounded-lg px-3 py-2 text-xs">
          {msg}
        </p>
      )}

      {/* Orígenes conectados */}
      {sources.length > 0 && (
        <ul className="mt-4 space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="bg-background flex flex-wrap items-center gap-2 rounded-lg border p-3"
            >
              {s.syncStatus === "connected" ? (
                <CheckCircle2 className="text-brand-accent size-4 shrink-0" />
              ) : s.syncStatus === "error" ? (
                <CloudOff className="text-destructive size-4 shrink-0" />
              ) : (
                <Link2 className="text-muted-foreground size-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {s.providerFolderName ?? "Carpeta de Drive"}
                </p>
                <p className="text-muted-foreground truncate font-mono text-[11px]">
                  {s.providerFolderId} · últ. sync {fmtDate(s.lastSyncAt)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => sync(s.id)}
                disabled={syncingId === s.id || busy}
                className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 gap-1.5 rounded-full"
              >
                {syncingId === s.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Sincronizar ahora
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disconnect(s.id)}
                disabled={busy}
                aria-label="Desconectar"
                className="text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Registrar carpeta */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          placeholder="ID de la carpeta de Drive"
          className="bg-background focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Nombre (opcional)"
          className="bg-background focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button onClick={connect} disabled={busy || !folderId.trim()} className="gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Conectar carpeta
        </Button>
      </div>

      {/* Historial de sincronización */}
      {logs.length > 0 && (
        <details className="mt-4">
          <summary className="text-muted-foreground cursor-pointer text-xs">
            Historial de sincronización ({logs.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {logs.map((l) => (
              <li
                key={l.id}
                className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-[11px]"
              >
                <span>{fmtDate(l.startedAt)}</span>
                <span
                  className={
                    l.status === "completed"
                      ? "text-brand-accent"
                      : l.status === "failed"
                        ? "text-destructive"
                        : "text-brand-amber"
                  }
                >
                  {l.status}
                </span>
                <span>
                  {l.filesImported}↓ {l.filesUpdated}↻ {l.filesFailed}✕ de{" "}
                  {l.filesFound}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
