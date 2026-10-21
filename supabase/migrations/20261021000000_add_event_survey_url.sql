-- 開催ごとの施術後アンケートURL
alter table public.events
  add column survey_url text;
