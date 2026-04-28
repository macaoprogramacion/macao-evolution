-- Customer app state and reservation persistence
-- Run this in Supabase SQL editor.

create table if not exists public.customer_app_state (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  state_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_app_state_owner_key_unique unique (owner_email, state_key)
);

create index if not exists customer_app_state_owner_email_idx
  on public.customer_app_state (owner_email);

create table if not exists public.customer_reservations_app (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  reservation_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_reservations_app_owner_reservation_unique unique (owner_email, reservation_id)
);

create index if not exists customer_reservations_app_owner_email_idx
  on public.customer_reservations_app (owner_email);

alter table public.customer_app_state enable row level security;
alter table public.customer_reservations_app enable row level security;

-- Temporary permissive policies for anon-key frontend usage.
-- Replace with strict auth policies when Supabase Auth is enabled.
drop policy if exists "customer_app_state_select_all" on public.customer_app_state;
create policy "customer_app_state_select_all"
  on public.customer_app_state
  for select
  using (true);

drop policy if exists "customer_app_state_insert_all" on public.customer_app_state;
create policy "customer_app_state_insert_all"
  on public.customer_app_state
  for insert
  with check (true);

drop policy if exists "customer_app_state_update_all" on public.customer_app_state;
create policy "customer_app_state_update_all"
  on public.customer_app_state
  for update
  using (true)
  with check (true);

drop policy if exists "customer_app_state_delete_all" on public.customer_app_state;
create policy "customer_app_state_delete_all"
  on public.customer_app_state
  for delete
  using (true);

drop policy if exists "customer_reservations_app_select_all" on public.customer_reservations_app;
create policy "customer_reservations_app_select_all"
  on public.customer_reservations_app
  for select
  using (true);

drop policy if exists "customer_reservations_app_insert_all" on public.customer_reservations_app;
create policy "customer_reservations_app_insert_all"
  on public.customer_reservations_app
  for insert
  with check (true);

drop policy if exists "customer_reservations_app_update_all" on public.customer_reservations_app;
create policy "customer_reservations_app_update_all"
  on public.customer_reservations_app
  for update
  using (true)
  with check (true);

drop policy if exists "customer_reservations_app_delete_all" on public.customer_reservations_app;
create policy "customer_reservations_app_delete_all"
  on public.customer_reservations_app
  for delete
  using (true);
