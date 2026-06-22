# Plan — Admin backstage, Dashboard y Demo enseñable

> Estado: plan para revisar (no implementado). Complementa `PLAN_BUILD_MVP.md` y
> `HANDOFF.md`. Objetivo: poder **enseñar** Demiurgos a terceros (inversores, bootcamp,
> clientes) con una demo creíble, y tener un **panel de operador** para verlo por detrás.

## ✅ Decisiones tomadas (22 jun 2026)
1. **Demo**: ruta `/demo` **pública** con datos de ejemplo (*fixtures* del repo).
2. **Admin**: gating por **allowlist de email** (env `ADMIN_EMAILS`).
3. **Datos falsos**: **multi-sector, 4 perfiles** (Carlos + abogada + chef + fisio).
4. **Chat de la demo**: **LLM real** (el Director responde de verdad con el perfil demo).

> ⚠️ Implicación de 1+4: una demo pública con chat de LLM real puede generar coste de
> gateway si alguien abusa. Mitigaciones obligatorias (ver sección C y F): rate limit
> por IP/sesión, tope de mensajes por sesión, modelo demo configurable (`DEMO_MODEL`),
> spend cap en el AI Gateway, y system prompt acotado al perfil demo. Sin esto, no se
> publica el `/demo`.

---

## 0. Las tres piezas y para qué sirve cada una

| Pieza | Para quién | Para qué |
|---|---|---|
| **A. Admin backstage** | Tú (operador) | Ver y gestionar el sistema multi-tenant: usuarios, uso/coste de IA, conocimiento de redes, salud. |
| **B. Dashboard** | El usuario final (y tú) | La "foto" del producto: propuestas de la semana, estado del perfil, señales, racha. Es lo más vistoso para enseñar. |
| **C. Demo con datos falsos** | Audiencia (enseñar) | Recorrer el producto lleno de contenido creíble, sin login ni datos reales, sin disparar coste de IA. |

Regla que se mantiene: **el motor es genérico**. La demo, además, sirve para
demostrarlo: varios perfiles de sectores distintos (no solo Carlos) probando que el
mismo sistema funciona para cualquiera.

---

## A. Admin backstage (panel de operador)

### Acceso y seguridad
- **Gating por allowlist de email** vía env `ADMIN_EMAILS` (CSV). Ruta `/admin`
  protegida en `proxy.ts`: si el email del usuario no está en la lista → 404/redirect.
  (Alternativa: columna `role` en una tabla `admins`; la allowlist por env es más
  simple para empezar y suficiente.)
- Todas las lecturas "cross-tenant" se hacen **en el servidor** con el cliente
  service-role (`lib/db/admin.ts`), nunca desde el cliente. El service role jamás
  llega al navegador.
- Privacidad: el admin puede ver agregados y metadatos; el contenido de mensajes de
  usuarios reales se trata con cuidado (en demo no hay problema; con usuarios reales,
  mínimo necesario + nota RGPD del `GUIA_SETUP`).

### Pantallas (`/admin/...`)
1. **Resumen** — KPIs: nº usuarios, perfiles completados, propuestas generadas,
   **coste total de IA** y tokens (de `ai_runs`), conversaciones activas (7/30 días).
2. **Usuarios** — tabla de `profiles`: nombre, sector/pilares, plataformas activas,
   `onboarding_completed`, última actividad, nº mensajes/propuestas. Detalle por usuario.
3. **Uso de IA** — explotación de `ai_runs`: tabla y gráfico de **coste por modelo y
   por día**, tokens por rol (Director/Crítico/Analista). Es el panel de control del
   "consejo de IAs" para A/B y coste.
4. **Conocimiento del ecosistema** — CRUD de las 6 fichas de `ecosystem_knowledge`:
   ver, editar, versionar (`version`, `is_current`), fecha. Gestión de la capa 4.
5. **Salud** — estado de migraciones, últimos errores (runtime), advisors de Supabase.

### Dependencias en datos
- Ya existe `ai_runs` (se llena en Hito 4; para la demo se siembra con datos falsos).
- Añadir índices/consultas agregadas. No requiere tablas nuevas salvo, opcional,
  `admins` si se elige rol en DB.

---

## B. Dashboard del usuario (lo que se enseña)

Pantalla `/dashboard` (o la home tras login) con:
- **Propuestas de la semana**: rejilla de cards en el formato del motor (IDEA · POR QUÉ
  AHORA · GUION · SLOT), con la red y el día. Estados: nueva / aceptada / descartada.
- **Estado del perfil**: barra de completitud + accesos para afinar (pilares, voz…).
- **Plataformas activas** y **banco de señales** recientes.
- **Racha / actividad**: "has usado Demiurgos X días seguidos" (métrica honesta del perfil).
- CTA al chat con el Director.

Es la vista más "producto". Reutiliza tokens y el shell ya creados. Las cards de
propuesta salen de la tabla `proposals` (Hito 4) o, en demo, de fixtures.

---

## C. Demo con datos falsos (enseñable)

### Estrategia elegida: `/demo` público con *fixtures* + chat con LLM real
- Ruta **pública** `/demo` (sin login, sin tocar la DB real ni RLS) que monta la
  misma UI (chat 3 columnas + dashboard + admin de ejemplo) leyendo **datos falsos
  desde el repo** (`demo/fixtures/*.ts`). Todo el contenido estático (perfiles,
  propuestas, dashboard, tablas admin) sale de fixtures: cero riesgo, no toca la DB.
- **Chat en demo = LLM real**: el compositor llama a un endpoint propio
  `app/api/demo-chat` que compone el contexto con el **perfil demo elegido** (fixture)
  + conocimiento de redes, y responde con el Director real vía gateway. NO usa la
  sesión de ningún usuario ni escribe en `messages`.
- **Guardas obligatorias del chat demo** (por ser público + LLM real):
  - Rate limit por IP/sesión (p. ej. 10 mensajes / 10 min) — con almacén simple
    (cookie+memoria, o Upstash si hace falta).
  - Tope duro de mensajes por sesión y longitud máxima de entrada.
  - `DEMO_MODEL` por env (puede ser un modelo más barato que el Director real).
  - **Spend cap** configurado en el Vercel AI Gateway.
  - System prompt acotado al perfil demo + "no salgas del personaje / no reveles esto".
- Selector de perfil demo (los 4 sectores) para enseñar la generalidad en vivo.
- Banner "Modo demo · datos de ejemplo" siempre visible.

### Datos falsos: qué generamos
Para demostrar que el motor es genérico, **4 perfiles de sectores distintos**:
1. Carlos Delgado — emprendedor / ecosistema (el que ya tenemos).
2. Una abogada de startups — autoridad legal.
3. Un chef / negocio gastronómico.
4. Una fisioterapeuta / salud.

Por cada perfil: perfil completo (esquema real), 5 propuestas con su "por qué ahora",
una conversación de ejemplo con el Director, 10-15 señales, y filas de `ai_runs` con
modelos y costes realistas. Más datos agregados para que el admin se vea "vivo".

### Cómo se generan
- Script `seed/demo.ts` con **@faker-js/faker** (locale es) + plantillas escritas a
  mano para los textos con criterio (las propuestas y el "por qué" no pueden ser lorem:
  se redactan creíbles por sector).
- Doble uso: (a) exporta a `demo/fixtures/` para el modo `/demo` estático; (b)
  opcionalmente inserta en Supabase marcando filas con **`is_demo = true`** (nueva
  columna boolean) para poder limpiarlas con un comando.

---

## D. Cambios técnicos necesarios (resumen)

- **Auth/rol**: env `ADMIN_EMAILS`; gating de `/admin` en `proxy.ts`.
- **Migración** (opcional pero útil): `is_demo boolean default false` en las tablas de
  datos (para sembrar/limpiar demo en DB) y, si se elige rol en DB, tabla `admins`.
- **Consultas admin**: helpers en `lib/db/admin-queries.ts` (agregados de `ai_runs`,
  conteos por usuario) usados solo en server components de `/admin`.
- **Fixtures demo**: `demo/fixtures/*` + `seed/demo.ts`.
- **Componentes**: cards de propuesta, tablas admin, gráfico simple (sparkline/barras,
  sin librería pesada o con `recharts` ligero), banner de demo.
- **Rutas**: `/admin`, `/admin/usuarios`, `/admin/ia`, `/admin/conocimiento`,
  `/dashboard`, `/demo`.

---

## E. Plan por pasos (orden sugerido)

1. **Datos falsos primero** (desbloquea todo lo demás): `seed/demo.ts` + 4 perfiles +
   propuestas/conversaciones/ai_runs + fixtures. *(Mayor valor para enseñar.)*
2. **Dashboard de usuario** `/dashboard` con las cards de propuesta (sobre fixtures).
3. **Modo demo** `/demo` público con chat pregrabado + banner.
4. **Admin backstage** `/admin` (gating + Resumen + Usuarios + Uso de IA + Conocimiento).
5. **Pulido para enseñar**: estados vacíos, responsive, un "guion de demo" (qué clicar
   en qué orden para contar la historia en 3 minutos).

Cada paso deja algo enseñable. Se puede parar tras el 3 y ya hay demo.

---

## F. Riesgos y cómo se mitigan

- **Coste/abuso de IA en demo pública (LLM real)** → rate limit por IP/sesión, tope de
  mensajes y longitud, `DEMO_MODEL` barato, spend cap en el gateway. Sin estas guardas
  no se publica `/demo`.
- **Privacidad / datos reales** → demo aislada (fixtures), nunca mezclar con tenants
  reales; filas `is_demo` si va a DB; banner visible.
- **Aislamiento multi-tenant (RLS)** → el admin lee con service role SOLO en servidor;
  el modo demo no usa la sesión de nadie.
- **Seguridad del admin** → allowlist de email + comprobación en proxy + nada de
  service role en el cliente.
- **Datos falsos poco creíbles** → los textos con criterio (propuestas, "por qué") se
  redactan a mano por sector; faker solo para nombres/fechas/números.

---

## G. Decisiones (cerradas) y sub-detalles abiertos

Las 4 grandes están decididas (ver arriba). Sub-detalles a concretar al implementar
(no bloquean el inicio; se puede arrancar con defaults):
- `DEMO_MODEL`: modelo del chat demo (default sugerido: uno barato del gateway, no
  GPT-5.5, para limitar coste). Se puede igualar al Director si se prefiere fidelidad.
- Almacén del rate limit: empezar con memoria/cookie (suficiente para enseñar); migrar
  a Upstash Redis solo si el `/demo` recibe tráfico real.
- Sectores exactos de los 4 perfiles demo: propuesta = emprendedor, abogada de
  startups, chef/gastro, fisio/salud (ajustable).

La siguiente sesión puede construir directamente siguiendo el orden de la sección E.
