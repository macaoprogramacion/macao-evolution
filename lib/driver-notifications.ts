import { supabase } from '@/lib/supabase';

export interface DriverNotification {
  id: string;
  driver_id: string;
  billing_record_id: string;
  notification_type: 'payment_received' | 'credit_issued' | 'direct_sale';
  client_name: string;
  phone?: string;
  amount: number;
  currency: string;
  service_type?: string;
  notes?: string;
  status: 'pending' | 'sent' | 'viewed' | 'acknowledged';
  sent_at?: string;
  viewed_at?: string;
  acknowledged_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Send billing record notification to a driver
 */
export async function sendNotificationToDriver(
  driverId: string,
  billingRecordId: string,
  notificationType: 'payment_received' | 'credit_issued' | 'direct_sale',
  clientName: string,
  amount: number,
  currency: string,
  phone?: string,
  serviceType?: string,
  notes?: string
): Promise<DriverNotification> {
  try {
    const { data, error } = await supabase
      .from('driver_notifications')
      .insert({
        driver_id: driverId,
        billing_record_id: billingRecordId,
        notification_type: notificationType,
        client_name: clientName,
        phone: phone || null,
        amount,
        currency,
        service_type: serviceType || null,
        notes: notes || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error sending notification to driver:', err);
    throw err;
  }
}

/**
 * Get pending notifications for a driver
 */
export async function getDriverPendingNotifications(driverId: string): Promise<DriverNotification[]> {
  try {
    const { data, error } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching pending notifications:', err);
    return [];
  }
}

/**
 * Get all notifications for a driver (paginated)
 */
export async function getDriverNotifications(
  driverId: string,
  limit = 50,
  offset = 0
): Promise<DriverNotification[]> {
  try {
    const { data, error } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching driver notifications:', err);
    return [];
  }
}

/**
 * Mark notification as viewed
 */
export async function markNotificationAsViewed(notificationId: string): Promise<DriverNotification> {
  try {
    const { data, error } = await supabase
      .from('driver_notifications')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error marking notification as viewed:', err);
    throw err;
  }
}

/**
 * Mark notification as acknowledged
 */
export async function acknowledgeNotification(notificationId: string): Promise<DriverNotification> {
  try {
    const { data, error } = await supabase
      .from('driver_notifications')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error acknowledging notification:', err);
    throw err;
  }
}

/**
 * Get notification count for a driver (pending + sent)
 */
export async function getDriverNotificationCount(driverId: string): Promise<{ pending: number; unviewed: number }> {
  try {
    const { count: pendingCount, error: err1 } = await supabase
      .from('driver_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driverId)
      .eq('status', 'pending');

    const { count: unviewedCount, error: err2 } = await supabase
      .from('driver_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driverId)
      .in('status', ['pending', 'sent']);

    if (err1 || err2) throw err1 || err2;

    return {
      pending: pendingCount || 0,
      unviewed: unviewedCount || 0,
    };
  } catch (err) {
    console.error('Error getting notification count:', err);
    return { pending: 0, unviewed: 0 };
  }
}
