-- Customer reservations app storage
-- Used by checkout confirmation and /reservas page

create table if not exists customer_reservations_app (
  id             uuid primary key default gen_random_uuid(),
  owner_email    text not null,
  reservation_id text not null,
  payload        jsonb not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists customer_reservations_app_owner_reservation_uniq
  on customer_reservations_app (lower(owner_email), reservation_id);

create index if not exists customer_reservations_app_owner_email_idx
  on customer_reservations_app (lower(owner_email));

create index if not exists customer_reservations_app_created_at_idx
  on customer_reservations_app (created_at desc);

alter table customer_reservations_app enable row level security;

drop policy if exists customer_reservations_app_public_select on customer_reservations_app;
drop policy if exists customer_reservations_app_public_insert on customer_reservations_app;
drop policy if exists customer_reservations_app_public_update on customer_reservations_app;

create policy customer_reservations_app_public_select on customer_reservations_app
for select using (true);

create policy customer_reservations_app_public_insert on customer_reservations_app
for insert with check (true);

create policy customer_reservations_app_public_update on customer_reservations_app
for update using (true) with check (true);