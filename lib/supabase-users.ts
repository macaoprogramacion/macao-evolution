import { supabase } from './supabase'

export interface DashboardUser {
  id: string
  name: string
  email: string
  phone: string
  pin: string
  role: string
  active: boolean
  created_at?: string
  updated_at?: string
  last_login?: string
}

// ---- Fetch all dashboard users ----
export async function getSupabaseUsers(): Promise<DashboardUser[]> {
  const { data, error } = await supabase
    .from('dashboard_users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error.message)
    return []
  }
  return data || []
}

// ---- Add a new dashboard user ----
export async function addSupabaseUser(user: Omit<DashboardUser, 'id' | 'active' | 'created_at' | 'updated_at'>): Promise<DashboardUser[]> {
  const { error } = await supabase
    .from('dashboard_users')
    .insert({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      pin: user.pin,
      role: user.role,
      active: true,
    })

  if (error) {
    console.error('Error adding user:', error.message)
  }
  return getSupabaseUsers()
}

// ---- Update an existing user ----
export async function updateSupabaseUser(id: string, updates: Partial<DashboardUser>): Promise<DashboardUser[]> {
  const { error } = await supabase
    .from('dashboard_users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating user:', error.message)
  }
  return getSupabaseUsers()
}

// ---- Delete a user ----
export async function deleteSupabaseUser(id: string): Promise<DashboardUser[]> {
  const { error } = await supabase
    .from('dashboard_users')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user:', error.message)
  }
  return getSupabaseUsers()
}

// ---- Authenticate by email (returns user if found, null otherwise) ----
export async function authenticateByEmail(email: string): Promise<DashboardUser | null> {
  const { data, error } = await supabase
    .from('dashboard_users')
    .select('*')
    .ilike('email', email.trim())
    .eq('active', true)
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

// ---- Authenticate by PIN only (for DashboardAuthGate legacy) ----
export async function authenticateByPin(pin: string): Promise<DashboardUser | null> {
  const { data, error } = await supabase
    .from('dashboard_users')
    .select('*')
    .eq('pin', pin)
    .eq('active', true)
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}
