-- Taxonomía de contenido en las propuestas del orquestador.
-- Columnas escalares (tipo, categoría, ciclo de vida) para poder FILTRAR/INDEXAR
-- en el módulo de Propuestas. Las subestructuras (slides/scenes/music_brief/pieces)
-- siguen viajando dentro de proposals.based_on (jsonb), como ya hace el pipeline.

alter table public.proposals
  add column if not exists content_type text,
  add column if not exists content_category text,
  add column if not exists expires_at timestamptz,
  add column if not exists feedback_reason text;

-- Filtrado por tipo y categoría en el módulo Propuestas.
create index if not exists proposals_type_category_idx
  on public.proposals (user_id, content_type, content_category);

-- Expiración automática de propuestas aún sin tocar.
create index if not exists proposals_expires_idx
  on public.proposals (expires_at)
  where status = 'nueva';
