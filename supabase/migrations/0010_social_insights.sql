-- Añade social_insights al perfil: ADN de contenido sintetizado por plataforma.
-- El job de síntesis (POST /api/apify/synthesize) lee todos los posts de social_posts
-- y guarda aquí un resumen compacto que el Director siempre recibe.
-- Estructura: { [platform]: { synthesized_at, posts_analyzed, content_dna } }

alter table public.profiles
  add column if not exists social_insights jsonb not null default '{}';
