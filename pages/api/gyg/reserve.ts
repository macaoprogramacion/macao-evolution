import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"
import type { ReservationRequest } from "@/lib/gyg/types"

/**
 * POST /api/gyg/reserve
 * GYG calls: POST /1/reserve/
 *
 * Creates a temporary hold (reservation) for the requested product/date/participants.
 * Returns a reservationReference and expiration time.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only POST is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  try {
    const body = req.body as ReservationRequest
    const data = body?.data

    if (!data) {
      return res.status(200).json(gygError("VALIDATION_FAILURE", "Missing request data."))
    }

    const { productId, dateTime, bookingItems, gygBookingReference, gygActivityReference } = data

    if (!productId || !dateTime || !bookingItems || !gygBookingReference) {
      return res.status(200).json(
        gygError("VALIDATION_FAILURE", "productId, dateTime, bookingItems, and gygBookingReference are required.")
      )
    }

    const product = getProduct(productId)
    if (!product) {
      return res.status(200).json(gygError("INVALID_PRODUCT", `Product '${productId}' does not exist.`))
    }

    // Validate ticket categories against what this specific product supports
    const supportedCategories = new Set<string>(product.prices.map((p) => p.category))
    for (const item of bookingItems) {
      if (!supportedCategories.has(item.category)) {
        return res.status(200).json(
          gygError("INVALID_TICKET_CATEGORY", `Category '${item.category}' is not supported for product '${productId}'.`, {
            ticketCategory: item.category,
          })
        )
      }
    }

    // Calculate total participants
    const totalParticipants = bookingItems.reduce((sum, item) => {
      if (item.category === "GROUP") {
        return sum + (item.groupSize || 0)
      }
      return sum + item.count
    }, 0)

    // Validate participant count
    if (totalParticipants < product.minParticipants || totalParticipants > product.maxParticipants) {
      return res.status(200).json({
        errorCode: "INVALID_PARTICIPANTS_CONFIGURATION",
        errorMessage: `Participants must be between ${product.minParticipants} and ${product.maxParticipants}. Requested: ${totalParticipants}.`,
        participantsConfiguration: {
          min: product.minParticipants,
          max: product.maxParticipants,
        },
      })
    }

    // Check availability
    const dateStr = dateTime.split("T")[0]
    const todayStr = new Date().toISOString().split("T")[0]

    // Past dates have no availability
    if (dateStr < todayStr) {
      return res.status(200).json(
        gygError("NO_AVAILABILITY", `No availability for past date ${dateStr}.`)
      )
    }

    let effectiveCapacity = product.defaultVacancies
    const { data: availabilityOverride, error: overrideError } = await supabase
      .from("gyg_availability_overrides")
      .select("manual_vacancies, is_blocked")
      .eq("product_id", productId)
      .eq("date", dateStr)
      .maybeSingle()

    // Keep integration backwards compatible if migration has not been applied yet.
    if (overrideError && !overrideError.message?.includes("gyg_availability_overrides")) {
      console.error("Failed to read availability override:", overrideError)
    }

    if (availabilityOverride?.is_blocked) {
      return res.status(200).json(
        gygError("NO_AVAILABILITY", `No availability for blocked date ${dateStr}.`)
      )
    }

    if (typeof availabilityOverride?.manual_vacancies === "number") {
      effectiveCapacity = availabilityOverride.manual_vacancies
    }

    const { data: existing } = await supabase
      .from(product.destinationTable)
      .select("guests, children")
      .eq("date", dateStr)
      .in("status", ["confirmed", "pending"])

    let totalBooked = 0
    if (existing) {
      totalBooked = existing.reduce((sum, r) => sum + (r.guests || 0) + (r.children || 0), 0)
    }

    // Also count active holds FOR THE SAME DATE
    const dateTimeStart = `${dateStr}T00:00:00${product.timezone}`
    const nextDay = new Date(new Date(dateStr + "T00:00:00").getTime() + 86400000)
    const nextDateStr = nextDay.toISOString().split("T")[0]
    const dateTimeEnd = `${nextDateStr}T00:00:00${product.timezone}`

    const { data: activeHolds } = await supabase
      .from("gyg_reservations")
      .select("total_participants")
      .eq("product_id", productId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .gte("date_time", dateTimeStart)
      .lt("date_time", dateTimeEnd)

    if (activeHolds) {
      totalBooked += activeHolds.reduce((sum, h) => sum + (h.total_participants || 0), 0)
    }

    const available = effectiveCapacity - totalBooked
    if (totalParticipants > available) {
      return res.status(200).json(
        gygError("NO_AVAILABILITY", `Insufficient availability. Requested ${totalParticipants}; available ${Math.max(0, available)}.`)
      )
    }

    // Create the reservation hold – GYG requires ISO 8601 without milliseconds
    const expiresAt = new Date(Date.now() + product.reserveHoldMinutes * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z")

    const { data: reservation, error } = await supabase
      .from("gyg_reservations")
      .insert({
        product_id: productId,
        gyg_booking_ref: gygBookingReference,
        gyg_activity_ref: gygActivityReference || null,
        date_time: dateTime,
        booking_items: bookingItems,
        total_participants: totalParticipants,
        status: "active",
        expires_at: expiresAt,
      })
      .select("id")
      .single()

    if (error) {
      return res.status(200).json(
        gygError("INTERNAL_SYSTEM_FAILURE", `Failed to create reservation: ${error.message}`)
      )
    }

    return res.status(200).json({
      data: {
        reservationReference: reservation.id,
        reservationExpiration: expiresAt,
      },
    })
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error during reservation.")
    )
  }
}
