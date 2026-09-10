-- ちょこっと整体 予約システム 初期スキーマ
-- Supabase の SQL Editor で実行するか、CLI で apply する。
-- RLS を有効にし、anon / authenticated 向けポリシーは置かない。
-- 読み書きは Next.js サーバ（service role）からのみ行う。

create table public.events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  slot_minutes integer not null check (slot_minutes > 0),
  break_minutes integer not null check (break_minutes >= 0),
  public_token text not null unique,
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (end_time > start_time)
);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  sort_index integer not null,
  unique (event_id, starts_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  company_name text not null,
  guest_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index bookings_one_per_slot
  on public.bookings (slot_id)
  where cancelled_at is null;

create unique index bookings_one_email_per_event
  on public.bookings (event_id, email)
  where cancelled_at is null;

create index events_date_start_idx on public.events (date desc, start_time desc);
create index slots_event_sort_idx on public.slots (event_id, sort_index);
create index bookings_event_active_idx
  on public.bookings (event_id)
  where cancelled_at is null;

alter table public.events enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;
