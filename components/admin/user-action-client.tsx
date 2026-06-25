"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, CheckCircle2, Clock, Loader2, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";

type ActionType = "block" | "unblock" | "suspend" | "activate" | "set_limits";

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  status: string;
  usageLimit: number | null;
  spendLimit: number | null;
  blockedReason: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
}

async function applyAction(
  userId: string,
  payload: {
    action: ActionType;
    reason?: string;
    usageLimit?: number | null;
    spendLimit?: number | null;
  }
) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error ?? "Error al aplicar acción");
  }
  return res.json();
}

export function UserActionClient({ user }: { user: UserInfo }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeForm, setActiveForm] = useState<ActionType | null>(null);
  const [reason, setReason] = useState("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [spendLimit, setSpendLimit] = useState<string>("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function reset() {
    setActiveForm(null);
    setReason("");
    setUsageLimit("");
    setSpendLimit("");
  }

  function submit(action: ActionType) {
    if (action !== "activate" && action !== "unblock" && !reason.trim() && action !== "set_limits") {
      setFeedback({ ok: false, msg: "Indica un motivo antes de continuar." });
      return;
    }
    startTransition(async () => {
      try {
        await applyAction(user.id, {
          action,
          reason: reason.trim() || undefined,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          spendLimit: spendLimit ? Number(spendLimit) : null,
        });
        setFeedback({ ok: true, msg: "Acción aplicada correctamente." });
        reset();
        router.refresh();
      } catch (e) {
        setFeedback({ ok: false, msg: (e as Error).message });
      }
    });
  }

  const isRestricted = ["blocked", "suspended", "limited"].includes(user.status);

  return (
    <div className="bg-card space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Control de acceso</h3>
        <StatusBadge status={user.status} />
      </div>

      {user.blockedReason && (
        <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3 text-xs">
          <p className="text-destructive font-medium">Motivo de restricción</p>
          <p className="text-muted-foreground mt-0.5">{user.blockedReason}</p>
          {user.blockedBy && (
            <p className="text-muted-foreground mt-1">
              Por <span className="font-mono">{user.blockedBy}</span>
              {user.blockedAt && (
                <>
                  {" · "}
                  {new Date(user.blockedAt).toLocaleDateString("es-ES")}
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Botones de acción */}
      {activeForm === null && (
        <div className="flex flex-wrap gap-2">
          {isRestricted ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-brand-accent border-brand-accent-tint-border border"
              onClick={() => submit("activate")}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Activar cuenta
            </Button>
          ) : null}
          {user.status !== "blocked" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive border-destructive/20 border"
              onClick={() => setActiveForm("block")}
            >
              <Ban className="size-3.5" />
              Bloquear
            </Button>
          )}
          {user.status !== "suspended" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-brand-amber border-brand-amber/20 border"
              onClick={() => setActiveForm("suspend")}
            >
              <Clock className="size-3.5" />
              Suspender
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="border"
            onClick={() => setActiveForm("set_limits")}
          >
            <Sliders className="size-3.5" />
            Fijar límites
          </Button>
        </div>
      )}

      {/* Formulario contextual */}
      {activeForm && (
        <div className="bg-muted/30 space-y-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-brand-amber size-4" />
            <p className="text-sm font-medium">
              {activeForm === "block" && "Bloquear usuario"}
              {activeForm === "suspend" && "Suspender usuario"}
              {activeForm === "set_limits" && "Fijar límites de uso"}
            </p>
          </div>

          {activeForm === "set_limits" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  Límite de runs
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="bg-card border-border w-full rounded-md border px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  Límite de gasto ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Sin límite"
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(e.target.value)}
                  className="bg-card border-border w-full rounded-md border px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-muted-foreground mb-1 block text-xs">
              Motivo{activeForm !== "set_limits" && " (obligatorio)"}
            </label>
            <textarea
              rows={2}
              placeholder="Describe el motivo de esta acción…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-card border-border w-full resize-none rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submit(activeForm)}
              disabled={pending}
              className={
                activeForm === "block"
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : ""
              }
            >
              {pending && <Loader2 className="mr-1 size-3 animate-spin" />}
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {feedback && (
        <p
          className={[
            "text-xs",
            feedback.ok ? "text-brand-accent" : "text-destructive",
          ].join(" ")}
        >
          {feedback.msg}
        </p>
      )}

      {(user.usageLimit !== null || user.spendLimit !== null) && (
        <div className="text-muted-foreground border-t pt-3 text-xs">
          {user.usageLimit !== null && (
            <p>Límite de runs: {user.usageLimit}</p>
          )}
          {user.spendLimit !== null && (
            <p>Límite de gasto: ${user.spendLimit}</p>
          )}
        </div>
      )}
    </div>
  );
}
