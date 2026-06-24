import { Sparkles } from "lucide-react";

import { AppRail } from "@/components/app/app-rail";
import { Button } from "@/components/ui/button";
import { UploadContentButton } from "@/components/chat/upload-content-button";
import type { PlatformKey } from "@/lib/ai/platforms";

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  substack: "Substack",
};

type SignalItem = { content: string; source: string | null };

function RailRight({
  displayName,
  positioning,
  platforms,
  signals,
}: {
  displayName: string;
  positioning: string | null;
  platforms: PlatformKey[];
  signals: SignalItem[];
}) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l p-5 xl:flex">
      <div>
        <h2 className="text-muted-foreground mb-3 font-mono text-xs tracking-wider uppercase">
          Contexto
        </h2>

        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Perfil activo</p>
          <p className="mt-0.5 font-medium">{displayName}</p>
          {positioning && (
            <p className="text-muted-foreground mt-2 line-clamp-4 text-sm">
              {positioning}
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium">
          Plataformas activas
        </h3>
        {platforms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="bg-secondary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <span className="bg-brand-accent size-1.5 rounded-full" />
                {PLATFORM_LABELS[p]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Sin plataformas marcadas todavía.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium">
          Señales recientes
        </h3>
        {signals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {signals.map((s, i) => (
              <li key={i} className="bg-card rounded-lg border p-3 text-sm">
                <p className="line-clamp-2">{s.content}</p>
                {s.source && (
                  <span className="text-muted-foreground mt-1 inline-block font-mono text-[10px] tracking-wide uppercase">
                    {s.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aún no hay señales. Comparte un artículo o una idea en el chat y
            Demiurgos la recordará.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <UploadContentButton />
        <Button variant="outline" size="sm" disabled className="justify-start gap-2">
          <Sparkles className="size-4" />
          Generar propuestas
          <span className="text-muted-foreground ml-auto text-[10px]">pronto</span>
        </Button>
      </div>
    </aside>
  );
}

export function ChatShell({
  email,
  displayName,
  positioning,
  platforms,
  signals,
  isAdmin = false,
  children,
}: {
  email: string;
  displayName: string;
  positioning: string | null;
  platforms: PlatformKey[];
  signals: SignalItem[];
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <AppRail
        active="chat"
        displayName={displayName}
        email={email}
        isAdmin={isAdmin}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      <RailRight
        displayName={displayName}
        positioning={positioning}
        platforms={platforms}
        signals={signals}
      />
    </div>
  );
}
