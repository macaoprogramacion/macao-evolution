-- Migration: photo_saved_payments
-- Stores the last card used by a client (by phone) for one-click repurchase in the gallery.
-- IMPORTANT: Only cardholder name, last 4 digits, and expiry are stored. Full card number and CVC are NEVER stored.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS photo_saved_payments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone       text        NOT NULL UNIQUE,
  cardholder_name text    NOT NULL,
  last4       text        NOT NULL,
  exp         text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Allow public read/write (same pattern as other photo tables)
ALTER TABLE photo_saved_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access_photo_saved_payments"
  ON photo_saved_payments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
