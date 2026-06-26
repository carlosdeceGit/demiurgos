"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquare, Trash2 } from "lucide-react";

export type ConversationItem = {
  id: string;
  title: string | null;
  last_message_at: string;
};

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

export function ChatHistorySidebar({
  conversations: initial,
  activeId,
}: {
  conversations: ConversationItem[];
  activeId?: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) router.push("/chat");
    setDeleting(null);
  }

  async function newChat() {
    setLoading(true);
    router.push("/chat");
    setLoading(false);
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r md:flex">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Conversaciones
        </span>
        <button
          type="button"
          onClick={newChat}
          disabled={loading}
          aria-label="Nueva conversación"
          className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-accent"
        >
          <MessageSquarePlus className="size-4" />
        </button>
      </div>

      {/* Lista */}
      <nav className="flex flex-col gap-0.5 overflow-y-auto p-2 flex-1">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground text-center">
            Aún no hay conversaciones.
          </p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <div key={c.id} className="group relative">
              <Link
                href={`/chat?conv=${c.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-start gap-2 rounded-lg px-3 py-2.5 pr-8 text-sm transition-colors ${
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
              <button
                type="button"
                onClick={(e) => deleteConversation(c.id, e)}
                disabled={deleting === c.id}
                aria-label="Eliminar conversación"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-all group-hover:opacity-100 text-muted-foreground hover:!text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
