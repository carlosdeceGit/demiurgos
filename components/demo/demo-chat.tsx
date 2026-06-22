"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DemoMessage } from "@/demo/fixtures";

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
}: {
  profileId: string;
  initial: DemoMessage[];
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-chat",
      body: { profileId },
    }),
    messages: toUiMessages(initial),
  });

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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

      <div className="p-4">
        <div className="bg-card focus-within:ring-ring/50 flex items-end gap-2 rounded-2xl border p-2 focus-within:ring-[3px]">
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
            <SendHorizontal className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-1.5 text-center text-xs">
          Modo demo · el Director responde de verdad con el perfil de ejemplo.
        </p>
      </div>
    </div>
  );
}
