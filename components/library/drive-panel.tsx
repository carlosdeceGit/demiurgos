"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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

const DRIVE_ERRORS: Record<string, string> = {
  not_configured:
    "Google Drive aún no está configurado en este entorno (faltan credenciales OAuth).",
  state_mismatch: "La sesión de autorización caducó. Inténtalo de nuevo.",
  no_refresh_token:
    "Google no devolvió permiso de acceso continuo. Revoca el acceso anterior en tu cuenta de Google y reconecta.",
};

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
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Feedback del flujo OAuth (vuelta del callback): se deriva de la URL.
  const errCode = searchParams.get("drive_error");
  const urlError = errCode
    ? DRIVE_ERRORS[errCode] ?? `Error de Google Drive: ${errCode}`
    : null;
  const urlMsg = searchParams.get("connected")
    ? "Cuenta de Google Drive conectada. Elige una carpeta para sincronizar."
    : null;
  const shownError = error ?? urlError;
  const shownMsg = msg ?? urlMsg;

  async function disconnect(id: string) {
    if (!confirm("¿Desconectar esta cuenta? El contenido ya importado se conserva."))
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
        setError(json.error ?? "No se pudo sincronizar.");
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderSync className="text-brand-accent size-4" />
          <h2 className="font-medium">Google Drive</h2>
        </div>
        {driveConfigured && (
          <Button
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => {
              window.location.href = "/api/library/oauth/start";
            }}
          >
            <Link2 className="size-3.5" /> Conectar Google Drive
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        Cada usuario conecta su propia cuenta de Drive y elige una carpeta. Al
        actualizar se importan solo los archivos nuevos o modificados.
      </p>

      {!driveConfigured && (
        <p className="text-brand-amber bg-brand-amber/10 mt-3 rounded-lg px-3 py-2 text-xs">
          OAuth de Google aún no está configurado en este entorno. Añade
          GOOGLE_CLIENT_ID / SECRET / REDIRECT_URI y LIBRARY_TOKEN_SECRET para
          habilitar la conexión (ver docs/CONTENT_LIBRARY.md).
        </p>
      )}

      {shownError && (
        <p className="text-destructive bg-destructive/10 mt-3 rounded-lg px-3 py-2 text-xs">
          {shownError}
        </p>
      )}
      {shownMsg && (
        <p className="text-brand-accent bg-brand-accent/10 mt-3 rounded-lg px-3 py-2 text-xs">
          {shownMsg}
        </p>
      )}

      {/* Cuentas/carpetas conectadas */}
      {sources.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {sources.map((s) => (
            <li key={s.id} className="bg-background rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                {s.syncStatus === "connected" ? (
                  <CheckCircle2 className="text-brand-accent size-4 shrink-0" />
                ) : s.syncStatus === "error" ? (
                  <CloudOff className="text-destructive size-4 shrink-0" />
                ) : (
                  <Link2 className="text-muted-foreground size-4 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.providerAccountEmail ?? "Cuenta de Drive"}
                  </p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    {s.providerFolderName
                      ? `${s.providerFolderName} · últ. sync ${fmtDate(s.lastSyncAt)}`
                      : "Sin carpeta elegida"}
                  </p>
                </div>
                {s.providerFolderId && (
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
                )}
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
              </div>

              {/* Selector de carpeta cuando aún no se ha elegido. */}
              {!s.providerFolderId && (
                <FolderPicker sourceId={s.id} onSaved={onRefresh} onError={setError} />
              )}

              {s.syncError && (
                <p className="text-brand-amber mt-2 text-[11px]">{s.syncError}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        driveConfigured && (
          <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-center text-sm">
            Sin cuentas conectadas. Pulsa «Conectar Google Drive» para empezar.
          </p>
        )
      )}

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

// Carga las carpetas de Drive de la cuenta y permite fijar una para sincronizar.
function FolderPicker({
  sourceId,
  onSaved,
  onError,
}: {
  sourceId: string;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [folders, setFolders] = useState<{ id: string; name: string }[] | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/library/sources/${sourceId}/folders`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudieron listar las carpetas.");
      setFolders(json.folders ?? []);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const folder = folders?.find((f) => f.id === selected);
      const res = await fetch(`/api/library/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selected, folderName: folder?.name }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (folders === null) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={load}
        disabled={loading}
        className="mt-2 gap-1.5"
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Elegir carpeta
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="bg-background rounded-md border px-3 py-1.5 text-sm"
      >
        <option value="">Selecciona una carpeta…</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={save} disabled={!selected || saving}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Guardar carpeta
      </Button>
    </div>
  );
}
