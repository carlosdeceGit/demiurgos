# Demiurgos

Inteligencia creativa para marca personal en redes. Demiurgos es tu director
creativo personal: aprende quién eres, tu voz y tu criterio, cruza eso con cómo
funciona cada red ahora mismo, y decide qué publicar, cuándo y por qué.

> Del griego: el artesano que da forma al mundo a partir del caos.

Este repo contiene el **Hito 1 (la fundación)** del MVP. El alcance, la
arquitectura y el plan completo están en
[`ARQUITECTURA_DEMIURGOS.md`](./ARQUITECTURA_DEMIURGOS.md) y
[`PLAN_BUILD_MVP.md`](./PLAN_BUILD_MVP.md).

## Qué incluye el Hito 1

- App Next.js (App Router, TypeScript, Tailwind, shadcn/ui) desplegable en Vercel.
- Postgres (Supabase) con el esquema del MVP y Row Level Security.
- Auth con Supabase (email + enlace mágico).
- Capa de IA multi-modelo vía Vercel AI Gateway (una key, fallbacks).
- Chat a pantalla completa con streaming que llama al rol **Director creativo**
  con el contexto compuesto (motor + perfil + conocimiento + señales).
- Seed que carga el motor, el conocimiento de las 6 redes y el perfil semilla.

Fuera de alcance en el Hito 1 (hitos posteriores): subida y análisis de
contenido, onboarding por IA, propuestas y consejo completo, investigador
semanal, worker en Railway.

## Arquitectura en una línea

Las capas de la arquitectura se materializan en tablas. El **motor** (genérico,
sin datos de nadie) vive en `seed/motor.md` y se compone en runtime con la
**instancia** del usuario (`profiles`), el **conocimiento del ecosistema**
(`ecosystem_knowledge`, neutral y compartido) y las **señales** frescas.

| Capa | Artefacto | Tabla / asset |
|---|---|---|
| Motor | `v1-proyecto-claude/INSTRUCCIONES.md` | `seed/motor.md` (runtime) |
| Esquema | `v1-proyecto-claude/PERFIL_PLANTILLA.md` | tabla `profiles` |
| Instancia | `v1-proyecto-claude/PERFIL_CARLOS.md` | fila en `profiles` |
| Conocimiento | `v1-proyecto-claude/CONOCIMIENTO_REDES.md` | tabla `ecosystem_knowledge` |

> El motor es genérico: no contiene datos de ningún usuario. Cada persona vive
> solo como una fila aislada (RLS). Un `grep "Carlos"` en `/lib` o `/app` no
> debe devolver nada.

## Requisitos

- Node.js 20+ y npm.
- Un proyecto de [Supabase](https://supabase.com) (Postgres + Auth + pgvector).
- Una API key de [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).
- (Para deploy) cuentas de Vercel y Supabase.

## Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena los valores. Nunca comitees
`.env.local` ni claves reales.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (cliente; RLS protege los datos) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo servidor: seed). Nunca al cliente |
| `AI_GATEWAY_API_KEY` | Key del Vercel AI Gateway |
| `DIRECTOR_MODEL` | Modelo del Director (def. `openai/gpt-5.5`) |
| `CRITIC_MODEL` / `ANALYST_MODEL` | Documentadas, sin uso en el Hito 1 |
| `NEXT_PUBLIC_SITE_URL` | URL pública, para el redirect del enlace mágico |
| `SEED_USER_EMAIL` | Email del usuario al que se asocia el perfil semilla |

## Setup local

```bash
# 1. Dependencias
npm install

# 2. Variables
cp .env.local.example .env.local   # y rellena los valores

# 3. Migraciones (esquema + RLS) contra tu proyecto Supabase
npx supabase login                 # una vez
npx supabase link --project-ref <TU_PROJECT_REF>
npm run db:push                    # aplica supabase/migrations/*.sql

# 4. Seed: motor + conocimiento de las 6 redes + perfil semilla
npm run seed

# 5. Arrancar
npm run dev                        # http://localhost:3000
```

### Configurar el enlace mágico en Supabase

En el panel de Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (y tu dominio de Vercel en producción).
- **Redirect URLs:** añade `http://localhost:3000/auth/callback` y
  `https://<tu-dominio>.vercel.app/auth/callback`.

Inicia sesión con el email de `SEED_USER_EMAIL` para entrar con el perfil
semilla ya cargado.

## Probar que funciona

1. `npm run dev`, abre `http://localhost:3000`, entra con tu email (enlace mágico).
2. En `/chat`, pregunta: **“¿qué formato me conviene en LinkedIn esta semana?”**
3. Demiurgos debe responder en personaje, con criterio del conocimiento sembrado
   (p. ej. carruseles/documentos y saves en LinkedIn) y referido a tu perfil, no
   de forma genérica.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run typecheck  # tsc --noEmit
npm run test       # vitest (compose-context y seed)
npm run seed       # sembrar la base de datos
npm run db:push    # aplicar migraciones (supabase CLI)
npm run db:reset   # resetear la base local (supabase CLI)
```

## Deploy en Vercel

1. Importa el repo en Vercel (framework: Next.js, detectado automáticamente).
2. Configura las variables de entorno del cuadro de arriba en el proyecto Vercel.
3. Aplica las migraciones a tu proyecto Supabase (`npm run db:push`) y ejecuta el
   seed (`npm run seed`) apuntando a ese proyecto.
4. En Supabase, añade la URL de Vercel a Site URL y Redirect URLs (ver arriba).
5. Deploy. Alternativamente, vía CLI:

```bash
npx vercel        # preview
npx vercel --prod # producción
```

## Estructura del repo

```
app/                      # Next.js (App Router)
  chat/                   # chat a pantalla completa
  login/                  # entrada con enlace mágico
  auth/                   # callback y signout del enlace mágico
  api/chat/               # ruta del chat (compone contexto + Director + persiste)
components/
  ui/                     # shadcn/ui (button, textarea, card)
  chat/                   # cliente de chat (streaming)
lib/
  ai/
    gateway.ts            # Vercel AI SDK + AI Gateway (modelos por entorno)
    compose-context.ts    # motor + perfil + conocimiento + señales + memoria
    platforms.ts          # claves canónicas de plataforma
    roles/director.ts     # rol Director creativo
  db/                     # clientes Supabase (browser, server, admin) + proxy
prompts/                  # prompts de los roles del consejo
seed/                     # parsers + script de seed + motor.md
supabase/migrations/      # esquema + RLS
v1-proyecto-claude/       # la spec: motor, esquema, instancia, conocimiento
tests/                    # vitest
```

La estructura sigue la sección 7 de `PLAN_BUILD_MVP.md`. `worker/` (Railway) y
las pantallas de onboarding/propuestas/perfil/upload llegan en hitos posteriores.
