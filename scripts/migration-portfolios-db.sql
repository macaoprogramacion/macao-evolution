-- ============================================================
-- Migration: Portfolios Database Tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the portfolios, portfolio_photos, and portfolio_videos
-- tables so portfolio data is persisted server-side (not just localStorage).
-- ============================================================

-- 1. Create enum type (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolio_status') THEN
    CREATE TYPE portfolio_status AS ENUM ('Pendiente', 'Vendido', 'Descargado');
  END IF;
END$$;

-- 2. Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name       TEXT NOT NULL,
  phone             TEXT,
  status            portfolio_status NOT NULL DEFAULT 'Pendiente',
  commission        NUMERIC(10,2) DEFAULT 0,
  date              TEXT,
  invoice_code      TEXT,
  source            TEXT,
  turno             TEXT,
  photographer_name TEXT,
  image             TEXT,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_phone ON portfolios (phone);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios (status);
CREATE INDEX IF NOT EXISTS idx_portfolios_expires ON portfolios (expires_at);

-- 3. Create portfolio_photos table
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_photos_portfolio ON portfolio_photos (portfolio_id);

-- 4. Create portfolio_videos table
CREATE TABLE IF NOT EXISTS portfolio_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_videos_portfolio ON portfolio_videos (portfolio_id);

-- 5. Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_videos ENABLE ROW LEVEL SECURITY;

-- 6. Public read access (clients need to see their gallery)
CREATE POLICY "Public read portfolios"
  ON portfolios FOR SELECT
  USING (true);

CREATE POLICY "Public read portfolio_photos"
  ON portfolio_photos FOR SELECT
  USING (true);

CREATE POLICY "Public read portfolio_videos"
  ON portfolio_videos FOR SELECT
  USING (true);

-- 7. Allow inserts (photographer uploads via anon key)
CREATE POLICY "Allow insert portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert portfolio_photos"
  ON portfolio_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert portfolio_videos"
  ON portfolio_videos FOR INSERT
  WITH CHECK (true);

-- 8. Allow updates (status changes, etc.)
CREATE POLICY "Allow update portfolios"
  ON portfolios FOR UPDATE
  USING (true);

-- 9. Allow deletes (portfolio cleanup)
CREATE POLICY "Allow delete portfolios"
  ON portfolios FOR DELETE
  USING (true);

CREATE POLICY "Allow delete portfolio_photos"
  ON portfolio_photos FOR DELETE
  USING (true);

CREATE POLICY "Allow delete portfolio_videos"
  ON portfolio_videos FOR DELETE
  USING (true);
