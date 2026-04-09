
create extension if not exists pgcrypto;

create table if not exists global_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  created_at timestamptz default now()
);

create unique index if not exists global_workouts_user_label_unique
on global_workouts (user_id, lower(label));

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day date not null,
  groups text[] default '{}',
  planned text[] default '{}',
  completed text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day)
);

alter table global_workouts enable row level security;
alter table plans enable row level security;

drop policy if exists "users can read own global_workouts" on global_workouts;
drop policy if exists "users can insert own global_workouts" on global_workouts;
drop policy if exists "users can update own global_workouts" on global_workouts;
drop policy if exists "users can delete own global_workouts" on global_workouts;

create policy "users can read own global_workouts"
on global_workouts for select to authenticated
using (auth.uid() = user_id);

create policy "users can insert own global_workouts"
on global_workouts for insert to authenticated
with check (auth.uid() = user_id);

create policy "users can update own global_workouts"
on global_workouts for update to authenticated
using (auth.uid() = user_id);

create policy "users can delete own global_workouts"
on global_workouts for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can read own plans" on plans;
drop policy if exists "users can insert own plans" on plans;
drop policy if exists "users can update own plans" on plans;
drop policy if exists "users can delete own plans" on plans;

create policy "users can read own plans"
on plans for select to authenticated
using (auth.uid() = user_id);

create policy "users can insert own plans"
on plans for insert to authenticated
with check (auth.uid() = user_id);

create policy "users can update own plans"
on plans for update to authenticated
using (auth.uid() = user_id);

create policy "users can delete own plans"
on plans for delete to authenticated
using (auth.uid() = user_id);
