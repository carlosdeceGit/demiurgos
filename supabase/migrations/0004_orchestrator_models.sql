-- Demiurgos — modelos del orquestador multi-agente (calendario semanal).
-- Añade un modelo configurable por rol del pipeline, además de los del chat.
-- Defaults: ids de slug del Vercel AI Gateway (creador/modelo). Cambiables
-- desde /admin sin redeploy.

alter table public.settings
  add column if not exists orchestrator_model text not null
    default 'anthropic/claude-opus-4.8',
  add column if not exists trend_model text not null
    default 'google/gemini-3.1-pro',
  add column if not exists idea_model text not null
    default 'anthropic/claude-haiku-4.5',
  add column if not exists script_model text not null
    default 'anthropic/claude-sonnet-4.6',
  add column if not exists image_director_model text not null
    default 'anthropic/claude-sonnet-4.6';
