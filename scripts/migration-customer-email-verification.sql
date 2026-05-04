-- Customer email verification (6-digit code)

create table if not exists customer_email_verifications (
  account_id   uuid primary key references customer_accounts(id) on delete cascade,
  code_hash    text not null,
  expires_at   timestamptz not null,
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists customer_email_verifications_expires_idx
  on customer_email_verifications (expires_at);

alter table customer_email_verifications enable row level security;

drop policy if exists customer_email_verifications_public_select on customer_email_verifications;
drop policy if exists customer_email_verifications_public_insert on customer_email_verifications;
drop policy if exists customer_email_verifications_public_update on customer_email_verifications;

create policy customer_email_verifications_public_select on customer_email_verifications
for select using (true);

create policy customer_email_verifications_public_insert on customer_email_verifications
for insert with check (true);

create policy customer_email_verifications_public_update on customer_email_verifications
for update using (true) with check (true);
