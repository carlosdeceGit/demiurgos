#!/usr/bin/env bash
# Recordatorio de proyecto al arrancar cualquier sesión (incl. Claude Code web).
cat <<'MSG'
[Demiurgos]
· UI/UX: el sitio tiene UNA sola identidad "dark esmeralda". Antes de crear o editar
  cualquier cosa visual, usa el skill `demiurgos-design-system` y respeta HANDOFF.md §10.
  No inventes colores/fuentes/logos: reutiliza los tokens (app/globals.css) y los
  componentes existentes (Logo, .dmg-cta, .dmg-card, Button/Card).
· Superpowers está habilitado para este repo (.claude/settings.json). Úsalo en trabajo
  no trivial: brainstorming → plan → TDD → verification-before-completion.
MSG
