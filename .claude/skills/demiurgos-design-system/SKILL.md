---
name: demiurgos-design-system
description: Use whenever you build, edit, or review ANY user-facing UI in Demiurgos — pages, React components, the landing, emails, OG images, favicons/icons, or any visual asset. Read it BEFORE touching anything visual so the whole site keeps one consistent identity (colors, typography, logo, imagery, components, spacing, motion, accessibility). If a change adds or alters something the user sees, this skill applies.
---

# Demiurgos — Sistema de diseño (UI/UX único para todo el sitio)

## Overview
Demiurgos tiene **una sola identidad visual**: "dark esmeralda". Toda pantalla
(landing, `/chat`, `/dashboard`, `/admin`, `/demo`, `/login`, emails, OG, favicon)
debe verse como parte del mismo producto. **No inventes paletas, fuentes, logos ni
estilos nuevos.** Si dudas, copia un patrón que ya exista en el repo.

**Fuente de verdad:** `HANDOFF.md` §10 (canónico) + la implementación en
`app/globals.css` (tokens) y `components/landing/logo.tsx` (marca). Este skill es el
resumen accionable; ante conflicto, gana el HANDOFF §10.

## Regla de oro
> Si una pantalla nueva no se puede distinguir, en estilo, de las que ya existen,
> vas bien. Si introduce un color, una fuente o un componente "a tu manera", está mal.

## 1. Color — usa SIEMPRE tokens, nunca colores sueltos
La app es **dark-only**. Los tokens viven en `:root, .dark` de `app/globals.css` y se
usan vía clases Tailwind semánticas. **Prohibido** `bg-white`, `text-black`, `#fff`,
`bg-zinc-*`, `style={{color:'#...'}}` con colores crudos, etc.

- Fondos: `bg-background` (#070809) · superficies/tarjetas: `bg-card` (#101315).
- Texto: `text-foreground` (#F3F6F4) · secundario: `text-muted-foreground`.
- **Acento ÚNICO = verde esmeralda** `#3FE0A2` (`bg-primary`, `text-primary`, `ring`,
  `bg-brand-accent`). Texto sobre verde: `text-primary-foreground` (#04130D).
- Bordes: `border` (#1C2123) · inputs: `border-input` · foco: `ring` verde.
- Apoyos mínimos (no protagonistas): `--brand-violet` #5BE0C2 (teal frío),
  `--brand-amber` #E6B45A (oro suave). **Nunca púrpura.**
- El verde se usa con disciplina: CTA, foco, énfasis, glow. No como fondo de bloques.

## 2. Tipografía
- **Display / titulares**: `Instrument Serif` (clase `font-serif` / `.dmg-serif`),
  con la **palabra-acento en itálica verde** (patrón: sans bold + 1 palabra serif itálica).
- **UI / cuerpo**: `Geist` (por defecto). Cuerpo 15–16px, interlineado ~1.55.
- **Datos / chips técnicos**: `Geist Mono` (`font-mono`).
- Ya cargadas en `app/layout.tsx`. No añadas otras fuentes.

## 3. Logo e iconos
- **Logo = `components/landing/logo.tsx`** (`<Logo size={n} />`): la "D" con la chispa
  esmeralda y resplandor. Úsalo SIEMPRE; no dibujes otra marca ni un texto "Demiurgos"
  suelto donde toque el logotipo. Favicon = `app/icon.svg` (mismo dibujo). No vuelvas a
  meter `favicon.ico`.
- **Iconos**: estilo línea (Lucide `lucide-react` en React; SVG inline en HTML), stroke
  1.5–2, `currentColor`. Nada de iconos 3D, ni de relleno recargado, ni de otra librería.

## 4. Imágenes / ilustración
- **Nada de stock genérico** ni ilustraciones 3D/caricatura. Prioriza: UI real del
  producto (la tarjeta de propuesta `idea / por qué ahora / guion`), composiciones
  abstractas dark + glow esmeralda, o la propia marca.
- OG/social: estilo dark esmeralda (ver `app/opengraph-image.tsx`). Mismo titular/tono.

## 5. Componentes (reutiliza, no reinventes)
- **CTA primario**: pastilla verde con gradiente + glow + barrido de brillo. En la
  landing = clase `.dmg-cta`; en el resto de la app = `Button` (variant default, ya es
  `bg-primary`). Grande y claro (Ley de Fitts), 1 CTA principal por sección.
- **Botón secundario**: `.dmg-ghost` (vidrio) / `Button variant="outline"`.
- **Tarjetas**: `.dmg-card`(+`.dmg-card-hover`) o el `Card` de shadcn. Radio 18px,
  borde `--line`, hover con halo verde.
- **Píldoras/badges**: `.dmg-pill` (glass, LED verde para estados vivos).
- Radios: tarjetas 18px, inputs/botones pequeños ~12px, píldoras 999px.
- Sombras oscuras y suaves (nunca grises lechosas). El verde es la fuente de luz (glow).

## 6. Motion
- Sutil, rápido, con propósito. Easing `cubic-bezier(.2,.6,.3,1)` / `[0.21,.5,.25,1]`.
- Repertorio aprobado: reveals al scroll (una vez), parallax/tilt de tarjetas, spotlight
  verde que sigue el cursor, CTA con shine, aurora, marquee, LED "ping".
- **Obligatorio** respetar `prefers-reduced-motion`. Stack: Framer Motion (`motion`).

## 7. Accesibilidad (no negociable)
- Foco visible (anillo verde `ring`), navegación por teclado, contraste AA.
- Semántica: un `h1` por página, jerarquía `h2/h3`, `header/main/section/footer`,
  `aria-label` en nav e iconos decorativos `aria-hidden`. Targets táctiles grandes.

## 8. Voz / copy (cuando escribas texto de UI)
- Español de España, claro, directo, **anti-humo**. Titulares orientados a resultado.
- Sin relleno ("revolucionar", "el futuro…"), sin tecnicismos vacíos, negritas con intención.
- **Honestidad**: nada de métricas/clientes/funciones inventadas; lo que no existe se deja
  "reservado" o se omite. Eje: la regla de oro ("si lo podría escribir ChatGPT sin
  conocerte, ha fallado").

## Checklist antes de dar por hecha CUALQUIER tarea de UI
1. ¿Solo tokens semánticos? (`grep -nE "bg-white|text-black|#fff|bg-(zinc|stone|neutral|gray|slate)-" <archivos>` → 0)
2. ¿Tipografía correcta? (Instrument Serif display, Geist cuerpo, Geist Mono datos).
3. ¿Logo = `<Logo/>` y favicon intacto? ¿Iconos Lucide línea?
4. ¿Imágenes sin stock genérico; coherentes con dark esmeralda?
5. ¿CTA/tarjetas/píldoras reutilizan los componentes existentes?
6. ¿Motion con propósito + `prefers-reduced-motion`?
7. ¿Accesibilidad: foco, jerarquía, aria, contraste AA?
8. ¿`grep -rn "Carlos" lib app` sigue dando 0? (regla motor/datos).
9. ¿`npm run build && npm run lint && npm run typecheck` en verde?

## Red flags (PARA y corrige)
- "Para esta página uso otro color/fuente para que destaque" → NO. Una identidad.
- Pegar un componente de otra librería/estética → NO. Usa los del repo.
- Un PNG/stock decorativo "de relleno" → NO. Imagen con sentido o nada.
- Modo claro nuevo → NO. La app es dark-only (el toggle quedó cosmético).
