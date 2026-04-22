-- Migration: Update Full Ride Experience product gallery with new horseback images
-- Date: 2026-04-22
-- Description: Updates the gallery images for product 9 (Full Ride Experience) with new horseback riding photos

UPDATE products
SET
  image = '/images/productos/horseback-full-main.webp',
  gallery = jsonb_build_array(
    '/images/productos/horseback-full-main.webp',
    '/images/productos/2.webp',
    '/images/productos/3.webp',
    '/images/productos/4.webp',
    '/images/productos/5.webp'
  )
WHERE slug = 'full-ride-experience'
  AND title = 'FULL RIDE EXPERIENCE';

-- Verify the update
SELECT slug, title, image, array_length(gallery, 1) as gallery_count 
FROM products 
WHERE slug = 'full-ride-experience';
