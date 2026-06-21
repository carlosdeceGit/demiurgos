# Demiurgos — Plan de Build del MVP (bucle central)

> Versión 2.0 · 21 jun 2026
> Cambio de enfoque: **código propio con Claude Code**, despliegue en **Vercel + Railway**, y un **consejo de IAs especializadas** (no una sola), todas intercambiables.
> Alcance: bucle central + **conversación** + **subida y análisis de contenido**. Conexión de redes, scheduling y auto-publicación, en fases posteriores.
> Estado: plan para revisar.

---

## 1. El cambio respecto a la v1 del plan

Fuera Lovable. Las razones encajan con lo que quieres:

- **Control del código.** Construyes con Claude Code, el repo es tuyo, despliegas donde quieras (Vercel el front, Railway los workers y trabajos pesados).
- **Varias IAs, no una.** Demiurgos deja de depender de un solo modelo. Distintas IAs analizan distintas cosas y proponen, y puedes cambiarlas o compararlas sin tocar la app, vía una capa model-agnostic.
- **Subir contenido.** El producto ingiere material (tus posts, capturas de pantalla, transcripciones, PDFs, referencias) y lo analiza para alimentar el perfil y las propuestas.

Lo que NO cambia: las cuatro capas de la arquitectura (motor, esquema, instancia, conocimiento) y los archivos que ya montamos siguen siendo la especificación.

---

## 2. El consejo de IAs (el corazón del nuevo enfoque)

En vez de "una IA hace todo", Demiurgos orquesta **roles**, y cada rol usa el modelo que mejor lo hace. Todos detrás de una sola capa (Vercel AI SDK + un gateway), así que cambiar de modelo es cambiar un string, no reescribir nada.

| Rol | Qué hace | Modelo sugerido (jun 2026) | Por qué |
|---|---|---|---|
| **Analista de contenido** | Ingesta lo que subes (capturas de posts, vídeos, transcripciones, PDFs) y extrae voz, señales, qué te ha funcionado | Gemini 3.1 Pro | Lidera razonamiento y análisis de datos, multimodal fuerte, frontier más barato |
| **Investigador del ecosistema** | Research semanal de tendencias y cambios de algoritmo, mantiene vivo el conocimiento de redes | Modelo con búsqueda web (Gemini 3.1 Pro o Grok 4.3) | Acceso a información fresca, Grok es el barato |
| **Director creativo** | Genera las propuestas con guion en tu voz | GPT-5.5 o Claude Opus 4.8 | GPT-5.5 lidera escritura creativa; Claude es tu voz histórica. Comparables, A/B entre ellos |
| **Crítico / verificador** | Pasa el filtro anti-humo, comprueba que no se inventa datos y que encaja con tu perfil | Claude (modelo distinto al creativo) | Cross-check con otro modelo reduce errores y peloteo |

**Idea clave:** el "consejo" no es marketing. Es un patrón real (pipeline de agentes con verificación cruzada) que da mejores propuestas que un solo modelo, y te deja experimentar con qué IA rinde mejor en cada paso. Ese experimento, además, es contenido para tu marca.

**Cómo se conectan:** todos los modelos a través de una sola capa. Recomendación: **Vercel AI SDK** como abstracción en el código, y un **gateway** (Vercel AI Gateway u OpenRouter) para acceder a OpenAI, Anthropic, Google y xAI con una sola key y fallbacks automáticos.

---

## 3. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| **Build** | Claude Code | Tú (con Claude Code) escribes y mantienes el repo |
| **Frontend** | Next.js + Tailwind + shadcn/ui | Deploy en Vercel |
| **Backend ligero** | Next.js API routes / server actions | En Vercel, para chat y CRUD |
| **Trabajos pesados** | Worker en Railway | Análisis de uploads, research semanal, colas. Lo que no cabe en una serverless function por tiempo |
| **Base de datos** | Postgres + pgvector | Supabase o Railway Postgres. pgvector para memoria semántica |
| **Almacenamiento de archivos** | Vercel Blob o S3/Railway | Para el contenido que subes |
| **Capa de IA** | Vercel AI SDK + gateway (Vercel AI Gateway u OpenRouter) | Model-agnostic, multi-proveedor, fallbacks |
| **Colas / jobs** | Railway (worker) + cron | Research semanal, procesado de uploads |

División práctica: **Vercel** para la app y el chat (rápido, serverless), **Railway** para el worker que hace el trabajo largo (analizar un vídeo subido, el research semanal de las 6 redes).

---

## 4. Funcionalidades del MVP

1. **Conversación.** Chat con Demiurgos, persistente. Inyectar contexto, pedir ideas, refinar piezas.
2. **Subida de contenido.** Arrastras posts, capturas, transcripciones, PDFs, enlaces. El Analista los procesa y los convierte en señales y aprendizajes del perfil.
3. **Onboarding por IA.** Entrevista conversacional una pregunta en una que rellena tu perfil.
4. **Propuestas semanales.** El Director creativo genera el set, el Crítico lo filtra, salen las cards en el formato estándar.
5. **Perfil vivo.** Vista estructurada y editable. La IA propone diffs, tú los aplicas.
6. **Conocimiento del ecosistema.** Sembrado al inicio, refrescado por el Investigador.

---

## 5. Modelo de datos (Postgres)

Igual que la v1 del plan, más lo que pide la subida de contenido:

```sql
profiles (id, user_id, display_name, positioning jsonb, pillars jsonb,
  audience jsonb, voice jsonb, tacit jsonb, goals jsonb, platforms jsonb,
  performance_patterns jsonb, referents jsonb, onboarding_completed bool,
  created_at, updated_at)

ecosystem_knowledge (id, platform, content text, version int,
  is_current bool, updated_at)

signals (id, user_id, content text, type, source, embedding vector(1536),
  created_at)        -- source: 'chat' | 'upload' | 'research'

uploads (id, user_id, file_url, file_type, status, extracted jsonb,
  created_at)        -- status: 'pending' | 'processed' | 'failed'
                     -- extracted: lo que el Analista sacó del archivo

proposals (id, user_id, week_of, platform, idea, why_now, script,
  image_prompt, video_prompt, suggested_slot, status, based_on jsonb,
  model_used text, created_at)   -- model_used: para comparar qué IA propuso

messages (id, user_id, role, content, created_at)

ai_runs (id, user_id, role, model, input_summary, output_summary,
  tokens, cost, created_at)      -- traza de qué IA hizo qué, para A/B y coste
```

`ai_runs` es nuevo y vale oro: te deja ver qué modelo usaste en cada paso, cuánto costó y comparar calidad. Es el panel de control de tu consejo de IAs.

---

## 6. Cómo fluye una propuesta (orquestación)

```
1. Subes 3 capturas de posts que te molaron  →  Railway worker
2. ANALISTA (Gemini) lee las imágenes, extrae temas, hooks, formato  →  signals
3. INVESTIGADOR refresca el conocimiento de las redes implicadas (si toca)
4. Pides "propuestas de la semana"
5. Se compone el contexto: motor + tu perfil + conocimiento + señales nuevas
6. DIRECTOR CREATIVO (GPT-5.5 / Claude) genera 5 propuestas en tu voz
7. CRÍTICO (otro modelo) pasa el filtro anti-humo y comprueba que no inventa datos
8. Salen las cards. Cada una guarda con qué modelo se generó (ai_runs)
```

---

## 7. Estructura del repo

```
demiurgos/
  app/                      # Next.js (Vercel)
    (chat)/                 # conversación
    onboarding/             # entrevista IA
    proposals/              # dashboard de propuestas
    profile/                # perfil vivo
    upload/                 # subida de contenido
    api/                    # rutas: chat, generate-proposals, upload
  lib/
    ai/
      gateway.ts            # cliente Vercel AI SDK + gateway
      roles/                # analista.ts, investigador.ts, director.ts, critico.ts
      compose-context.ts    # motor + perfil + conocimiento + señales
    db/                     # acceso a Postgres, queries
  worker/                   # servicio Railway: procesado de uploads, research semanal
  seed/
    motor.md                # = INSTRUCCIONES.md
    conocimiento/           # = CONOCIMIENTO_REDES.md por red
    perfil-carlos.json      # = PERFIL_CARLOS.md mapeado
  prompts/                  # prompts de cada rol del consejo
```

Los `seed/` salen directos de los archivos que ya tienes en `v1-proyecto-claude/`.

---

## 8. Secuencia de build con Claude Code

- **Hito 1, fundación.** Repo + Next.js en Vercel + Postgres + auth + capa de IA (gateway) + chat básico que ya llama al Director creativo con el contexto compuesto. Seed de motor, conocimiento y tu perfil.
- **Hito 2, subida y análisis.** Worker en Railway + subida de archivos + Analista que procesa uploads y crea señales. Memoria semántica con pgvector.
- **Hito 3, onboarding + perfil.** Entrevista IA que rellena el perfil. Pantalla de perfil con diffs aplicables.
- **Hito 4, propuestas + consejo.** Generación con Director, verificación con Crítico, dashboard de cards, tabla `ai_runs` para comparar modelos.
- **Hito 5, investigador.** Research semanal automatizado que refresca `ecosystem_knowledge` (cron en Railway).

Cada hito deja algo funcionando. No se avanza hasta que el anterior va.

---

## 9. Decisiones abiertas (para que elijas)

1. **Gateway:** Vercel AI Gateway (una key, todo dentro del ecosistema Vercel, simple) u OpenRouter (300+ modelos, máxima flexibilidad). Recomiendo empezar con Vercel AI Gateway por simplicidad y migrar si te quedas corto.
2. **Base de datos:** Supabase (auth incluido, pgvector, lo conoces) o Railway Postgres (todo en Railway). Recomiendo Supabase por el auth y pgvector listos.
3. **Line-up de modelos inicial:** la tabla del punto 2 es mi recomendación. ¿La tomamos tal cual y ya iteramos con `ai_runs`?
4. **Reparto Vercel/Railway:** front y chat en Vercel, worker pesado en Railway. ¿Te encaja, o prefieres todo en Railway?

---

## 10. Qué necesito de ti para arrancar el código

1. **API keys** de los proveedores que quieras en el consejo (Anthropic, OpenAI, Google, opcional xAI), o una sola key del gateway (Vercel AI Gateway u OpenRouter) que las agrupa.
2. **Cuentas** de Vercel y Railway (y Supabase si vamos por ahí).
3. Tus respuestas a las 4 decisiones abiertas.
4. Tu ok para que monte el esqueleto del repo (Hito 1) aquí en la carpeta del proyecto. Puedo dejarte el scaffold listo para abrir con Claude Code.

---

## Fuentes (jun 2026)

- Modelos frontier: [LLM-Stats](https://llm-stats.com/), [Pluralsight best AI models 2026](https://www.pluralsight.com/resources/blog/ai-and-data/best-ai-models-2026-list), [Azumo top LLMs Jun 2026](https://azumo.com/artificial-intelligence/ai-insights/top-10-llms-0625)
- Gateways multi-modelo: [Vercel AI Gateway docs](https://vercel.com/docs/ai-gateway/models-and-providers), [OpenRouter + Vercel AI SDK](https://openrouter.ai/docs/guides/community/vercel-ai-sdk), [Vercel AI Gateway vs OpenRouter](https://www.truefoundry.com/blog/vercel-ai-gateway-vs-openrouter)
