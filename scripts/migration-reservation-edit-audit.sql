-- Audit metadata for reservation edits across operation modules.
-- Safe to run multiple times.

alter table if exists reservations
  add column if not exists is_edited boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edit_reason text;

alter table if exists samana_reservations
  add column if not exists is_edited boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edit_reason text;

alter table if exists saona_reservations
  add column if not exists is_edited boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edit_reason text;

create index if not exists idx_reservations_edited_at on reservations (edited_at desc);
create index if not exists idx_samana_reservations_edited_at on samana_reservations (edited_at desc);
create index if not exists idx_saona_reservations_edited_at on saona_reservations (edited_at desc);
