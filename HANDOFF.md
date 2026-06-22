# Demiurgos — Handoff de contexto (para continuar en otra sesión)

> Última actualización: 22 jun 2026. Este documento resume TODO lo necesario para
> seguir trabajando en Demiurgos sin empezar de cero. Léelo entero al abrir una
> sesión nueva.

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
- `PLAN_BUILD_MVP.md` — plan por hitos, consejo de IAs, stack, modelo de datos (sección 5), estructura de repo (sección 7).
- `v1-proyecto-claude/INSTRUCCIONES.md` — el MOTOR (system prompt genérico, capa 1).
- `v1-proyecto-claude/CONOCIMIENTO_REDES.md` — conocimiento neutral de 6 redes (capa 4).
- `v1-proyecto-claude/PERFIL_PLANTILLA.md` — esquema de perfil (capa 2).
- `v1-proyecto-claude/PERFIL_CARLOS.md` — instancia semilla de Carlos (capa 3).

### Regla de oro (no romper)
El **motor es genérico**: NO hardcodear "Carlos" ni datos suyos en `/lib` ni `/app`.
Carlos vive solo como fila de datos (seed). `grep -rn "Carlos" lib app` debe dar 0.
(En `/design` sí hay contenido de Carlos: son mockups ilustrativos, no código.)

---

## 2. Stack y decisiones tomadas (no re-debatir)

- **App**: Next.js 16 (App Router) + TypeScript estricto + Tailwind v4 + shadcn/ui. Deploy en **Vercel**.
- **DB + Auth**: **Supabase** (Postgres + pgvector + Auth con magic link).
- **Capa de IA**: Vercel AI SDK v6 + **Vercel AI Gateway** (una key, multi-proveedor).
- **Modelos del consejo** (por env): Director = GPT-5.5; Crítico = Claude Opus 4.8;
  Analista/Investigador = Gemini 3.1 Pro. **En el Hito 1 solo se usa el Director.**
- Trabajos pesados → worker Railway (hitos posteriores; aún no existe).
- Secretos solo en env, nunca en el repo.

---

## 3. Estado actual: Hito 1 COMPLETO y desplegado

**Web en producción**: https://demiurgos.vercel.app (pública, build verde).

Lo construido y verificado (build + 13 tests + typecheck + lint, todo verde):
- Scaffold Next.js + Tailwind + shadcn/ui (estructura de la sección 7 del plan).
- Migraciones SQL: 7 tablas (`profiles, ecosystem_knowledge, signals, uploads,
  proposals, messages, ai_runs`) + **RLS** (cada usuario lo suyo; ecosystem_knowledge
  lectura pública). pgvector habilitado (`signals.embedding` nullable, uso en Hito 2).
- Auth Supabase magic link (`/login`, `/auth/callback`, `/auth/signout`) + proxy de sesión.
- Capa de IA en `lib/ai/`: `gateway.ts`, `compose-context.ts` (motor + perfil +
  conocimiento de plataformas activas + 20 señales + 20 mensajes), `roles/director.ts`,
  `platforms.ts`.
- Seed (`seed/`): parsers de CONOCIMIENTO_REDES y PERFIL_CARLOS + `seed.ts`. `seed/motor.md`
  es copia del motor que lee compose-context en runtime.
- Chat: `/chat` con streaming, persiste en `messages`.
- Tests (vitest): `compose-context` y seed.

**Rediseño UI aplicado** (commit `88627f5`):
- `/chat` ahora es un **shell de 3 columnas** estilo Blotato: riel izq (nav: Chat
  activo; Biblioteca/Ideas/Propuestas/Perfil = "pronto"), centro (Director: cabecera,
  estado vacío en serif, sugerencias, compositor con CTA verde, adjuntar deshabilitado
  = Hito 2), riel der (panel **Contexto**: perfil activo, plataformas activas, señales,
  alimentado por datos reales).
- Tokens de marca en `globals.css`: verde acento `--brand-accent`, violeta IA
  `--brand-violet`, ámbar `--brand-amber`; fuente serif Instrument Serif; toggle
  claro/oscuro (`components/theme-toggle.tsx`) + script anti-parpadeo en `layout.tsx`.

**Mockups de diseño** en `/design` (artefactos, no app real):
- `index.html` (lanzador + design-system), `app.html` (app principal chat+biblioteca),
  `onboarding.html` (alta estilo Blotato), `BRIEF.md` (sistema de diseño compartido),
  `REPORT.md` (racional). Se generaron con 2 subagentes en paralelo sobre el BRIEF.

---

## 4. Infraestructura (IDs y dónde está cada cosa)

- **Repo GitHub**: `carlosdeceGit/demiurgos` (público). Rama de trabajo:
  **`claude/upbeat-knuth-6uil82`**. Aún NO hay rama `main`/default; Vercel despliega
  producción desde esa rama vía integración GitHub (push = auto-deploy).
- **Supabase**: proyecto `isvgigmlkwlwikxxzrqd` ("Demiurgos Web", región eu-west-3).
  - 7 tablas creadas + RLS. ecosystem_knowledge sembrado con las 6 redes (texto
    íntegro, verificado por md5). Perfil de Carlos sembrado. Usuario semilla
    `delgadocollantes@gmail.com` (id `e0d265c5-e9fb-493e-b5d4-0348e108f2f7`) + su
    identidad email, creados por SQL (login magic link funciona).
  - Acceso por MCP: el conector de Supabase de la sesión apuntaba a este proyecto
    (tras conectarlo como "Conector"). Las migraciones/seed se aplicaron con
    `apply_migration` / `execute_sql` (la red del entorno BLOQUEA Supabase y
    api.vercel.com; solo el MCP funciona).
- **Vercel**: proyecto `prj_jU4eCxCCwbCD1K9kog9kFENhWfkf` (nombre "demiurgos"),
  team `team_SrSBEVuPdalqxSIehSDq0K6t` ("carlos-7014's projects"). Dominio
  `demiurgos.vercel.app`. Variables de entorno ya configuradas en el proyecto.
  Protección de despliegue DESACTIVADA (web pública).

### Variables de entorno (valores reales NO van aquí)
Están en `.env.local` (gitignored) y en Vercel. Lista en `.env.local.example`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`AI_GATEWAY_API_KEY`, `DIRECTOR_MODEL` (=openai/gpt-5.5), `CRITIC_MODEL`, `ANALYST_MODEL`,
`NEXT_PUBLIC_SITE_URL` (=https://demiurgos.vercel.app), `SEED_USER_EMAIL`.

### ⚠️ Seguridad pendiente
El usuario compartió en el chat anterior: AI Gateway key, contraseña DB, un Personal
Access Token de Supabase (`sbp_…`) y las keys anon/service_role. **Recomendado rotar**:
borrar el PAT de Supabase (ya cumplió su función), rotar la AI Gateway key y
actualizar `AI_GATEWAY_API_KEY` en Vercel. La service_role solo debe usarse en
servidor/seed, nunca en cliente.

---

## 5. Cómo se trabaja en este entorno (gotchas importantes)

- **Red del entorno restringida**: bloquea hosts de Supabase, `api.vercel.com` y el
  AI Gateway. Por eso NO se puede: aplicar migraciones por CLI, correr `npm run seed`
  contra la DB, ni `vercel deploy` desde aquí. SÍ se puede: **MCP de Supabase**
  (apply_migration/execute_sql), **MCP de Vercel** (lecturas + `web_fetch_vercel_url`
  para ver el sitio), y **git push** (dispara el deploy de Vercel).
- **Deploy**: se hace empujando a la rama (auto-deploy). Verificar con
  `list_deployments`/`get_deployment` (MCP Vercel) hasta READY, y `web_fetch_vercel_url`
  para comprobar páginas. El chat logueado solo lo verifica el usuario (necesita su
  sesión por email; el MCP no inicia sesión Supabase).
- **Magic link**: funciona. Es de un solo uso y el email integrado de Supabase está
  limitado (rate limit). Para fiabilidad futura: SMTP propio (Resend) en Supabase Auth.
- **No-flash de tema**: hay un `<script>` en `layout.tsx` que aplica `.dark` antes del
  paint; el toggle usa `localStorage['dmg-theme']`.
- Commits firmados con `Co-Authored-By: Claude Opus 4.8` y la línea `Claude-Session`.
  Hay un hook de stop que avisa si quedan archivos sin commitear: commitea y pushea.

---

## 6. Estructura del repo (resumen)

```
app/            page.tsx (landing) · login/ · auth/{callback,signout}/ · chat/page.tsx · api/chat/route.ts · layout.tsx · globals.css
components/     ui/ (button,textarea,card) · chat/{chat-client,chat-shell}.tsx · theme-toggle.tsx
lib/ai/         gateway.ts · compose-context.ts · platforms.ts · roles/director.ts
lib/db/         client.ts · server.ts · admin.ts · middleware.ts (usado por proxy.ts)
prompts/        director.md
seed/           seed.ts · parse-conocimiento.ts · map-perfil.ts · parse-markdown.ts · motor.md
supabase/migrations/  0001_schema.sql · 0002_rls.sql
design/         index.html · app.html · onboarding.html · BRIEF.md · REPORT.md
v1-proyecto-claude/   los 4 .md fuente (motor, plantilla, Carlos, conocimiento)
tests/          compose-context.test.ts · seed.test.ts
proxy.ts        middleware de sesión (convención Next 16)
```

---

## 7. Siguientes pasos (hitos pendientes)

Opciones inmediatas (la sesión anterior terminó ofreciendo estas):
- **Onboarding real** en `/onboarding`: llevar el mockup `design/onboarding.html` a una
  ruta Next que escriba en `profiles` (modo "rápido"; la entrevista por IA es Hito 3).
- **Pulir `/chat`**: densidad, colores, panel derecho en móvil (drawer), markdown en
  respuestas del Director.

Hoja de ruta por hitos (de `PLAN_BUILD_MVP.md`):
- **Hito 2** — Subida y análisis: worker Railway + uploads + Analista (Gemini) que
  procesa archivos → señales. Memoria semántica con pgvector (rellenar `signals.embedding`).
  La UI ya deja sitio (botón adjuntar y Biblioteca como "pronto").
- **Hito 3** — Onboarding por IA + pantalla de Perfil con diffs aplicables.
- **Hito 4** — Propuestas + consejo: Director genera, Crítico verifica, dashboard de
  cards, tabla `ai_runs` para comparar modelos.
- **Hito 5** — Investigador: research semanal que refresca `ecosystem_knowledge` (cron).

---

## 8. Comandos útiles

```bash
npm run dev        # desarrollo local (necesita .env.local)
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest (compose-context y seed)
npm run seed       # sembrar DB (NO funciona desde el entorno remoto por red; sí en local)
grep -rn "Carlos" lib app   # debe dar 0 (regla de separación motor/datos)
```

Definición de hecho del Hito 1 (cumplida): app desplegada, migraciones+seed cargados
(6 redes + perfil de Carlos), chat responde en personaje con el perfil cargado, README
y este handoff disponibles.
