"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatClient({ email }: { email: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Demiurgos</span>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {email}
          </span>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-muted-foreground m-auto max-w-md text-center text-sm">
            Habla con tu director creativo. Prueba:{" "}
            <span className="text-foreground">
              “¿qué formato me conviene en LinkedIn esta semana?”
            </span>
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
                  : "bg-muted max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm whitespace-pre-wrap"
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

      <div className="border-t p-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escribe un mensaje…"
            rows={1}
            className="max-h-40 min-h-10 flex-1 resize-none"
          />
          <Button onClick={submit} disabled={busy || !input.trim()}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
