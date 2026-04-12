-- ══════════════════════════════════════════════════════════════════
-- Migracion: Tablas photo_invoices y photo_returns
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── Facturas de fotografia ──
CREATE TABLE IF NOT EXISTS photo_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  client_name     TEXT NOT NULL DEFAULT 'Cliente General',
  client_phone    TEXT,
  turno           TEXT,
  photographer    TEXT,
  source          TEXT DEFAULT 'billing',
  date            TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',      -- USD | EUR | DOP
  status          TEXT NOT NULL DEFAULT 'active',   -- active | cancelled
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Devoluciones / cancelaciones ──
CREATE TABLE IF NOT EXISTS photo_returns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL REFERENCES photo_invoices(invoice_number),
  client_name     TEXT,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | aprobada | rechazada
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE photo_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_returns  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access photo_invoices" ON photo_invoices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access photo_returns" ON photo_returns
  FOR ALL USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_photo_invoices_date ON photo_invoices(date);
CREATE INDEX IF NOT EXISTS idx_photo_invoices_turno ON photo_invoices(turno);
CREATE INDEX IF NOT EXISTS idx_photo_invoices_status ON photo_invoices(status);
CREATE INDEX IF NOT EXISTS idx_photo_returns_invoice ON photo_returns(invoice_number);
