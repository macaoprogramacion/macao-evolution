-- =====================================================================
-- GYG Webhook Request Log
-- Stores all incoming GYG Supplier API requests for:
--   1. Audit trail
--   2. Automatic retry of failed bookings
--   3. Debugging & monitoring
-- =====================================================================

CREATE TABLE IF NOT EXISTS gyg_webhook_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint            TEXT NOT NULL,           -- 'reserve', 'book', 'cancel-booking', etc.
  method              TEXT NOT NULL DEFAULT 'POST',
  request_body        JSONB,                   -- Raw request body from GYG
  response_body       JSONB,                   -- What we returned
  processing_status   TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | success | failed | retried
  error_message       TEXT,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  product_id          TEXT,                    -- Extracted for quick filtering
  gyg_booking_ref     TEXT,                    -- Extracted for quick lookup
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gyg_webhook_log_status ON gyg_webhook_log (processing_status);
CREATE INDEX IF NOT EXISTS idx_gyg_webhook_log_created ON gyg_webhook_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gyg_webhook_log_booking_ref ON gyg_webhook_log (gyg_booking_ref);
CREATE INDEX IF NOT EXISTS idx_gyg_webhook_log_endpoint ON gyg_webhook_log (endpoint);

ALTER TABLE gyg_webhook_log DISABLE ROW LEVEL SECURITY;
GRANT ALL ON gyg_webhook_log TO anon, authenticated, service_role;
