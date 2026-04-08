-- ============================================================================
-- MACAO EVOLUTION — MIGRACIÓN: Operaciones + Chofer Dashboard
-- ============================================================================
-- Ejecuta este SQL si ya tienes el esquema anterior y solo necesitas
-- agregar las nuevas columnas y funciones para el flujo de
-- operaciones → enviar a chofer.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. NUEVO ENUM: Punto de recogida                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pickup_point_type') THEN
    CREATE TYPE pickup_point_type AS ENUM ('lobby', 'barrera');
  END IF;
END$$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. NUEVAS COLUMNAS en tabla reservations                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Columnas de asignación a chofer
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS assigned_chofer_id UUID REFERENCES dashboard_users(id),
  ADD COLUMN IF NOT EXISTS assigned_chofer_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Columnas extra de la reserva
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS children INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_point pickup_point_type DEFAULT 'lobby',
  ADD COLUMN IF NOT EXISTS channel_url TEXT,
  ADD COLUMN IF NOT EXISTS channel_color TEXT;

-- Índice para buscar reservas por chofer
CREATE INDEX IF NOT EXISTS idx_reservations_chofer
  ON reservations (assigned_chofer_id)
  WHERE assigned_chofer_id IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. FUNCIONES RPC                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Cambiar estado de reserva (Pendiente → Confirmada) ─────────────
CREATE OR REPLACE FUNCTION update_reservation_status(
  p_reservation_id UUID,
  p_status reservation_status
)
RETURNS reservations AS $$
DECLARE
  result reservations;
BEGIN
  UPDATE reservations
     SET status = p_status,
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Asignar reserva a un chofer ────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_reservation_to_chofer(
  p_reservation_id UUID,
  p_chofer_id UUID
)
RETURNS reservations AS $$
DECLARE
  result reservations;
  chofer_name TEXT;
BEGIN
  SELECT name INTO chofer_name
    FROM dashboard_users
   WHERE id = p_chofer_id AND role = 'chofer' AND active = TRUE;

  IF chofer_name IS NULL THEN
    RAISE EXCEPTION 'Chofer no encontrado o inactivo';
  END IF;

  UPDATE reservations
     SET assigned_chofer_id = p_chofer_id,
         assigned_chofer_name = chofer_name,
         assigned_at = NOW(),
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Obtener reservas asignadas a un chofer ─────────────────────────
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
      r.assigned_at
    FROM reservations r
    WHERE r.assigned_chofer_id = p_chofer_id
    ORDER BY r.date, r.pickup_time
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Obtener choferes activos con conteo de reservas del día ────────
CREATE OR REPLACE FUNCTION get_active_choferes()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', du.id,
    'name', du.name,
    'phone', du.phone,
    'assigned_count', (
      SELECT COUNT(*)
      FROM reservations r
      WHERE r.assigned_chofer_id = du.id
        AND r.date = CURRENT_DATE
    )
  )), '[]'::JSON) INTO result
  FROM dashboard_users du
  WHERE du.role = 'chofer' AND du.active = TRUE
  ORDER BY du.name;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Estadísticas del día para operaciones ──────────────────────────
CREATE OR REPLACE FUNCTION get_operation_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM reservations WHERE date = p_date),
    'confirmed', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND status = 'confirmed'),
    'pending', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND status = 'pending'),
    'assigned', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND assigned_chofer_id IS NOT NULL),
    'totalGuests', (SELECT COALESCE(SUM(guests), 0) FROM reservations WHERE date = p_date),
    'totalChildren', (SELECT COALESCE(SUM(children), 0) FROM reservations WHERE date = p_date)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. VISTAS ACTUALIZADAS                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Vista: Operaciones con info del chofer
DROP VIEW IF EXISTS operations_summary;
CREATE OR REPLACE VIEW operations_summary AS
SELECT
  r.*,
  CASE
    WHEN r.status = 'confirmed' THEN 'Confirmada'
    WHEN r.status = 'pending' THEN 'Pendiente'
    WHEN r.status = 'in_progress' THEN 'En Progreso'
    WHEN r.status = 'completed' THEN 'Completada'
    WHEN r.status = 'cancelled' THEN 'Cancelada'
  END AS status_label,
  CASE
    WHEN r.assigned_chofer_id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS is_assigned,
  du.name AS chofer_name,
  du.phone AS chofer_phone
FROM reservations r
LEFT JOIN dashboard_users du ON du.id = r.assigned_chofer_id
ORDER BY r.date DESC, r.pickup_time;

-- Vista: Reservas de un chofer
DROP VIEW IF EXISTS chofer_reservations;
CREATE OR REPLACE VIEW chofer_reservations AS
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
  r.assigned_chofer_id,
  r.assigned_chofer_name,
  r.assigned_at
FROM reservations r
WHERE r.assigned_chofer_id IS NOT NULL
ORDER BY r.date, r.pickup_time;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. SEED: Usuarios chofer de ejemplo                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Solo ejecutar si no tienes choferes aún:
-- INSERT INTO dashboard_users (id, name, email, phone, pin, role, active) VALUES
--   (uuid_generate_v4(), 'Juan Pérez',     'juan@macaoevolution.com',  '+1 809-555-7001', '111111', 'chofer', TRUE),
--   (uuid_generate_v4(), 'Pedro Martínez', 'pedro@macaoevolution.com', '+1 809-555-7002', '222222', 'chofer', TRUE);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  FIN DE MIGRACIÓN                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
