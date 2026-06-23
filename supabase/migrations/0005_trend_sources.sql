-- Demiurgos — fuentes de tendencias en tiempo real para el Trend Analyst.
-- Config (enable/provider/fuentes) en settings, editable desde /admin.
-- El SECRETO (key del proveedor) va en env: TRENDS_API_KEY (no en BD).

alter table public.settings
  add column if not exists trends_enabled boolean not null default false,
  add column if not exists trends_provider text not null default 'trendsmcp',
  add column if not exists trends_sources text not null
    default 'TikTok Trending Hashtags,YouTube Trending,Google Trends,Reddit Hot Posts';
