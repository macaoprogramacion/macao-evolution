-- Fix billing_records RLS policies to avoid auth.users dependency and allow dashboard usage
-- This migration is resilient: it creates the table if it does not exist.

CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('pago_al_llegar', 'credito_vendedor', 'venta_directa')),
  client_name TEXT NOT NULL,
  phone TEXT,
  vendor_name TEXT,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'DOP', 'EUR', 'GBP')),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('tarjeta', 'paypal', 'efectivo')),
  courtesy BOOLEAN DEFAULT FALSE,
  service_type TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'cancelado')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_records_date_status ON billing_records(date, status);
CREATE INDEX IF NOT EXISTS idx_billing_records_client_phone ON billing_records(phone);

ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_records_view_admin_contabilidad" ON billing_records;
DROP POLICY IF EXISTS "billing_records_insert_admin_contabilidad" ON billing_records;
DROP POLICY IF EXISTS "billing_records_update_admin_contabilidad" ON billing_records;
DROP POLICY IF EXISTS "billing_records_delete_admin_contabilidad" ON billing_records;

-- Dashboard currently uses custom session (not Supabase Auth), so allow authenticated and anon for app runtime.
CREATE POLICY "billing_records_select_policy" ON billing_records
  FOR SELECT
  USING (true);

CREATE POLICY "billing_records_insert_policy" ON billing_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "billing_records_update_policy" ON billing_records
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "billing_records_delete_policy" ON billing_records
  FOR DELETE
  USING (true);
