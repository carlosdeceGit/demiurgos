"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import type { UIMessage } from "ai";

import { AppRail } from "@/components/app/app-rail";
import { Button } from "@/components/ui/button";
import { ChatClient } from "@/components/chat/chat-client";
import type { PlatformKey } from "@/lib/ai/platforms";

function extractContextPoints(messages: UIMessage[]): string[] {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) =>
      m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
        .trim()
    )
    .filter(Boolean);

  return userMessages.slice(-4).map((t) =>
    t.length > 80 ? t.slice(0, 80).trimEnd() + "…" : t
  );
}

function RailRight({ messages }: { messages: UIMessage[] }) {
  const points = extractContextPoints(messages);
  const hasContext = points.length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l p-5 xl:flex">
      <div>
        <h2 className="text-muted-foreground mb-3 font-mono text-xs tracking-wider uppercase">
          Esta conversación
        </h2>

        {hasContext ? (
          <ul className="flex flex-col gap-2">
            {points.map((pt, i) => (
              <li
                key={i}
                className="bg-card flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
              >
                <span className="bg-brand-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Los temas que traigas aparecerán aquí para que el Director los tenga
            siempre a la vista.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <h3 className="text-muted-foreground mb-1 font-mono text-xs tracking-wider uppercase">
          Acciones rápidas
        </h3>
        <Button variant="outline" size="sm" asChild className="justify-start gap-2">
          <Link href="/library">
            <BookOpen className="size-4" />
            Ir a Biblioteca
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="justify-start gap-2">
          <Link href="/propuestas">
            <Sparkles className="size-4" />
            Ver propuestas
          </Link>
        </Button>
      </div>
    </aside>
  );
}

export function ChatShell({
  email,
  displayName,
  isAdmin = false,
}: {
  email: string;
  displayName: string;
  positioning?: string | null;
  platforms?: PlatformKey[];
  signals?: { content: string; source: string | null }[];
  isAdmin?: boolean;
}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const handleMessages = useCallback((msgs: UIMessage[]) => setMessages(msgs), []);

  return (
    <div className="flex h-dvh">
      <AppRail
        active="chat"
        displayName={displayName}
        email={email}
        isAdmin={isAdmin}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatClient onMessagesChange={handleMessages} />
      </main>
      <RailRight messages={messages} />
    </div>
  );
}
