-- Demiurgos — Row Level Security (Hito 1)
-- Regla: cada usuario solo ve y modifica lo suyo.
-- Excepción: ecosystem_knowledge es lectura pública (capa 4 neutral y compartida).
-- El seed usa la service_role key, que ignora RLS por diseño.

-- ─────────────────────────────────────────────────────────────
-- profiles: cada usuario es dueño de su propia fila.
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ecosystem_knowledge: lectura pública, sin escritura por clientes.
-- (Las escrituras llegan vía service_role: seed e Investigador.)
-- ─────────────────────────────────────────────────────────────
alter table public.ecosystem_knowledge enable row level security;

create policy "ecosystem_knowledge_read_all"
  on public.ecosystem_knowledge for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
-- Tablas por usuario: signals, uploads, proposals, messages, ai_runs.
-- Mismo patrón: dueño = auth.uid().
-- ─────────────────────────────────────────────────────────────
alter table public.signals enable row level security;
create policy "signals_all_own"
  on public.signals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.uploads enable row level security;
create policy "uploads_all_own"
  on public.uploads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.proposals enable row level security;
create policy "proposals_all_own"
  on public.proposals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.messages enable row level security;
create policy "messages_all_own"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.ai_runs enable row level security;
create policy "ai_runs_all_own"
  on public.ai_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
