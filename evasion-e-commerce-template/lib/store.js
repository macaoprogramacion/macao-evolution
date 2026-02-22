// ===================== MACAO SHARED DATA STORE =====================
// All cross-page/cross-app data flows through localStorage.
// Keys are namespaced with "macao_" to avoid collisions.

// ---- Invoice helpers (already existed, centralised here) ----
const INVOICES_KEY      = 'macao_invoices';
const COUNTER_KEY       = 'macao_invoice_counter';
const PORTFOLIOS_KEY    = 'macao_portfolios';
const PORTFOLIO_PHOTOS  = 'macao_portfolio_photos';
const PORTFOLIO_VIDEOS  = 'macao_portfolio_videos';
const BILLING_CLIENTS   = 'macao_billing_clients';   // clients created by cashier
const PHOTO_SALES_KEY   = 'macao_photo_sales';       // online photo purchases
const RETURNS_KEY       = 'macao_returns';            // processed returns
const ACTIVITY_KEY      = 'macao_activity';           // recent activity log

// ---- Generic read / write ----
function read(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- Invoices ----
export const getInvoices        = () => read(INVOICES_KEY, []);
export const saveInvoices       = (inv) => write(INVOICES_KEY, inv);
export const addInvoice         = (inv) => { const all = getInvoices(); all.push(inv); saveInvoices(all); return all; };
export const getInvoiceCounter  = () => { try { return parseInt(localStorage.getItem(COUNTER_KEY) || '0'); } catch { return 0; } };
export const setInvoiceCounter  = (n) => localStorage.setItem(COUNTER_KEY, n.toString());
export const formatInvoiceNumber = (n) => `FAC-${n.toString().padStart(4, '0')}`;

export const findInvoiceByNumber = (code) => getInvoices().find(i => i.invoiceNumber?.toUpperCase() === code?.toUpperCase()?.trim());
export const findInvoicesByPhone = (phone) => {
  const normalised = phone?.replace(/\D/g, '');
  return getInvoices().filter(i => i.clientPhone?.replace(/\D/g, '') === normalised);
};
export const markInvoiceRedeemed = (invoiceNumber) => {
  const all = getInvoices();
  const updated = all.map(i => i.invoiceNumber === invoiceNumber ? { ...i, redeemed: true, redeemedAt: new Date().toISOString() } : i);
  saveInvoices(updated);
  return updated;
};

// ---- Billing Clients (created by cashier, flow to photographer) ----
export const getBillingClients  = () => read(BILLING_CLIENTS, []);
export const saveBillingClients = (c) => write(BILLING_CLIENTS, c);
export const addBillingClient   = (client) => { const all = getBillingClients(); all.push(client); saveBillingClients(all); return all; };

// ---- Portfolios (persistent version of PortfolioContext) ----
export const getPortfolios      = () => read(PORTFOLIOS_KEY, []);
export const savePortfolios     = (p) => write(PORTFOLIOS_KEY, p);
export const getPortfolioPhotos = () => read(PORTFOLIO_PHOTOS, {});
export const savePortfolioPhotos = (p) => write(PORTFOLIO_PHOTOS, p);
export const getPortfolioVideos = () => read(PORTFOLIO_VIDEOS, {});
export const savePortfolioVideos = (v) => write(PORTFOLIO_VIDEOS, v);

export const findPortfolioByPhone = (phone) => {
  const normalised = phone?.replace(/\D/g, '');
  return getPortfolios().find(p => p.phone?.replace(/\D/g, '') === normalised);
};

// ---- Photo Sales (online purchases by clients who chose a plan) ----
export const getPhotoSales      = () => read(PHOTO_SALES_KEY, []);
export const savePhotoSales     = (s) => write(PHOTO_SALES_KEY, s);
export const addPhotoSale       = (sale) => { const all = getPhotoSales(); all.push(sale); savePhotoSales(all); return all; };

// ---- Returns ----
export const getReturns         = () => read(RETURNS_KEY, []);
export const saveReturns        = (r) => write(RETURNS_KEY, r);
export const addReturn          = (ret) => { const all = getReturns(); all.push(ret); saveReturns(all); return all; };

// ---- Activity log (last 50) ----
export const getActivity        = () => read(ACTIVITY_KEY, []);
export const logActivity        = (action, detail) => {
  const all = getActivity();
  all.unshift({ id: Date.now(), action, detail, time: new Date().toISOString() });
  if (all.length > 50) all.length = 50;
  write(ACTIVITY_KEY, all);
};

// ---- Finance helpers (calculate stats from invoices) ----
export function calculateFinanceStats(invoices, returns = []) {
  const now   = new Date();
  const todayStr = now.toLocaleDateString('es-DO');
  const weekAgo  = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);

  let salesToday = 0, salesWeek = 0, salesMonth = 0, invoicesToday = 0;

  invoices.forEach(inv => {
    const d = new Date(inv.timestamp);
    const dStr = d.toLocaleDateString('es-DO');
    if (dStr === todayStr) { salesToday += inv.total; invoicesToday++; }
    if (d >= weekAgo) salesWeek += inv.total;
    if (d >= monthAgo) salesMonth += inv.total;
  });

  let returnsTotal = 0;
  returns.forEach(r => { if (r.status === 'aprobada' || r.status === 'procesada') returnsTotal += r.amount; });

  return { salesToday, salesWeek, salesMonth, invoicesToday, returnsTotal, ticketPromedio: invoicesToday > 0 ? salesToday / invoicesToday : 0 };
}

// ---- Turno helpers ----
export function calculateSalesByTurno(invoices) {
  const turnoMap = { 'Primer Turno': { sales: 0, amount: 0 }, 'Segundo Turno': { sales: 0, amount: 0 }, 'Tercer Turno': { sales: 0, amount: 0 } };
  invoices.forEach(inv => {
    const t = inv.turno || 'Primer Turno';
    if (turnoMap[t]) { turnoMap[t].sales++; turnoMap[t].amount += inv.total; }
  });
  return Object.entries(turnoMap).map(([shift, data]) => ({ shift, ...data }));
}
