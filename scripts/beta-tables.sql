-- ============================================================
-- Beta Program Tables Migration
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Add analytics consent columns to profiles
alter table profiles
  add column if not exists analytics_consent boolean not null default false,
  add column if not exists analytics_consent_at timestamptz;

-- 2. beta_events — tracks how users interact with E.V.E.
create table if not exists beta_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references profiles(id) on delete cascade not null,
  event       text        not null,        -- e.g. 'page_view', 'vibe_run', 'script_edit'
  page        text,                        -- which page / route
  properties  jsonb,                       -- any extra context (script_id, theme_id, etc.)
  created_at  timestamptz not null default now()
);

create index if not exists beta_events_user_id_idx  on beta_events(user_id);
create index if not exists beta_events_event_idx    on beta_events(event);
create index if not exists beta_events_created_idx  on beta_events(created_at desc);

-- RLS: users can only insert their own events; only service role can read
alter table beta_events enable row level security;

drop policy if exists "Beta users can insert own events" on beta_events;
create policy "Beta users can insert own events"
  on beta_events for insert
  with check (auth.uid() = user_id);

-- 3. beta_reports — bugs / recommendations / errors submitted by users
create table if not exists beta_reports (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references profiles(id) on delete cascade not null,
  type        text        not null check (type in ('bug', 'plugin_error', 'recommendation', 'other')),
  description text        not null,
  page        text,                        -- what page they were on when reporting
  status      text        not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at  timestamptz not null default now()
);

create index if not exists beta_reports_user_id_idx   on beta_reports(user_id);
create index if not exists beta_reports_status_idx    on beta_reports(status);
create index if not exists beta_reports_created_idx   on beta_reports(created_at desc);

-- RLS: users can insert their own reports; only service role can read/update
alter table beta_reports enable row level security;

drop policy if exists "Beta users can insert own reports" on beta_reports;
create policy "Beta users can insert own reports"
  on beta_reports for insert
  with check (auth.uid() = user_id);
