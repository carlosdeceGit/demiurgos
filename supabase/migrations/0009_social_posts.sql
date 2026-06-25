-- Tabla de posts scrapeados por Apify (perfiles propios y referentes).
-- Se almacenan individualmente para que el Director pueda consultar
-- la voz real del usuario y aprender de sus referentes.

create table public.social_posts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  platform     text        not null,  -- 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'substack'
  account_url  text,                  -- URL del perfil scrapeado
  target       text        not null,  -- 'own' | 'referent'
  post_text    text        not null,  -- texto del post (caption, tweet, descripción...)
  post_date    text,                  -- fecha original del post (como texto, varía por red)
  engagement   jsonb       not null default '{}',  -- { likes, comments, shares, views, ... }
  raw          jsonb,                 -- item completo de Apify (por si se necesita en el futuro)
  scraped_at   timestamptz not null default now()
);

create index social_posts_user_idx
  on public.social_posts (user_id, platform, target, scraped_at desc);

-- RLS: cada usuario solo ve sus propios posts
alter table public.social_posts enable row level security;

create policy "social_posts: usuario propio"
  on public.social_posts
  for all
  using (user_id = auth.uid());

-- El webhook de Apify escribe con service role (sin sesión), así que necesita
-- una política separada. Se gestiona con el cliente service-role en el webhook.
