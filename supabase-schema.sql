-- ============================================================================
-- MACAO EVOLUTION — ESQUEMA COMPLETO PARA SUPABASE
-- ============================================================================
-- Pega este SQL completo en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- Se creará todo: tablas, índices, enums, triggers, RLS y seed data.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  0. EXTENSIONES                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. TIPOS ENUM                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Roles de usuario del dashboard
CREATE TYPE user_role AS ENUM ('billing', 'photographer', 'both', 'admin', 'operaciones', 'chofer', 'contabilidad');

-- Estado de portfolio del fotógrafo
CREATE TYPE portfolio_status AS ENUM ('Pendiente', 'Vendido', 'Descargado');

-- Estado de devoluciones
CREATE TYPE return_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'procesada');

-- Tipo de representante / vendedor
CREATE TYPE rep_type AS ENUM ('tour_operator', 'local_seller', 'hotel_concierge', 'agency');

-- Estado de reservación
CREATE TYPE booking_status AS ENUM ('confirmed', 'pending', 'completed', 'cancelled');

-- Estado de miembro del equipo
CREATE TYPE team_member_status AS ENUM ('active', 'inactive', 'vacation');

-- Posición del miembro del equipo
CREATE TYPE team_position AS ENUM ('photographer', 'driver', 'guide', 'admin', 'cashier', 'manager');

-- Estado de workflow
CREATE TYPE workflow_status AS ENUM ('active', 'paused', 'draft');

-- Tipo de item en carrito
CREATE TYPE cart_item_type AS ENUM ('service', 'product');

-- Estado de reservación operativa
CREATE TYPE reservation_status AS ENUM ('confirmed', 'pending', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Estado de confirmación del chofer
CREATE TYPE chofer_status AS ENUM ('none', 'recibida', 'confirmada');

-- Canal de reservación
CREATE TYPE reservation_channel AS ENUM ('website', 'whatsapp', 'phone', 'walk_in', 'seller', 'ota');

-- Tipo de transporte
CREATE TYPE transport_type AS ENUM ('included', 'self', 'hotel_shuttle');

-- Punto de recogida
CREATE TYPE pickup_point_type AS ENUM ('lobby', 'barrera');


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. TABLAS — USUARIOS DEL DASHBOARD                                     ║
-- ║  Página: /admin/users                                                   ║
-- ║  Funciones: getDashboardUsers, addDashboardUser, updateDashboardUser,   ║
-- ║             deleteDashboardUser, authenticateDashboardUser               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE dashboard_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  pin         TEXT NOT NULL,               -- PIN numérico 6 dígitos para login
  role        user_role NOT NULL DEFAULT 'billing',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_dashboard_users_pin ON dashboard_users (pin) WHERE active = TRUE;
CREATE INDEX idx_dashboard_users_role ON dashboard_users (role);
CREATE INDEX idx_dashboard_users_active ON dashboard_users (active);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. TABLAS — PRODUCTOS / CATÁLOGO                                       ║
-- ║  Páginas: /product/[slug], /admin/products                              ║
-- ║  Funciones: getProductBySlug, CRUD admin products                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  capacity          TEXT,                 -- Ej: "2 people"
  image             TEXT,                 -- URL imagen principal
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price    NUMERIC(10,2),        -- Precio antes de descuento
  has_discount      BOOLEAN DEFAULT FALSE,
  discount_percent  NUMERIC(5,2) DEFAULT 0,
  duration          TEXT,                 -- Ej: "4 hours"
  highlights        JSONB DEFAULT '[]',   -- Array de strings
  gallery           JSONB DEFAULT '[]',   -- Array de URLs
  itinerary         JSONB DEFAULT '[]',   -- Array de {title, duration, description, details?}
  general_info      JSONB DEFAULT '{}',   -- {minAge, notAllowed, freeCancellation, ...}
  category          TEXT,                 -- Categoría admin (Buggies, ATV, etc.)
  website           TEXT,                 -- Sitio web asociado
  website_label     TEXT,
  website_color     TEXT,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products (slug);
CREATE INDEX idx_products_active ON products (active);
CREATE INDEX idx_products_category ON products (category);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. TABLAS — FACTURAS / INVOICES                                        ║
-- ║  Páginas: /photographer/billing, /photographer/finances,                ║
-- ║           /photographer/gallery, /admin/analytics                       ║
-- ║  Funciones: getInvoices, addInvoice, findInvoiceByNumber,               ║
-- ║             findInvoicesByPhone, markInvoiceRedeemed,                    ║
-- ║             calculateFinanceStats, calculateSalesByTurno                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE NOT NULL,      -- Ej: "FAC-0001"
  client_name     TEXT,
  client_phone    TEXT,
  turno           TEXT,                      -- "Primer Turno", "Segundo Turno", "Tercer Turno"
  photographer    TEXT,                      -- Nombre del fotógrafo encargado
  items           JSONB NOT NULL DEFAULT '[]',  -- [{name, price, quantity}]
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  source          TEXT,                      -- "billing", "online", etc.
  redeemed        BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_at     TIMESTAMPTZ,
  date            TEXT,                      -- Fecha original como string
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_invoices_number ON invoices (invoice_number);
CREATE INDEX idx_invoices_phone ON invoices (client_phone);
CREATE INDEX idx_invoices_date ON invoices (timestamp);
CREATE INDEX idx_invoices_turno ON invoices (turno);
CREATE INDEX idx_invoices_redeemed ON invoices (redeemed);

-- Contador secuencial para números de factura
CREATE TABLE invoice_counter (
  id      INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Solo 1 fila
  counter INT NOT NULL DEFAULT 0
);

INSERT INTO invoice_counter (id, counter) VALUES (1, 0);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. TABLAS — CLIENTES DE BILLING                                        ║
-- ║  Página: /photographer/billing → /photographer/dashboard                 ║
-- ║  Funciones: getBillingClients, addBillingClient                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE billing_clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  phone           TEXT,
  turno           TEXT,
  photographer    TEXT,
  invoice_number  TEXT REFERENCES invoices(invoice_number),
  total           NUMERIC(10,2) DEFAULT 0,
  date            TEXT,
  photos_ready    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_clients_phone ON billing_clients (phone);
CREATE INDEX idx_billing_clients_invoice ON billing_clients (invoice_number);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. TABLAS — PORTFOLIOS DEL FOTÓGRAFO                                   ║
-- ║  Páginas: /photographer/dashboard, /photographer/clients,               ║
-- ║           /photographer/portfolios, /photographer/gallery               ║
-- ║  Funciones (PortfolioContext): addPortfolio, deletePortfolio,           ║
-- ║    updatePortfolio, addPhotosToPortfolio, deletePhotosFromPortfolio,    ║
-- ║    addVideoToPortfolio, deleteVideoFromPortfolio, findByPhone           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE portfolios (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name       TEXT NOT NULL,
  phone             TEXT,
  status            portfolio_status NOT NULL DEFAULT 'Pendiente',
  commission        NUMERIC(10,2) DEFAULT 0,
  date              TEXT,
  invoice_code      TEXT,
  source            TEXT,                   -- "billing", "manual", etc.
  turno             TEXT,
  photographer_name TEXT,
  image             TEXT,                   -- Thumbnail/cover image
  expires_at        TIMESTAMPTZ,            -- 30 días después de creación
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_phone ON portfolios (phone);
CREATE INDEX idx_portfolios_status ON portfolios (status);
CREATE INDEX idx_portfolios_expires ON portfolios (expires_at);

-- Fotos del portfolio (antes era un objeto {portfolioId: [url1, url2, ...]})
CREATE TABLE portfolio_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_photos_portfolio ON portfolio_photos (portfolio_id);

-- Videos del portfolio (antes era un objeto {portfolioId: url})
CREATE TABLE portfolio_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_videos_portfolio ON portfolio_videos (portfolio_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. TABLAS — VENTAS DE FOTOS (ONLINE)                                   ║
-- ║  Página: /photographer/gallery                                          ║
-- ║  Funciones: getPhotoSales, addPhotoSale                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE photo_sales (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT,
  client_name TEXT,
  plan        TEXT,           -- Nombre del plan seleccionado
  amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  photos      JSONB DEFAULT '[]',   -- Array de URLs de fotos seleccionadas
  source      TEXT,           -- "gallery", "billing", etc.
  date        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photo_sales_phone ON photo_sales (phone);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. TABLAS — DEVOLUCIONES / RETURNS                                     ║
-- ║  Página: /photographer/billing                                          ║
-- ║  Funciones: getReturns, addReturn, saveReturns (approve/reject)         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE returns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT,
  client_name     TEXT,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason          TEXT,
  status          return_status NOT NULL DEFAULT 'pendiente',
  date            TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_returns_status ON returns (status);
CREATE INDEX idx_returns_invoice ON returns (invoice_number);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  9. TABLAS — LOG DE ACTIVIDAD                                           ║
-- ║  Página: /photographer/billing                                          ║
-- ║  Funciones: getActivity, logActivity                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action      TEXT NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para listar las más recientes
CREATE INDEX idx_activity_log_created ON activity_log (created_at DESC);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  10. TABLAS — REPRESENTANTES / VENDEDORES                               ║
-- ║  Páginas: /sellers/*, /admin/representatives                            ║
-- ║  Funciones: getAllRepresentatives, getRepById                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE representatives (
  id                  TEXT PRIMARY KEY,        -- Ej: "REP-001"
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  company             TEXT,
  type                rep_type NOT NULL DEFAULT 'local_seller',
  hotel               TEXT,
  commission_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  initials            TEXT,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_representatives_type ON representatives (type);
CREATE INDEX idx_representatives_active ON representatives (active);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  11. TABLAS — EXPERIENCIAS (CATÁLOGO DE TOURS)                          ║
-- ║  Páginas: /sellers/dashboard/new-booking, /admin/operation              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE experiences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,           -- "Buggies", "ATV", "Horseback Ride", etc.
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experiences_category ON experiences (category);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  12. TABLAS — HOTELES                                                   ║
-- ║  Páginas: /sellers/dashboard/new-booking, /admin/operation              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE hotels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  13. TABLAS — HORARIOS DE PICKUP                                        ║
-- ║  Página: /sellers/dashboard/new-booking                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE pickup_times (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time    TEXT NOT NULL UNIQUE,     -- Ej: "7:00 AM"
  active  BOOLEAN NOT NULL DEFAULT TRUE
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  14. TABLAS — BOOKINGS (RESERVACIONES DE VENDEDORES)                    ║
-- ║  Páginas: /sellers/dashboard, /sellers/dashboard/bookings,              ║
-- ║           /sellers/dashboard/new-booking                                ║
-- ║  Funciones: getBookingsByRep, createBooking                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id          TEXT REFERENCES representatives(id),
  rep_name        TEXT,
  traveler_name   TEXT NOT NULL,
  guest_count     INT NOT NULL DEFAULT 1,
  experience      TEXT,
  pickup_time     TEXT,
  hotel           TEXT,
  sale_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_pending  NUMERIC(10,2) NOT NULL DEFAULT 0,
  date            TEXT,                     -- Fecha de la experiencia
  status          booking_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_rep ON bookings (rep_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_date ON bookings (date);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  15. TABLAS — MIEMBROS DEL EQUIPO                                       ║
-- ║  Página: /admin/team                                                    ║
-- ║  Funciones: CRUD completo (Create, Read, Update, Delete)                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  position        team_position NOT NULL DEFAULT 'photographer',
  position_label  TEXT,               -- Label legible "Fotógrafo", "Conductor", etc.
  avatar          TEXT,               -- URL del avatar
  status          team_member_status NOT NULL DEFAULT 'active',
  join_date       TEXT,               -- Fecha de ingreso
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_status ON team_members (status);
CREATE INDEX idx_team_members_position ON team_members (position);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  16. TABLAS — WORKFLOWS AUTOMATIZADOS                                   ║
-- ║  Página: /admin/workflows                                               ║
-- ║  Funciones: CRUD completo                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  status          workflow_status NOT NULL DEFAULT 'draft',
  trigger         TEXT,                   -- "daily", "on_invoice", "manual", etc.
  actions         JSONB DEFAULT '[]',     -- Array de acciones configuradas
  notifications   JSONB DEFAULT '[]',     -- Array de notificaciones
  last_run        TIMESTAMPTZ,
  next_run        TIMESTAMPTZ,
  runs            INT NOT NULL DEFAULT 0,
  success_rate    NUMERIC(5,2) DEFAULT 0,
  avg_duration    TEXT,                   -- Duración promedio
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_status ON workflows (status);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  17. TABLAS — RESERVACIONES OPERATIVAS                                  ║
-- ║  Página: /admin/operation                                               ║
-- ║  Funciones: Listar y filtrar reservaciones del día                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE reservations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name         TEXT NOT NULL,
  phone                 TEXT,
  email                 TEXT,
  hotel                 TEXT,
  location              TEXT,
  timeslot              TEXT,                   -- "8 AM", "11 AM", "3 PM"
  guests                INT NOT NULL DEFAULT 1,
  children              INT NOT NULL DEFAULT 0,
  pickup_time           TEXT,
  pickup_point          pickup_point_type DEFAULT 'lobby',
  transport_type        transport_type DEFAULT 'included',
  experience            TEXT,
  channel               reservation_channel DEFAULT 'website',
  channel_url           TEXT,                   -- URL o nombre del canal (ej: "macaooffroad.com")
  channel_color         TEXT,                   -- Color hex del canal (ej: "#dc2626")
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  status                reservation_status NOT NULL DEFAULT 'pending',
  assigned_chofer_id    UUID REFERENCES dashboard_users(id),
  assigned_chofer_name  TEXT,
  assigned_at           TIMESTAMPTZ,
  chofer_status         chofer_status NOT NULL DEFAULT 'none',
  amount                NUMERIC(10,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_date ON reservations (date);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_channel ON reservations (channel);
CREATE INDEX idx_reservations_timeslot ON reservations (timeslot);
CREATE INDEX idx_reservations_chofer ON reservations (assigned_chofer_id) WHERE assigned_chofer_id IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  18. TABLAS — CARRITO DE COMPRAS                                        ║
-- ║  Páginas: Header (cart), Checkout, /product/[slug]                      ║
-- ║  Funciones: addItem, removeItem, updateQuantity, clearCart              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE cart_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      TEXT NOT NULL,            -- ID de sesión del navegador / usuario
  product_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price  NUMERIC(10,2),
  image           TEXT,
  type            cart_item_type NOT NULL DEFAULT 'product',
  quantity        INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_session ON cart_items (session_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  19. TABLAS — CONFIGURACIÓN DEL FOTÓGRAFO                               ║
-- ║  Página: /photographer/settings                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE photographer_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES dashboard_users(id) ON DELETE CASCADE,
  business_name       TEXT,
  display_name        TEXT,
  bio                 TEXT,
  avatar_url          TEXT,
  watermark_enabled   BOOLEAN DEFAULT FALSE,
  watermark_url       TEXT,
  default_commission  NUMERIC(5,2) DEFAULT 0,
  notification_email  BOOLEAN DEFAULT TRUE,
  notification_sms    BOOLEAN DEFAULT FALSE,
  notification_push   BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  20. TRIGGER — updated_at AUTOMÁTICO                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'dashboard_users', 'products', 'portfolios', 'returns',
      'representatives', 'bookings', 'team_members', 'workflows',
      'reservations', 'cart_items', 'photographer_settings'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      tbl
    );
  END LOOP;
END;
$$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  21. ROW LEVEL SECURITY (RLS)                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Habilita RLS en todas las tablas. Ajusta las políticas según tu auth.

ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_settings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────
-- POLÍTICAS: Acceso total para usuarios autenticados (ajusta según necesidad)
-- Para producción, restringe por rol usando auth.jwt() -> role claim
-- ──────────────────────────────────────────────────────────────────────────

-- Política genérica: autenticados tienen acceso completo
-- (Cambia 'authenticated' por roles específicos en producción)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'dashboard_users', 'products', 'invoices', 'invoice_counter',
      'billing_clients', 'portfolios', 'portfolio_photos', 'portfolio_videos',
      'photo_sales', 'returns', 'activity_log', 'representatives',
      'experiences', 'hotels', 'pickup_times', 'bookings',
      'team_members', 'workflows', 'reservations', 'cart_items',
      'photographer_settings'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Allow full access for authenticated users" ON %I
       FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END;
$$;

-- Política especial: productos y experiencias son legibles por todos (público)
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON experiences FOR SELECT USING (true);
CREATE POLICY "Public read access" ON hotels FOR SELECT USING (true);
CREATE POLICY "Public read access" ON pickup_times FOR SELECT USING (true);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  22. FUNCIONES RPC — LÓGICA DE NEGOCIO                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Autenticar usuario por PIN ──────────────────────────────────────
-- Página: /photographer/billing, /photographer/dashboard (DashboardAuthGate)
CREATE OR REPLACE FUNCTION authenticate_by_pin(p_pin TEXT)
RETURNS SETOF dashboard_users AS $$
  SELECT * FROM dashboard_users WHERE pin = p_pin AND active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Obtener y avanzar contador de factura ──────────────────────────
-- Página: /photographer/billing
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_counter INT;
BEGIN
  UPDATE invoice_counter SET counter = counter + 1 WHERE id = 1
  RETURNING counter INTO new_counter;
  RETURN 'FAC-' || LPAD(new_counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Marcar factura como redimida ───────────────────────────────────
-- Página: /photographer/gallery
CREATE OR REPLACE FUNCTION redeem_invoice(p_invoice_number TEXT)
RETURNS invoices AS $$
DECLARE
  result invoices;
BEGIN
  UPDATE invoices
     SET redeemed = TRUE, redeemed_at = NOW()
   WHERE invoice_number = UPPER(TRIM(p_invoice_number))
     AND redeemed = FALSE
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Estadísticas financieras ───────────────────────────────────────
-- Páginas: /photographer/billing, /photographer/finances, /admin/analytics
CREATE OR REPLACE FUNCTION get_finance_stats(p_timezone TEXT DEFAULT 'America/Santo_Domingo')
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH stats AS (
    SELECT
      COALESCE(SUM(CASE WHEN (timestamp AT TIME ZONE p_timezone)::DATE = (NOW() AT TIME ZONE p_timezone)::DATE THEN total END), 0) AS sales_today,
      COALESCE(COUNT(CASE WHEN (timestamp AT TIME ZONE p_timezone)::DATE = (NOW() AT TIME ZONE p_timezone)::DATE THEN 1 END), 0) AS invoices_today,
      COALESCE(SUM(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN total END), 0) AS sales_week,
      COALESCE(SUM(CASE WHEN timestamp >= NOW() - INTERVAL '30 days' THEN total END), 0) AS sales_month
    FROM invoices
  ),
  return_stats AS (
    SELECT COALESCE(SUM(amount), 0) AS returns_total
    FROM returns
    WHERE status IN ('aprobada', 'procesada')
  )
  SELECT json_build_object(
    'salesToday', s.sales_today,
    'invoicesToday', s.invoices_today,
    'salesWeek', s.sales_week,
    'salesMonth', s.sales_month,
    'returnsTotal', r.returns_total,
    'ticketPromedio', CASE WHEN s.invoices_today > 0 THEN s.sales_today / s.invoices_today ELSE 0 END
  ) INTO result
  FROM stats s, return_stats r;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Ventas por turno ────────────────────────────────────────────────
-- Páginas: /photographer/billing, /photographer/finances
CREATE OR REPLACE FUNCTION get_sales_by_turno()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      COALESCE(turno, 'Primer Turno') AS shift,
      COUNT(*)::INT AS sales,
      COALESCE(SUM(total), 0)::NUMERIC(10,2) AS amount
    FROM invoices
    GROUP BY COALESCE(turno, 'Primer Turno')
    ORDER BY shift
  ) t;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Log de actividad (insertar y mantener máximo 50) ───────────────
-- Página: /photographer/billing
CREATE OR REPLACE FUNCTION log_activity(p_action TEXT, p_detail TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (action, detail) VALUES (p_action, p_detail);

  -- Mantener solo las últimas 50 entradas
  DELETE FROM activity_log
  WHERE id NOT IN (
    SELECT id FROM activity_log ORDER BY created_at DESC LIMIT 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Buscar portfolios con expiración (30 días) ─────────────────────
-- Página: /photographer/portfolios, /photographer/dashboard
CREATE OR REPLACE FUNCTION get_portfolios_with_expiration()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      p.*,
      CASE
        WHEN p.created_at + INTERVAL '30 days' > NOW() THEN TRUE
        ELSE FALSE
      END AS is_active,
      EXTRACT(DAY FROM (p.created_at + INTERVAL '30 days') - NOW())::INT AS days_remaining,
      (SELECT json_agg(json_build_object('id', ph.id, 'url', ph.url, 'sort_order', ph.sort_order))
       FROM portfolio_photos ph WHERE ph.portfolio_id = p.id) AS photos,
      (SELECT pv.url FROM portfolio_videos pv WHERE pv.portfolio_id = p.id LIMIT 1) AS video_url
    FROM portfolios p
    ORDER BY p.created_at DESC
  ) t;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Buscar facturas por teléfono ────────────────────────────────────
-- Página: /photographer/gallery
CREATE OR REPLACE FUNCTION find_invoices_by_phone(p_phone TEXT)
RETURNS SETOF invoices AS $$
  SELECT * FROM invoices
  WHERE REGEXP_REPLACE(client_phone, '\D', '', 'g') = REGEXP_REPLACE(p_phone, '\D', '', 'g')
  ORDER BY timestamp DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Dashboard de ventas por representante ──────────────────────────
-- Página: /sellers/dashboard
CREATE OR REPLACE FUNCTION get_rep_dashboard(p_rep_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'rep', (SELECT row_to_json(r) FROM representatives r WHERE r.id = p_rep_id),
    'bookings', (
      SELECT COALESCE(json_agg(row_to_json(b) ORDER BY b.created_at DESC), '[]'::JSON)
      FROM bookings b WHERE b.rep_id = p_rep_id
    ),
    'totalSales', (SELECT COALESCE(SUM(sale_price), 0) FROM bookings WHERE rep_id = p_rep_id AND status != 'cancelled'),
    'totalPending', (SELECT COALESCE(SUM(amount_pending), 0) FROM bookings WHERE rep_id = p_rep_id AND status != 'cancelled'),
    'totalBookings', (SELECT COUNT(*) FROM bookings WHERE rep_id = p_rep_id)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Cambiar estado de reserva (Pendiente → Confirmada) ─────────────
-- Página: /admin/operation
CREATE OR REPLACE FUNCTION update_reservation_status(
  p_reservation_id UUID,
  p_status reservation_status
)
RETURNS reservations AS $$
DECLARE
  result reservations;
BEGIN
  UPDATE reservations
     SET status = p_status,
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Asignar reserva a un chofer ────────────────────────────────────
-- Página: /admin/operation → modal "Enviar a Chofer"
CREATE OR REPLACE FUNCTION assign_reservation_to_chofer(
  p_reservation_id UUID,
  p_chofer_id UUID
)
RETURNS reservations AS $$
DECLARE
  result reservations;
  chofer_name TEXT;
BEGIN
  -- Obtener nombre del chofer
  SELECT name INTO chofer_name
    FROM dashboard_users
   WHERE id = p_chofer_id AND role = 'chofer' AND active = TRUE;

  IF chofer_name IS NULL THEN
    RAISE EXCEPTION 'Chofer no encontrado o inactivo';
  END IF;

  UPDATE reservations
     SET assigned_chofer_id = p_chofer_id,
         assigned_chofer_name = chofer_name,
         assigned_at = NOW(),
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Obtener reservas asignadas a un chofer ─────────────────────────
-- Página: /admin/chofer
CREATE OR REPLACE FUNCTION get_chofer_reservations(p_chofer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO result
  FROM (
    SELECT
      r.id,
      r.customer_name,
      r.phone,
      r.email,
      r.hotel,
      r.location,
      r.timeslot,
      r.guests,
      r.children,
      r.pickup_time,
      r.pickup_point,
      r.transport_type,
      r.experience,
      r.channel,
      r.date,
      r.status,
      r.chofer_status,
      r.assigned_at
    FROM reservations r
    WHERE r.assigned_chofer_id = p_chofer_id
    ORDER BY r.date, r.pickup_time
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Actualizar estado del chofer (recibida / confirmada) ───────────
-- Página: /admin/chofer
CREATE OR REPLACE FUNCTION update_chofer_status(
  p_reservation_id UUID,
  p_chofer_status chofer_status
)
RETURNS reservations AS $$
DECLARE
  result reservations;
BEGIN
  UPDATE reservations
     SET chofer_status = p_chofer_status,
         updated_at = NOW()
   WHERE id = p_reservation_id
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Obtener choferes activos ───────────────────────────────────────
-- Página: /admin/operation → modal "Enviar a Chofer"
CREATE OR REPLACE FUNCTION get_active_choferes()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', du.id,
    'name', du.name,
    'phone', du.phone,
    'assigned_count', (
      SELECT COUNT(*)
      FROM reservations r
      WHERE r.assigned_chofer_id = du.id
        AND r.date = CURRENT_DATE
    )
  )), '[]'::JSON) INTO result
  FROM dashboard_users du
  WHERE du.role = 'chofer' AND du.active = TRUE
  ORDER BY du.name;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Resumen de operación del día ───────────────────────────────────
-- Página: /admin/operation (stats cards)
CREATE OR REPLACE FUNCTION get_operation_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM reservations WHERE date = p_date),
    'confirmed', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND status = 'confirmed'),
    'pending', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND status = 'pending'),
    'assigned', (SELECT COUNT(*) FROM reservations WHERE date = p_date AND assigned_chofer_id IS NOT NULL),
    'totalGuests', (SELECT COALESCE(SUM(guests), 0) FROM reservations WHERE date = p_date),
    'totalChildren', (SELECT COALESCE(SUM(children), 0) FROM reservations WHERE date = p_date)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  23. VISTAS — CONSULTAS PRECALCULADAS                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Vista: Resumen de admin dashboard (/admin/page.tsx)
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM reservations WHERE date = CURRENT_DATE) AS reservations_today,
  (SELECT COUNT(*) FROM reservations WHERE date = CURRENT_DATE AND status = 'confirmed') AS confirmed_today,
  (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE timestamp::DATE = CURRENT_DATE) AS revenue_today,
  (SELECT COUNT(*) FROM invoices WHERE timestamp::DATE = CURRENT_DATE) AS invoices_today,
  (SELECT COUNT(*) FROM dashboard_users WHERE active = TRUE) AS active_users,
  (SELECT COUNT(*) FROM team_members WHERE status = 'active') AS active_team,
  (SELECT COUNT(*) FROM portfolios WHERE created_at::DATE = CURRENT_DATE) AS portfolios_today,
  (SELECT COUNT(*) FROM bookings WHERE created_at::DATE = CURRENT_DATE) AS bookings_today;

-- Vista: Analytics por período (/admin/analytics)
CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(timestamp) AS day,
  COUNT(*) AS total_invoices,
  SUM(total) AS total_revenue,
  AVG(total) AS avg_ticket,
  SUM(CASE WHEN turno = 'Primer Turno' THEN total ELSE 0 END) AS revenue_turno_1,
  SUM(CASE WHEN turno = 'Segundo Turno' THEN total ELSE 0 END) AS revenue_turno_2,
  SUM(CASE WHEN turno = 'Tercer Turno' THEN total ELSE 0 END) AS revenue_turno_3
FROM invoices
GROUP BY DATE(timestamp)
ORDER BY day DESC;

-- Vista: Resumen de operaciones (/admin/operation)
CREATE OR REPLACE VIEW operations_summary AS
SELECT
  r.*,
  CASE
    WHEN r.status = 'confirmed' THEN 'Confirmada'
    WHEN r.status = 'pending' THEN 'Pendiente'
    WHEN r.status = 'in_progress' THEN 'En Progreso'
    WHEN r.status = 'completed' THEN 'Completada'
    WHEN r.status = 'cancelled' THEN 'Cancelada'
  END AS status_label,
  CASE
    WHEN r.assigned_chofer_id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS is_assigned,
  du.name AS chofer_name,
  du.phone AS chofer_phone
FROM reservations r
LEFT JOIN dashboard_users du ON du.id = r.assigned_chofer_id
ORDER BY r.date DESC, r.pickup_time;

-- Vista: Reservas asignadas a un chofer (/admin/chofer)
CREATE OR REPLACE VIEW chofer_reservations AS
SELECT
  r.id,
  r.customer_name,
  r.phone,
  r.email,
  r.hotel,
  r.location,
  r.timeslot,
  r.guests,
  r.children,
  r.pickup_time,
  r.pickup_point,
  r.transport_type,
  r.experience,
  r.channel,
  r.date,
  r.status,
  r.assigned_chofer_id,
  r.assigned_chofer_name,
  r.assigned_at
FROM reservations r
WHERE r.assigned_chofer_id IS NOT NULL
ORDER BY r.date, r.pickup_time;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  24. SEED DATA — DATOS INICIALES                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Experiencias ────────────────────────────────────────────────────
INSERT INTO experiences (name, category, base_price) VALUES
  ('Elite Couple Experience',      'Buggies',         160),
  ('Elite Family Experience',      'Buggies',         200),
  ('Apex Predator',                'Buggies',         130),
  ('Predator Family Experience',   'Buggies',         145),
  ('Flintstone Era',               'Buggies',          85),
  ('The Flintstone Family',        'Buggies',         100),
  ('ATV Quad Experience',          'ATV',              90),
  ('The Combined',                 'ATV + Horseback',  90),
  ('Full Ride Experience',         'Horseback Ride',   75),
  ('Party Boat Experience',        'Party Boat',      120),
  ('Saona Island Tour',            'Saona Island',     95);

-- ── Hoteles ─────────────────────────────────────────────────────────
INSERT INTO hotels (name) VALUES
  ('Hard Rock Hotel & Casino'),
  ('Barceló Bávaro Palace'),
  ('Dreams Macao Beach'),
  ('Secrets Royal Beach'),
  ('Iberostar Grand Bávaro'),
  ('Grand Palladium Punta Cana'),
  ('Riu Palace Macao'),
  ('Bahia Principe Fantasia'),
  ('Majestic Elegance'),
  ('Lopesan Costa Bávaro'),
  ('Hyatt Zilara Cap Cana'),
  ('Club Med Punta Cana'),
  ('Paradisus Palma Real'),
  ('Excellence Punta Cana'),
  ('Breathless Punta Cana'),
  ('Occidental Caribe'),
  ('Ocean Blue & Sand'),
  ('Now Onyx Punta Cana'),
  ('Royalton Punta Cana'),
  ('Otro hotel');

-- ── Horarios de pickup ──────────────────────────────────────────────
INSERT INTO pickup_times (time) VALUES
  ('6:30 AM'), ('7:00 AM'), ('7:30 AM'), ('8:00 AM'),
  ('9:30 AM'), ('10:00 AM'), ('10:30 AM'), ('11:00 AM'),
  ('1:30 PM'), ('2:00 PM'), ('2:30 PM'), ('3:00 PM');

-- ── Representantes ──────────────────────────────────────────────────
INSERT INTO representatives (id, name, phone, email, company, type, hotel, commission_percent, initials) VALUES
  ('REP-001', 'Carlos Méndez',    '+1 809-555-1001', 'carlos.mendez@excursionesPCana.com',  'Excursiones Punta Cana', 'tour_operator',   'Hard Rock Hotel & Casino',   25, 'CM'),
  ('REP-002', 'Ana Rodríguez',     '+1 829-555-2002', 'ana.rodriguez@tropicaltours.do',      'Tropical Tours',         'agency',          NULL,                         20, 'AR'),
  ('REP-003', 'Miguel Santos',    '+1 849-555-3003', 'miguel.santos@hotelconcierge.com',    'Barceló Concierge',      'hotel_concierge', 'Barceló Bávaro Palace',      15, 'MS'),
  ('REP-004', 'Laura Vásquez',    '+1 809-555-4004', 'laura.vasquez@aventurasrd.com',       'Aventuras RD',           'local_seller',    NULL,                         30, 'LV'),
  ('REP-005', 'Pedro Jiménez',    '+1 829-555-5005', 'pedro.jimenez@caribbeansun.com',      'Caribbean Sun Tours',    'tour_operator',   'Dreams Macao Beach',         22, 'PJ');

-- ── Usuario maestro (admin) ──────────────────────────────────────────
INSERT INTO dashboard_users (id, name, email, phone, pin, role, active) VALUES
  (uuid_generate_v4(), 'Admin Master', 'admin@macaoevolution.com', '+1 809-000-0000', '000000', 'admin', TRUE);

-- ── Usuarios chofer (ejemplo) ──────────────────────────────────────
INSERT INTO dashboard_users (id, name, email, phone, pin, role, active) VALUES
  (uuid_generate_v4(), 'Juan Pérez',    'juan@macaoevolution.com',   '+1 809-555-7001', '111111', 'chofer', TRUE),
  (uuid_generate_v4(), 'Pedro Martínez', 'pedro@macaoevolution.com', '+1 809-555-7002', '222222', 'chofer', TRUE);

-- ── Usuario operaciones (ejemplo) ──────────────────────────────────
INSERT INTO dashboard_users (id, name, email, phone, pin, role, active) VALUES
  (uuid_generate_v4(), 'María López', 'maria@macaoevolution.com', '+1 809-555-8001', '333333', 'operaciones', TRUE);

-- ── Reservas de ejemplo (/admin/operation) ──────────────────────────
INSERT INTO reservations (customer_name, phone, email, hotel, location, timeslot, guests, children, pickup_time, pickup_point, experience, channel, channel_url, channel_color, date, status) VALUES
  ('John Smith',          '+1 809-555-0123', 'john.smith@email.com',       'Hard Rock Hotel & Casino', 'Punta Cana', '8 AM',  2, 0, '7:30 AM',  'lobby',   'Elite Couple',         'website', 'macaooffroad.com',          '#dc2626', CURRENT_DATE, 'pending'),
  ('María García',        '+1 829-555-0456', 'maria.garcia@email.com',     'Barceló Bávaro Palace',    'Bávaro',     '11 AM', 4, 2, '10:15 AM', 'lobby',   'Elite Family',         'ota',     'viator.com',                '#ef4444', CURRENT_DATE, 'pending'),
  ('Robert Johnson',      '+1 849-555-0789', 'r.johnson@email.com',        'Dreams Macao Beach',       'Macao',      '3 PM',  2, 0, '2:30 PM',  'barrera', 'Apex Predator',        'website', 'caribebuggy.com',           '#3b82f6', CURRENT_DATE, 'pending'),
  ('Sophie Laurent',      '+33 6-55-55-0123','sophie.laurent@email.fr',    'Royalton Punta Cana',      'Punta Cana', '8 AM',  3, 0, '7:45 AM',  'lobby',   'Flintstone Era',       'ota',     'getyourguide.com',          '#8b5cf6', CURRENT_DATE + 1, 'pending'),
  ('Carlos Rodríguez',    '+1 809-555-3456', 'carlos.r@email.com',         'Secrets Cap Cana',         'Cap Cana',   '11 AM', 2, 0, '10:30 AM', 'lobby',   'ATV QUAD',             'website', 'saonaislandpuntacana.com',  '#10b981', CURRENT_DATE + 1, 'pending'),
  ('Anna Müller',         '+49 151-555-7890','anna.mueller@email.de',      'Majestic Elegance',        'Punta Cana', '3 PM',  5, 3, '2:15 PM',  'barrera', 'Predator Family',      'website', 'macaooffroad.com',          '#dc2626', CURRENT_DATE + 1, 'pending'),
  ('James Wilson',        '+1 829-555-9012', 'j.wilson@email.com',         'Excellence Punta Cana',    'Punta Cana', '8 AM',  2, 0, '7:30 AM',  'lobby',   'THE COMBINED',         'ota',     'viator.com',                '#ef4444', CURRENT_DATE + 2, 'pending'),
  ('Isabella Costa',      '+55 11-555-3456', 'isabella.costa@email.com.br','Paradisus Palma Real',     'Bávaro',     '11 AM', 4, 1, '10:00 AM', 'lobby',   'Flintstone Family',    'website', 'caribebuggy.com',           '#3b82f6', CURRENT_DATE + 2, 'pending');

-- ── Productos (catálogo del sitio web) ──────────────────────────────
INSERT INTO products (slug, title, description, capacity, price, original_price, has_discount, duration, category, image, highlights, gallery, itinerary, general_info, active) VALUES
  (
    'elite-couple-experience',
    'Elite Couple Experience',
    'Couple',
    '2 people',
    160, NULL, FALSE,
    '4 hours',
    'Buggies',
    '/images/.webp',
    '["Premium buggy for couples", "Private guide experience", "All stops included"]'::JSONB,
    '["/images/.webp", "/images/.webp", "/images/.webp"]'::JSONB,
    '[]'::JSONB,
    '{"minAge": "16", "notAllowed": "Pregnant women", "freeCancellation": "24 hours before", "bookNowPayLater": "Yes", "duration": "4 hours", "guide": "Spanish/English", "pickupService": "Included"}'::JSONB,
    TRUE
  ),
  (
    'elite-family-experience',
    'Elite Family Experience',
    'Family',
    '4 people',
    200, NULL, FALSE,
    '4 hours',
    'Buggies',
    '/images/.webp',
    '["Family-size buggy", "Kid-friendly stops", "All-inclusive experience"]'::JSONB,
    '["/images/.webp"]'::JSONB,
    '[]'::JSONB,
    '{"minAge": "5", "notAllowed": "Pregnant women", "freeCancellation": "24 hours before", "bookNowPayLater": "Yes", "duration": "4 hours", "guide": "Spanish/English", "pickupService": "Included"}'::JSONB,
    TRUE
  ),
  (
    'apex-predator',
    'Apex Predator',
    'Solo',
    '1 person',
    130, NULL, FALSE,
    '3 hours',
    'Buggies',
    '/images/.webp',
    '["Solo extreme experience", "Full power buggy", "Adrenaline guaranteed"]'::JSONB,
    '["/images/.webp"]'::JSONB,
    '[]'::JSONB,
    '{"minAge": "18", "notAllowed": "Pregnant women, Back problems", "freeCancellation": "24 hours before", "bookNowPayLater": "Yes", "duration": "3 hours", "guide": "Spanish/English", "pickupService": "Included"}'::JSONB,
    TRUE
  ),
  (
    'predatory-family-experience',
    'Predatory Family Experience',
    'Family',
    '4 people',
    145, NULL, FALSE,
    '3.5 hours',
    'Buggies',
    '/images/.webp',
    '["Family adventure", "Moderate terrain", "All ages welcome"]'::JSONB,
    '["/images/.webp"]'::JSONB,
    '[]'::JSONB,
    '{"minAge": "5", "notAllowed": "Pregnant women", "freeCancellation": "24 hours before", "bookNowPayLater": "Yes", "duration": "3.5 hours", "guide": "Spanish/English", "pickupService": "Included"}'::JSONB,
    TRUE
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  25. SUPABASE STORAGE BUCKETS (ejecutar en Dashboard)                   ║
-- ║  Para fotos de portfolios y avatares                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Los buckets se crean desde el Dashboard de Supabase > Storage, o con SQL:

INSERT INTO storage.buckets (id, name, public) VALUES
  ('portfolio-photos', 'portfolio-photos', TRUE),
  ('portfolio-videos', 'portfolio-videos', TRUE),
  ('avatars',          'avatars',          TRUE),
  ('products',         'products',         TRUE);

-- Política de storage: permitir uploads a usuarios autenticados
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('portfolio-photos', 'portfolio-videos', 'avatars', 'products'));

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id IN ('portfolio-photos', 'portfolio-videos', 'avatars', 'products'));

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('portfolio-photos', 'portfolio-videos', 'avatars', 'products'));


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  FIN DEL SCHEMA                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ¡Listo! Pega este archivo completo en el SQL Editor de Supabase.
-- Todas las tablas, funciones, vistas, políticas y datos iniciales
-- quedarán configurados para tu proyecto Macao Evolution.
