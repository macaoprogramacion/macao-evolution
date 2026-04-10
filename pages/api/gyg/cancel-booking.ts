import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"
import type { BookingCancellationRequest } from "@/lib/gyg/types"

/**
 * POST /api/gyg/cancel-booking
 * GYG calls: POST /1/cancel-booking/
 *
 * Cancels a confirmed booking. Updates gyg_bookings and the destination table
 * (saona_reservations or samana_reservations based on productId).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only POST is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  try {
    const body = req.body as BookingCancellationRequest
    const data = body?.data

    if (!data) {
      return res.status(200).json(gygError("VALIDATION_FAILURE", "Missing request data."))
    }

    const { bookingReference, gygBookingReference, productId } = data

    if (!bookingReference || !gygBookingReference || !productId) {
      return res.status(200).json(
        gygError("VALIDATION_FAILURE", "bookingReference, gygBookingReference, and productId are required.")
      )
    }

    // Find the booking
    const { data: booking, error: findError } = await supabase
      .from("gyg_bookings")
      .select("id, saona_reservation_id, product_id, status, date_time")
      .eq("booking_reference", bookingReference)
      .eq("gyg_booking_ref", gygBookingReference)
      .single()

    if (findError || !booking) {
      return res.status(200).json(
        gygError("INVALID_BOOKING", `Booking '${bookingReference}' not found.`)
      )
    }

    if (booking.status === "cancelled") {
      return res.status(200).json(
        gygError("BOOKING_ALREADY_CANCELED", "The booking has already been cancelled.")
      )
    }

    // Check if booking is in the past
    const bookingDate = new Date(booking.date_time)
    if (bookingDate < new Date()) {
      return res.status(200).json(
        gygError("BOOKING_IN_PAST", "The booking is in the past and cannot be cancelled.")
      )
    }

    // Cancel the gyg_bookings record
    const { error: cancelError } = await supabase
      .from("gyg_bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", booking.id)

    if (cancelError) {
      return res.status(200).json(
        gygError("INTERNAL_SYSTEM_FAILURE", `Failed to cancel booking: ${cancelError.message}`)
      )
    }

    // Cancel in the correct destination table based on the product
    if (booking.saona_reservation_id) {
      const product = getProduct(booking.product_id)
      const table = product?.destinationTable || "saona_reservations"

      await supabase
        .from(table)
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", booking.saona_reservation_id)
    }

    return res.status(200).json({ data: {} })
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error during booking cancellation.")
    )
  }
}
