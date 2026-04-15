-- ============================================================
-- Fix: Update product image URLs in Supabase
-- The image URLs had .png extension but actual files are .webp
-- Also fix any %20 encoding (should be plain spaces for storage)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Fix image column: .png → .webp and decode %20
UPDATE products
SET image = REPLACE(REPLACE(image, '.png', '.webp'), '%20', ' ')
WHERE image LIKE '%productos%';

-- Fix gallery arrays: .png → .webp and decode %20
UPDATE products
SET gallery = (
  SELECT jsonb_agg(
    REPLACE(REPLACE(elem::text, '.png', '.webp'), '%20', ' ')::jsonb
  )
  FROM jsonb_array_elements(gallery) AS elem
)
WHERE gallery IS NOT NULL AND jsonb_array_length(gallery) > 0;
