import { supabase } from '@/lib/supabase';

export interface PickupSheet {
  id: string;
  date: string;
  turno: '8 AM' | '11 AM' | '3 PM' | 'all';
  status: 'draft' | 'locked' | 'printed';
  created_at?: string;
  updated_at?: string;
  locked_at?: string;
  printed_at?: string;
  created_by?: string;
  notes?: string;
}

export interface PickupSheetRow {
  id: string;
  sheet_id: string;
  pickup_time: string;
  customer_name: string;
  hotel: string;
  room?: string;
  agency?: string;
  pax: number;
  notes?: string;
  is_ghost: boolean;
  ghost_hotel_random?: string;
  ghost_name_random?: string;
  reservation_id?: string;
  created_at?: string;
}

export type PickupSheetRowInsert = Omit<PickupSheetRow, 'id' | 'sheet_id' | 'created_at'>;

/**
 * Create a new pickup sheet (draft status)
 */
export async function createPickupSheet(
  date: string,
  turno: '8 AM' | '11 AM' | '3 PM' | 'all',
  createdBy?: string
): Promise<PickupSheet> {
  try {
    const id = `sheet-${date}-${turno.replace(' ', '-').toLowerCase()}-${Date.now()}`;
    const { data, error } = await supabase
      .from('pickup_sheets')
      .insert({
        id,
        date,
        turno,
        status: 'draft',
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating pickup sheet:', err);
    throw err;
  }
}

/**
 * Get pickup sheet by id
 */
export async function getPickupSheet(sheetId: string): Promise<PickupSheet | null> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .select('*')
      .eq('id', sheetId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching pickup sheet:', err);
    return null;
  }
}

/**
 * Get pickup sheet by date
 */
export async function getPickupSheetByDate(date: string): Promise<PickupSheet | null> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0 ? data[0] : null) as PickupSheet | null;
  } catch (err) {
    console.error('Error fetching pickup sheet by date:', err);
    return null;
  }
}

/**
 * Get most recent draft pickup sheet by date.
 */
export async function getDraftPickupSheetByDate(date: string): Promise<PickupSheet | null> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .select('*')
      .eq('date', date)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0 ? data[0] : null) as PickupSheet | null;
  } catch (err) {
    console.error('Error fetching draft pickup sheet by date:', err);
    return null;
  }
}

/**
 * Reuse today's draft sheet if available, otherwise create one.
 */
export async function getOrCreateDraftPickupSheet(
  date: string,
  turno: '8 AM' | '11 AM' | '3 PM' | 'all' = '8 AM',
  createdBy?: string,
): Promise<PickupSheet> {
  const existingDraft = await getDraftPickupSheetByDate(date);
  if (existingDraft) return existingDraft;
  return createPickupSheet(date, turno, createdBy);
}

/**
 * List recent pickup sheet documents, optionally filtered by status.
 */
export async function listPickupSheets(options?: {
  status?: PickupSheet['status'];
  limit?: number;
}): Promise<PickupSheet[]> {
  try {
    const limit = options?.limit ?? 30;
    let query = supabase
      .from('pickup_sheets')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PickupSheet[];
  } catch (err) {
    console.error('Error listing pickup sheets:', err);
    return [];
  }
}

/**
 * Get pickup sheet rows
 */
export async function getPickupSheetRows(sheetId: string): Promise<PickupSheetRow[]> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheet_rows')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('pickup_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching pickup sheet rows:', err);
    return [];
  }
}

/**
 * Add rows to pickup sheet
 */
export async function addPickupSheetRows(sheetId: string, rows: PickupSheetRowInsert[]): Promise<PickupSheetRow[]> {
  try {
    const rowsWithIds = rows.map((r) => ({
      ...r,
      id: `row-${sheetId}-${Date.now()}-${Math.random()}`,
      sheet_id: sheetId,
    }));

    const { data, error } = await supabase
      .from('pickup_sheet_rows')
      .insert(rowsWithIds)
      .select();

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error adding pickup sheet rows:', err);
    throw err;
  }
}

/**
 * Remove row from pickup sheet (only if sheet is draft)
 */
export async function removePickupSheetRow(rowId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pickup_sheet_rows')
      .delete()
      .eq('id', rowId);

    if (error) throw error;
  } catch (err) {
    console.error('Error removing pickup sheet row:', err);
    throw err;
  }
}

/**
 * Lock pickup sheet (change status from draft to locked)
 */
export async function lockPickupSheet(sheetId: string): Promise<PickupSheet> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .update({
        status: 'locked',
        locked_at: new Date().toISOString(),
      })
      .eq('id', sheetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error locking pickup sheet:', err);
    throw err;
  }
}

/**
 * Mark pickup sheet as printed
 */
export async function markPickupSheetPrinted(sheetId: string): Promise<PickupSheet> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .update({
        status: 'printed',
        printed_at: new Date().toISOString(),
      })
      .eq('id', sheetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error marking pickup sheet as printed:', err);
    throw err;
  }
}

/**
 * Get existing pickup sheet for date and turno
 */
export async function getExistingPickupSheet(date: string, turno: string): Promise<PickupSheet | null> {
  try {
    const { data, error } = await supabase
      .from('pickup_sheets')
      .select('*')
      .eq('date', date)
      .eq('turno', turno)
      .in('status', ['draft', 'locked'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error?.code === 'PGRST116') {
      // No rows found - this is not an error
      return null;
    }
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching existing pickup sheet:', err);
    return null;
  }
}

/**
 * Delete pickup sheet (only if draft)
 */
export async function deletePickupSheet(sheetId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pickup_sheets')
      .delete()
      .eq('id', sheetId)
      .eq('status', 'draft');

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting pickup sheet:', err);
    throw err;
  }
}
