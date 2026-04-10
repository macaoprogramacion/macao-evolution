-- =====================================================================
-- GYG (GetYourGuide) Integration Tables
-- Adds reservation hold tracking for the GYG Supplier API flow:
--   reserve → book → cancel
-- The final bookings land in saona_reservations or samana_reservations
-- consumed by admin/operation-saona and admin/operation-samana.
-- =====================================================================

-- ─── PREREQUISITE: Ensure destination tables exist ──────────────────────────

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
  boat_type     TEXT DEFAULT 'catamaran',
  lunch_included BOOLEAN DEFAULT TRUE,
  drink_package TEXT DEFAULT 'standard',
  channel       TEXT,
  channel_url   TEXT,
  channel_color TEXT DEFAULT '#6b7280',
  date          DATE NOT NULL,
  status        TEXT DEFAULT 'pending',
  amount        NUMERIC(10,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saona_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON saona_reservations;
CREATE POLICY "Allow full access for authenticated users" ON saona_reservations
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_saona_reservations_date ON saona_reservations(date);
CREATE INDEX IF NOT EXISTS idx_saona_reservations_status ON saona_reservations(status);

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
  tour_type       TEXT DEFAULT 'full_day',
  lunch_included  BOOLEAN DEFAULT TRUE,
  whale_watching  BOOLEAN DEFAULT FALSE,
  channel         TEXT,
  channel_url     TEXT,
  channel_color   TEXT DEFAULT '#6b7280',
  date            DATE NOT NULL,
  status          TEXT DEFAULT 'pending',
  amount          NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE samana_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON samana_reservations;
CREATE POLICY "Allow full access for authenticated users" ON samana_reservations
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_samana_reservations_date ON samana_reservations(date);
CREATE INDEX IF NOT EXISTS idx_samana_reservations_status ON samana_reservations(status);

-- ─── GYG TABLES ─────────────────────────────────────────────────────────────

-- Tracks GYG reservations (holds) before they become confirmed bookings.
-- A reservation expires after the hold time if not converted to a booking.
CREATE TABLE IF NOT EXISTS gyg_reservations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          TEXT NOT NULL,
  gyg_booking_ref     TEXT NOT NULL,
  gyg_activity_ref    TEXT,
  date_time           TIMESTAMPTZ NOT NULL,
  booking_items       JSONB NOT NULL DEFAULT '[]',
  total_participants  INT NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active',  -- active | cancelled | booked | expired
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gyg_reservations_status ON gyg_reservations(status);
CREATE INDEX IF NOT EXISTS idx_gyg_reservations_gyg_ref ON gyg_reservations(gyg_booking_ref);
CREATE INDEX IF NOT EXISTS idx_gyg_reservations_expires ON gyg_reservations(expires_at);

-- Disable RLS on GYG tables (auth handled at API level)
ALTER TABLE gyg_reservations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON gyg_reservations TO anon, authenticated, service_role;

-- Tracks confirmed GYG bookings with their reference mapping.
-- Links to the destination reservation table (saona or samana).
CREATE TABLE IF NOT EXISTS gyg_bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id        UUID REFERENCES gyg_reservations(id),
  saona_reservation_id  UUID,  -- points to saona_reservations or samana_reservations depending on product
  product_id            TEXT NOT NULL,
  gyg_booking_ref       TEXT NOT NULL,
  gyg_activity_ref      TEXT,
  booking_reference     TEXT NOT NULL UNIQUE, -- our reference sent back to GYG (max 25 chars)
  date_time             TIMESTAMPTZ NOT NULL,
  currency              TEXT DEFAULT 'USD',
  booking_items         JSONB NOT NULL DEFAULT '[]',
  addon_items           JSONB DEFAULT '[]',
  travelers             JSONB NOT NULL DEFAULT '[]',
  traveler_hotel        TEXT,
  comment               TEXT,
  language              TEXT,
  tickets               JSONB DEFAULT '[]',
  total_participants    INT NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gyg_bookings_ref ON gyg_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_gyg_bookings_gyg_ref ON gyg_bookings(gyg_booking_ref);
CREATE INDEX IF NOT EXISTS idx_gyg_bookings_saona ON gyg_bookings(saona_reservation_id);
CREATE INDEX IF NOT EXISTS idx_gyg_bookings_status ON gyg_bookings(status);

ALTER TABLE gyg_bookings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON gyg_bookings TO anon, authenticated, service_role;

-- Log of GYG notifications received (product deactivations, etc.)
CREATE TABLE IF NOT EXISTS gyg_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  product_id        TEXT,
  gyg_tour_option   TEXT,
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gyg_notifications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON gyg_notifications TO anon, authenticated, service_role;

-- Grant access on destination tables too
GRANT ALL ON saona_reservations TO anon, authenticated, service_role;
GRANT ALL ON samana_reservations TO anon, authenticated, service_role;

-- Add gyg columns to saona_reservations if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'saona_reservations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'saona_reservations' AND column_name = 'gyg_booking_ref'
    ) THEN
      ALTER TABLE saona_reservations ADD COLUMN gyg_booking_ref TEXT;
      ALTER TABLE saona_reservations ADD COLUMN gyg_booking_reference TEXT;
      CREATE INDEX IF NOT EXISTS idx_saona_gyg_ref ON saona_reservations(gyg_booking_ref);
    END IF;
  END IF;
END $$;

-- Add gyg columns to samana_reservations if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'samana_reservations'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'samana_reservations' AND column_name = 'gyg_booking_ref'
    ) THEN
      ALTER TABLE samana_reservations ADD COLUMN gyg_booking_ref TEXT;
      ALTER TABLE samana_reservations ADD COLUMN gyg_booking_reference TEXT;
      CREATE INDEX IF NOT EXISTS idx_samana_gyg_ref ON samana_reservations(gyg_booking_ref);
    END IF;
  END IF;
END $$;
