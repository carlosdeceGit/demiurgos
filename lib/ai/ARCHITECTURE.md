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

## El orquestador es la pieza clave (regla rectora)

Todo el sistema gira en torno a **un único orquestador** (Opus 4.8 por defecto).
No es "un agente más": es **el cerebro que reparte trabajo**. El resto de modelos
son **subagentes ejecutores** que solo actúan cuando el orquestador les da una
tarea concreta y un prompt preciso. Diseño no negociable:

1. **El orquestador descompone**: lee el contexto, decide el tema de la semana,
   filtra ideas y trocea el trabajo en tareas atómicas (un guion, un brief visual,
   un brief de vídeo, una locución…). Nada se ejecuta sin que él lo ordene.
2. **El orquestador reparte**: a cada tarea le asigna un **grupo de tarea**
   (texto, web, imagen, vídeo, audio, código) y, dentro del grupo, el modelo que
   el usuario eligió. Los subagentes nunca se auto-asignan trabajo.
3. **El orquestador supervisa y cierra**: recoge los resultados (en paralelo),
   degrada con elegancia los que fallen, **juzga** cuando hay competición (ver §
   correspondiente) y sintetiza la agenda final. El ensamblado del calendario es
   determinista en código, pero la **decisión** es siempre suya.

Mantén esta jerarquía al tocar cualquier parte: si añades una capacidad nueva
(p. ej. vídeo o audio), entra como **un grupo de tarea más que el orquestador
puede repartir**, nunca como un agente autónomo que decide por su cuenta.

## Pipeline (`lib/ai/orchestrator.ts`)

`runCalendarPipeline()` es un **async generator** que emite eventos de progreso
(`OrchestratorEvent`) mientras ejecuta:

```
Fase 1  Trend Analyst            (web)            → TrendReport
Fase 2  Idea Generator           (text)           → 18-25 ideas
Fase 2b Orchestrator · filtrado  (opus)           → top 5-7 + weekly_theme
Fase 3  por idea, EN PARALELO los 4 productores:
          Script Writer (text) + Image Director (image)
          + Video Director (video) + Audio Director (audio)
        cada uno puede COMPETIR (2 modelos) → el orquestador hace de juez
        (Promise.all por idea; Promise.allSettled dentro de cada productor)
Fase 4  Orchestrator · síntesis  (opus)           → plan de agenda (días/horas)
        ensamblado determinista en código → WeeklyCalendar
```

- **Paralelismo real**: Fase 3 = `Promise.all` de N ideas × 4 productores; y dentro
  de cada productor que compite, sus 2 modelos también van en paralelo.
- **Degradación graceful**: si un productor falla (imagen, guión, vídeo, audio,
  tendencias, síntesis) se anota en `degraded[]`/`warning` y el pipeline continúa.
  Solo un fallo del generador de ideas aborta (sin ideas no hay nada que orquestar).
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

## Modelos por GRUPO DE TAREA, elegibles por cada usuario

Decisión de producto: Opus 4.8 es el **orquestador** (analiza, trocea y reparte);
los subagentes no tienen que ser top. Cada usuario elige su IA por grupo de tarea
en **`/settings`** (calidad vs precio) y, además, **qué modelo compite** en cada
grupo. Catálogo en `lib/ai/model-catalog.ts`; resolución en
`lib/ai/resolve-models.ts`; preferencia por usuario en `profiles.model_preferences`
(jsonb). Resolución = elección del usuario → default del catálogo (degradación
graceful si un modelo no enruta). **El usuario puede escribir CUALQUIER slug de su
gateway**, no solo las opciones sugeridas, tanto para el principal como el rival.

El **orquestador es quien decide a qué grupo va cada tarea**; el grupo solo dice
*qué modelo* ejecuta. La tabla es el "menú" del que el orquestador reparte:

| Grupo de tarea | Qué reparte el orquestador aquí | Default | Alternativas | Compite por defecto |
|---|---|---|---|---|
| Orquestador (razonamiento) | coordinación/filtrado/síntesis/juez | `anthropic/claude-opus-4.8` | sonnet 4.6 · gemini 3.1 pro · deepseek r1 | — (es el juez) |
| Texto (ideas y guiones) | Idea Generator + Script Writer | `anthropic/claude-haiku-4.5` | gemini 2.5 flash · deepseek v3 · sonnet 4.6 | ✅ (vs gemini 2.5 flash) |
| Web / búsqueda | Trend Analyst | `google/gemini-3.1-pro` | gemini 2.5 flash · gpt-4.1 · sonnet 4.6 | — |
| Imágenes (dirección) | Image Director | `google/gemini-3.1-pro` | sonnet 4.6 · gemini 2.5 flash | activable (rec. sonnet 4.6) |
| **Vídeo (dirección y montaje)** | Video Director (plano/ritmo/formato) | `google/gemini-3.1-pro` | sonnet 4.6 · gemini 2.5 flash · *veo 3 / sora 2 (gen, futuro)* | ✅ (vs sonnet 4.6) |
| **Audio (voz/locución y música)** | Audio Director (VO, tono, música/SFX) | `anthropic/claude-haiku-4.5` | gemini 2.5 flash · sonnet 4.6 · *elevenlabs (TTS, futuro)* | activable (rec. gemini flash) |
| Código (reservado) | — (no aplica al calendario) | `anthropic/claude-sonnet-4.6` | deepseek v3 · gpt-4.1 | — |

**Estado de los grupos.** Cableados y EJECUTÁNDOSE en el pipeline: orquestador,
texto, web, imagen, **vídeo y audio** (cada pieza del calendario lleva ahora guion +
brief visual + dirección de vídeo + guion de audio). La competición está disponible
en los cuatro productores por pieza (texto/imagen/vídeo/audio); el usuario la
activa/desactiva y elige el rival por grupo en `/settings` (`COMPETITION_GROUPS`).
**Código** sigue reservado: no encaja en un calendario de contenido, pero es
seleccionable. Para vídeo/audio se produce **dirección/guion** (siempre útil y
barato); la **generación** real (Veo/Sora/Runway, ElevenLabs) es un motor
enchufable a futuro, igual que la imagen (ver nota de Image Generator).

> Los modelos del **chat/demo** siguen siendo globales en `/admin` (tabla
> `settings`). Los del **orquestador** los manda cada usuario desde `/settings`.

> **Generación de imagen real**: el doc añade un Image Generator (gpt-image-2). Aquí
> el pipeline produce el **brief visual** (prompt de imagen/vídeo, ratio, estilo),
> que ya es valioso y nunca bloquea. La generación de la imagen en sí es un paso
> opcional y enchufable a futuro (otro proveedor del gateway), por diseño desacoplado.

## Competición de modelos (dos IAs por la misma tarea)

Algunos grupos de tarea admiten **competición**: el orquestador encarga la misma
tarea a **dos modelos a la vez** y luego **hace de juez** y se queda con el mejor
resultado. Es el orquestador, fiel a su papel, quien reparte por duplicado y quien
decide — los aspirantes no se comparan entre ellos.

**CABLEADO y GENERALIZADO** a los cuatro productores por pieza (texto, imagen,
vídeo, audio) con un único helper `runCompetitiveStage<T>` en `orchestrator.ts`.
Compiten por defecto **Texto** (Haiku 4.5 vs Gemini 2.5 Flash) y **Vídeo** (Gemini
3.1 Pro vs Sonnet 4.6); **Imagen** y **Audio** traen rival recomendado pero vienen
apagados (el usuario los activa). Para qué sirve: la parte sensible a calidad/voz
se beneficia de dos enfoques baratos en paralelo y un juez que elige, en vez de
pagar un único modelo top para todo.

Quién decide el rival (`resolve-models.ts → competitorModel`), por grupo:
- `"off"` → competición desactivada. `"auto"`/vacío → rival recomendado del
  catálogo. `"<slug>"` → ese modelo (CUALQUIERA del gateway). Sin configurar → el
  default del grupo (`catalogCompetesByDefault`). **Nunca** devuelve el mismo modelo
  que el principal (`recommendedCompetitor` garantiza uno distinto).

Mecánica genérica de cada productor (`runCompetitiveStage`):

```
1. primary = elección del usuario ; competitor = competitorModel(group) (o null)
2. sin competitor → una sola llamada (comportamiento clásico)
3. con competitor → Promise.allSettled([ run(A), run(B) ])
4. 0 responden → null (degrada: bandera del grupo en el post)
5. 1 responde  → ese gana por incomparecencia (sin juez)
6. 2 responden → el ORQUESTADOR juzga con ORCHESTRATOR_JUDGE_PROMPT
   (generateObject JudgeVerdict { winner:'A'|'B', why }); si el juez falla, gana A
7. trazas en ai_runs: roles "<grupo>" (A), "<grupo>_b" (B), "<grupo>_judge" → A/B
```

Encaja sin romper nada: la Fase 3 ya corría en paralelo, así que la competición es
"dos runners + un paso de juicio" **dentro** de cada productor, no una fase nueva.
Coste: con todo activado son hasta 4 productores × 2 modelos + jueces por pieza, por
eso es **config por usuario** (puede apagar lo que no quiera). Resolución pura
cubierta por tests (`tests/resolve-models.test.ts`): off/auto/slug y el invariante
"el rival nunca es igual al modelo del usuario".

## Taxonomía de contenido y calidad del enjambre

Cada idea lleva dos ejes (en `IdeaSchema`, `lib/ai/agents/schemas.ts`):
- **`content_type`** `post_text · post_image · carousel · video_script · video_live ·
  music · mixed`. Define **qué productores activa el orquestador** (`producersFor`):
  un `post_text` solo gasta guión; un `carousel`, guión (con `slides`) + imagen; un
  `video_*`, los cuatro; `music`, guión + imagen + audio. Es el orquestador
  repartiendo solo lo necesario (mejor coste y piezas más limpias).
- **`content_category`** `educational · informative · entertainment · trending ·
  awareness · promotional · curated`. Define la **intención** y se usa para
  equilibrar el mix de la semana.

Palancas de calidad cableadas (lo que hace que el resultado sirva de verdad):
- **Anti-repetición**: el pipeline recibe `recentIdeas` (resumen "tema — ángulo" de
  las últimas ~25 propuestas, leídas en la API) y se inyectan en el prompt del Idea
  Generator con la regla dura de no repetir. Evita que la semana N clone la N-1.
- **Mix por prompt + red de seguridad en código**: el Idea Generator reparte
  categorías (~30 % educational, máx 2 promotional…) y el selector valida el mix;
  además `balanceSelection` **recorta en código** el exceso de promotional (los
  prompts "se olvidan", el código no). Función pura, testeada.
- **Reparto por tipo**: `producersFor` evita malgastar agentes y mantiene coherencia
  pieza↔producción. Lo omitido a propósito NO cuenta como `degraded`.

Persistencia: `content_type`/`content_category` son **columnas** de `proposals`
(filtrables/indexadas, migración `0008_proposals_taxonomy.sql`); `slides` y los
briefs estructurados viajan en `based_on` (jsonb). `music_brief`/`pieces` quedan
reservados (tipos listos) para `music`/`mixed`.

> Pendientes de calidad (no hechos aún, por orden de impacto): activar **trends
> reales** (`TRENDS_API_KEY`), **auto-crítica de hooks** (puntuar y reescribir los
> flojos) y una **rúbrica de evaluación** persistida en `ai_runs`/`proposals` para
> medir y comparar modelos. Ver HANDOFF §14.9.

## Tendencias en tiempo real (opcional, enchufable)

El Trend Analyst puede trabajar con **datos reales de tendencias** de redes, no
solo con el conocimiento del modelo. Capa en `lib/ai/trends/`:

- `getTrendGrounding(config)` consulta un proveedor de tendencias y devuelve un
  bloque de "grounding" (markdown) que se inyecta en el prompt del Trend Analyst.
- Proveedor por defecto: **trendsmcp.ai** por su **API REST** (`POST /api`, key
  Bearer, free tier). Usamos `get_top_trends` (lo que está de moda ahora en cada
  red); las fuentes son los `type` EXACTOS de trendsmcp ('TikTok Trending
  Hashtags', 'YouTube Trending', 'Google Trends', 'Reddit Hot Posts'…). Endpoint
  configurable con `TRENDS_API_URL`.
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
  model-catalog.ts            # grupos de tarea, defaults, rival y COMPETITION_GROUPS
  resolve-models.ts           # prefs usuario (models+competitors) → modelos del pipeline
  orchestrator.ts             # pipeline por fases + runCompetitiveStage (juez) + helpers puros
  agents/
    schemas.ts                # Zod schemas + tipos compartidos (incl. Video/Audio/JudgeVerdict)
    prompts.ts                # system prompts por rol (persona Demiurgos, es) + juez
    run-object.ts             # helper generateObject tipado + tokens
    trend-analyst.ts · idea-generator.ts · script-writer.ts · image-director.ts
    video-director.ts · audio-director.ts
app/settings/ (page + actions) · components/settings/model-preferences-form.tsx
app/api/generate-calendar/route.ts   # SSE + persistencia (video/audio en based_on)
lib/db/settings.ts            # +5 roles del orquestador
supabase/migrations/0004_orchestrator_models.sql
tests/orchestrator.test.ts · tests/resolve-models.test.ts
```
