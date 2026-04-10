import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError } from "@/lib/gyg/config"
import type { ReservationCancellationRequest } from "@/lib/gyg/types"

/**
 * POST /api/gyg/cancel-reservation
 * GYG calls: POST /1/cancel-reservation/
 *
 * Cancels a reservation hold (e.g. customer removed item from cart, or hold expired).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only POST is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  try {
    const body = req.body as ReservationCancellationRequest
    const data = body?.data

    if (!data) {
      return res.status(200).json(gygError("VALIDATION_FAILURE", "Missing request data."))
    }

    const { reservationReference, gygBookingReference } = data

    if (!reservationReference || !gygBookingReference) {
      return res.status(200).json(
        gygError("VALIDATION_FAILURE", "reservationReference and gygBookingReference are required.")
      )
    }

    // Find the reservation
    const { data: reservation, error: findError } = await supabase
      .from("gyg_reservations")
      .select("id, status")
      .eq("id", reservationReference)
      .eq("gyg_booking_ref", gygBookingReference)
      .single()

    if (findError || !reservation) {
      return res.status(200).json(
        gygError("INVALID_RESERVATION", `Reservation '${reservationReference}' not found.`)
      )
    }

    if (reservation.status !== "active") {
      return res.status(200).json(
        gygError("INVALID_RESERVATION", `Reservation is in state '${reservation.status}' and cannot be cancelled.`)
      )
    }

    // Cancel the reservation
    const { error: updateError } = await supabase
      .from("gyg_reservations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", reservationReference)

    if (updateError) {
      return res.status(200).json(
        gygError("INTERNAL_SYSTEM_FAILURE", `Failed to cancel reservation: ${updateError.message}`)
      )
    }

    return res.status(200).json({ data: {} })
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error during reservation cancellation.")
    )
  }
}
