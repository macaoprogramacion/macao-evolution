-- Migration: create centralized exchange rates for photography billing

create table if not exists public.photo_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null unique,
  rate_to_dop numeric(12,4) not null default 0,
  active boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.photo_exchange_rates (currency_code, rate_to_dop, active, updated_by)
values
  ('USD', 60.0000, true, 'seed'),
  ('EUR', 65.0000, true, 'seed')
on conflict (currency_code) do update
set rate_to_dop = excluded.rate_to_dop,
    active = true,
    updated_at = now();

alter table public.photo_exchange_rates enable row level security;

drop policy if exists "photo_exchange_rates_select_all" on public.photo_exchange_rates;
create policy "photo_exchange_rates_select_all"
  on public.photo_exchange_rates
  for select
  using (true);

drop policy if exists "photo_exchange_rates_modify_all" on public.photo_exchange_rates;
create policy "photo_exchange_rates_modify_all"
  on public.photo_exchange_rates
  for all
  using (true)
  with check (true);

create or replace function public.update_photo_exchange_rates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists photo_exchange_rates_updated_at on public.photo_exchange_rates;
create trigger photo_exchange_rates_updated_at
before update on public.photo_exchange_rates
for each row execute function public.update_photo_exchange_rates_updated_at();
