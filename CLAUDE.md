# Demiurgos — guía para agentes (Claude Code)

## ⚠️ Diseño (OBLIGATORIO en todo el sitio)
Demiurgos tiene **una sola identidad visual: "dark esmeralda"**, idéntica en landing,
`/chat`, `/dashboard`, `/admin`, `/demo`, `/login`, emails, OG y favicon.

**Antes de crear o editar CUALQUIER UI, usa el skill `demiurgos-design-system`**
(`.claude/skills/demiurgos-design-system/`) y sigue `HANDOFF.md` §10 (fuente de verdad).

Resumen no negociable:
- **Dark-only.** Usa solo tokens semánticos (Tailwind: `bg-background`, `bg-card`,
  `text-foreground`, `text-muted-foreground`, `border`, `bg-primary`, `ring`). **Nunca**
  colores crudos (`bg-white`, `#fff`, `bg-zinc-*`, etc.).
- **Acento único = verde esmeralda `#3FE0A2`.** Nada de púrpura.
- **Tipografía**: Instrument Serif (display/itálica acento) + Geist (UI) + Geist Mono (datos).
- **Logo** = `components/landing/logo.tsx`; **favicon** = `app/icon.svg`. Iconos Lucide (línea).
- Reutiliza componentes (`.dmg-cta`, `.dmg-card`, `.dmg-pill`, `Button`, `Card`). No reinventes.
- Motion con propósito + `prefers-reduced-motion`. Accesibilidad AA. Sin stock genérico.

## Superpowers
El plugin **Superpowers** (obra/superpowers) está habilitado para este repo en
`.claude/settings.json` (marketplace `obra/superpowers-marketplace`). Úsalo en cualquier
tarea no trivial: brainstorming → escribir plan → TDD → `verification-before-completion`.
Si tu Claude Code aún no lo tiene instalado, ejecútalo una vez:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## Reglas del repo
- **Motor genérico**: `grep -rn "Carlos" lib app` debe dar **0** (datos de usuario solo en seed/`/design`/`/demo`).
- Antes de dar por terminada una tarea: `npm run build && npm run lint && npm run typecheck` en verde.
- Contexto completo del proyecto, infraestructura, diseño (§10) y trabajo/pendientes (§11): **`HANDOFF.md`**.
