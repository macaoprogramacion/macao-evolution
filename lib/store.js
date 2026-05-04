import { supabase } from '@/lib/supabase';

export const formatInvoiceNumber = (n) => `FAC-${n.toString().padStart(4, '0')}`;

// ── localStorage helpers (offline fallback) ──────────────────────────────────
const INVOICES_KEY = 'macao_billing_invoices';
const INVOICE_COUNTER_KEY = 'macao_billing_counter';
const RETURNS_KEY = 'macao_billing_returns';

export function getInvoices() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]'); } catch { return []; }
}

export function saveInvoices(invoices) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getInvoiceCounter() {
  if (typeof window === 'undefined') return 1;
  return parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '1', 10);
}

export function setInvoiceCounter(num) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INVOICE_COUNTER_KEY, String(num));
}

export function getReturns() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]'); } catch { return []; }
}

export function saveReturns(returns) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
}

export function addReturn(ret) {
  const updated = [...getReturns(), ret];
  saveReturns(updated);
  return updated;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillingClients() {
  const { data, error } = await supabase
    .from('photo_billing_clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[store] getBillingClients:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    clientName: row.client_name || row.payload?.clientName || '',
    phone: row.phone || row.payload?.phone || '',
    invoiceNumber: row.invoice_number || row.payload?.invoiceNumber || '',
    source: row.source || row.payload?.source || 'billing',
    turno: row.turno || row.payload?.turno || null,
    photographerName: row.photographer_name || row.payload?.photographerName || null,
    createdAt: row.created_at,
    ...(row.payload || {}),
  }));
}

export async function addBillingClient(client) {
  const payload = {
    client_name: client.clientName || client.client_name || null,
    phone: client.phone || null,
    invoice_number: client.invoiceNumber || client.invoice_number || null,
    source: client.source || 'billing',
    turno: client.turno || null,
    photographer_name: client.photographerName || null,
    payload: client,
  };

  const { error } = await supabase.from('photo_billing_clients').insert(payload);
  if (error) {
    console.error('[store] addBillingClient:', error.message);
  }
  return getBillingClients();
}

export async function getActivity() {
  const { data, error } = await supabase
    .from('photo_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[store] getActivity:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    action: row.action,
    detail: row.detail || '',
    time: row.created_at,
  }));
}

export async function logActivity(action, detail) {
  const { error } = await supabase.from('photo_activity_log').insert({
    action,
    detail,
  });

  if (error) {
    console.error('[store] logActivity:', error.message);
  }
}

export function calculateSalesByTurno(invoices) {
  const turnoMap = { 'Turno 9:00': { sales: 0, amount: 0 }, 'Turno 12:00': { sales: 0, amount: 0 }, 'Turno 3:00': { sales: 0, amount: 0 } };
  invoices.forEach((inv) => {
    const t = inv.turno || 'Turno 9:00';
    if (turnoMap[t]) {
      turnoMap[t].sales++;
      turnoMap[t].amount += inv.total;
    }
  });
  return Object.entries(turnoMap).map(([shift, data]) => ({ shift, ...data }));
}
