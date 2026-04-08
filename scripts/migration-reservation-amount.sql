-- ══════════════════════════════════════════════════════════════════
-- Migración: Agregar columna amount a reservations
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
