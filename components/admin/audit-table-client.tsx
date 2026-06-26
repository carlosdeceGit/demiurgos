"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminAction = {
  id: string;
  admin_email: string;
  target_user_id: string;
  action_type: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  block: "Bloquear",
  unblock: "Desbloquear",
  suspend: "Suspender",
  activate: "Activar",
  set_limits: "Fijar límites",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditTableClient() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  async function fetchPage(off: number) {
    const res = await fetch(`/api/admin/audit?limit=${limit}&offset=${off}`);
    if (res.ok) {
      const d = await res.json();
      setActions(d.actions);
      setTotal(d.total);
      setOffset(off);
    }
  }

  async function load(off = 0) {
    setLoading(true);
    try {
      await fetchPage(off);
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial: el primer setState ocurre tras el await (no es síncrono dentro
  // del effect) y `loading` ya arranca en true → sin renders en cascada.
  useEffect(() => {
    (async () => {
      try {
        await fetchPage(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {total} registros en total
        </p>
        <div className="flex gap-2">
          <a
            href="/api/admin/export?type=audit"
            download
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <Download className="size-4" /> CSV
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => load(offset)}
            disabled={loading}
            className="text-muted-foreground"
          >
            <RefreshCw className={["size-3.5", loading ? "animate-spin" : ""].join(" ")} />
          </Button>
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
                <th className="px-4 py-2 text-left font-medium">Administrador</th>
                <th className="px-4 py-2 text-left font-medium">Acción</th>
                <th className="px-4 py-2 text-left font-medium">Usuario afectado</th>
                <th className="px-4 py-2 text-left font-medium">Motivo</th>
                <th className="px-4 py-2 text-left font-medium">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                    Cargando…
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                    Sin registros de auditoría todavía.
                  </td>
                </tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="border-t transition-colors hover:bg-muted/20">
                    <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                      {fmt(a.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-secondary rounded-full px-2 py-0.5 text-xs">
                        {ACTION_LABELS[a.action_type] ?? a.action_type}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                      {a.target_user_id.slice(0, 8)}…
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {a.reason ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {a.previous_value?.status && a.new_value?.status ? (
                        <span>
                          {String(a.previous_value.status)} →{" "}
                          <span className="text-foreground">
                            {String((a.new_value as Record<string, unknown>).status)}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={offset === 0}
              onClick={() => load(Math.max(0, offset - limit))}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={offset + limit >= total}
              onClick={() => load(offset + limit)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
