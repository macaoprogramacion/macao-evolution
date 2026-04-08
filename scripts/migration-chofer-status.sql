-- ══════════════════════════════════════════════════════════════════
-- Migración: Agregar chofer_status a reservations
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Crear el tipo enum
DO $$ BEGIN
  CREATE TYPE chofer_status AS ENUM ('none', 'recibida', 'confirmada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Agregar columna a la tabla reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS chofer_status chofer_status NOT NULL DEFAULT 'none';

-- 3. Actualizar función get_chofer_reservations para incluir chofer_status
CREATE OR REPLACE FUNCTION get_chofer_reservations(p_chofer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO result
  FROM (
    SELECT
      r.id,
      r.customer_name,
      r.phone,
      r.email,
      r.hotel,
      r.location,
      r.timeslot,
      r.guests,
      r.children,
      r.pickup_time,
      r.pickup_point,
      r.transport_type,
      r.experience,
      r.channel,
      r.date,
      r.status,
      r.chofer_status,
      r.assigned_chofer_name,
      r.assigned_at
    FROM reservations r
    WHERE r.assigned_chofer_id = p_chofer_id
    ORDER BY r.date, r.pickup_time
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear función para que el chofer actualice su estado
CREATE OR REPLACE FUNCTION update_chofer_status(
  p_reservation_id UUID,
  p_chofer_status chofer_status
)
RETURNS reservations AS $$
DECLARE
  result reservations;
BEGIN
  UPDATE reservations
     SET chofer_status = p_chofer_status,
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
