"use client";

import { useState } from "react";
import Link from "next/link";
import { History, MessageSquare, MessageSquarePlus, PanelRight } from "lucide-react";

import { AppRail } from "@/components/app/app-rail";
import { UploadContentButton } from "@/components/chat/upload-content-button";
import {
  ChatHistorySidebar,
  type ConversationItem,
} from "@/components/chat/chat-history-sidebar";
import { Sheet } from "@/components/ui/sheet";
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

function timeLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function MobileHistorySheet({
  open,
  onClose,
  conversations,
  activeId,
}: {
  open: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  activeId?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Conversaciones">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground text-xs">
          {conversations.length} conversaciones
        </span>
        <Link
          href="/chat"
          onClick={onClose}
          className="text-primary flex items-center gap-1.5 text-xs font-medium"
        >
          <MessageSquarePlus className="size-3.5" aria-hidden />
          Nueva
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {conversations.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Aún no hay conversaciones.
          </p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <Link
              key={c.id}
              href={`/chat?conv=${c.id}`}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-snug">
                  {c.title ?? "Nueva conversación"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  {timeLabel(c.last_message_at)}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </Sheet>
  );
}

function ContextPanel({
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
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4">
      <div>
        <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
          Perfil activo
        </p>
        <div className="bg-card rounded-xl border p-3">
          <p className="font-medium">{displayName}</p>
          {positioning && (
            <p className="text-muted-foreground mt-1.5 line-clamp-4 text-xs leading-relaxed">
              {positioning}
            </p>
          )}
        </div>
      </div>

      {platforms.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
            Plataformas
          </p>
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
        </div>
      )}

      {signals.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
            Señales recientes
          </p>
          <ul className="flex flex-col gap-2">
            {signals.map((s, i) => (
              <li key={i} className="bg-card rounded-lg border p-2.5 text-xs">
                <p className="line-clamp-2 leading-relaxed">{s.content}</p>
                {s.source && (
                  <span className="text-muted-foreground mt-1 inline-block font-mono text-[9px] tracking-wide uppercase">
                    {s.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-2">
        <UploadContentButton />
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
  conversations,
  activeConversationId,
  children,
}: {
  email: string;
  displayName: string;
  positioning: string | null;
  platforms: PlatformKey[];
  signals: SignalItem[];
  isAdmin?: boolean;
  conversations: ConversationItem[];
  activeConversationId?: string;
  children: React.ReactNode;
}) {
  const [contextOpen, setContextOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* 1: Nav rail */}
      <AppRail
        active="chat"
        displayName={displayName}
        email={email}
        isAdmin={isAdmin}
      />

      {/* 2: Historial desktop */}
      <ChatHistorySidebar
        conversations={conversations}
        activeId={activeConversationId}
      />

      {/* 3: Chat principal */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Botón historial móvil — solo visible en < md */}
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="Ver historial de conversaciones"
          className="border-border text-muted-foreground hover:text-foreground absolute left-4 top-3 z-10 flex rounded-lg border p-1.5 transition-colors md:hidden"
        >
          <History className="size-4" aria-hidden />
        </button>

        {/* Botón contexto desktop — solo visible en xl */}
        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          aria-label={contextOpen ? "Cerrar contexto" : "Ver contexto"}
          title={contextOpen ? "Cerrar contexto" : "Ver contexto"}
          className={`absolute right-4 top-3 z-10 hidden rounded-lg border p-1.5 transition-colors xl:flex ${
            contextOpen
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <PanelRight className="size-4" />
        </button>

        {children}
      </main>

      {/* 4: Panel de contexto desktop (toggle) */}
      {contextOpen && (
        <ContextPanel
          displayName={displayName}
          positioning={positioning}
          platforms={platforms}
          signals={signals}
        />
      )}

      {/* 5: Sheet de historial móvil */}
      <MobileHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
      />
    </div>
  );
}
