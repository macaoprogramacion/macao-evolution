-- Customer accounts and saved checkout profile

create table if not exists customer_accounts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  phone          text not null default '',
  email          text not null,
  password_hash  text not null,
  role           text not null check (role in ('cliente', 'representante')),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists customer_accounts_email_role_uniq
  on customer_accounts (lower(email), role);

create index if not exists customer_accounts_active_idx
  on customer_accounts (active);

create table if not exists customer_profiles (
  account_id            uuid primary key references customer_accounts(id) on delete cascade,
  full_name             text,
  phone                 text,
  last_payment_option   text check (last_payment_option in ('full', 'partial')),
  last_payment_method   text check (last_payment_method in ('card', 'paypal')),
  card_number           text,
  card_expiry           text,
  card_cvc              text,
  card_last4            text,
  card_holder_name      text,
  pickup_mode           text check (pickup_mode in ('hotel', 'custom')),
  pickup_hotel          text,
  pickup_custom         text,
  updated_at            timestamptz not null default now()
);

alter table customer_accounts enable row level security;
alter table customer_profiles enable row level security;

drop policy if exists customer_accounts_public_select on customer_accounts;
drop policy if exists customer_accounts_public_insert on customer_accounts;
drop policy if exists customer_profiles_public_select on customer_profiles;
drop policy if exists customer_profiles_public_upsert on customer_profiles;

create policy customer_accounts_public_select on customer_accounts
for select using (true);

create policy customer_accounts_public_insert on customer_accounts
for insert with check (true);

create policy customer_profiles_public_select on customer_profiles
for select using (true);

create policy customer_profiles_public_upsert on customer_profiles
for insert with check (true);

create policy customer_profiles_public_update on customer_profiles
for update using (true) with check (true);
