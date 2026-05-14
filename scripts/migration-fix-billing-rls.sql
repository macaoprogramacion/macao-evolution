-- Fix billing_records RLS policies to avoid auth.users dependency and allow dashboard usage

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
