#!/usr/bin/env bash
# Hook de arranque de sesión (incl. Claude Code web).

# El contenedor remoto se clona limpio (sin node_modules). Sin dependencias,
# `tsc`, `eslint` y `next build` escupen CIENTOS de errores fantasma (no encuentran
# los tipos de React/Next, `process`, etc.). Instalamos una sola vez si faltan,
# para que typecheck/lint/build funcionen de verdad en cada sesión.
if [ ! -d node_modules ] && [ -f package.json ]; then
  echo "[Demiurgos] node_modules ausente: instalando dependencias…"
  if npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1; then
    echo "[Demiurgos] Dependencias listas."
  else
    echo "[Demiurgos] ⚠ La instalación automática falló; ejecuta 'npm install' a mano."
  fi
fi

# Recordatorio de proyecto.
cat <<'MSG'
[Demiurgos]
· UI/UX: el sitio tiene UNA sola identidad "dark esmeralda". Antes de crear o editar
  cualquier cosa visual, usa el skill `demiurgos-design-system` y respeta HANDOFF.md §10.
  No inventes colores/fuentes/logos: reutiliza los tokens (app/globals.css) y los
  componentes existentes (Logo, .dmg-cta, .dmg-card, Button/Card).
· Superpowers está habilitado para este repo (.claude/settings.json). Úsalo en trabajo
  no trivial: brainstorming → plan → TDD → verification-before-completion.
MSG
