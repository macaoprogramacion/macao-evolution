-- Migration: chofer_incidents table
-- Records customer-reported driver no-show incidents

create table if not exists chofer_incidents (
  id             bigserial primary key,
  reservation_id text        not null,
  customer_name  text        not null,
  customer_email text        not null,
  customer_phone text        not null default '',
  pickup_location text       not null default '',
  pickup_date    text        not null default '',
  pickup_time    text        not null default '',
  items_summary  text        not null default '',
  reported_at    timestamptz not null default now()
);

create index if not exists chofer_incidents_reported_at_idx on chofer_incidents (reported_at desc);
create index if not exists chofer_incidents_reservation_idx on chofer_incidents (reservation_id);

-- RLS: allow inserts from authenticated and anonymous clients (public report)
alter table chofer_incidents enable row level security;

create policy "allow_insert_incidents" on chofer_incidents
  for insert with check (true);

create policy "allow_admin_select_incidents" on chofer_incidents
  for select using (true);
