-- Migration: Add avatar_url column to dashboard_users
ALTER TABLE dashboard_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
