"use client";

import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Paperclip, SendHorizontal } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ── Markdown mínimo sin dependencias externas ──────────────────
// Soporta: párrafos, **negrita**, *cursiva*, `código inline`,
// ```bloques de código```, y listas con - o *.
function renderMarkdown(text: string): React.ReactNode {
  const blocks = text.split(/\n\n+/);

  return blocks.map((block, bi) => {
    // Bloque de código vallado
    if (block.startsWith("```")) {
      const end = block.indexOf("```", 3);
      const code = end > 0 ? block.slice(block.indexOf("\n") + 1, end) : block.slice(3);
      return (
        <pre key={bi} className="bg-background overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      );
    }

    // Lista (líneas que empiezan con - o * o número.)
    const lines = block.split("\n");
    const isList = lines.every((l) => /^[-*•]\s/.test(l.trim()) || l.trim() === "");
    const isOrderedList = lines.every((l) => /^\d+\.\s/.test(l.trim()) || l.trim() === "");

    if (isList && lines.some((l) => /^[-*•]\s/.test(l.trim()))) {
      return (
        <ul key={bi} className="ml-4 list-disc space-y-1">
          {lines.filter((l) => l.trim()).map((l, li) => (
            <li key={li}>{inlineMarkdown(l.replace(/^[-*•]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    if (isOrderedList && lines.some((l) => /^\d+\.\s/.test(l.trim()))) {
      return (
        <ol key={bi} className="ml-4 list-decimal space-y-1">
          {lines.filter((l) => l.trim()).map((l, li) => (
            <li key={li}>{inlineMarkdown(l.replace(/^\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    // Encabezado
    if (block.startsWith("### ")) return <h3 key={bi} className="font-semibold">{inlineMarkdown(block.slice(4))}</h3>;
    if (block.startsWith("## ")) return <h2 key={bi} className="font-semibold text-base">{inlineMarkdown(block.slice(3))}</h2>;
    if (block.startsWith("# ")) return <h1 key={bi} className="font-bold text-base">{inlineMarkdown(block.slice(2))}</h1>;

    // Párrafo normal (con saltos de línea suaves dentro)
    return (
      <p key={bi}>
        {lines.map((line, li) => (
          <span key={li}>
            {inlineMarkdown(line)}
            {li < lines.length - 1 && "\n"}
          </span>
        ))}
      </p>
    );
  });
}

function inlineMarkdown(text: string): React.ReactNode {
  // Procesa **negrita**, *cursiva*, `código inline`
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[0].startsWith("*")) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else {
      parts.push(
        <code key={match.index} className="bg-background rounded px-1 py-0.5 font-mono text-[11px]">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

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
  // Muestra spinner solo mientras esperamos el primer token, no durante streaming
  const showSpinner = status === "submitted";

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
            <div className="text-muted-foreground m-auto max-w-md py-8 text-center sm:py-16">
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
              {m.role === "user" ? (
                <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm whitespace-pre-wrap">
                  {messageText(m)}
                </div>
              ) : (
                <div className="bg-card text-foreground prose-sm max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed">
                  {renderMarkdown(messageText(m))}
                </div>
              )}
            </div>
          ))}

          {showSpinner && (
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

      {/* Compositor — en móvil deja espacio para el bottom nav fijo */}
      <div className="shrink-0 border-t p-4 pb-20 md:pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {!empty && (
            <div className="mb-2 hidden flex-wrap gap-2 sm:flex">
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
