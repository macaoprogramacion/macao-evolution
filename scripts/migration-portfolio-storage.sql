-- ============================================================
-- Migration: Create Supabase Storage bucket for portfolio media
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create the storage bucket (public so clients can download)
--    20GB limit for high-quality videos, restricted MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  21474836480,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','video/mp4','video/quicktime','video/x-msvideo','video/webm','video/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','video/mp4','video/quicktime','video/x-msvideo','video/webm','video/mpeg'];

-- 2. Allow anyone to read/download files (public bucket)
CREATE POLICY "Public read access on portfolio-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-media');

-- 3. Allow authenticated and anonymous users to upload files
--    (photographers use the anon key from the client)
CREATE POLICY "Allow uploads to portfolio-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-media');

-- 4. Allow file updates (upsert for avatar, etc.)
CREATE POLICY "Allow updates on portfolio-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolio-media');

-- 5. Allow file deletion (for portfolio cleanup)
CREATE POLICY "Allow deletes on portfolio-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-media');
