-- ============================================================
-- Migration: Create Supabase Storage bucket for portfolio media
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create the storage bucket (public so clients can download)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to read/download files (public bucket)
CREATE POLICY "Public read access on portfolio-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-media');

-- 3. Allow authenticated and anonymous users to upload files
--    (photographers use the anon key from the client)
CREATE POLICY "Allow uploads to portfolio-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-media');

-- 4. Allow file deletion (for portfolio cleanup)
CREATE POLICY "Allow deletes on portfolio-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-media');
