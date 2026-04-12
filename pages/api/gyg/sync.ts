import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { getProduct } from "@/lib/gyg/config"
import { processBookingData } from "@/lib/gyg/booking-processor"

/**
 * POST /api/gyg/sync
 *
 * Automatic & manual reconciliation endpoint.
 * 1. Retries failed "book" webhook requests from gyg_webhook_log
 * 2. Reconciles gyg_bookings ↔ destination tables (samana/saona_reservations)
 *
 * Auth: x-internal-secret header or CRON_SECRET bearer token
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Auth: accept internal secret, cron secret, or same-origin dashboard calls
  const internalSecret = req.headers["x-internal-secret"]
  const authHeader = req.headers.authorization
  const cronSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  const referer = req.headers.referer || ""

  const validInternal = internalSecret && internalSecret === process.env.GYG_INTERNAL_SECRET
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET
  const validDashboard = referer.includes("/admin/operation-samana") || referer.includes("/admin/operation-saona")

  if (!validInternal && !validCron && !validDashboard) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const results: {
    retriedWebhooks: { id: string; gygRef: string; success: boolean; error?: string }[]
    reconciledBookings: { id: string; gygRef: string; success: boolean; error?: string }[]
  } = {
    retriedWebhooks: [],
    reconciledBookings: [],
  }

  try {
    // ── Step 1: Retry failed "book" and "reserve" webhooks ───────────────

    const { data: failedLogs } = await supabase
      .from("gyg_webhook_log")
      .select("*")
      .in("endpoint", ["book", "reserve"])
      .eq("processing_status", "failed")
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(20)

    for (const log of failedLogs || []) {
      const bookData = log.request_body?.data
      if (!bookData || log.endpoint !== "book") {
        // Skip non-book or empty entries, just increment retry count
        await supabase
          .from("gyg_webhook_log")
          .update({ retry_count: log.retry_count + 1, processed_at: new Date().toISOString() })
          .eq("id", log.id)
        continue
      }

      try {
        const result = await processBookingData(bookData)

        if (result.success) {
          await supabase
            .from("gyg_webhook_log")
            .update({
              processing_status: "retried",
              retry_count: log.retry_count + 1,
              processed_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", log.id)

          results.retriedWebhooks.push({
            id: log.id,
            gygRef: log.gyg_booking_ref || "unknown",
            success: true,
          })
        } else {
          await supabase
            .from("gyg_webhook_log")
            .update({
              retry_count: log.retry_count + 1,
              error_message: result.error,
              processed_at: new Date().toISOString(),
            })
            .eq("id", log.id)

          results.retriedWebhooks.push({
            id: log.id,
            gygRef: log.gyg_booking_ref || "unknown",
            success: false,
            error: result.error,
          })
        }
      } catch (err: any) {
        await supabase
          .from("gyg_webhook_log")
          .update({
            retry_count: log.retry_count + 1,
            error_message: err.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", log.id)

        results.retriedWebhooks.push({
          id: log.id,
          gygRef: log.gyg_booking_ref || "unknown",
          success: false,
          error: err.message,
        })
      }
    }

    // ── Step 2: Reconcile gyg_bookings → destination tables ─────────────
    // Find confirmed gyg_bookings whose destination row is missing

    const { data: confirmedBookings } = await supabase
      .from("gyg_bookings")
      .select("*")
      .eq("status", "confirmed")
      .order("created_at", { ascending: true })

    for (const booking of confirmedBookings || []) {
      const product = getProduct(booking.product_id)
      if (!product) continue

      // Check if the destination row still exists
      if (booking.saona_reservation_id) {
        const { data: destRow } = await supabase
          .from(product.destinationTable)
          .select("id")
          .eq("id", booking.saona_reservation_id)
          .maybeSingle()

        if (destRow) continue // Row exists, all good
      }

      // Also check by gyg_booking_ref in case saona_reservation_id is stale
      const { data: byRef } = await supabase
        .from(product.destinationTable)
        .select("id")
        .eq("gyg_booking_ref", booking.gyg_booking_ref)
        .maybeSingle()

      if (byRef) {
        // Destination exists but gyg_bookings.saona_reservation_id is wrong — fix it
        await supabase
          .from("gyg_bookings")
          .update({ saona_reservation_id: byRef.id })
          .eq("id", booking.id)
        continue
      }

      // Destination row is missing — re-create from gyg_bookings data
      try {
        const bookData = {
          productId: booking.product_id,
          reservationReference: booking.reservation_id,
          gygBookingReference: booking.gyg_booking_ref,
          gygActivityReference: booking.gyg_activity_ref,
          currency: booking.currency,
          dateTime: booking.date_time,
          bookingItems: booking.booking_items,
          addonItems: booking.addon_items,
          language: booking.language,
          travelers: booking.travelers,
          travelerHotel: booking.traveler_hotel,
          comment: booking.comment,
        }

        const result = await processBookingData(bookData)

        if (result.success && result.destinationId) {
          // Update the gyg_bookings reference
          await supabase
            .from("gyg_bookings")
            .update({ saona_reservation_id: result.destinationId })
            .eq("id", booking.id)
        }

        results.reconciledBookings.push({
          id: booking.id,
          gygRef: booking.gyg_booking_ref,
          success: result.success,
          error: result.error,
        })
      } catch (err: any) {
        results.reconciledBookings.push({
          id: booking.id,
          gygRef: booking.gyg_booking_ref,
          success: false,
          error: err.message,
        })
      }
    }

    return res.status(200).json({
      message: "Sync completed",
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (err: any) {
    console.error("[GYG Sync Error]", err)
    return res.status(500).json({ error: err.message, ...results })
  }
}
