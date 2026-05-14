-- Migration: Create billing records table (Cobros y Facturación)
-- Purpose: Persist billing records, payments, and direct sales from operations dashboard

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

-- Index for searching by date and status
CREATE INDEX IF NOT EXISTS idx_billing_records_date_status ON billing_records(date, status);
CREATE INDEX IF NOT EXISTS idx_billing_records_client_phone ON billing_records(phone);

-- Enable RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin and contabilidad can view all records
CREATE POLICY "billing_records_view_admin_contabilidad" ON billing_records
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'both', 'contabilidad')
    )
    OR auth.jwt() ->> 'email' LIKE '%jonathan%'
  );

-- RLS Policy: Admin and contabilidad can insert
CREATE POLICY "billing_records_insert_admin_contabilidad" ON billing_records
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'both', 'contabilidad', 'operaciones')
    )
    OR auth.jwt() ->> 'email' LIKE '%jonathan%'
  );

-- RLS Policy: Admin and contabilidad can update
CREATE POLICY "billing_records_update_admin_contabilidad" ON billing_records
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'both', 'contabilidad', 'operaciones')
    )
    OR auth.jwt() ->> 'email' LIKE '%jonathan%'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'both', 'contabilidad', 'operaciones')
    )
    OR auth.jwt() ->> 'email' LIKE '%jonathan%'
  );

-- RLS Policy: Admin and contabilidad can delete
CREATE POLICY "billing_records_delete_admin_contabilidad" ON billing_records
  FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'both', 'contabilidad', 'operaciones')
    )
    OR auth.jwt() ->> 'email' LIKE '%jonathan%'
  );
