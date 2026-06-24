"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export function WelcomeBanner({ name }: { name: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const firstName = name.split(" ")[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Bienvenido, {firstName}. Tu Director creativo está listo.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Estamos analizando tus redes en segundo plano. En unos minutos tu perfil
          estará completo y podrás generar tu primera semana de propuestas.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
