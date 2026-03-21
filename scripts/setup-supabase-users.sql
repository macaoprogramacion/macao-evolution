-- ============================================================
-- MACAO EVOLUTION — Tabla dashboard_users para Supabase
-- ============================================================
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tabla anterior si existe (para recrearla limpia)
DROP TABLE IF EXISTS dashboard_users CASCADE;

-- Crear tabla de usuarios del dashboard
CREATE TABLE dashboard_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  pin         TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'billing',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dashboard_users_email ON dashboard_users (email) WHERE active = TRUE;
CREATE INDEX idx_dashboard_users_role ON dashboard_users (role);
CREATE INDEX idx_dashboard_users_active ON dashboard_users (active);

-- RLS con acceso completo
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access" ON dashboard_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insertar usuario admin maestro
INSERT INTO dashboard_users (name, email, phone, pin, role, active)
VALUES ('Jonathan', 'jonathan@macaooffroad.com', '+1 809-000-0000', '000000', 'admin', true);
