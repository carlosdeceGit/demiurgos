-- Demiurgos — Biblioteca de contenidos
-- Permite a cada usuario subir/sincronizar contenido, convertirlo a Markdown
-- limpio (la representación principal para los modelos de IA) y consultarlo.
--
-- Decisiones (ver docs/CONTENT_LIBRARY.md):
--  - El Markdown final vive en la BD (content_library.markdown_content): ligero y
--    directamente útil para IA/RAG. NO guardamos archivos originales pesados.
--  - El original solo se conserva de forma opcional y temporal en Supabase Storage
--    (bucket privado 'library-originals') cuando hace falta reprocesar (p. ej.
--    imágenes pendientes de OCR). Política de retención en el doc.
--  - Tres tablas: content_sources (carpetas Drive), content_library (contenido) y
--    content_sync_logs (trazas de sincronización). RLS por usuario en todas.
--  - Se reutiliza el trigger set_updated_at() de 0001_schema.sql.

-- ─────────────────────────────────────────────────────────────
-- content_sources — carpetas externas conectadas (Google Drive).
-- NO guardamos tokens en texto plano: solo la referencia de la carpeta y el
-- estado. El intercambio de tokens OAuth se documenta como punto de integración
-- (ver docs/CONTENT_LIBRARY.md). Si en el futuro se almacena un refresh token,
-- debe ir cifrado (Supabase Vault), no en una columna en claro.
-- ─────────────────────────────────────────────────────────────
create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null default 'google_drive'
    check (source_type in ('google_drive', 'other')),
  provider text not null default 'google_drive',
  provider_folder_id text,
  provider_folder_name text,
  provider_account_email text,                -- email de la cuenta conectada (informativo)
  token_ref text,                             -- referencia a la credencial (NO el token)
  sync_status text not null default 'disconnected'
    check (sync_status in ('disconnected', 'connected', 'syncing', 'error')),
  sync_error text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_sources_user_idx
  on public.content_sources (user_id, created_at desc);

create trigger content_sources_set_updated_at
  before update on public.content_sources
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- content_library — una fila por pieza de contenido del usuario.
-- ─────────────────────────────────────────────────────────────
create table public.content_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Metadata de presentación.
  title text not null default 'Sin título',
  tags text[] not null default '{}',

  -- Procedencia del archivo original.
  original_file_name text,
  original_mime_type text,
  original_extension text,
  original_size bigint,                       -- bytes del original (informativo)
  original_storage_path text,                 -- ruta en Storage si se conservó

  -- Origen del contenido.
  source_type text not null default 'manual_upload'
    check (source_type in ('manual_upload', 'google_drive', 'other')),
  source_id uuid references public.content_sources (id) on delete set null,
  provider_file_id text,                      -- id del archivo en el proveedor (Drive)
  provider_modified_at timestamptz,           -- modifiedTime del proveedor (dedupe)
  source_url text,                            -- enlace al original (Drive, etc.)
  content_hash text,                          -- hash del markdown (dedupe/cambios)

  -- Contenido convertido (representación principal).
  markdown_content text,
  markdown_size integer not null default 0,   -- longitud en caracteres

  -- Estado de procesamiento.
  status text not null default 'pending'
    check (status in (
      'pending',      -- en cola, aún sin procesar
      'processing',   -- conversión en curso
      'completed',    -- convertido a Markdown correctamente
      'failed',       -- la conversión falló
      'needs_review', -- convertido pero requiere revisión humana (p. ej. OCR)
      'synced'        -- importado desde un proveedor externo
    )),
  conversion_tool text,                       -- 'markdown-validate' | 'txt-normalize' | 'html-to-md' | 'ocr-vision' | ...
  conversion_error text,

  -- Metadata libre para recuperación posterior (futuro RAG/embeddings).
  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create index content_library_user_created_idx
  on public.content_library (user_id, created_at desc);

create index content_library_user_status_idx
  on public.content_library (user_id, status);

create index content_library_source_idx
  on public.content_library (source_id);

-- Dedupe de archivos sincronizados: un mismo archivo del proveedor no se
-- importa dos veces para el mismo origen.
create unique index content_library_provider_unique
  on public.content_library (source_id, provider_file_id)
  where provider_file_id is not null;

create trigger content_library_set_updated_at
  before update on public.content_library
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- content_sync_logs — traza de cada sincronización (visible al usuario).
-- ─────────────────────────────────────────────────────────────
create table public.content_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_id uuid references public.content_sources (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'partial')),
  files_found integer not null default 0,
  files_imported integer not null default 0,
  files_updated integer not null default 0,
  files_failed integer not null default 0,
  error_log text
);

create index content_sync_logs_source_idx
  on public.content_sync_logs (source_id, started_at desc);

create index content_sync_logs_user_idx
  on public.content_sync_logs (user_id, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: cada usuario solo ve y modifica lo suyo.
-- Mismo patrón que el resto de tablas por usuario (0002_rls.sql).
-- ─────────────────────────────────────────────────────────────
alter table public.content_library enable row level security;
create policy "content_library_all_own"
  on public.content_library for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.content_sources enable row level security;
create policy "content_sources_all_own"
  on public.content_sources for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.content_sync_logs enable row level security;
create policy "content_sync_logs_all_own"
  on public.content_sync_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
