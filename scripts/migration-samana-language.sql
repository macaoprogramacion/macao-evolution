-- Migration: Add language column to samana_reservations
-- This column stores the client's preferred language for tickets and messages
ALTER TABLE samana_reservations
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
