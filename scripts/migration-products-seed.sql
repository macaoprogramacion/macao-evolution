-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘  MIGRACIÃ“N: Seed de productos en tabla products                        â•‘
-- â•‘  Ejecutar en SQL Editor de Supabase                                    â•‘
-- â•‘  Nota: La tabla products ya debe existir (supabase-schema.sql)         â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Si la tabla aÃºn no existe, descomenta las siguientes lÃ­neas:
-- CREATE TABLE IF NOT EXISTS products (
--   id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   slug              TEXT UNIQUE NOT NULL,
--   title             TEXT NOT NULL,
--   description       TEXT,
--   capacity          TEXT,
--   image             TEXT,
--   price             NUMERIC(10,2) NOT NULL DEFAULT 0,
--   original_price    NUMERIC(10,2),
--   has_discount      BOOLEAN DEFAULT FALSE,
--   discount_percent  NUMERIC(5,2) DEFAULT 0,
--   duration          TEXT,
--   highlights        JSONB DEFAULT '[]',
--   gallery           JSONB DEFAULT '[]',
--   itinerary         JSONB DEFAULT '[]',
--   general_info      JSONB DEFAULT '{}',
--   category          TEXT,
--   website           TEXT,
--   website_label     TEXT,
--   website_color     TEXT,
--   active            BOOLEAN NOT NULL DEFAULT TRUE,
--   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
-- CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Trigger para actualizar updated_at automÃ¡ticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Limpia datos existentes (si los hay)
DELETE FROM products;

-- â”€â”€â”€ PRODUCTO 1: Elite Couple Experience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'elite-couple-experience',
  'Elite Couple Experience',
  'Couple',
  '2 people',
  '/images/productos/producto (3).webp',
  160.00,
  NULL,
  FALSE,
  0,
  '4 hours',
  '["Premium buggy for couples", "Private guide experience", "All stops included", "Photo opportunities at every location"]',
  '["/images/productos/producto (3).webp", "/images/Buggies/buggie (1).webp", "/images/Buggies/buggie (3).webp", "/images/paradas/columna (1).webp", "/images/paradas/columna (2).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana''s vibrant streets and lush landscapes as you head to the ranch baseâ€”no stops, just great sights."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Get geared up with safety instructions and helmet fitting before your buggy adventure. Our team ensures you''re confident and ready to ride."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming and savor authentic local products. Enjoy a unique experience as local artisans handcraft coffee, chocolate, cigars, and much more right before your eyes."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach, known for its white sands, turquoise waters, and peaceful vibeâ€”perfect for relaxing or snapping photos."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters and mystical cave formations.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience. Every splash and turn adds to the thrill!"}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time. You will be emailed the pickup location and time within 24 hours of booking. Please contact us the day before your tour if the information provided is unclear. Please wait outside the hotel 5 minutes before the pickup time, as the bus cannot park and wait."}',
  'Elite',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 2: Elite Family Experience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'elite-family-experience',
  'Elite Family Experience',
  'FROM 3 TO 4 PEOPLE',
  '3-4 people',
  '/images/productos/producto (4).webp',
  200.00,
  NULL,
  FALSE,
  0,
  '4 hours',
  '["Spacious buggy for families", "Kid-friendly adventure", "All stops included", "Memorable family experience"]',
  '["/images/productos/producto (4).webp", "/images/Buggies/buggie (2).webp", "/images/Buggies/buggie (4).webp", "/images/paradas/columna (3).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana''s vibrant streets and lush landscapes as you head to the ranch baseâ€”no stops, just great sights."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Get geared up with safety instructions and helmet fitting before your buggy adventure. Our team ensures you''re confident and ready to ride."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming and savor authentic local products."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach, known for its white sands, turquoise waters, and peaceful vibeâ€”perfect for relaxing or snapping photos."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters and mystical cave formations.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience. Every splash and turn adds to the thrill!"}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time. You will be emailed the pickup location and time within 24 hours of booking. Please contact us the day before your tour if the information provided is unclear. Please wait outside the hotel 5 minutes before the pickup time, as the bus cannot park and wait."}',
  'Elite',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 3: Apex Predactor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'apex-predactor',
  'APEX PREDACTOR',
  'COUPLE',
  '2 people',
  '/images/productos/producto (1).webp',
  130.00,
  NULL,
  FALSE,
  0,
  '4 hours',
  '["High-performance buggy", "Adrenaline-packed trails", "All stops included", "Perfect for adventurous couples"]',
  '["/images/productos/producto (1).webp", "/images/Buggies/buggie (5).webp", "/images/Buggies/buggie (6).webp", "/images/paradas/columna (1).webp", "/images/paradas/columna (3).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana''s vibrant streets and lush landscapes as you head to the ranch base."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Get geared up with safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming and savor authentic local products."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach for relaxing or snapping photos."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters and mystical cave formations.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time."}',
  'Adventure',
  'caribebuggy',
  'Caribe Buggy',
  '#3b82f6',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 4: Predatory Family Experience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO products (slug, title, description, capacity, image, price, original_price, has_discount, discount_percent, duration, highlights, gallery, itinerary, general_info, category, website, website_label, website_color, active)
VALUES (
  'predatory-family-experience',
  'PREDATORY FAMILY EXPERIENCE',
  'FROM 3 TO 4 PEOPLE',
  '3-4 people',
  '/images/productos/producto (2).webp',
  145.00,
  NULL,
  FALSE,
  0,
  '4 hours',
  '["Family-sized high-performance buggy", "Thrilling trails for the whole family", "All stops included", "Unforgettable family bonding"]',
  '["/images/productos/producto (2).webp", "/images/Buggies/buggie (7).webp", "/images/Buggies/buggie (8).webp", "/images/paradas/columna (2).webp", "/images/paradas/columna (4).webp"]',
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Get geared up with safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming and savor authentic local products."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads for an exciting buggy experience."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'Adventure',
  'caribebuggy',
  'Caribe Buggy',
  '#3b82f6',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 5: Flintstone Era â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'Nature',
  'saonaisland',
  'Saona Island',
  '#10b981',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 6: The Flintstones Family â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your buggy adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride your buggy to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Buggy Adventure","duration":"65 mins driving","description":"Drive through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'Nature',
  'saonaisland',
  'Saona Island',
  '#10b981',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 7: ATV Quad Experience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"ATV Quad Adventure","duration":"65 mins driving","description":"Ride through muddy trails, jungle paths, and open roads on your ATV quad."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'ATV',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 8: The Combined â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and helmet fitting before your adventure."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Combined Buggy & ATV Adventure","duration":"65 mins driving","description":"Experience both buggy and ATV through muddy trails, jungle paths, and open roads."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'Combo',
  'caribebuggy',
  'Caribe Buggy',
  '#3b82f6',
  TRUE
);

-- â”€â”€â”€ PRODUCTO 9: Full Ride Experience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  '[{"title":"Pick-Up & City Tour","duration":"1.5 hrs","description":"Begin your adventure with a scenic city tour in an open-air Safari truck."},{"title":"Ranch Base Briefing","duration":"30 mins","description":"Safety instructions and equipment fitting before your ride."},{"title":"Typical Dominican House Visit","duration":"20 mins","description":"Experience authentic local culture in a peaceful rural setting.","details":["Coffee, Cocoa & Tobacco â€” Explore the roots of traditional farming."]},{"title":"Macao Beach Stop","duration":"20 mins","description":"Ride to the stunning Macao Beach."},{"title":"Cueva TaÃ­na â€” Cenote Cave","duration":"20 mins","description":"Explore a jungle cenote with crystal-clear waters.","details":["Swim in the refreshing natural pool."]},{"title":"Full Ride Adventure","duration":"65 mins","description":"Enjoy the complete riding experience through scenic trails and countryside paths."}]',
  '{"minAge":"Children must be 4 years old or above to participate, and drivers must be 18 years old or older.","notAllowed":"Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.","freeCancellation":"Cancel up to 24 hours in advance and receive a full refund.","bookNowPayLater":"Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.","duration":"4 hours","guide":"English, French, Portuguese, Spanish, Italian, German, Russian","pickupService":"Pickup is available from hotels in Punta Cana, BÃ¡varo, Uvero Alto, and Cabeza de Toro."}',
  'Ride',
  'macaooffroad',
  'Macao Off Road',
  '#dc2626',
  TRUE
);

-- Habilitar RLS en products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pÃºblica (para la web)
CREATE POLICY "Allow public read on products" ON products
  FOR SELECT USING (true);

-- Permitir escritura solo para usuarios autenticados (admin)
CREATE POLICY "Allow authenticated write on products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
