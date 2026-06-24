# Demiurgos — Handoff de contexto (para continuar en otra sesión)

> Última actualización: 22 jun 2026. Resume TODO lo necesario para seguir sin
> empezar de cero. Léelo entero al abrir una sesión nueva.
> Para arrancar rápido: di "Lee HANDOFF.md en la raíz del repo y continúa".

---

## 1. Qué es Demiurgos

Webapp de inteligencia creativa para marca personal en redes. Es un **director
creativo personal**: aprende quién eres (perfil), lo cruza con cómo funciona cada
red (conocimiento del ecosistema) y con señales frescas, y decide QUÉ publicar,
cuándo y POR QUÉ. Persona: culto, con criterio, anti-humo. Tagline: "el artesano
que da forma al mundo a partir del caos".

Fuente de verdad del producto (están en la **wiki** del repo de GitHub y vendoreados
en `v1-proyecto-claude/`):
- `ARQUITECTURA_DEMIURGOS.md` — las 6 capas y la regla motor/datos.
- `PLAN_BUILD_MVP.md` — plan por hitos, consejo de IAs, stack, modelo de datos (secc. 5), estructura de repo (secc. 7).
- `v1-proyecto-claude/INSTRUCCIONES.md` — el MOTOR (system prompt genérico, capa 1).
- `v1-proyecto-claude/CONOCIMIENTO_REDES.md` — conocimiento neutral de 6 redes (capa 4).
- `v1-proyecto-claude/PERFIL_PLANTILLA.md` — esquema de perfil (capa 2).
- `v1-proyecto-claude/PERFIL_CARLOS.md` — instancia semilla de Carlos (capa 3).

Planes adicionales en el repo: `PLAN_ADMIN_DEMO.md` (admin + dashboard + demo, con
decisiones tomadas).

### Regla de oro (no romper)
El **motor es genérico**: NO hardcodear "Carlos" ni datos suyos en `/lib` ni `/app`.
Carlos vive solo como fila de datos (seed). `grep -rn "Carlos" lib app` debe dar 0.
(En `/design` y `/demo/fixtures` sí hay contenido de Carlos/ejemplo: son mockups y
datos de demostración ilustrativos, no el motor.)

---

## 2. Stack y decisiones tomadas (no re-debatir)

- **App**: Next.js 16 (App Router) + TypeScript estricto + Tailwind v4 + shadcn/ui. Deploy en **Vercel**.
- **DB + Auth**: **Supabase** (Postgres + pgvector + Auth con magic link).
- **Capa de IA**: Vercel AI SDK v6 + **Vercel AI Gateway** (una key, multi-proveedor).
  El modelo de cada rol es **configurable desde el admin** (tabla `settings`), no por código.
- **Modelos del consejo**: Director (lo usa el chat), Crítico, Analista, y el del chat de
  la demo. En producción el Director y la demo están en `anthropic/claude-opus-4.7`.
- Trabajos pesados → worker Railway (hitos posteriores; aún no existe).
- Secretos solo en env, nunca en el repo.

---

## 3. Estado actual

**Web en producción**: https://demiurgos.vercel.app (pública, build verde).
Todo lo de abajo está desplegado y con build + 13 tests + typecheck + lint en verde,
y `grep "Carlos"` a 0 en `/lib` y `/app`.

### Hito 1 (fundación) — COMPLETO
- Scaffold Next.js + Tailwind + shadcn/ui (estructura de la secc. 7 del plan).
- Migraciones SQL + RLS (ver §4). Seed cargado (6 redes + perfil de Carlos + usuario semilla).
- Auth magic link (`/login`, `/auth/callback`, `/auth/signout`) + proxy de sesión.
- Capa de IA en `lib/ai/`: `gateway.ts`, `compose-context.ts` (motor + perfil +
  conocimiento de plataformas activas + 20 señales + 20 mensajes), `roles/director.ts`, `platforms.ts`.
- Chat `/chat` con streaming, persiste en `messages`. Tests (vitest) de compose-context y seed.

### Rediseño de UI (estilo Blotato)
- `/chat` = **shell de 3 columnas**: riel izq (nav, compartido = `AppRail`), centro
  (Director: cabecera, estado vacío en serif, sugerencias, compositor con CTA verde,
  adjuntar deshabilitado = Hito 2), riel der (panel **Contexto**: perfil, plataformas,
  señales, datos reales).
- Tokens de marca en `globals.css` (`--brand-accent` verde, `--brand-violet`, `--brand-amber`),
  fuente serif Instrument Serif, toggle claro/oscuro (`components/theme-toggle.tsx`) +
  script anti-parpadeo en `layout.tsx`.
- Mockups de diseño en `/design` (artefactos, no app): `index.html`, `app.html`,
  `onboarding.html`, `BRIEF.md`, `REPORT.md`.

### Demo pública `/demo` (datos falsos + chat LLM real)
- Pública, sin login. Selector de **4 perfiles multi-sector** (Carlos emprendedor,
  Lucía abogada, Marc chef, Ana fisio) + pestañas **Chat / Dashboard / Panel admin** + banner.
- Todo el contenido sale de **fixtures** (`demo/fixtures/`): perfiles, propuestas con
  "por qué ahora", señales, conversaciones, métricas de `ai_runs` (coste/modelo/uso).
- El chat llama al **modelo real** vía `app/api/demo-chat/route.ts` con **guardas**:
  rate limit en memoria (8 msg/10 min por IP), máx. 16 turnos, máx. 600 chars/entrada,
  modelo = `settings.demo_model`. No usa sesión ni escribe en BD. Lee el conocimiento de
  redes con cliente anon (lectura pública).

### Dashboard de usuario `/dashboard` (datos reales)
- Server component con RLS: perfil, propuestas y señales reales del usuario + barra de
  completitud. Componente presentacional `components/dashboard/dashboard-view.tsx` (con
  estados vacíos honestos). Las propuestas reales aún no existen (Hito 4) → estado vacío.

### Panel admin `/admin` (allowlist por email)
- Gating: `ADMIN_EMAILS` (CSV) en `lib/auth/admin.ts`; el proxy protege `/chat` y
  `/dashboard` (requieren sesión) y `/admin` (sesión + email en allowlist; fail-closed).
- Lee agregados **cross-tenant con service role** (`lib/db/admin-queries.ts`): KPIs
  (usuarios, propuestas, mensajes, coste IA), coste por modelo, uso por usuario, estado
  del conocimiento del ecosistema.
- **Preferencias de IA**: sección para elegir el modelo de cada rol (Director, Crítico,
  Analista, Demo). UI `components/admin/model-settings-form.tsx` (campo libre con
  sugerencias) + server action `app/admin/actions.ts` → `lib/db/settings.ts`. Se guarda
  en la tabla `settings` y aplica al momento (el chat lo lee en cada petición, sin redeploy).

### Navegación compartida
- `components/app/app-rail.tsx`: riel izquierdo común a Chat/Dashboard/Admin (con enlace
  Admin solo si eres admin). `chat-shell` lo usa. Biblioteca/Ideas/Propuestas/Perfil = "pronto".

### Fix del chat (modelo de IA)
- Síntoma: el chat devolvía `GatewayInternalServerError` y "no llamaba a la IA".
- Causa: el modelo `openai/gpt-5.5` no enruta en el gateway de la cuenta.
- Solución: modelo configurable (tabla `settings`, leído por petición). Puesto a
  **`anthropic/claude-opus-4.7`** (id que usa la doc oficial de Vercel AI Gateway).
  **Pendiente de confirmar por el usuario** que responde; si no, cambiar el id en
  `/admin` o por SQL (`update settings set director_model=… where id=true`) sin redeploy.

---

## 4. Infraestructura (IDs y dónde está cada cosa)

- **Repo GitHub**: `carlosdeceGit/demiurgos` (público). Rama de trabajo:
  **`claude/upbeat-knuth-6uil82`**. No hay rama `main`/default; Vercel despliega
  producción desde esa rama (push = auto-deploy vía integración GitHub).
- **Supabase**: proyecto `isvgigmlkwlwikxxzrqd` ("Demiurgos Web", eu-west-3).
  - **Tablas (8)**: `profiles, ecosystem_knowledge, signals, uploads, proposals,
    messages, ai_runs` (migr. 0001/0002) + `settings` (migr. 0003, singleton de modelos,
    RLS sin policies = solo service role). pgvector habilitado (`signals.embedding` nullable).
  - **Migraciones nuevas (aplicadas vía MCP)**: `0004_orchestrator_models` y
    `0005_trend_sources` (columnas en `settings`); `0006_user_model_preferences`
    (`profiles.model_preferences` jsonb — IA por usuario, ver §14).
  - Sembrado: 6 redes (texto íntegro, md5-verificado), perfil de Carlos, usuario semilla
    `delgadocollantes@gmail.com` (id `e0d265c5-e9fb-493e-b5d4-0348e108f2f7`) + identidad email.
  - `settings` (modelos del CHAT/DEMO, globales): `director_model` y `demo_model` =
    `anthropic/claude-sonnet-4.6` (cambiado desde opus-4.7 al depurar el chat);
    `critic_model` = `anthropic/claude-opus-4.8`; `analyst_model` = `google/gemini-3.1-pro`.
    Los modelos del ORQUESTADOR ya NO se leen de `settings`: son por usuario (§14).
  - `settings` (tendencias): `trends_enabled=true`, `trends_provider='trendsmcp'`,
    `trends_sources='TikTok Trending Hashtags,YouTube Trending,Google Trends,Reddit Hot Posts'`.
  - Acceso por **MCP de Supabase** (conector apunta a este proyecto): `apply_migration`,
    `execute_sql`, `get_logs`, `get_advisors`. Es la única vía a la BD desde el entorno.
- **Vercel**: proyecto `prj_jU4eCxCCwbCD1K9kog9kFENhWfkf` ("demiurgos"),
  team `team_SrSBEVuPdalqxSIehSDq0K6t`. Dominio `demiurgos.vercel.app`. Protección de
  despliegue DESACTIVADA. Variables de entorno configuradas (ver abajo).

### Variables de entorno (valores reales NO van aquí; ver `.env.local.example`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`AI_GATEWAY_API_KEY`, `DIRECTOR_MODEL`/`CRITIC_MODEL`/`ANALYST_MODEL`/`DEMO_MODEL`
(solo fallback; la tabla `settings` manda), `NEXT_PUBLIC_SITE_URL`, `SEED_USER_EMAIL`,
`ADMIN_EMAILS`. **Nuevas (tendencias en tiempo real, ver §14)**: `TRENDS_API_KEY`
(secreto del proveedor de tendencias) y opcional `TRENDS_API_URL`
(default `https://api.trendsmcp.ai/api`).

### ⚠️ Acciones pendientes del usuario (en Vercel)
1. **`ADMIN_EMAILS`**: añadir en Vercel `ADMIN_EMAILS=delgadocollantes@gmail.com` y
   redeploy. Sin esto, `/admin` redirige a `/chat` (fail-closed). El chat funciona sin esto.
2. (Opcional) `DEMO_MODEL` en Vercel; ya hay default en BD/código.
3. **Confirmar** que el chat responde con `claude-opus-4.7`; si no, cambiar el modelo en `/admin`.

### ⚠️ Seguridad pendiente
En el chat se compartieron: AI Gateway key (`vck_…`), contraseña DB, un Personal Access
Token de Supabase (`sbp_…`) y las keys anon/service_role. **Rotar/borrar**: borrar el PAT
de Supabase (ya cumplió su función), rotar la AI Gateway key y actualizar `AI_GATEWAY_API_KEY`
en Vercel. La service_role solo en servidor/seed.

---

## 5. Cómo se trabaja en este entorno (gotchas)

- **Red restringida**: bloquea hosts de Supabase, `api.vercel.com`, `ai-gateway.vercel.sh`
  y el subdominio del proyecto. Por eso NO se puede: aplicar migraciones por CLI, `npm run
  seed` contra la DB, `vercel deploy`, ni llamar al LLM desde aquí. SÍ se puede: **MCP de
  Supabase** (DDL/SQL/logs), **MCP de Vercel** (lecturas, `get_runtime_logs`,
  `web_fetch_vercel_url` para ver páginas protegidas), y **git push** (deploy).
- **Deploy y verificación**: push → auto-deploy. Comprobar con `list_deployments`/
  `get_deployment` hasta READY y `web_fetch_vercel_url` para páginas públicas. Las páginas
  logueadas (`/chat`, `/dashboard`, `/admin`) NO se pueden verificar por MCP (sin sesión):
  las confirma el usuario. Errores de runtime: `get_runtime_logs` (MCP Vercel).
- **Cambiar el modelo de IA sin redeploy**: `update public.settings set director_model='…'
  where id=true;` vía MCP Supabase (o desde `/admin`).
- **Magic link**: de un solo uso; el email integrado de Supabase tiene rate limit. Para
  fiabilidad: SMTP propio (Resend) en Supabase Auth.
- Commits firmados con `Co-Authored-By: Claude Opus 4.8` + línea `Claude-Session`. Hay un
  stop-hook que avisa si quedan archivos sin commitear: commitea y pushea.

---

## 6. Estructura del repo

```
app/
  page.tsx (landing) · login/ · auth/{callback,signout}/
  chat/page.tsx · dashboard/page.tsx · admin/{page.tsx,actions.ts} · demo/page.tsx
  api/chat/route.ts · api/demo-chat/route.ts
  layout.tsx · globals.css
components/
  ui/ (button,textarea,card) · theme-toggle.tsx
  app/app-rail.tsx                 # nav compartido
  chat/{chat-client,chat-shell}.tsx
  dashboard/dashboard-view.tsx
  admin/model-settings-form.tsx
  demo/{demo-experience,demo-chat,demo-dashboard,demo-admin}.tsx
lib/
  ai/ gateway.ts · compose-context.ts · platforms.ts · roles/director.ts
  db/ client.ts · server.ts · admin.ts · middleware.ts · admin-queries.ts · settings.ts
  auth/admin.ts
prompts/director.md
seed/ seed.ts · parse-conocimiento.ts · map-perfil.ts · parse-markdown.ts · motor.md
supabase/migrations/ 0001_schema · 0002_rls · 0003_settings · 0004_orchestrator_models
  · 0005_trend_sources · 0006_user_model_preferences
demo/fixtures/ types.ts · profiles.ts · content.ts · metrics.ts · index.ts
design/ index.html · app.html · onboarding.html · BRIEF.md · REPORT.md
v1-proyecto-claude/ (4 .md fuente)
tests/ compose-context · seed · orchestrator · trends · resolve-models
proxy.ts   # middleware de sesión + gating (/chat,/calendar,/dashboard,/settings,/admin)
PLAN_ADMIN_DEMO.md · HANDOFF.md · README.md · lib/ai/ARCHITECTURE.md
```

> Nuevo desde §14: `app/calendar/` · `app/settings/` · `app/api/generate-calendar/` ·
> `lib/ai/{orchestrator.ts,model-catalog.ts,resolve-models.ts}` · `lib/ai/agents/` ·
> `lib/ai/trends/` · `lib/db/user-settings.ts` · `components/{calendar,settings}/`.

Rutas en producción: `/`, `/login`, `/auth/*`, `/chat`, `/calendar`, `/dashboard`,
`/settings`, `/admin`, `/demo`, `/api/chat`, `/api/demo-chat`, `/api/generate-calendar`.

---

## 7. Siguientes pasos (pendientes y mejoras)

Pendientes inmediatos:
- Confirmar el chat con `claude-opus-4.7` (o ajustar modelo en `/admin`).
- Que el usuario añada `ADMIN_EMAILS` en Vercel para abrir `/admin`.
- Unificar el dashboard de la demo (`demo-dashboard`) con `DashboardView` para una sola vista.
- CRUD del conocimiento del ecosistema en `/admin` (editar/versionar las 6 fichas).
- `/onboarding` real (mockup en `design/onboarding.html`) que escriba en `profiles`.
- Pulir `/chat`: markdown en respuestas, panel derecho en móvil (drawer).
- Demo: spend cap en el AI Gateway; gráfico de coste por día; guion de demo de 3 min.

Hoja de ruta por hitos (`PLAN_BUILD_MVP.md`):
- **Hito 2** — Uploads + Analista (Gemini) → señales; pgvector real. UI ya deja sitio.
- **Hito 3** — Onboarding por IA + pantalla de Perfil con diffs.
- **Hito 4** — Propuestas + Crítico; se llenan `proposals` y `ai_runs` reales.
- **Hito 5** — Investigador: refresco semanal de `ecosystem_knowledge` (cron).

---

## 8. Comandos útiles

```bash
npm run dev        # desarrollo local (necesita .env.local)
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest (compose-context y seed)
npm run seed       # sembrar DB (solo en local; el entorno remoto no llega a Supabase por red)
grep -rn "Carlos" lib app   # debe dar 0 (regla de separación motor/datos)
```

---

## 9. Landing pública en la home + flujo de entrada

> Añadido el 23 jun 2026 (integrado en producción desde la rama de diseño
> `claude/sweet-faraday-uqfo4s`).

- **La home `/` es ahora la landing de marketing** (antes era un placeholder).
  Diseño "dark esmeralda" (ver sección 10). Server component en `app/page.tsx`,
  secciones: hero (con tabs de plataforma que cambian la propuesta en vivo, parallax),
  problema, solución (3 fuentes), beneficios, cómo funciona, diferenciación, visión, CTA.
- **Flujo de entrada**: landing → CTA "Empezar gratis" / "Entrar" → `/login` (enlace
  mágico, sirve para login y registro) → `/auth/callback` → **`/dashboard`** (el panel).
  El callback redirige por defecto a `/dashboard` (antes `/chat`). El middleware
  (`lib/db/middleware.ts`) protege `/dashboard`, `/chat` y `/admin`.
- **Componentes**: `components/landing/` → `hero.tsx`, `landing-header.tsx`, `reveal.tsx`,
  `logo.tsx`. La landing está aislada en `.dmg-landing` (dark-only) y NO afecta a la
  paleta de /chat, /dashboard, /admin (siguen con el tema claro/oscuro global).
- **Marca/SEO añadidos**: `app/icon.svg` (favicon, se quitó `favicon.ico`),
  `app/opengraph-image.tsx` (OG dark), `app/sitemap.ts`, `app/robots.ts`, metadata
  ampliada en `app/layout.tsx`. Dependencia nueva: `motion` (Framer Motion).
- **Bocetos de referencia** en `/design`: `landing-v2.html` (editorial claro, conversión
  SaaS 4C) y `landing-v3.html` (dark esmeralda, base del diseño actual).

## 10. Sistema de diseño / Identidad de marca Demiurgos (CANÓNICO — todas las webs)

> ⚠️ **OBLIGATORIO. Este es EL diseño con el que se construye TODO en Demiurgos** (landing,
> app, /chat, /dashboard, /admin, /demo, /login y cualquier pantalla futura). No se crean
> pantallas con otra paleta ni otro estilo; si haces algo nuevo, sale de aquí.
> Versión: **"dark esmeralda"**, jun 2026.
>
> **Está implementado de forma global:** los tokens semánticos (shadcn) viven en
> `:root, .dark` de `app/globals.css` con la paleta esmeralda, así que TODA la app es
> **dark-only** y hereda la marca automáticamente (`bg-background`, `text-foreground`,
> `bg-primary`, `border`, `text-muted-foreground`, `bg-brand-accent`, etc.). La landing
> añade además utilidades en `.dmg-landing` (CTA con glow, tarjetas, aurora…). Marca/logo:
> `components/landing/logo.tsx` y `app/icon.svg`. El toggle claro/oscuro quedó **cosmético**
> (ambos temas son la misma paleta dark); se puede retirar.

### 10.1 Esencia de marca
- **Qué es**: director creativo personal para marca personal en redes.
- **Personalidad**: culto, con criterio, anti-humo, directo. Elegante y tecnológico, sin
  postureo.
- **Tagline**: "el artesano que da forma al mundo a partir del caos" (del griego
  *dēmiourgós*).
- **Metáfora visual rectora**: **caos → forma**. Señales sueltas que se ordenan en una
  decisión. Negro (el caos/el lienzo) + una chispa verde (el criterio que da forma).

### 10.2 Logo
- **Concepto**: la **"D"** de Demiurgos formada por **columna + arco**, con una **chispa
  esmeralda** (✦ de 4 puntas) en la boca y un **resplandor interior** que la hace "emitir
  luz". El toque especial = esa chispa luminosa (acto de creación).
- **Implementación**: `components/landing/logo.tsx` → `<Logo size={n} />`. SVG `viewBox
  0 0 40 40`: tile redondeado `rx 12` fondo `#0A0D0E` con borde esmeralda al 35%; glow
  radial interior; D en degradado `#7CF3C6 → #3FE0A2 → #0FA56F` (stroke 3, linecap round);
  chispa `#C9FCE8`.
- **Favicon**: `app/icon.svg` (mismo dibujo, stroke 3.4 para legibilidad pequeña). Next lo
  sirve como icono. NO usar el `favicon.ico` por defecto (se eliminó).
- **Lockups**: marca sola (header/footer), marca + wordmark "Demiurgos" (Geist 600). En el
  boceto `design/landing-v3.html` hay 3 fondos de prueba (tinta / verde / blanco).
- **Uso**: espacio libre mínimo = altura de la chispa alrededor; tamaño mínimo cómodo
  ~24 px; sobre fondos oscuros preferente. No deformar, no recolorear fuera de la paleta,
  no quitar la chispa (es la firma).

### 10.3 Color — "dark esmeralda" (verde como ÚNICO acento)
Tokens (hex) — definidos en `.dmg-landing`:
```
--paper:        #070809   /* fondo base, casi negro */
--paper-2:      #0A0C0D   /* secciones alternas */
--surface:      #101315   /* tarjetas/paneles */
--surface-2:    #161A1D   /* hover de tarjeta */
--ink:          #F3F6F4   /* texto principal (hueso) */
--ink-soft:     #B6BCB9   /* texto secundario */
--muted:        #838A87   /* texto terciario */
--faint:        #525956   /* sutil / metadatos */
--line:         #1C2123   /* bordes */
--line-strong:  #2A2F31   /* bordes destacados */
--green:        #3FE0A2   /* ACENTO único: CTA, énfasis, glow, foco */
--green-strong: #16C988   /* gradiente del CTA */
--green-deep:   #0B7F58   /* gradiente / sombras verdes */
--green-ink:    #04130D   /* texto sobre verde */
--green-soft:   rgba(63,224,162,.10)  /* fondos de icon/badge */
--green-glow:   rgba(63,224,162,.45)  /* resplandor del CTA */
--violet:       #5BE0C2   /* "toque" frío verde-azulado (NO púrpura) */
--violet-soft:  rgba(91,224,194,.10)
--amber:        #E6B45A   /* oro suave, solo para "por qué/avisos" */
--amber-soft:   rgba(230,180,90,.12)
```
**Reglas de color (importantes):**
- Verde **con disciplina**: acento, CTA, foco, palabra-clave y glows. Nunca como fondo de
  bloques grandes ni a puñados.
- Identidad **monocroma negra + verde**. El teal y el oro son apoyos mínimos (diferenciar
  "guion" vs "por qué"), no protagonistas. Prohibido el púrpura/violeta de versiones viejas.
- Contraste AA siempre. Texto principal `--ink` sobre `--paper`.
- **La marca es dark-first.** Si en algún producto hace falta modo claro, créalo como
  variante equivalente, pero la identidad pública (landing) es oscura.

### 10.4 Tipografía
- **Display / titulares**: *Instrument Serif* (Google Fonts), incluida **itálica** para la
  palabra-acento (ej. "Publica con *criterio*"). Tracking ligeramente negativo.
- **UI / cuerpo**: *Geist* (400/500/600/700). Body 15–16 px, line-height ~1.55.
- **Datos / chips técnicos**: *Geist Mono*.
- **Patrón de titular**: sans bold + 1 palabra clave en serif itálica verde. No mezclar más
  de una serif por titular.
- Variables ya cargadas en `app/layout.tsx`: `--font-instrument-serif`, `--font-geist-sans`,
  `--font-geist-mono`. Clase helper `.dmg-serif`.

### 10.5 Forma, sombra y luz
- **Radios**: tarjetas 18 px, inputs/botones pequeños ~12 px, píldoras 999 px.
- **Bordes**: 1 px en `--line`; hover sube a `--line-strong` + halo verde al 10%.
- **Sombras**: oscuras y suaves (`0 28px 60px -32px rgba(0,0,0,.8)`), nunca grises lechosas.
- **Glow**: el verde "ilumina" CTAs, logo y aciertos. Es la fuente de luz de la marca.
- **Texturas de fondo**: retícula sutil con desvanecido radial (`.dmg-grid`), "aurora"
  verde difusa (`.dmg-aurora`), ruido fino opcional (en el boceto).

### 10.6 Componentes base (referencia en `globals.css`)
- **CTA primario (`.dmg-cta`)**: pastilla verde con gradiente `#67F0BB → --green-strong`,
  texto `--green-ink`, **glow** + **barrido de brillo (shine)** al hover, lift -2 px.
  Grande (Ley de Fitts), 1 CTA principal por sección, persistente en header y barra fija
  en móvil.
- **Botón secundario (`.dmg-ghost`)**: vidrio (`rgba(255,255,255,.035)` + blur), borde
  `--line-strong`, hover a borde verde.
- **Tarjeta (`.dmg-card` + `.dmg-card-hover`)**: superficie `--surface`, hover lift + halo
  verde.
- **Píldora/badge (`.dmg-pill`)**: glass con borde `--line`, LED verde con "ping" para
  estados vivos.
- **Icon badge**: cuadro `--green-soft` con icono verde (line, stroke 1.7).
- **Tabs interactivas**: activa = fondo verde + texto `--green-ink`; inactiva = glass.

### 10.7 Iconografía
- Estilo **línea** (tipo Lucide), stroke 1.5–2, `currentColor`. En React: `lucide-react`;
  en HTML autónomo: SVG inline. Nada de iconos 3D ni de relleno recargado.

### 10.8 Motion / microinteracciones
- **Principios**: sutil, rápido, con propósito. Fluidez > espectáculo. Easing
  `cubic-bezier(.2,.6,.3,1)` / `[0.21,0.5,0.25,1]`.
- **Repertorio**: reveals al scroll (una vez), parallax/tilt 3D de la tarjeta de producto,
  spotlight verde que sigue el cursor (hero), CTAs magnéticos + shine, aurora animada,
  marquee de redes, LED "ping".
- **Obligatorio**: respetar `prefers-reduced-motion` (desactivar animaciones).
- Stack: **Framer Motion** (`motion`) en Next; JS mínimo vanilla en bocetos.

### 10.9 Accesibilidad (no negociable)
- Foco visible (anillo verde), navegación por teclado, contraste AA.
- Semántica HTML: un `h1` por página, jerarquía `h2/h3` coherente, `header/main/section/
  footer`, `aria-label` en navegación e iconos decorativos `aria-hidden`.
- Objetivos táctiles grandes; CTA alcanzable con el pulgar en móvil.

### 10.10 Voz y copy
- Español de España. Claro, directo, **anti-humo**. Titulares memorables orientados a
  resultado (ej. "Publica con criterio. No por inercia.").
- Prohibido: relleno tipo "revolucionamos el futuro", tecnicismos vacíos, entusiasmo
  publirreportaje. Negritas con intención.
- **Honestidad**: nada de métricas, clientes ni funciones inventadas. Lo que no existe se
  deja como bloque **reservado** o se omite. Producto "en construcción" se dice sin maquillar.
- Eje de diferenciación: la **regla de oro** ("si lo podría haber escrito ChatGPT sin
  conocerte, ha fallado").

### 10.11 Conversión (heredado del documento SaaS del usuario)
- Marco **4C**: Claridad (hero que se entiende en 3 s) · Credibilidad (prueba social real,
  reservada hasta tenerla) · Conversión (CTA prominente + microcopy de reaseguro) ·
  Conveniencia (nav mínima, rápido, móvil).
- Leyes aplicadas: **Hick** (nav y opciones mínimas), **Fitts** (CTA grande/persistente),
  **Zeigarnik/Progreso dotado** (perfil "en marcha"), **Pico-Fin** (cierre positivo).
- Microcopy estándar de reaseguro: "Gratis para empezar · No necesitas tarjeta".

### 10.12 Regla motor/datos (recordatorio que también aplica al diseño)
- En código (`/lib`, `/app`) **0 referencias a "Carlos"**. Los ejemplos de propuestas de la
  landing son **genéricos**. El contenido ilustrativo con datos reales solo vive en
  `/design` (mockups) o como seed de DB.

### 10.13 Mapa de tokens globales (shadcn → esmeralda) — fuente: `app/globals.css`
Aplicados en `:root, .dark` (mismos valores = dark-only). Cualquier pantalla los hereda vía
Tailwind (`bg-background`, `text-foreground`, `bg-primary`, `border`, `bg-card`, etc.):
```
--background #070809   --foreground #F3F6F4   --card/#101315  --popover #101315
--primary #3FE0A2 (texto --primary-foreground #04130D)
--secondary #161A1D    --muted #161A1D  --muted-foreground #98A09C
--accent #1B2024       --destructive #F0616B
--border #1C2123       --input #2A2F31  --ring #3FE0A2
--brand-accent #3FE0A2 --brand-violet #5BE0C2 --brand-amber #E6B45A
```
Reglas al construir pantallas nuevas: usa SIEMPRE estas clases semánticas (no colores
sueltos), botón primario = verde esmeralda, foco con `--ring` verde, superficies en `--card`.

---

## 11. Trabajo de esta sesión (landing + rebranding "dark esmeralda")

> Sesión 23 jun 2026. Punto de partida: la sesión de diseño en la rama
> `claude/sweet-faraday-uqfo4s`; resultado final integrado en producción
> (`claude/upbeat-knuth-6uil82`, dominio `demiurgos.vercel.app`).

### 11.1 Qué se hizo (entregado y desplegado)
1. **Landing de marketing** profesional (Next + Tailwind + Framer Motion), primero en
   `/landing` y finalmente como **home `/`**. Secciones: hero, plataformas, problema,
   solución (3 fuentes), beneficios, cómo funciona, diferenciación (regla de oro), visión, CTA.
2. **Investigación de conversión** (documento SaaS del usuario) aplicada: marco 4C, leyes
   Hick/Fitts/Zeigarnik/Pico-Fin, microcopy de reaseguro, prueba social reservada (sin
   inventar), acceso honesto sin tarifas falsas, FAQ.
3. **Bocetos HTML** en `/design`: `landing-v2.html` (editorial claro) y `landing-v3.html`
   (**dark esmeralda**, base del diseño final), servido en `public/landing-v3.html`.
4. **Rebranding "dark esmeralda"** (ver §10): paleta, **logo nuevo** (D + chispa), favicon
   `app/icon.svg`, OG dark, tipografía, CTAs con glow/shine, tabs interactivas en el hero.
5. **Aplicado a TODA la app**: tokens globales esmeralda en `:root/.dark` → chat, dashboard,
   admin, demo y login heredan la marca (dark-only).
6. **Flujo de entrada**: home (landing) → `/login` (enlace mágico) → `/auth/callback` →
   **`/dashboard`** (panel). Callback cambiado de `/chat` a `/dashboard`.
7. **SEO/infra**: `sitemap.ts`, `robots.ts`, metadata + OG/Twitter, dep `motion`.
8. **HANDOFF**: secciones 9 (landing+flujo), 10 (sistema de diseño canónico) y 11 (esto).

### 11.2 Archivos clave tocados/creados
- `app/page.tsx` (landing), `app/layout.tsx` (metadata), `app/globals.css` (tokens globales
  esmeralda + utilidades `.dmg-landing`), `app/auth/callback/route.ts` (→ /dashboard),
  `app/icon.svg`, `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`.
- `components/landing/`: `logo.tsx`, `hero.tsx`, `landing-header.tsx`, `reveal.tsx`.
- `design/landing-v2.html`, `design/landing-v3.html`, `public/landing-v3.html`.
- Eliminado `app/favicon.ico`. Añadida dep `motion`.

### 11.3 Mejoras propuestas / pendientes (priorizadas)
- **Redirigir a usuarios ya logueados** desde la home (`/`) directamente a `/dashboard`
  (hoy ven la landing y "Entrar" los manda a `/login`). Fácil: check de sesión en
  `app/page.tsx` o en el middleware.
- **Retirar el theme toggle** (ya cosmético, la app es dark-only) de `chat-shell`/`app-rail`
  y limpiar `theme-toggle.tsx` + el script anti-parpadeo, o reconvertirlo en algo útil.
- **Portar la riqueza del boceto v3 al resto de la app**: que /dashboard, /chat y /admin
  usen las tarjetas con glow, CTAs con shine y la tipografía display donde aporte.
- **Email del enlace mágico**: configurar **SMTP propio (Resend)** en Supabase Auth para
  fiabilidad (el integrado tiene rate limit) — clave porque ahora el login es la puerta al panel.
- **Prueba social real**: sustituir los bloques "reservados" por reseñas reales cuando existan.
- **Generar `apple-icon`** (PNG 180×180) para iOS; hoy solo hay `icon.svg`.
- **Página de precios** real cuando haya planes (hoy "acceso temprano · gratis", honesto).
- **A/B testing** de titular/CTA del hero (la doc de conversión lo recomienda).
- **Consolidar marca**: mover `Logo` y tokens a un módulo compartido si crecen más webs.

### 11.4 Notas de proceso (entorno)
- La red del entorno bloquea Supabase/Vercel API; deploy = `git push` (auto-deploy). Verificar
  con MCP de Vercel (`list_deployments`, `web_fetch_vercel_url`). El login real (email) solo
  lo prueba el usuario.
- Producción despliega desde `claude/upbeat-knuth-6uil82`. La rama de diseño
  `claude/sweet-faraday-uqfo4s` quedó como preview con los bocetos.

---

## 12. Tooling de agentes: Superpowers + skill de diseño (gobernanza UI/UX)

Para mantener **una sola identidad UI/UX en todo el sitio** y un proceso de trabajo
consistente, el repo está configurado así (no afecta al build de Next; son archivos de
Claude Code):

- **`.claude/skills/demiurgos-design-system/SKILL.md`**: skill de proyecto que obliga a
  usar el sistema de diseño (tokens, tipografía, logo, imágenes, componentes, motion,
  accesibilidad) en cualquier trabajo visual. Es el resumen accionable de §10; ante
  conflicto gana §10. Se auto-descubre en toda sesión de Claude Code (web incluida).
- **`CLAUDE.md`** (raíz): memoria de proyecto que apunta al skill, a §10 y a las reglas
  del repo. Claude Code lo lee automáticamente.
- **Superpowers** (obra/superpowers) habilitado en **`.claude/settings.json`**
  (`extraKnownMarketplaces` = `obra/superpowers-marketplace`, `enabledPlugins` =
  `superpowers@superpowers-marketplace`). Da el método (brainstorming → plan → TDD →
  verification). Instalación manual si hiciera falta en un Claude Code nuevo:
  `/plugin marketplace add obra/superpowers-marketplace` + `/plugin install superpowers@superpowers-marketplace`.
- **Hook `SessionStart`** (`.claude/hooks/session-start.sh`): al abrir cualquier sesión
  recuerda usar el skill de diseño y Superpowers.
- `.claude/settings.local.json` (no compartido) guarda permisos locales de la sesión.

**Cómo trabajar a partir de ahora con UI:** invoca el skill `demiurgos-design-system`
antes de tocar nada visual, reutiliza tokens/componentes existentes y pasa su checklist
(incl. `grep` de colores crudos = 0 y build/lint/typecheck en verde) antes de terminar.

---

## 13. Elevación de pantallas al nivel de marca (pasada UI/UX + copy)

> Sesión 23 jun 2026. Tras aplicar la marca a nivel global (§10), pasada de craft y copy
> por las pantallas, con el skill `demiurgos-design-system`. Todo en producción
> (`claude/upbeat-knuth-6uil82`), build/lint/typecheck en verde.

### 13.1 Qué se elevó
- **`/login`** (`app/login/page.tsx`) — rediseño a nivel marca: fondo con resplandor
  esmeralda (`var(--primary)`), **logo real** `<Logo/>`, titular serif con acento
  ("Entra a tu *panel*"), input con icono (Mail), estado "enviado" con check, microcopy
  de reaseguro y a11y (`label` sr-only, `aria-live`). Solo tokens + `Button`.
- **Riel de app** (`components/app/app-rail.tsx`, compartido en `/chat`, `/dashboard`,
  `/admin`, `/calendar`) — se sustituyó la "D" placeholder por `<Logo/>` enlazado a
  `/dashboard`. Identidad consistente en toda la zona logueada.
- **`/chat`** (`components/chat/chat-client.tsx`) — estado vacío con logo, titular serif
  con acento ("Soy tu *director creativo*"), copy más afilado y sugerencias orientadas a
  criterio ("¿Qué publico esta semana, y por qué?").
- **`/demo`** (`components/demo/demo-experience.tsx`) — logo real en cabecera; el perfil
  activo del selector usa el acento esmeralda (`bg-primary`) en vez de blanco.

### 13.2 Ya estaban on-brand (revisadas, sin tocar)
`/dashboard` (`dashboard-view.tsx`), `/calendar` (`calendar-client.tsx`) y `/admin` ya
usaban tokens semánticos + `font-serif` + acentos de marca correctamente (el trabajo en
paralelo del orquestador/calendario siguió el lenguaje). Copy honesto y en voz Demiurgos.

### 13.3 Estado de la marca en el producto
Toda pantalla comparte ahora: misma paleta dark esmeralda, **mismo logo en todas las
cabeceras (cero placeholders "D")**, tipografía Instrument Serif/Geist/Geist Mono, y copy
anti-humo orientado a criterio. La gobernanza (§12: skill + hook + CLAUDE.md) mantiene esto
en cambios futuros.

### 13.4 Pendientes / mejoras propuestas
- **Canva**: se generaron 4 candidatos de imagen social/OG dark esmeralda pero ninguno
  convenció; pendiente reintentar con otra dirección visual (el CDN de preview de Canva
  está bloqueado por el proxy del entorno, así que el usuario los revisa por enlace).
- **Repaso de copy más profundo** pantalla por pantalla (microcopy de `/dashboard`,
  `/calendar`, estados de error/vacío, textos de botones).
- **Elevar el panel `/admin`** y detalles del `/chat` en conversación (burbujas, estados
  de carga, markdown en respuestas del Director).
- **Onboarding** real (cuando exista) debe nacer ya con el sistema de diseño.

---

## 14. Orquestador de IA multi-agente + calendario semanal + tendencias + IA por usuario

> Sesión 23 jun 2026 (rama `claude/determined-heisenberg-zelqe3`, fusionada a producción
> vía PR #1 y PR #2). Mejora completa de la capa de IA. Doc técnico detallado en
> **`lib/ai/ARCHITECTURE.md`**. Build/lint/typecheck en verde, 31 tests, `grep "Carlos"`=0.

### 14.1 Qué se construyó
- **Orquestador de verdad** (`lib/ai/orchestrator.ts`): a partir del contexto del usuario
  (motor + perfil + conocimiento + señales) produce un **calendario semanal** de forma
  automática. Es un *async generator* que **emite su razonamiento en streaming** por fases:
  `Fase 0` tendencias reales (opcional) → `1` Trend Analyst → `2` Idea Generator →
  `2b` filtrado (orquestador) → `3` Script Writer + Image Director **en paralelo por idea** →
  `4` síntesis/agenda. Ensamblado final determinista en código (no lo reescribe un LLM).
- **Agentes tipados** (`lib/ai/agents/`): `schemas.ts` (Zod), `prompts.ts`, `run-object.ts`
  (`generateObject`), `trend-analyst.ts`, `idea-generator.ts`, `script-writer.ts`,
  `image-director.ts`. Ningún agente devuelve texto libre.
- **Degradación graceful**: si falla un agente periférico (tendencias, imagen, guión,
  síntesis) se anota (`degraded[]`/`warning`) y el pipeline sigue. Solo aborta si caen las ideas.
- **API SSE** `POST /api/generate-calendar`: emite los eventos y persiste `proposals`
  (una fila por pieza) + `ai_runs` (rol/modelo/tokens), best-effort.
- **UI** `/calendar` (`components/calendar/calendar-client.tsx`) con link **Calendario**
  en el rail: botón "Generar calendario", razonamiento en vivo y calendario final.

### 14.2 IA por GRUPO DE TAREA, elegible por cada usuario (decisión de producto)
- **Opus 4.8 es el orquestador** (analiza, trocea, coordina). Los subagentes son modelos
  más baratos. Catálogo en `lib/ai/model-catalog.ts` con 7 grupos y 3-5 opciones c/u + precio:
  - Orquestador → `anthropic/claude-opus-4.8` (def) · sonnet 4.6 · gemini 3.1 pro · deepseek r1
  - Texto (ideas+guiones) → `anthropic/claude-haiku-4.5` (def) · gemini 2.5 flash · deepseek v3 · sonnet 4.6 — **compite**
  - Web/búsqueda (tendencias) → `google/gemini-3.1-pro` (def) · gemini flash · gpt-4.1 · sonnet 4.6
  - Imágenes (dirección) → `google/gemini-3.1-pro` (def) · sonnet 4.6 · gemini flash
  - **Vídeo (dirección/montaje)** → `google/gemini-3.1-pro` (def) · sonnet 4.6 · gemini flash · *veo 3 / sora 2 (gen, futuro)* — **compite**
  - **Audio (voz/locución/música)** → `anthropic/claude-haiku-4.5` (def) · gemini flash · sonnet 4.6 · *elevenlabs (TTS, futuro)*
  - Código (reservado, sin uso aún) → sonnet 4.6 · deepseek v3 · gpt-4.1
  - Cableados hoy en el pipeline: orquestador, texto, web, imagen. **Vídeo, audio y código**
    ya están en catálogo y `/settings` (el orquestador puede repartirles), pero su ejecución
    en el pipeline está **pendiente de cablear** (hoja de ruta).
- **Por usuario**: `profiles.model_preferences` (jsonb). Resolución pura en
  `lib/ai/resolve-models.ts` = preferencia del usuario → default del catálogo; mapea grupos
  a roles del pipeline (idea y guión = texto; tendencias = web; etc.).
- **UI** `/settings` (`components/settings/model-preferences-form.tsx`, acción
  `app/settings/actions.ts`) con link **"Ajustes de IA"** en el rail. Lectura/escritura con
  cliente de sesión (`lib/db/user-settings.ts`) → RLS por usuario. Campo libre con sugerencias.
- **`/admin`** vuelve a gestionar SOLO chat/demo (globales); las columnas de orquestador en
  `settings` quedan sin uso (legado, inofensivas).

### 14.3 Tendencias en tiempo real (enchufable, opcional)
- Capa `lib/ai/trends/` que alimenta al Trend Analyst con datos reales por red. Proveedor
  por defecto **trendsmcp.ai** por su **API REST** (`POST /api`, Bearer): usamos
  `get_top_trends` con los `type` exactos (sensibles a mayúsculas). Endpoint en
  `TRENDS_API_URL`, secreto en `TRENDS_API_KEY` (env, no BD).
- **Activada** en `settings`, pero **requiere que el usuario ponga `TRENDS_API_KEY` en
  Vercel** para traer datos. Sin key → degrada a análisis solo-LLM (no rompe).
- OJO: el repo del reel `ryoppippi/trend-finder-mcp` **no existe (404)**; se eligió
  trendsmcp.ai. Demiurgos es webapp, no cliente MCP: se consulta la API desde el backend.

### 14.4 Correcciones hechas
- **Modelos al día**: el `AGENTS_ARCHITECTURE.md` adjunto pedía `claude-opus-4-6` por un
  ranking de Arena; se usa **Opus 4.8** (sucesor directo, mismo precio). Idem ids actuales.
- **Chat (`GatewayInternalServerError`)**: persistía con dos modelos válidos → es problema
  de **cuenta del AI Gateway (saldo/clave)**, no de código. Se cambió el modelo del chat a
  `claude-sonnet-4.6` (en caliente, vía `settings`). **Pendiente del usuario**: revisar
  saldo del AI Gateway en Vercel y validez de `AI_GATEWAY_API_KEY`.
- **Etiqueta engañosa "GPT-5.5"** del cabecero del chat → "Demiurgos".

### 14.5 Acciones pendientes del usuario
1. **AI Gateway**: revisar saldo/crédito y `AI_GATEWAY_API_KEY` (causa del fallo del chat).
   El Gateway usa una sola key y enruta a todos los proveedores; BYOK opcional en su dashboard.
2. **Tendencias reales**: añadir `TRENDS_API_KEY` en Vercel (Settings → Env Vars) y Redeploy.
   (El usuario decidió no rotar la key que compartió en el chat; queda anotado el riesgo.)
3. Probar el chat y `/calendar` end-to-end (no verificable desde el sandbox: sin red al LLM).

### 14.6 Posible siguiente paso (no hecho)
- Orquestación **dinámica**: que Opus invente las tareas/subprompts en cada petición en vez
  del pipeline por fases fijo. Es un cambio mayor; el diseño actual ya coordina subagentes.
- Generación de **imagen real** (hoy se produce el *brief* visual); enchufar un generador
  (p. ej. gemini image) detrás del Image Director, con degradación graceful.

### 14.7 Arquitectura ampliada: categorías nuevas + competición (esta sesión, jun 2026)
> Doc fuente: `lib/ai/ARCHITECTURE.md` (nueva sección "El orquestador es la pieza clave",
> tabla de grupos ampliada y sección "Competición de modelos"). Cambios:
- **Refuerzo del orquestador como pieza central** en toda la arquitectura: el doc deja
  explícito que el orquestador **descompone → reparte → supervisa/juzga/cierra**, y que toda
  capacidad nueva entra como *grupo de tarea que él reparte*, nunca como agente autónomo.
- **Categorías nuevas** en `lib/ai/model-catalog.ts` (y por tanto en `/settings`):
  - **Vídeo** (dirección y montaje: plano, ritmo, formato Reel/Short/TikTok, b-roll, texto en
    pantalla). Generación real (Veo/Sora/Runway) = motor enchufable a futuro.
  - **Audio** (guion de voz/VO, tono, música/SFX). Síntesis TTS (ElevenLabs) = futuro.
  - Estado: reservadas como `código` — visibles y elegibles, ejecución en el pipeline pendiente.
- **Competición de modelos**: flag `competition` + `competeWith` en el catálogo. Lo declaran
  **Texto** (Haiku 4.5 vs Gemini 2.5 Flash) y **Vídeo** (Gemini 3.1 Pro vs Sonnet 4.6): el
  orquestador encarga la tarea a **dos modelos a la vez** y **hace de juez** (winner+why),
  con traza A/B en `ai_runs` y degradación graceful si solo responde uno. Mecánica diseñada
  y documentada; **pendiente de cablear** en `orchestrator.ts` (encaja en el `Promise.allSettled`
  ya existente de la Fase 3 como "dos runners + un paso de juicio").
- **Verificado**: `npm run build && npm run lint && npm run typecheck` en verde.

---

## 15. Biblioteca de contenidos (`/library`)

> Sesión jun 2026. Rama `claude/beautiful-galileo-voqn1l`. Doc completo:
> **`docs/CONTENT_LIBRARY.md`** (decisiones, flujos, configuración, pruebas).

Nueva sección donde el usuario sube/sincroniza contenido y Demiurgos lo convierte
a **Markdown limpio** (fuente principal para la IA). El item "Biblioteca" del riel
ya apunta a `/library` (antes "pronto"); el middleware protege la ruta.

- **BD (migr. `0007_content_library.sql`, YA aplicada vía MCP)**: 3 tablas con RLS
  por usuario — `content_library` (markdown_content + metadata + estado + dedupe por
  hash/`provider_file_id`), `content_sources` (carpetas Drive, sin tokens en claro)
  y `content_sync_logs` (trazas de sync). No se tocó `uploads` (Hito 2) ni nada más.
- **Conversión** (`lib/library/convert.ts`, pura y testeada): `.md` valida, `.txt`
  normaliza, `.html` → MD (conversor propio ligero), imágenes → **OCR vía modelo de
  visión** del AI Gateway existente (`lib/library/ocr.ts`, `LIBRARY_OCR_MODEL`).
  `.pdf/.docx/.rtf/.odt` quedan `needs_review` con punto de integración claro.
- **Google Drive — OAuth POR USUARIO** (`lib/library/drive.ts` + `crypto.ts`):
  flujo completo implementado. Cada usuario conecta su cuenta (`/api/library/oauth/
  start`→`callback`, refresh token **cifrado AES-256-GCM** con `LIBRARY_TOKEN_SECRET`,
  CSRF por state-cookie), elige su carpeta (`sources/[id]/folders` + PATCH) y
  sincroniza (dedupe id+modifiedTime, logs). Solo faltan credenciales:
  `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` + `LIBRARY_TOKEN_SECRET`. Sin ellas la UI
  avisa con claridad y no rompe nada. Pasos exactos en el doc §5.
- **Rutas** `app/api/library/`: `upload`, `[id]` (GET/PATCH/DELETE), `[id]/reprocess`,
  `sources` (POST/DELETE), `sources/[id]` (PATCH) + `sources/[id]/folders` (GET),
  `oauth/start` + `oauth/callback`, `sync` (POST). **UI**: `/library`
  (`library-view`: drag&drop, buscador, filtros, estados vacíos; `content-detail`,
  `status-badge`) y **`/profile`** (`components/profile/profile-view` — cabecera de
  cuenta + **conexión de Drive por usuario**, reutiliza `library/drive-panel`).
  El item "Perfil" del riel ya apunta a `/profile`. Marca dark esmeralda + tokens.
- **Estados**: pending/processing/completed/failed/needs_review/synced. Validación de
  formato y tamaño (10 MB), errores legibles que no rompen la app.
- **Verde**: build + lint + typecheck + tests (40, incl. `tests/library-convert.test.ts`).
- **Pendiente del usuario**: (opcional) bucket privado `library-originals` si se activa
  conservar originales; credenciales OAuth de Google para activar la sync real.
