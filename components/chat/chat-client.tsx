"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Paperclip, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "¿Qué formato me conviene en LinkedIn esta semana?",
  "Dame 5 propuestas para esta semana",
  "Vamos a afinar mi perfil",
];

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatClient() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera del chat */}
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-brand-accent size-2 rounded-full" />
          <span className="font-medium">Director creativo</span>
        </div>
        <span className="text-brand-violet bg-brand-violet/10 rounded-full px-2.5 py-1 font-mono text-xs">
          GPT-5.5
        </span>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
          {empty && (
            <div className="text-muted-foreground m-auto max-w-md py-16 text-center">
              <h1 className="text-foreground font-serif text-3xl">
                Hola, soy tu director creativo.
              </h1>
              <p className="mt-2 text-sm">
                Dime qué traes entre manos esta semana, o prueba con una de las
                sugerencias de abajo.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
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
              Algo falló: {error.message}
            </p>
          )}
        </div>
      </div>

      {/* Compositor */}
      <div className="border-t p-4">
        <div className="mx-auto w-full max-w-3xl">
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="Subir contenido — próximamente (Hito 2)"
              className="text-muted-foreground shrink-0"
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
              placeholder="Escribe un mensaje, o pega un post que te haya llamado…"
              rows={1}
              className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              size="icon"
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 shrink-0 rounded-full"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-1.5 text-center text-xs">
            Demiurgos cruza tu perfil con cómo funciona cada red. Comparte
            señales para afinar.
          </p>
        </div>
      </div>
    </div>
  );
}
