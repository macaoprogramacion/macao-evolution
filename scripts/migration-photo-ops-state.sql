-- Migration: activity log and cashier-to-photographer client buffer

create table if not exists public.photo_activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists photo_activity_log_created_at_idx
  on public.photo_activity_log (created_at desc);

create table if not exists public.photo_billing_clients (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  phone text,
  invoice_number text,
  source text,
  turno text,
  photographer_name text,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists photo_billing_clients_created_at_idx
  on public.photo_billing_clients (created_at desc);

alter table public.photo_activity_log enable row level security;
alter table public.photo_billing_clients enable row level security;

drop policy if exists "photo_activity_log_select_all" on public.photo_activity_log;
create policy "photo_activity_log_select_all"
  on public.photo_activity_log
  for select
  using (true);

drop policy if exists "photo_activity_log_modify_all" on public.photo_activity_log;
create policy "photo_activity_log_modify_all"
  on public.photo_activity_log
  for all
  using (true)
  with check (true);

drop policy if exists "photo_billing_clients_select_all" on public.photo_billing_clients;
create policy "photo_billing_clients_select_all"
  on public.photo_billing_clients
  for select
  using (true);

drop policy if exists "photo_billing_clients_modify_all" on public.photo_billing_clients;
create policy "photo_billing_clients_modify_all"
  on public.photo_billing_clients
  for all
  using (true)
  with check (true);
