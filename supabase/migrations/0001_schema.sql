-- Demiurgos — esquema del MVP (Hito 1)
-- Materializa las capas de ARQUITECTURA_DEMIURGOS.md en tablas Postgres.
-- Tablas: profiles, ecosystem_knowledge, signals, uploads, proposals, messages, ai_runs.

-- pgvector: memoria semántica. La columna embedding se crea ya, pero no se usa
-- hasta el Hito 2 (queda nullable).
create extension if not exists vector;

-- updated_at automático para tablas vivas.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Capa 3 — Instancia de perfil (una fila por usuario).
-- Estructura derivada de PERFIL_PLANTILLA.md (capa 2 = el esquema).
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  positioning jsonb not null default '{}'::jsonb,
  pillars jsonb not null default '[]'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  voice jsonb not null default '{}'::jsonb,
  tacit jsonb not null default '{}'::jsonb,
  goals jsonb not null default '{}'::jsonb,
  platforms jsonb not null default '[]'::jsonb,
  performance_patterns jsonb not null default '[]'::jsonb,
  referents jsonb not null default '[]'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Capa 4 — Conocimiento del ecosistema (neutral y compartido).
-- Una fila por red. Versionado: is_current marca la ficha vigente.
-- No tiene user_id: es global.
-- ─────────────────────────────────────────────────────────────
create table public.ecosystem_knowledge (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  content text not null,
  version integer not null default 1,
  is_current boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger ecosystem_knowledge_set_updated_at
  before update on public.ecosystem_knowledge
  for each row execute function public.set_updated_at();

-- Una sola ficha vigente por plataforma.
create unique index ecosystem_knowledge_current_platform
  on public.ecosystem_knowledge (platform)
  where is_current;

-- ─────────────────────────────────────────────────────────────
-- Señales frescas que inyecta el usuario (chat, uploads, research).
-- ─────────────────────────────────────────────────────────────
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  type text,
  source text, -- 'chat' | 'upload' | 'research'
  embedding vector(1536), -- Hito 2
  created_at timestamptz not null default now()
);

create index signals_user_created_idx
  on public.signals (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Contenido subido por el usuario (procesado en Hito 2).
-- ─────────────────────────────────────────────────────────────
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_url text not null,
  file_type text,
  status text not null default 'pending', -- 'pending' | 'processed' | 'failed'
  extracted jsonb,
  created_at timestamptz not null default now()
);

create index uploads_user_created_idx
  on public.uploads (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Propuestas generadas por el consejo de IAs (Hito 4).
-- ─────────────────────────────────────────────────────────────
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_of date,
  platform text,
  idea text,
  why_now text,
  script text,
  image_prompt text,
  video_prompt text,
  suggested_slot text,
  status text not null default 'draft',
  based_on jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

create index proposals_user_created_idx
  on public.proposals (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Conversación persistente con Demiurgos.
-- ─────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null, -- 'user' | 'assistant' | 'system'
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_user_created_idx
  on public.messages (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Traza de qué IA hizo qué (para A/B y coste). Se llena en Hito 4.
-- ─────────────────────────────────────────────────────────────
create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null, -- 'director' | 'critico' | 'analista' | 'investigador'
  model text not null,
  input_summary text,
  output_summary text,
  tokens integer,
  cost numeric,
  created_at timestamptz not null default now()
);

create index ai_runs_user_created_idx
  on public.ai_runs (user_id, created_at desc);
