-- Migration: Add ticket_url column to photo_invoices
-- Run this in your Supabase SQL editor

ALTER TABLE photo_invoices
  ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- Create storage bucket for photo tickets (run once)
-- Note: Bucket must be created via Supabase dashboard or Storage API
-- Bucket name: photo-tickets  (public)
