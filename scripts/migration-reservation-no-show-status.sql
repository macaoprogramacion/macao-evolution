-- Migration: Add no_show status to reservation_status enum
-- Execute in Supabase SQL editor

ALTER TYPE reservation_status
  ADD VALUE IF NOT EXISTS 'no_show';
