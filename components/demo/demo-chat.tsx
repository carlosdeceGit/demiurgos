"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Paperclip, Plus, SendHorizontal } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DemoMessage } from "@/demo/fixtures";

const SUGGESTIONS = [
  "¿Qué publico esta semana, y por qué?",
  "Dame 5 propuestas con criterio",
  "Afina mi perfil en base a esta conversación",
];

function toUiMessages(initial: DemoMessage[]): UIMessage[] {
  return initial.map((m, i) => ({
    id: `seed-${i}`,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  }));
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function DemoChat({
  profileId,
  initial,
  onMessagesChange,
}: {
  profileId: string;
  initial: DemoMessage[];
  onMessagesChange?: (msgs: UIMessage[]) => void;
}) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-chat",
      body: { profileId },
    }),
    messages: toUiMessages(initial),
  });

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function newConversation() {
    setMessages(toUiMessages(initial));
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-brand-accent size-2 rounded-full" />
          <span className="font-medium">Director creativo</span>
        </div>
        <div className="flex items-center gap-2">
          {!empty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={newConversation}
              className="text-muted-foreground gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Nueva
            </Button>
          )}
          <span className="text-brand-accent bg-brand-accent/10 rounded-full px-2.5 py-1 font-mono text-xs">
            Demiurgos
          </span>
        </div>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
          {empty && (
            <div className="text-muted-foreground m-auto max-w-md py-16 text-center">
              <Logo size={44} className="mx-auto mb-5" />
              <h2 className="text-foreground font-serif text-3xl">
                Soy tu <span className="text-primary italic">director creativo</span>.
              </h2>
              <p className="mt-3 text-sm">
                Cuéntame qué traes entre manos esta semana, pégame un post que te
                haya llamado o <span className="text-foreground">adjunta un archivo</span>{" "}
                (se guarda en tu biblioteca). Empieza por una de estas:
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm whitespace-pre-wrap"
                    : "bg-card max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-2 text-sm whitespace-pre-wrap"
                }
              >
                {messageText(m)}
              </div>
            </div>
          ))}

          {error && (
            <p className="text-destructive text-sm">
              {error.message || "Algo falló en la demo. Inténtalo de nuevo."}
            </p>
          )}
        </div>
      </div>

      {/* Compositor */}
      <div className="border-t p-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Chips de sugerencia */}
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="bg-secondary hover:bg-secondary/70 text-secondary-foreground rounded-full px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-card focus-within:ring-ring/50 flex items-end gap-2 rounded-2xl border p-2 focus-within:ring-[3px]">
            {/* Paperclip — solo visual en demo */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="Adjuntar archivo (disponible en la versión completa)"
              className="text-muted-foreground hover:text-foreground shrink-0 opacity-50"
            >
              <Paperclip className="size-4" />
            </Button>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Pregúntale al director de este perfil…"
              rows={1}
              className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />

            <Button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              size="icon"
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 shrink-0 rounded-full"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendHorizontal className="size-4" />
              )}
            </Button>
          </div>

          <p className="text-muted-foreground mt-1.5 text-center text-xs">
            Modo demo · el Director responde de verdad con el perfil de ejemplo.
          </p>
        </div>
      </div>
    </div>
  );
}
