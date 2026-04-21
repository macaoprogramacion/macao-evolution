-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRACIÓN: Insertar productos faltantes (5-10)                         ║
-- ║  Usa ON CONFLICT DO NOTHING para no afectar los 4 productos existentes  ║
-- ║  Ejecutar en SQL Editor de Supabase                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── PRODUCTO 5: Flintstone Era ─────────────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'flintstone-era',
  'FLINTSTONE ERA',
  'COUPLE',
  '2 people',
  '/images/productos/producto (5).webp',
  85.00,
  100.00,
  TRUE,
  15,
  '4 hours',
  '["Classic buggy experience", "Great value for couples", "All stops included", "Fun and accessible adventure"]',
  '["/images/productos/producto (5).webp", "/images/Buggies/buggie (9).webp", "/images/Buggies/buggie (10).webp", "/images/paradas/columna (1).webp", "/images/paradas/columna (3).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco - Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach."},{"title":"Cueva Taina - Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'Nature',
  'saonaisland',
  'Saona Island',
  '#10b981',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTO 6: The Flintstones Family ────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'the-flintstones-family',
  'THE FLINTSTONES FAMILY',
  'From 3 to 4 people',
  '3-4 people',
  '/images/productos/producto (6).webp',
  100.00,
  125.00,
  TRUE,
  20,
  '4 hours',
  '["Family-sized classic buggy", "Great value for families", "All stops included", "Kid-friendly fun"]',
  '["/images/productos/producto (6).webp", "/images/Buggies/buggie (1).webp", "/images/Buggies/buggie (5).webp", "/images/paradas/columna (2).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco - Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach."},{"title":"Cueva Taina - Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'Nature',
  'saonaisland',
  'Saona Island',
  '#10b981',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTO 7: ATV Quad Experience ───────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'atv-quad-experience',
  'ATV QUAD EXPERIENCE',
  'SINGLE',
  '1 person',
  '/images/productos/producto (7).webp',
  90.00,
  110.00,
  TRUE,
  18,
  '4 hours',
  '["Solo ATV quad adventure", "Full control of your ride", "All stops included", "Ultimate solo experience"]',
  '["/images/productos/producto (7).webp", "/images/Buggies/buggie (3).webp", "/images/Buggies/buggie (6).webp", "/images/paradas/columna (1).webp", "/images/paradas/columna (2).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco - Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva Taina - Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"ATV Quad Adventure","duration":"65 mins driving","description":"Ride through muddy trails, jungle paths, and open roads on your ATV quad."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'ATV',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTO 8: The Combined ──────────────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'the-combined',
  'THE COMBINED',
  'SINGLE',
  '1 person',
  '/images/productos/producto (8).webp',
  110.00,
  130.00,
  TRUE,
  18,
  '4 hours',
  '["Buggy + ATV combo experience", "Best of both worlds", "All stops included", "Maximum adrenaline"]',
  '["/images/productos/producto (8).webp", "/images/Buggies/buggie (4).webp", "/images/Buggies/buggie (7).webp", "/images/paradas/columna (3).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco - Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva Taina - Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Combined Buggy & ATV Adventure","duration":"65 mins driving","description":"Experience both buggy and ATV through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'Combo',
  'caribebuggy',
  'Caribe Buggy',
  '#3b82f6',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTO 9: Full Ride Experience ─────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'full-ride-experience',
  'FULL RIDE EXPERIENCE',
  'SINGLE',
  '1 person',
  '/images/productos/producto (9).webp',
  60.00,
  75.00,
  TRUE,
  20,
  '4 hours',
  '["Complete horseback riding experience", "Scenic trails through nature", "All stops included", "Accessible for beginners"]',
  '["/images/productos/producto (9).webp", "/images/Buggies/buggie (8).webp", "/images/Buggies/buggie (2).webp", "/images/paradas/columna (1).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and equipment fitting before your ride."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco - Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva Taina - Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Full Ride Adventure","duration":"65 mins","description":"Enjoy the complete riding experience through scenic trails and countryside paths."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'Ride',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTO 10: Sunset Ride ──────────────────────────────────────────────
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'sunset-ride',
  'SUNSET RIDE',
  'SINGLE',
  '1 person',
  '/images/productos/producto (8).webp',
  70.00,
  85.00,
  TRUE,
  18,
  '4 hours',
  '["Golden-hour horseback route", "Sunset views on scenic trails", "Cultural stop and beach photo stop", "Ideal for couples and solo riders"]',
  '["/images/productos/producto (8).webp", "/images/Buggies/buggie (3).webp", "/images/paradas/columna (2).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and equipment fitting before your ride."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting."},{"title":"Sunset Trail Ride","duration":"65 mins","description":"Ride through countryside paths timed with sunset light for a premium nature experience."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, Bavaro, Uvero Alto, and Cabeza de Toro."}',
  'Ride',
  'caribebuggy',
  'Caribe Buggy',
  '#3b82f6',
  TRUE
) ON CONFLICT (slug) DO NOTHING;
