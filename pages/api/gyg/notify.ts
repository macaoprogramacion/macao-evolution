import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError } from "@/lib/gyg/config"
import type { NotificationRequest } from "@/lib/gyg/types"

/**
 * POST /api/gyg/notify
 * GYG calls: POST /1/notify/
 *
 * Receives notifications from GYG (e.g. product deactivation).
 * Logs them for review in the admin dashboard.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only POST is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  try {
    const body = req.body as NotificationRequest
    const data = body?.data

    if (!data || !data.notificationType) {
      return res.status(200).json(gygError("VALIDATION_FAILURE", "Missing notification data."))
    }

    // Log the notification
    await supabase.from("gyg_notifications").insert({
      notification_type: data.notificationType,
      product_id: data.productDetails?.productId || null,
      gyg_tour_option: data.productDetails?.gygTourOptionId || null,
      payload: data,
    })

    console.warn(`[GYG Notification] ${data.notificationType}: ${data.description}`)

    return res.status(200).json({ data: {} })
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error processing notification.")
    )
  }
}
