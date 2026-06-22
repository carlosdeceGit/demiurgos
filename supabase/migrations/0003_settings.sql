-- Demiurgos — ajustes globales (singleton). Permite elegir el modelo de cada
-- rol del consejo desde el panel admin, sin tocar variables de entorno.
-- Solo accesible con service role (servidor): RLS activa y sin policies.

create table if not exists public.settings (
  id boolean primary key default true,
  director_model text not null default 'openai/gpt-5.5',
  critic_model text not null default 'anthropic/claude-opus-4.8',
  analyst_model text not null default 'google/gemini-3.1-pro',
  demo_model text not null default 'google/gemini-3.1-pro',
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

alter table public.settings enable row level security;

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id) values (true) on conflict (id) do nothing;
