"use client";

import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Paperclip, SendHorizontal } from "lucide-react";

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

// Convierte mensajes históricos de la BD al formato UIMessage
function toUIMessages(
  raw: { id: string; role: string; content: string }[]
): UIMessage[] {
  return raw.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
    content: m.content,
  }));
}

export function ChatClient({
  conversationId: initialConvId,
  initialMessages: rawInitial = [],
}: {
  conversationId?: string;
  initialMessages?: { id: string; role: string; content: string }[];
}) {
  const [convId, setConvId] = useState<string | undefined>(initialConvId);
  const [input, setInput] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId: convId },
      // Capturar el conversation_id devuelto en headers
      fetch: async (url, init) => {
        const res = await fetch(url, init);
        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId && !convId) setConvId(newConvId);
        return res;
      },
    }),
    initialMessages: toUIMessages(rawInitial),
  });

  const busy = status === "submitted" || status === "streaming";

  // Scroll al fondo en cada mensaje nuevo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
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
        } catch { /* ignorar */ }

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
            text: `He subido «${file.name}» a mi biblioteca, pero la conversión necesita revisión. Lo tengo guardado.`,
          });
        } else {
          setAttachError(`«${file.name}»: ${item.conversionError ?? "no se pudo convertir."}`);
        }
      } catch (e) {
        setAttachError(`«${file.name}»: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setAttaching(null);
      }
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <header className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-brand-accent size-2 rounded-full" />
          <span className="font-medium">Director creativo</span>
        </div>
        <span className="text-brand-violet bg-brand-violet/10 rounded-full px-2.5 py-1 font-mono text-xs">
          Demiurgos
        </span>
      </header>

      {/* Mensajes */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
          {empty && (
            <div className="text-muted-foreground m-auto max-w-md py-16 text-center">
              <Logo size={44} className="mx-auto mb-5" />
              <h1 className="text-foreground font-serif text-3xl">
                Soy tu <span className="text-primary italic">director creativo</span>.
              </h1>
              <p className="mt-3 text-sm">
                Cuéntame qué traes entre manos esta semana, pégame un post que te
                haya llamado o{" "}
                <span className="text-foreground">adjunta un archivo</span>{" "}
                (se guarda en tu biblioteca).
              </p>
              <div className="mt-6 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="bg-card hover:border-primary/40 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
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
                    : "bg-card max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                }
              >
                {messageText(m)}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="bg-card rounded-2xl rounded-bl-sm border px-4 py-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm">Algo falló: {error.message}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Compositor */}
      <div className="shrink-0 border-t p-4">
        <div className="mx-auto w-full max-w-3xl">
          {!empty && (
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
          )}

          {attaching && (
            <p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Subiendo «{attaching}»…
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
              title="Adjuntar archivo"
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
              placeholder="Escribe un mensaje…"
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
            El Director cruza tu perfil con el ecosistema y las señales de la semana.
          </p>
        </div>
      </div>
    </div>
  );
}
