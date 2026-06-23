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

---

## 9. Landing pública + rediseño de marca (sesión `claude/sweet-faraday-uqfo4s`)

> Añadido el 23 jun 2026. Track de **diseño/landing** en una rama propia. Objetivo: una
> landing de marketing profesional y diferencial + rediseño de marca (logo, color,
> tipografía) orientado a conversión.

### 9.1 Rama y deploy (importante)
- Rama de trabajo: **`claude/sweet-faraday-uqfo4s`**, creada desde `1738e34` (commit del
  handoff). **Está POR DETRÁS de producción** (`claude/upbeat-knuth-6uil82`, que ya tiene
  admin/dashboard/demo/settings). Por eso **NO** despliega a `demiurgos.vercel.app`:
  Vercel le da un **deploy de PREVIEW** automático en cada push.
- URL de preview (alias estable de la rama):
  `https://demiurgos-git-claude-sweet-faraday-uqfo4s-carlos-7014s-projects.vercel.app`
  - Landing Next real: **la home `/`** (decisión final: la landing está en `/`, no en `/landing`).
  - Boceto v3 servido estático: **`/landing-v3.html`**.
- Para llevarlo a producción: **rebasar sobre `claude/upbeat-knuth-6uil82`** y mergear
  (pendiente; OJO: producción ya cambió `app/page.tsx`, habrá que resolver el conflicto).

### 9.2 Landing real en Next (en la home `/`)
- `app/page.tsx` — landing de marketing completa (server component) con su `metadata`
  (canónica `/`, OG). Secciones: hero, tira de plataformas, problema, solución (3 fuentes),
  beneficios, cómo funciona, diferenciación (regla de oro), visión, CTA final.
  (Pasó por `/landing` y finalmente se movió a la home `/` a petición del usuario.)
- `app/opengraph-image.tsx` — OG image dinámica (next/og), prerender estático.
- `components/landing/` — `hero.tsx` (parallax + señales flotantes, Framer Motion),
  `landing-header.tsx` (sticky scroll-aware), `reveal.tsx` (reveal al scroll, respeta
  `prefers-reduced-motion`).
- `app/globals.css` — sistema **`.dmg-landing`** (paleta "papel+tinta" aislada para no
  tocar /chat ni /login) + keyframes/utilidades.
- `app/sitemap.ts` (solo `/`), `app/robots.ts`, metadata global en `app/layout.tsx` (OG/Twitter).
- **Dependencia nueva**: `motion` (Framer Motion, `^12.40`). Build/typecheck/lint en verde.

### 9.3 Bocetos de diseño (HTML autónomos, en `/design`)
- `design/landing-v2.html` — boceto editorial claro. Aplica la **arquitectura de
  conversión SaaS** del documento del usuario: marco 4C, hero story-driven con preview de
  producto real, nav mínima (Hick) + CTA grande (Fitts), microcopy de reaseguro, progreso
  dotado (Zeigarnik), bento, comparativa, prueba social **reservada** (sin inventar),
  acceso honesto **sin tarifas falsas**, FAQ, cierre pico-fin.
- `design/landing-v3.html` (**el preferido por el usuario**) — **dark esmeralda**: negro
  elegante `#070809` con verde `#3FE0A2` como único acento. CTAs pro (glow + shine +
  magnéticos + barra fija móvil), spotlight que sigue el cursor, tarjeta con tilt 3D,
  **tabs de plataforma que cambian la propuesta en vivo** (LinkedIn/YouTube/X/Substack),
  aurora, marquee, reveals. Copia en `public/landing-v3.html` para verlo en vivo.

### 9.4 Marca rediseñada (en los bocetos; aún no portada al Next)
- **Logo nuevo**: una "D" de columna + arco con una **chispa esmeralda** y tres nodos que
  se desvanecen = "el caos que toma forma". En v3 va como `<symbol id="mark">` SVG con
  gradiente; 3 lockups (sobre tinta / verde / blanco).
- **Color (v3)**: tinta `#070809`, superficie `#101315`, esmeralda `#3FE0A2`, verde deep
  `#0B7F58`, hueso `#F3F6F4`. Verde con criterio (acento/CTA/glow), no a puñados.
- **Tipografía**: *Instrument Serif* (display + palabra-acento itálica) + *Geist*
  (UI/cuerpo) + *Geist Mono* (datos).
- **Copy** anti-humo, basado en la doc. Titular eje: "Publica con criterio. No por
  inercia." Regla de oro como diferenciación. Sin métricas/clientes inventados.

### 9.5 Reglas respetadas
- `grep -rn "Carlos" lib app` sigue dando **0** (ejemplos de propuesta genéricos; en
  `/design` el contenido es ilustrativo).
- Accesibilidad: foco visible, `prefers-reduced-motion`, contraste, semántica h1/h2/h3.

### 9.6 Commits de esta rama (orden)
`067077f` landing premium · `3f2d784` mover a /landing + home simple · `d23d165` boceto v2
· `c0f3a28` boceto v3 dark esmeralda + public/ · (luego) mover landing a la home `/` +
este update del handoff.

### 9.7 Estado y siguiente paso
- ✅ **Dark esmeralda portado al Next** (commit `2cdc2a9`): la home `/` ya usa la marca
  nueva. Archivos clave: `components/landing/logo.tsx` (marca), `app/icon.svg` (favicon),
  `app/opengraph-image.tsx` (OG dark), tokens dark en `app/globals.css` (`.dmg-landing`).
- Pendiente: decidir si esta rama se **rebasa y mergea sobre producción**
  (`claude/upbeat-knuth-6uil82`) para que la landing salga en `demiurgos.vercel.app`
  (OJO: producción ya cambió `app/page.tsx`, habrá conflicto que resolver).

> **El sistema de diseño definitivo está en la sección 10** (abajo). Esa sección es la
> fuente de verdad de marca para TODAS las webs de Demiurgos; lo de arriba es el registro
> de cómo se llegó a él.

---

## 10. Sistema de diseño / Identidad de marca Demiurgos (CANÓNICO — todas las webs)

> Fuente de verdad de marca para **cualquier web de Demiurgos** (landing, app, dashboards,
> futuros sitios). Si haces una pantalla nueva, sale de aquí. Versión: **"dark esmeralda"**,
> jun 2026. Implementación de referencia: `app/globals.css` (`.dmg-landing`),
> `components/landing/logo.tsx`.

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
