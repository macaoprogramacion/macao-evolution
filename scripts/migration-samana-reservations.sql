-- ══════════════════════════════════════════════════════════════════
-- Migración: Tabla samana_reservations
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS samana_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name   TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  hotel           TEXT,
  location        TEXT,
  guests          INT DEFAULT 1,
  children        INT DEFAULT 0,
  pickup_time     TEXT,
  tour_type       TEXT DEFAULT 'full_day',        -- full_day | half_day | whale_only | cayo_levantado
  lunch_included  BOOLEAN DEFAULT TRUE,
  whale_watching  BOOLEAN DEFAULT FALSE,
  channel         TEXT,
  channel_url     TEXT,
  channel_color   TEXT DEFAULT '#6b7280',
  date            DATE NOT NULL,
  status          TEXT DEFAULT 'pending',          -- pending | confirmed | cancelled | completed
  amount          NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE samana_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for authenticated users" ON samana_reservations
  FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_samana_reservations_date ON samana_reservations(date);
CREATE INDEX IF NOT EXISTS idx_samana_reservations_status ON samana_reservations(status);
