"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Loader2, Paperclip, Plus, SendHorizontal } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "¿Qué publico esta semana, y por qué?",
  "Dame 5 propuestas con criterio",
  "Vamos a afinar mi perfil",
];

const ACCEPT = ".md,.markdown,.txt,.html,.htm,.jpg,.jpeg,.png,.webp,.pdf,.docx,.rtf,.odt";
const MAX_INLINE_CHARS = 8000;

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

type Props = {
  onMessagesChange?: (messages: UIMessage[]) => void;
};

export function ChatClient({ onMessagesChange }: Props) {
  const [input, setInput] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const convIdRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Transport custom que siempre lee el conversationId de la ref.
  const transport = useMemo(
    () => ({
      async sendMessages({
        messages,
        abortSignal,
      }: {
        messages: unknown[];
        abortSignal?: AbortSignal;
      }): Promise<Response> {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            conversationId: convIdRef.current,
          }),
          signal: abortSignal,
        });
        const newId = res.headers.get("X-Conversation-Id");
        if (newId && !convIdRef.current) convIdRef.current = newId;
        return res;
      },
    }),
    []
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function newConversation() {
    setMessages([]);
    convIdRef.current = null;
    onMessagesChange?.([]);
  }

  async function attachFiles(files: FileList | File[]) {
    setAttachError(null);
    for (const file of Array.from(files)) {
      setAttaching(file.name);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/library/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        const { item } = await res.json();

        let md = "";
        try {
          const detail = await fetch(`/api/library/${item.id}`);
          if (detail.ok) md = (await detail.json()).item?.markdown_content ?? "";
        } catch {
          /* si falla, mandamos solo el aviso de subida */
        }

        if (item.status === "completed" && md) {
          const clipped =
            md.length > MAX_INLINE_CHARS
              ? `${md.slice(0, MAX_INLINE_CHARS)}\n\n…(recortado; el contenido completo está en tu Biblioteca)`
              : md;
          sendMessage({
            text: `He subido «${item.title}» a mi biblioteca. Este es su contenido:\n\n${clipped}`,
          });
        } else if (item.status === "needs_review") {
          sendMessage({
            text: `He subido «${file.name}» a mi biblioteca, pero la conversión a texto necesita revisión (${item.conversionError ?? "formato no extraído"}). Lo tengo guardado para revisarlo.`,
          });
        } else {
          setAttachError(
            `«${file.name}»: ${item.conversionError ?? "no se pudo convertir."}`
          );
        }
      } catch (e) {
        setAttachError(
          `«${file.name}»: ${e instanceof Error ? e.message : String(e)}`
        );
      } finally {
        setAttaching(null);
      }
    }
  }

  const empty = messages.length === 0;

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
              <h1 className="text-foreground font-serif text-3xl">
                Soy tu <span className="text-primary italic">director creativo</span>.
              </h1>
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

          {attaching && (
            <p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Subiendo y convirtiendo «{attaching}»…
            </p>
          )}
          {attachError && (
            <p className="text-destructive bg-destructive/10 mb-2 rounded-lg px-3 py-1.5 text-xs">
              {attachError}
            </p>
          )}

          <div className="bg-card focus-within:ring-ring/50 flex items-end gap-2 rounded-2xl border p-2 focus-within:ring-[3px]">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) attachFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy || Boolean(attaching)}
              onClick={() => fileRef.current?.click()}
              title="Adjuntar archivo (se guarda en tu biblioteca)"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {attaching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
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
