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
  - Sembrado: 6 redes (texto íntegro, md5-verificado), perfil de Carlos, usuario semilla
    `delgadocollantes@gmail.com` (id `e0d265c5-e9fb-493e-b5d4-0348e108f2f7`) + identidad email.
  - `settings`: `director_model` y `demo_model` = `anthropic/claude-opus-4.7`;
    `critic_model` = `anthropic/claude-opus-4.8`; `analyst_model` = `google/gemini-3.1-pro`.
  - Acceso por **MCP de Supabase** (conector apunta a este proyecto): `apply_migration`,
    `execute_sql`, `get_logs`, `get_advisors`. Es la única vía a la BD desde el entorno.
- **Vercel**: proyecto `prj_jU4eCxCCwbCD1K9kog9kFENhWfkf` ("demiurgos"),
  team `team_SrSBEVuPdalqxSIehSDq0K6t`. Dominio `demiurgos.vercel.app`. Protección de
  despliegue DESACTIVADA. Variables de entorno configuradas (ver abajo).

### Variables de entorno (valores reales NO van aquí; ver `.env.local.example`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`AI_GATEWAY_API_KEY`, `DIRECTOR_MODEL`/`CRITIC_MODEL`/`ANALYST_MODEL`/`DEMO_MODEL`
(solo fallback; la tabla `settings` manda), `NEXT_PUBLIC_SITE_URL`, `SEED_USER_EMAIL`,
`ADMIN_EMAILS`.

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
supabase/migrations/ 0001_schema.sql · 0002_rls.sql · 0003_settings.sql
demo/fixtures/ types.ts · profiles.ts · content.ts · metrics.ts · index.ts
design/ index.html · app.html · onboarding.html · BRIEF.md · REPORT.md
v1-proyecto-claude/ (4 .md fuente)
tests/ compose-context.test.ts · seed.test.ts
proxy.ts   # middleware de sesión + gating (/chat,/dashboard,/admin)
PLAN_ADMIN_DEMO.md · HANDOFF.md · README.md
```

Rutas en producción: `/`, `/login`, `/auth/*`, `/chat`, `/dashboard`, `/admin`, `/demo`,
`/api/chat`, `/api/demo-chat`.

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
