// Cliente mínimo de MCP "Streamable HTTP" para trendsmcp.ai, hablado por fetch
// (la versión de `ai` instalada no trae cliente MCP, y no añadimos dependencias).
//
// Flujo MCP 2025-06-18: initialize -> notifications/initialized -> tools/call.
// Defensivo y con timeout: cualquier fallo lo captura el orquestador y se degrada
// a análisis solo-LLM. NOTA: no se ha podido probar en vivo desde el sandbox
// (sin salida de red); requiere TRENDS_API_KEY y una verificación real al activarlo.

const PROTOCOL_VERSION = "2025-06-18";
const TIMEOUT_MS = 12_000;

type JsonRpcResult = { result?: unknown; error?: { message?: string } };

// Extrae el JSON-RPC de una respuesta que puede ser application/json o SSE.
function parseBody(contentType: string, body: string): JsonRpcResult | null {
  if (contentType.includes("text/event-stream")) {
    // Tomamos el último `data:` parseable.
    let last: JsonRpcResult | null = null;
    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        last = JSON.parse(payload) as JsonRpcResult;
      } catch {
        /* ignora trozos no-JSON */
      }
    }
    return last;
  }
  try {
    return JSON.parse(body) as JsonRpcResult;
  } catch {
    return null;
  }
}

// Concatena el texto de result.content[] (forma estándar de tools/call).
function textFromToolResult(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content)) return JSON.stringify(result);
  return content
    .map((c) => {
      if (c && typeof c === "object" && "text" in c) {
        return String((c as { text: unknown }).text ?? "");
      }
      return typeof c === "string" ? c : JSON.stringify(c);
    })
    .filter(Boolean)
    .join("\n");
}

export async function fetchTopTrends(args: {
  url: string;
  apiKey: string;
  sources: string[];
}): Promise<{ source: string; text: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let nextId = 1;
  let sessionId: string | null = null;

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${args.apiKey}`,
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    };
    if (sessionId) h["Mcp-Session-Id"] = sessionId;
    return h;
  };

  const rpc = async (
    method: string,
    params: Record<string, unknown>,
    notify = false
  ): Promise<JsonRpcResult | null> => {
    const id = notify ? undefined : nextId++;
    const res = await fetch(args.url, {
      method: "POST",
      headers: headers(),
      signal: controller.signal,
      body: JSON.stringify({ jsonrpc: "2.0", ...(id ? { id } : {}), method, params }),
    });
    const sid = res.headers.get("Mcp-Session-Id");
    if (sid) sessionId = sid;
    if (notify) return null;
    if (!res.ok) {
      throw new Error(`trendsmcp ${method} -> HTTP ${res.status}`);
    }
    return parseBody(res.headers.get("Content-Type") ?? "", await res.text());
  };

  try {
    await rpc("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "demiurgos", version: "1.0" },
    });
    await rpc("notifications/initialized", {}, true);

    const results: { source: string; text: string }[] = [];
    for (const source of args.sources) {
      try {
        const r = await rpc("tools/call", {
          name: "get_top_trends",
          arguments: { source },
        });
        if (r?.error) throw new Error(r.error.message ?? "tool error");
        results.push({ source, text: textFromToolResult(r?.result) });
      } catch (err) {
        results.push({
          source,
          text: `(sin datos: ${err instanceof Error ? err.message : String(err)})`,
        });
      }
    }
    return results;
  } finally {
    clearTimeout(timer);
  }
}
