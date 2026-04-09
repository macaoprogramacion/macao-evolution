-- ══════════════════════════════════════════════════════════════════
-- Migración: Tabla saona_reservations
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saona_reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  hotel         TEXT,
  location      TEXT,
  guests        INT DEFAULT 1,
  children      INT DEFAULT 0,
  pickup_time   TEXT,
  boat_type     TEXT DEFAULT 'catamaran',       -- catamaran | speedboat
  lunch_included BOOLEAN DEFAULT TRUE,
  drink_package TEXT DEFAULT 'standard',        -- standard | premium | none
  channel       TEXT,
  channel_url   TEXT,
  channel_color TEXT DEFAULT '#6b7280',
  date          DATE NOT NULL,
  status        TEXT DEFAULT 'pending',         -- pending | confirmed | cancelled | completed
  amount        NUMERIC(10,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE saona_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for authenticated users" ON saona_reservations
  FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saona_reservations_date ON saona_reservations(date);
CREATE INDEX IF NOT EXISTS idx_saona_reservations_status ON saona_reservations(status);
