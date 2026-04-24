-- Migration: manual availability overrides for GYG products
-- Purpose: allow admin portal to block dates or set custom daily vacancies

CREATE TABLE IF NOT EXISTS gyg_availability_overrides (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       TEXT NOT NULL,
  date             DATE NOT NULL,
  manual_vacancies INT,
  is_blocked       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT gyg_availability_overrides_manual_vacancies_non_negative
    CHECK (manual_vacancies IS NULL OR manual_vacancies >= 0),
  CONSTRAINT gyg_availability_overrides_unique_product_date
    UNIQUE (product_id, date)
);

CREATE INDEX IF NOT EXISTS idx_gyg_availability_overrides_product_date
  ON gyg_availability_overrides(product_id, date);

ALTER TABLE gyg_availability_overrides DISABLE ROW LEVEL SECURITY;
GRANT ALL ON gyg_availability_overrides TO anon, authenticated, service_role;
