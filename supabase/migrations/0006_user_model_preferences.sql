-- Demiurgos — preferencias de IA por usuario (grupos de tarea).
-- Cada usuario elige qué modelo usar en cada grupo (orquestador, texto, web,
-- imágenes, código). Mapa jsonb { grupo: "creador/modelo" }. RLS de profiles
-- ya garantiza el aislamiento por usuario.

alter table public.profiles
  add column if not exists model_preferences jsonb not null default '{}'::jsonb;
