import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/gyg/debug-logs?secret=SaonaSecret2026
 * Temporary endpoint to check webhook logs and recent bookings.
 * DELETE THIS FILE after debugging.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.secret !== process.env.GYG_INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" })
  }

  // Recent webhook logs (last 20)
  const { data: webhookLogs, error: wErr } = await supabase
    .from("gyg_webhook_log")
    .select("id, endpoint, gyg_booking_ref, processing_status, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  // Recent gyg_bookings (last 20)
  const { data: bookings, error: bErr } = await supabase
    .from("gyg_bookings")
    .select("id, booking_reference, gyg_booking_ref, product_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  // Recent gyg_reservations (last 20)
  const { data: reservations, error: rErr } = await supabase
    .from("gyg_reservations")
    .select("id, product_id, gyg_booking_ref, status, created_at, expires_at")
    .order("created_at", { ascending: false })
    .limit(20)

  // Recent saona_reservations (last 10)
  const { data: saona, error: sErr } = await supabase
    .from("saona_reservations")
    .select("id, customer_name, date, status, channel, gyg_booking_ref, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  // Recent samana_reservations (last 10)
  const { data: samana, error: smErr } = await supabase
    .from("samana_reservations")
    .select("id, customer_name, date, status, channel, gyg_booking_ref, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  // GYG notifications
  const { data: notifications, error: nErr } = await supabase
    .from("gyg_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return res.status(200).json({
    webhookLogs: webhookLogs || wErr?.message,
    bookings: bookings || bErr?.message,
    reservations: reservations || rErr?.message,
    saona: saona || sErr?.message,
    samana: samana || smErr?.message,
    notifications: notifications || nErr?.message,
  })
}
