-- ============================================================
-- Theme Intakes — client intake link system
-- Run this in Supabase → SQL Editor
-- ============================================================

create table if not exists theme_intakes (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users(id) on delete cascade not null,
  client_name  text        not null,
  token        uuid        not null default gen_random_uuid() unique,
  completed    boolean     not null default false,
  theme_id     uuid        references themes(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists theme_intakes_token_idx   on theme_intakes(token);
create index if not exists theme_intakes_user_id_idx on theme_intakes(user_id);

-- RLS: editors can create and read their own intakes
alter table theme_intakes enable row level security;

drop policy if exists "Users can insert own intakes" on theme_intakes;
create policy "Users can insert own intakes"
  on theme_intakes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own intakes" on theme_intakes;
create policy "Users can read own intakes"
  on theme_intakes for select
  using (auth.uid() = user_id);
