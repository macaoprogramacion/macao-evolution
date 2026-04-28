-- Migration: photography sales events + daily closures + invoice redemption fields

DO $$
BEGIN
  IF to_regclass('public.photo_invoices') IS NOT NULL THEN
    ALTER TABLE public.photo_invoices
      ADD COLUMN IF NOT EXISTS redeemed BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
  ELSE
    RAISE NOTICE 'Table public.photo_invoices does not exist yet. Skipping redeemed columns.';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.photo_invoices') IS NOT NULL THEN
    EXECUTE '
      CREATE TABLE IF NOT EXISTS public.photo_sales_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL CHECK (event_type IN (''online_purchase'', ''download'', ''invoice_redeemed'')),
        phone TEXT,
        client_name TEXT,
        invoice_number TEXT,
        plan_name TEXT,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT ''USD'',
        source TEXT,
        metadata JSONB NOT NULL DEFAULT ''{}''::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_photo_sales_events_invoice
          FOREIGN KEY (invoice_number)
          REFERENCES public.photo_invoices(invoice_number)
      )
    ';
  ELSE
    EXECUTE '
      CREATE TABLE IF NOT EXISTS public.photo_sales_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL CHECK (event_type IN (''online_purchase'', ''download'', ''invoice_redeemed'')),
        phone TEXT,
        client_name TEXT,
        invoice_number TEXT,
        plan_name TEXT,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT ''USD'',
        source TEXT,
        metadata JSONB NOT NULL DEFAULT ''{}''::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.photo_invoices') IS NOT NULL
     AND to_regclass('public.photo_sales_events') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_photo_sales_events_invoice'
     ) THEN
    ALTER TABLE public.photo_sales_events
      ADD CONSTRAINT fk_photo_sales_events_invoice
      FOREIGN KEY (invoice_number)
      REFERENCES public.photo_invoices(invoice_number);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.photo_daily_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_date DATE NOT NULL UNIQUE,
  closed_by TEXT,
  total_invoices INTEGER NOT NULL DEFAULT 0,
  by_currency JSONB NOT NULL DEFAULT '{}'::jsonb,
  disable_tax_after_close BOOLEAN NOT NULL DEFAULT true,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.photo_sales_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_daily_closures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'photo_sales_events'
      AND policyname = 'Allow full access photo_sales_events'
  ) THEN
    CREATE POLICY "Allow full access photo_sales_events"
      ON public.photo_sales_events
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'photo_daily_closures'
      AND policyname = 'Allow full access photo_daily_closures'
  ) THEN
    CREATE POLICY "Allow full access photo_daily_closures"
      ON public.photo_daily_closures
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_photo_sales_events_created_at ON public.photo_sales_events(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_sales_events_type ON public.photo_sales_events(event_type);
CREATE INDEX IF NOT EXISTS idx_photo_sales_events_invoice ON public.photo_sales_events(invoice_number);
CREATE INDEX IF NOT EXISTS idx_photo_daily_closures_date ON public.photo_daily_closures(closure_date);
