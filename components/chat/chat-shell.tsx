import Link from "next/link";
import {
  FolderOpen,
  Lightbulb,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  Sparkles,
  User,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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

// Navegación. Solo "Chat" está activo en este hito; el resto se marca como
// próximo (hitos posteriores), pero ya ocupa su sitio en la UI.
const NAV = [
  { label: "Chat", icon: MessageSquare, active: true },
  { label: "Biblioteca", icon: FolderOpen, active: false },
  { label: "Banco de ideas", icon: Lightbulb, active: false },
  { label: "Propuestas", icon: LayoutGrid, active: false },
  { label: "Perfil", icon: User, active: false },
];

function RailLeft({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <aside className="bg-muted/30 hidden w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex items-center gap-2 px-5 py-4">
        <span className="bg-foreground text-background grid size-7 place-items-center rounded-lg font-serif text-lg italic">
          D
        </span>
        <span className="font-semibold tracking-tight">Demiurgos</span>
      </div>

      <div className="px-3">
        <Button asChild className="w-full justify-start gap-2 rounded-full">
          <Link href="/chat">
            <Plus className="size-4" />
            Nueva conversación
          </Link>
        </Button>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        {NAV.map(({ label, icon: Icon, active }) =>
          active ? (
            <span
              key={label}
              aria-current="page"
              className="bg-accent text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
            >
              <Icon className="size-4" />
              {label}
            </span>
          ) : (
            <span
              key={label}
              title="Próximamente"
              className="text-muted-foreground/70 flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm"
            >
              <Icon className="size-4" />
              {label}
              <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px]">
                pronto
              </span>
            </span>
          )
        )}
      </nav>

      <div className="mt-auto border-t p-3">
        <div className="flex items-center gap-2">
          <span className="bg-secondary grid size-8 place-items-center rounded-full text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action="/auth/signout" method="post" className="mt-2">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            Salir
          </Button>
        </form>
      </div>
    </aside>
  );
}

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
        <Button variant="outline" size="sm" disabled className="justify-start gap-2">
          <Plus className="size-4" />
          Subir contenido
          <span className="text-muted-foreground ml-auto text-[10px]">pronto</span>
        </Button>
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
  children,
}: {
  email: string;
  displayName: string;
  positioning: string | null;
  platforms: PlatformKey[];
  signals: SignalItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <RailLeft displayName={displayName} email={email} />
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
