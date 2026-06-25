"use client";

import { useState } from "react";
import { PanelRight } from "lucide-react";

import { AppRail } from "@/components/app/app-rail";
import { UploadContentButton } from "@/components/chat/upload-content-button";
import {
  ChatHistorySidebar,
  type ConversationItem,
} from "@/components/chat/chat-history-sidebar";
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

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* 1: Nav rail */}
      <AppRail
        active="chat"
        displayName={displayName}
        email={email}
        isAdmin={isAdmin}
      />

      {/* 2: Historial de conversaciones */}
      <ChatHistorySidebar
        conversations={conversations}
        activeId={activeConversationId}
      />

      {/* 3: Chat principal */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Botón para mostrar/ocultar el panel de contexto */}
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

      {/* 4: Panel de contexto (toggle) */}
      {contextOpen && (
        <ContextPanel
          displayName={displayName}
          positioning={positioning}
          platforms={platforms}
          signals={signals}
        />
      )}
    </div>
  );
}
