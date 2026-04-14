import type { NextApiRequest, NextApiResponse } from "next"
import { randomBytes } from "crypto"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"
import type { BookingRequest, Ticket, TicketCategory } from "@/lib/gyg/types"

/**
 * POST /api/gyg/book
 * GYG calls: POST /1/book/
 *
 * Converts a reservation hold into a confirmed booking.
 * Routes to the correct table based on product:
 *   909291  → saona_reservations  → admin/operation-saona
 *   1068932 → samana_reservations → admin/operation-samana
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only POST is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  try {
    const body = req.body as BookingRequest
    const data = body?.data

    if (!data) {
      return res.status(200).json(gygError("VALIDATION_FAILURE", "Missing request data."))
    }

    const {
      productId,
      reservationReference,
      gygBookingReference,
      gygActivityReference,
      currency,
      dateTime,
      bookingItems,
      addonItems,
      language,
      travelers,
      travelerHotel,
      comment,
    } = data

    // Validate required fields
    if (!productId || !reservationReference || !gygBookingReference || !dateTime || !bookingItems || !travelers) {
      return res.status(200).json(
        gygError("VALIDATION_FAILURE", "Missing required booking fields.")
      )
    }

    const product = getProduct(productId)
    if (!product) {
      return res.status(200).json(gygError("INVALID_PRODUCT", `Product '${productId}' does not exist.`))
    }

    // Validate the reservation exists and is still active
    const { data: reservation, error: resError } = await supabase
      .from("gyg_reservations")
      .select("*")
      .eq("id", reservationReference)
      .single()

    if (resError || !reservation) {
      return res.status(200).json(
        gygError("INVALID_RESERVATION", `Reservation '${reservationReference}' not found.`)
      )
    }

    // Allow booking even if expired (GYG retries handle re-reservation)
    if (reservation.status === "booked") {
      // Idempotent: if already booked with same GYG ref, return existing booking
      const { data: existingBooking } = await supabase
        .from("gyg_bookings")
        .select("booking_reference, tickets")
        .eq("reservation_id", reservationReference)
        .eq("gyg_booking_ref", gygBookingReference)
        .single()

      if (existingBooking) {
        return res.status(200).json({
          data: {
            bookingReference: existingBooking.booking_reference,
            tickets: existingBooking.tickets,
          },
        })
      }
    }

    if (reservation.status === "cancelled") {
      return res.status(200).json(
        gygError("INVALID_RESERVATION", "Reservation has been cancelled.")
      )
    }

    // Calculate totals
    const totalParticipants = bookingItems.reduce((sum, item) => {
      if (item.category === "GROUP") return sum + (item.groupSize || 0)
      return sum + item.count
    }, 0)

    const adults = bookingItems
      .filter((i) => i.category === "ADULT")
      .reduce((s, i) => s + i.count, 0)
    const children = bookingItems
      .filter((i) => ["CHILD", "INFANT", "YOUTH"].includes(i.category))
      .reduce((s, i) => s + i.count, 0)

    // Calculate total amount from retail prices
    let totalAmountCents = 0
    for (const item of bookingItems) {
      totalAmountCents += (item.retailPrice || 0) * item.count
    }
    if (addonItems) {
      for (const addon of addonItems) {
        totalAmountCents += (addon.retailPrice || 0) * addon.count
      }
    }
    const totalAmount = totalAmountCents / 100 // Convert cents to dollars

    // Lead traveler
    const leadTraveler = travelers[0]
    const customerName = `${leadTraveler?.firstName || ""} ${leadTraveler?.lastName || ""}`.trim() || "GYG Guest"

    const dateOnly = dateTime.split("T")[0]
    const timeMatch = dateTime.match(/T(\d{2}:\d{2})/)
    const pickupTime = timeMatch ? timeMatch[1] : "07:30"

    // Generate a short booking reference (max 25 chars per spec)
    const refPrefix = product.destinationTable === "samana_reservations" ? "SAM" : "SAO"
    const bookingReference = `${refPrefix}-${randomBytes(4).toString("hex").toUpperCase()}`

    // Generate tickets — one per individual participant (or 1 COLLECTIVE)
    const tickets: Ticket[] = []
    for (const item of bookingItems) {
      if (item.category === "GROUP") {
        tickets.push({
          category: item.category as TicketCategory,
          ticketCode: `${bookingReference}-G${tickets.length + 1}`,
          ticketCodeType: "QR_CODE",
        })
      } else {
        for (let i = 0; i < item.count; i++) {
          tickets.push({
            category: item.category as TicketCategory,
            ticketCode: `${bookingReference}-${item.category[0]}${tickets.length + 1}`,
            ticketCodeType: "QR_CODE",
          })
        }
      }
    }

    // Build the notes field
    const noteParts = [
      `GYG Ref: ${gygBookingReference}`,
      comment && comment.trim() !== "\\n" ? `Comment: ${comment}` : "",
      language ? `Language: ${language}` : "",
    ].filter(Boolean)

    // Build common insert fields (shared between saona and samana tables)
    const commonFields: Record<string, any> = {
      customer_name: customerName,
      phone: leadTraveler?.phoneNumber || "",
      email: leadTraveler?.email || "",
      hotel: travelerHotel || "",
      location: "",
      guests: adults || totalParticipants,
      children: children,
      pickup_time: pickupTime,
      channel: "GetYourGuide",
      channel_url: "https://www.getyourguide.com",
      channel_color: "#FF5533",
      date: dateOnly,
      status: "confirmed",
      amount: totalAmount > 0 ? totalAmount : null,
      notes: noteParts.join(" | "),
      gyg_booking_ref: gygBookingReference,
      gyg_booking_reference: bookingReference,
      ...(language ? { language } : {}),
    }

    // Merge product-specific extra fields (boat_type, tour_type, etc.)
    const insertPayload = { ...commonFields, ...(product.extraInsertFields || {}) }

    // Insert into the correct destination table
    let destRow: { id: string } | null = null
    let destError: any = null

    ;({ data: destRow, error: destError } = await supabase
      .from(product.destinationTable)
      .insert(insertPayload)
      .select("id")
      .single())

    // If insert failed because of missing 'language' column, retry without it
    if (destError && destError.message?.includes("language")) {
      const { language: _lang, ...payloadWithoutLang } = insertPayload
      ;({ data: destRow, error: destError } = await supabase
        .from(product.destinationTable)
        .insert(payloadWithoutLang)
        .select("id")
        .single())
    }

    if (destError || !destRow) {
      return res.status(200).json(
        gygError("INTERNAL_SYSTEM_FAILURE", `Failed to create booking record: ${destError?.message}`)
      )
    }

    // Insert into gyg_bookings for tracking
    const { error: gygBookError } = await supabase.from("gyg_bookings").insert({
      reservation_id: reservationReference,
      saona_reservation_id: destRow.id, // points to either saona or samana row
      product_id: productId,
      gyg_booking_ref: gygBookingReference,
      gyg_activity_ref: gygActivityReference || null,
      booking_reference: bookingReference,
      date_time: dateTime,
      currency: currency || "USD",
      booking_items: bookingItems,
      addon_items: addonItems || [],
      travelers: travelers,
      traveler_hotel: travelerHotel || null,
      comment: comment || null,
      language: language || null,
      tickets: tickets,
      total_participants: totalParticipants,
      status: "confirmed",
    })

    if (gygBookError) {
      console.error("Failed to insert gyg_bookings record:", gygBookError.message)
      // Non-fatal: destination table row already created, booking is valid
    }

    // Mark the reservation as booked
    await supabase
      .from("gyg_reservations")
      .update({ status: "booked", updated_at: new Date().toISOString() })
      .eq("id", reservationReference)

    return res.status(200).json({
      data: {
        bookingReference,
        tickets,
      },
    })
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error during booking.")
    )
  }
}
