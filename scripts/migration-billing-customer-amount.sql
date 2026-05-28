-- Migration: add optional customer_amount to billing_records
-- Purpose: track how much the client pays in office for seller credit sales.
-- Re-runnable: safe to execute multiple times.

ALTER TABLE IF EXISTS public.billing_records
  ADD COLUMN IF NOT EXISTS customer_amount NUMERIC;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'billing_records'
      AND column_name = 'customer_amount'
  ) THEN
    EXECUTE 'ALTER TABLE public.billing_records DROP CONSTRAINT IF EXISTS billing_records_customer_amount_non_negative';
    EXECUTE 'ALTER TABLE public.billing_records ADD CONSTRAINT billing_records_customer_amount_non_negative CHECK (customer_amount IS NULL OR customer_amount >= 0)';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_billing_records_customer_amount
  ON public.billing_records(customer_amount)
  WHERE customer_amount IS NOT NULL;

NOTIFY pgrst, 'reload schema';

SELECT
  to_regclass('public.billing_records') AS billing_records_table,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'billing_records'
      AND column_name = 'customer_amount'
  ) AS has_customer_amount_column;
