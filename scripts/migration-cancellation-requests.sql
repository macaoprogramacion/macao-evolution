-- ============================================================================
-- MACAO EVOLUTION — MIGRACION: Bandeja central de solicitudes de cancelacion
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservation_cancellation_requests (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('buggy', 'saona', 'samana')),
  reservation_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  accounting_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cancel_request_operation_reservation
  ON reservation_cancellation_requests (operation_type, reservation_id);

CREATE INDEX IF NOT EXISTS idx_cancel_request_status_date
  ON reservation_cancellation_requests (status, requested_at DESC);

CREATE OR REPLACE FUNCTION set_reservation_cancellation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_cancellation_requests_updated_at ON reservation_cancellation_requests;
CREATE TRIGGER trg_reservation_cancellation_requests_updated_at
BEFORE UPDATE ON reservation_cancellation_requests
FOR EACH ROW
EXECUTE FUNCTION set_reservation_cancellation_requests_updated_at();

ALTER TABLE reservation_cancellation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservation_cancellation_requests_select_all ON reservation_cancellation_requests;
CREATE POLICY reservation_cancellation_requests_select_all
ON reservation_cancellation_requests
FOR SELECT
USING (true);

DROP POLICY IF EXISTS reservation_cancellation_requests_insert_all ON reservation_cancellation_requests;
CREATE POLICY reservation_cancellation_requests_insert_all
ON reservation_cancellation_requests
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS reservation_cancellation_requests_update_all ON reservation_cancellation_requests;
CREATE POLICY reservation_cancellation_requests_update_all
ON reservation_cancellation_requests
FOR UPDATE
USING (true)
WITH CHECK (true);
