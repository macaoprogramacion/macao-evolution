-- Backfill for edited reservation amount audit tags.
-- Purpose:
-- 1) Ensure rows that already have edit evidence are flagged as edited.
-- 2) Fill missing [EDIT_AMOUNT_BEFORE]/[EDIT_AMOUNT_AFTER] tags in notes.
--
-- Important:
-- Historical previous amounts are not recoverable from current schema,
-- so fallback uses current amount for both before/after.
-- This keeps accounting analytics complete and avoids null gaps.
-- Safe to run multiple times.

-- =========================
-- BUGGY (reservations)
-- =========================

update reservations
set is_edited = true
where coalesce(is_edited, false) = false
  and (
    coalesce(edit_reason, '') <> ''
    or coalesce(notes, '') like '%[EDIT_REASON]:%'
    or edited_at is not null
  );

update reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_BEFORE]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_BEFORE]:%';

update reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_AFTER]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_AFTER]:%';

-- =========================
-- SAONA (saona_reservations)
-- =========================

update saona_reservations
set is_edited = true
where coalesce(is_edited, false) = false
  and (
    coalesce(edit_reason, '') <> ''
    or coalesce(notes, '') like '%[EDIT_REASON]:%'
    or edited_at is not null
  );

update saona_reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_BEFORE]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_BEFORE]:%';

update saona_reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_AFTER]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_AFTER]:%';

-- =========================
-- SAMANA (samana_reservations)
-- =========================

update samana_reservations
set is_edited = true
where coalesce(is_edited, false) = false
  and (
    coalesce(edit_reason, '') <> ''
    or coalesce(notes, '') like '%[EDIT_REASON]:%'
    or edited_at is not null
  );

update samana_reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_BEFORE]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_BEFORE]:%';

update samana_reservations
set notes = trim(both E'\n' from (
  coalesce(notes, '')
  || case when coalesce(notes, '') = '' then '' else E'\n' end
  || '[EDIT_AMOUNT_AFTER]: ' || coalesce(amount, 0)::text
))
where (
  coalesce(is_edited, false) = true
  or coalesce(edit_reason, '') <> ''
  or coalesce(notes, '') like '%[EDIT_REASON]:%'
)
  and coalesce(notes, '') not like '%[EDIT_AMOUNT_AFTER]:%';
