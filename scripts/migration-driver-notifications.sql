-- Create driver_notifications table for sending billing/payment info to drivers
CREATE TABLE IF NOT EXISTS driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
  billing_record_id UUID NOT NULL REFERENCES billing_records(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'payment_received', -- 'payment_received', 'credit_issued', 'direct_sale'
  client_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  service_type VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'acknowledged'
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_billing_record_id ON driver_notifications(billing_record_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_status ON driver_notifications(status);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_created_at ON driver_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drivers can see notifications sent to them
CREATE POLICY "drivers_view_own_notifications" ON driver_notifications
  FOR SELECT
  USING (
    auth.uid()::text = driver_id::text OR
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE id = driver_id AND auth.uid()::text = id::text
    )
  );

-- Admin/contabilidad can insert notifications
CREATE POLICY "admin_insert_notifications" ON driver_notifications
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('admin', 'contabilidad', 'operaciones')
  );

-- Drivers can update their own acknowledgments
CREATE POLICY "drivers_update_own_acknowledgments" ON driver_notifications
  FOR UPDATE
  USING (
    auth.uid()::text = driver_id::text OR
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE id = driver_id AND auth.uid()::text = id::text
    )
  )
  WITH CHECK (
    auth.uid()::text = driver_id::text OR
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE id = driver_id AND auth.uid()::text = id::text
    )
  );

-- Admin can view all notifications
CREATE POLICY "admin_view_all_notifications" ON driver_notifications
  FOR SELECT
  USING (
    auth.jwt() ->> 'user_role' IN ('admin', 'contabilidad', 'operaciones')
  );
