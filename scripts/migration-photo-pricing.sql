-- Migration: Create photo_pricing table for centralized photography pricing
-- Run this migration on Supabase

CREATE TABLE IF NOT EXISTS photo_pricing (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'package', -- 'package' or 'video'
  min_photos INT,   -- for gallery plan matching (null = not applicable)
  max_photos INT,   -- for gallery plan matching (null = infinity)
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default pricing (matches current hardcoded values)
INSERT INTO photo_pricing (code, name, price, description, category, min_photos, max_photos, sort_order)
VALUES
  ('PAQ-BAS', 'PAQUETE BÁSICO', 30.00, '30 fotos digitales HD', 'package', 1, 2, 1),
  ('PAQ-EST', 'PAQUETE ESTÁNDAR', 50.00, '50 fotos digitales HD + 5 editadas', 'package', 3, 4, 2),
  ('PAQ-COM', 'PAQUETE COMPLETO', 70.00, 'Todas las fotos + edición profesional', 'package', 5, NULL, 3),
  ('VID-001', 'VIDEO AVENTURA', 60.00, 'Video HD de la experiencia completa', 'video', NULL, NULL, 4)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE photo_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access (gallery needs to read prices)
CREATE POLICY "photo_pricing_public_read" ON photo_pricing
  FOR SELECT USING (true);

-- Only authenticated users can modify
CREATE POLICY "photo_pricing_auth_modify" ON photo_pricing
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_photo_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_pricing_updated_at
  BEFORE UPDATE ON photo_pricing
  FOR EACH ROW EXECUTE FUNCTION update_photo_pricing_updated_at();
