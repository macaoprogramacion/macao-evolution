import { supabase } from '@/lib/supabase';

export interface BillingRecord {
  id: string;
  type: 'pago_al_llegar' | 'credito_vendedor' | 'venta_directa';
  client_name: string;
  phone?: string;
  vendor_name?: string;
  customer_amount?: number | null;
  currency: 'USD' | 'DOP' | 'EUR' | 'GBP';
  amount: number;
  payment_method: 'tarjeta' | 'paypal' | 'efectivo';
  courtesy: boolean;
  service_type: string;
  status: 'pendiente' | 'pagado' | 'cancelado';
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all billing records for a specific date range
 */
export async function getBillingRecords(fromDate: string, toDate: string) {
  try {
    const { data, error } = await supabase
      .from('billing_records')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching billing records:', err);
    return [];
  }
}

/**
 * Get billing records for today
 */
export async function getTodayBillingRecords() {
  const today = new Date().toISOString().slice(0, 10);
  return getBillingRecords(today, today);
}

/**
 * Get billing records for a specific month
 */
export async function getMonthBillingRecords(month: string) {
  const [year, monthNum] = month.split('-');
  const fromDate = `${year}-${monthNum}-01`;
  const toDate = new Date(Number(year), Number(monthNum), 0).toISOString().slice(0, 10);
  return getBillingRecords(fromDate, toDate);
}

/**
 * Insert a new billing record
 */
export async function insertBillingRecord(record: Omit<BillingRecord, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const id = `billing-${Date.now()}`;
    
    // Try inserting with customer_amount first
    const insertPayload: any = {
      id,
      type: record.type,
      client_name: record.client_name,
      phone: record.phone || null,
      vendor_name: record.vendor_name || null,
      currency: record.currency,
      amount: record.amount,
      payment_method: record.payment_method,
      courtesy: record.courtesy,
      service_type: record.service_type,
      status: record.status,
      date: record.date,
      notes: record.notes || null,
    };
    
    // Only include customer_amount if provided
    if (record.customer_amount !== undefined && record.customer_amount !== null) {
      insertPayload.customer_amount = record.customer_amount;
    }
    
    let { data, error } = await supabase
      .from('billing_records')
      .insert(insertPayload)
      .select();
    
    // If customer_amount column doesn't exist, try without it
    if (error && error.message?.includes('customer_amount')) {
      console.warn('customer_amount column not found, inserting without it:', error.message);
      delete insertPayload.customer_amount;
      
      ({ data, error } = await supabase
        .from('billing_records')
        .insert(insertPayload)
        .select());
    }
    
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Error inserting billing record:', err);
    throw err;
  }
}

/**
 * Update a billing record
 */
export async function updateBillingRecord(id: string, updates: Partial<BillingRecord>) {
  try {
    const { data, error } = await supabase
      .from('billing_records')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Error updating billing record:', err);
    throw err;
  }
}

/**
 * Delete a billing record
 */
export async function deleteBillingRecord(id: string) {
  try {
    const { error } = await supabase
      .from('billing_records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting billing record:', err);
    throw err;
  }
}

/**
 * Get billing summary for a date
 */
export async function getBillingSummary(date: string) {
  const records = await getBillingRecords(date, date);
  
  return {
    totalRecords: records.length,
    paid: records.filter((r) => r.status === 'pagado').length,
    pending: records.filter((r) => r.status === 'pendiente').length,
    cancelled: records.filter((r) => r.status === 'cancelado').length,
    totalsByCurrency: {
      USD: records.filter((r) => r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0),
      DOP: records.filter((r) => r.currency === 'DOP').reduce((sum, r) => sum + r.amount, 0),
      EUR: records.filter((r) => r.currency === 'EUR').reduce((sum, r) => sum + r.amount, 0),
      GBP: records.filter((r) => r.currency === 'GBP').reduce((sum, r) => sum + r.amount, 0),
    },
  };
}
