# Orquestador de IA — arquitectura implementada

> Implementa (y corrige) `AGENTS_ARCHITECTURE.md`. Capa de IA en `lib/ai/`.
> Todo pasa por **Vercel AI Gateway** (una key, multi-proveedor) y **Vercel AI SDK v6**.

## Idea

Un **orquestador de verdad**: a partir del contexto del usuario produce, de forma
totalmente automática, un **calendario de contenido semanal**. No es un chat: es
un pipeline multi-agente por fases que razona solo de principio a fin y va
emitiendo su progreso.

Se apoya en el motor de contexto que ya existía (`compose-context.ts`): motor +
perfil + conocimiento del ecosistema + señales. Es decir, la "Fase 1 · perfil
builder" del doc ya está resuelta: el perfil entra en el `system` de cada agente.

## Pipeline (`lib/ai/orchestrator.ts`)

`runCalendarPipeline()` es un **async generator** que emite eventos de progreso
(`OrchestratorEvent`) mientras ejecuta:

```
Fase 1  Trend Analyst            (gemini)         → TrendReport
Fase 2  Idea Generator           (haiku)          → 18-25 ideas
Fase 2b Orchestrator · filtrado  (opus)           → top 5-7 + weekly_theme
Fase 3  por idea, EN PARALELO:   Script Writer (sonnet) + Image Director (sonnet)
        (Promise.allSettled → degradación graceful por agente)
Fase 4  Orchestrator · síntesis  (opus)           → plan de agenda (días/horas)
        ensamblado determinista en código → WeeklyCalendar
```

- **Paralelismo real** donde corresponde (Fase 3: `Promise.all` de N ideas × 2 agentes).
- **Degradación graceful**: si un agente periférico falla (tendencias, imagen,
  guión, síntesis) se anota en `degraded[]`/`warning` y el pipeline continúa. Solo
  un fallo del generador de ideas aborta (sin ideas no hay nada que orquestar).
- **`generateObject` + Zod en todos los agentes** (`lib/ai/agents/schemas.ts`): el
  orquestador siempre recibe JSON tipado y validado, nunca texto a parsear a mano.
- **La síntesis no reescribe los guiones**: el LLM solo agenda (día/hora/porqué); el
  calendario final se ensambla en código (`assembleCalendar`, determinista y testeable).

## API (`app/api/generate-calendar/route.ts`)

`POST /api/generate-calendar` (requiere sesión). Compone el contexto, lanza el
pipeline y **transmite los eventos por SSE** (`text/event-stream`) — el usuario ve
el razonamiento construirse, no espera 40s a ciegas. Al terminar persiste, best-effort:

- una fila en `proposals` por post (con `based_on` = hook/caption/hashtags/cta/…);
- la traza en `ai_runs` (rol, modelo, tokens) para coste y A/B.

Consumir desde el cliente: leer el stream y reaccionar a `data: {…}` por línea
(eventos `phase`, `trends`, `ideas`, `selection`, `post`, `warning`, `done`, `error`).

## Modelos (configurables en `/admin`, tabla `settings`, sin redeploy)

| Rol | Default | Por qué |
|-----|---------|---------|
| Orquestador | `anthropic/claude-opus-4.8` | Top de la familia Opus al mismo precio que 4.6/4.7 ($5/$25). El doc pedía 4.6 por un ranking de Arena; 4.8 es el sucesor directo. |
| Trend Analyst | `google/gemini-3.1-pro` | Barato y bueno para contexto. Puedes bajarlo a `gemini-2.5-flash` en /admin. |
| Idea Generator | `anthropic/claude-haiku-4.5` | Volumen rápido de ideas. |
| Script Writer | `anthropic/claude-sonnet-4.6` | Guiones y copy. |
| Image Director | `anthropic/claude-sonnet-4.6` | Mismo modelo, system prompt y esquema distintos (no se fusionan: importa la separación). |

> **Generación de imagen real**: el doc añade un Image Generator (gpt-image-2). Aquí
> el pipeline produce el **brief visual** (prompt de imagen/vídeo, ratio, estilo),
> que ya es valioso y nunca bloquea. La generación de la imagen en sí es un paso
> opcional y enchufable a futuro (otro proveedor del gateway), por diseño desacoplado.

## Tendencias en tiempo real (opcional, enchufable)

El Trend Analyst puede trabajar con **datos reales de tendencias** de redes, no
solo con el conocimiento del modelo. Capa en `lib/ai/trends/`:

- `getTrendGrounding(config)` consulta un proveedor de tendencias y devuelve un
  bloque de "grounding" (markdown) que se inyecta en el prompt del Trend Analyst.
- Proveedor por defecto: **trendsmcp.ai** (servidor MCP remoto sobre HTTP, key
  Bearer, free tier 100 req/mes). Lo hablamos por `fetch` (la versión instalada de
  `ai` no trae cliente MCP y no añadimos dependencias).
- **Importante**: Demiurgos es una webapp Next.js, NO un cliente MCP como Claude
  Code. Por eso no "instalamos un MCP" como en el reel: consultamos un servidor de
  tendencias remoto desde el backend. (El repo del reel, `ryoppippi/trend-finder-mcp`,
  da 404 — no existe en esa ruta.)
- **OFF por defecto** y totalmente degradable: si está apagado, sin key o falla,
  el analista sigue solo con su conocimiento. No puede tumbar el pipeline.
- Config en `/admin` (tabla `settings`: `trends_enabled`, `trends_provider`,
  `trends_sources`). El **secreto va en env**: `TRENDS_API_KEY` (y opcional
  `TRENDS_MCP_URL`), nunca en BD — igual patrón que `AI_GATEWAY_API_KEY`.

> No probado en vivo desde el sandbox (sin salida de red). Al activarlo: añade
> `TRENDS_API_KEY` en Vercel, enciéndelo en `/admin` y verifícalo. El adaptador
> está aislado en `lib/ai/trends/trendsmcp.ts`: si el wire difiere, es un fichero.

## Sobre el AI Gateway y las cuentas de proveedores

No necesitas pasar cuentas de OpenAI/Anthropic/Google. El **Vercel AI Gateway**
usa **una sola key** (`AI_GATEWAY_API_KEY`) y enruta+factura a todos los
proveedores por ti (es lo que ya hace el chat). Opcional: en el dashboard del
Gateway puedes añadir tus propias keys de proveedor (BYOK) para facturar contra
tus cuentas en vez de la de Vercel; es config del dashboard, no del código.

## Ajustes que tienes que poner tú

- **Nada obligatorio para que arranque**: hay defaults en BD y en env. Si un slug de
  modelo no enruta en tu gateway, cámbialo en `/admin` (aplica al instante).
- Migración `0004_orchestrator_models.sql` ya aplicada (columnas con defaults).
- (Opcional) afinar coste: bajar el Trend Analyst a un flash, o el orquestador a 4.7.

## Ficheros

```
lib/ai/
  gateway.ts                  # MODELS por rol (defaults), Vercel AI Gateway
  orchestrator.ts             # pipeline por fases (async generator) + helpers puros
  agents/
    schemas.ts                # Zod schemas + tipos compartidos
    prompts.ts                # system prompts por rol (persona Demiurgos, es)
    run-object.ts             # helper generateObject tipado + tokens
    trend-analyst.ts · idea-generator.ts · script-writer.ts · image-director.ts
app/api/generate-calendar/route.ts   # SSE + persistencia
lib/db/settings.ts            # +5 roles del orquestador
supabase/migrations/0004_orchestrator_models.sql
tests/orchestrator.test.ts    # helpers puros (isoWeek, selección, ensamblado)
```
