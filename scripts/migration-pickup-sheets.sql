-- Migration: Create pickup sheets table (Hojas de Recogida)
-- Purpose: Persist pickup sheets with their state and prevent editing after creation
-- Re-runnable: safe to execute multiple times in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.pickup_sheets (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('8 AM', '11 AM', '3 PM', 'all')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked', 'printed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  locked_at TIMESTAMP,
  printed_at TIMESTAMP,
  created_by TEXT,
  notes TEXT
);

-- Index for searching by date and turno
CREATE INDEX IF NOT EXISTS idx_pickup_sheets_date_turno ON public.pickup_sheets(date, turno);
CREATE INDEX IF NOT EXISTS idx_pickup_sheets_status ON public.pickup_sheets(status);

-- Table to store individual pickup rows within a sheet
CREATE TABLE IF NOT EXISTS public.pickup_sheet_rows (
  id TEXT PRIMARY KEY,
  sheet_id TEXT NOT NULL REFERENCES public.pickup_sheets(id) ON DELETE CASCADE,
  pickup_time TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  hotel TEXT NOT NULL,
  room TEXT,
  agency TEXT,
  pax INTEGER DEFAULT 0,
  notes TEXT,
  is_ghost BOOLEAN DEFAULT FALSE,
  ghost_hotel_random TEXT,
  ghost_name_random TEXT,
  -- Can store UUID reservation ids and non-UUID external/billing ids.
  reservation_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sheet_id, customer_name, hotel)
);

-- Backward compatibility: if a previous version created an FK to reservations(id), remove it.
ALTER TABLE public.pickup_sheet_rows
  DROP CONSTRAINT IF EXISTS pickup_sheet_rows_reservation_id_fkey;

-- Ensure reservation_id stays TEXT across environments.
ALTER TABLE public.pickup_sheet_rows
  ALTER COLUMN reservation_id TYPE TEXT USING reservation_id::TEXT;

-- Index for searching by sheet_id
CREATE INDEX IF NOT EXISTS idx_pickup_sheet_rows_sheet_id ON public.pickup_sheet_rows(sheet_id);
CREATE INDEX IF NOT EXISTS idx_pickup_sheet_rows_reservation ON public.pickup_sheet_rows(reservation_id);

-- Enable RLS
ALTER TABLE public.pickup_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_sheet_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_sheets
DROP POLICY IF EXISTS "pickup_sheets_view_admin" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_insert_admin" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_update_draft_only" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_delete_admin" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_select_policy" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_insert_policy" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_update_draft_policy" ON public.pickup_sheets;
DROP POLICY IF EXISTS "pickup_sheets_delete_draft_policy" ON public.pickup_sheets;

-- Dashboard uses app-side session, not Supabase Auth role claims.
-- Keep policies runtime-safe (no dependency on auth.users).
CREATE POLICY "pickup_sheets_select_policy" ON public.pickup_sheets
  FOR SELECT
  USING (true);

CREATE POLICY "pickup_sheets_insert_policy" ON public.pickup_sheets
  FOR INSERT
  WITH CHECK (true);

-- Can only update if status is still draft
CREATE POLICY "pickup_sheets_update_draft_policy" ON public.pickup_sheets
  FOR UPDATE
  USING (status = 'draft')
  WITH CHECK (status IN ('draft', 'locked', 'printed'));

CREATE POLICY "pickup_sheets_delete_draft_policy" ON public.pickup_sheets
  FOR DELETE
  USING (status = 'draft');

-- RLS Policies for pickup_sheet_rows
DROP POLICY IF EXISTS "pickup_sheet_rows_view_admin" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_insert_admin" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_update_draft_only" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_delete_admin" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_select_policy" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_insert_policy" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_update_draft_policy" ON public.pickup_sheet_rows;
DROP POLICY IF EXISTS "pickup_sheet_rows_delete_draft_policy" ON public.pickup_sheet_rows;

CREATE POLICY "pickup_sheet_rows_select_policy" ON public.pickup_sheet_rows
  FOR SELECT
  USING (true);

CREATE POLICY "pickup_sheet_rows_insert_policy" ON public.pickup_sheet_rows
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pickup_sheets ps
      WHERE ps.id = sheet_id
      AND ps.status = 'draft'
    )
  );

-- Can only update rows if the parent sheet status is still draft
CREATE POLICY "pickup_sheet_rows_update_draft_policy" ON public.pickup_sheet_rows
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pickup_sheets ps
      WHERE ps.id = sheet_id
      AND ps.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pickup_sheets ps
      WHERE ps.id = sheet_id
      AND ps.status = 'draft'
    )
  );

CREATE POLICY "pickup_sheet_rows_delete_draft_policy" ON public.pickup_sheet_rows
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pickup_sheets ps
      WHERE ps.id = sheet_id
      AND ps.status = 'draft'
    )
  );

-- Grants help environments where table privileges are not inherited as expected.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pickup_sheets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pickup_sheet_rows TO anon, authenticated;

-- Force PostgREST to refresh schema cache so the new tables become visible immediately.
NOTIFY pgrst, 'reload schema';

-- Sanity check for SQL editor output.
SELECT to_regclass('public.pickup_sheets') AS pickup_sheets_table,
       to_regclass('public.pickup_sheet_rows') AS pickup_sheet_rows_table;
