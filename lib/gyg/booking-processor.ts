import { randomBytes } from "crypto"
import { supabase } from "@/lib/supabase"
import { getProduct } from "@/lib/gyg/config"

export interface ProcessBookingResult {
  success: boolean
  error?: string
  bookingReference?: string
  destinationId?: string
  alreadyExists?: boolean
}

/**
 * Core booking insertion logic — shared by book.ts (live flow) and sync.ts (retry flow).
 * Takes raw GYG booking data and inserts into the correct destination table.
 * Idempotent: if a row with the same gyg_booking_ref already exists, returns success.
 */
export async function processBookingData(bookData: any): Promise<ProcessBookingResult> {
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
  } = bookData

  if (!productId || !gygBookingReference || !dateTime || !bookingItems || !travelers) {
    return { success: false, error: "Missing required booking fields (productId, gygBookingReference, dateTime, bookingItems, travelers)" }
  }

  const product = getProduct(productId)
  if (!product) {
    return { success: false, error: `Product '${productId}' not configured` }
  }

  // Idempotent check — if destination row already exists for this GYG ref, skip
  const { data: existing } = await supabase
    .from(product.destinationTable)
    .select("id, gyg_booking_reference")
    .eq("gyg_booking_ref", gygBookingReference)
    .maybeSingle()

  if (existing) {
    return {
      success: true,
      alreadyExists: true,
      bookingReference: existing.gyg_booking_reference,
      destinationId: existing.id,
    }
  }

  // Calculate totals
  const totalParticipants = bookingItems.reduce((sum: number, item: any) => {
    if (item.category === "GROUP") return sum + (item.groupSize || 0)
    return sum + item.count
  }, 0)

  const adults = bookingItems
    .filter((i: any) => i.category === "ADULT")
    .reduce((s: number, i: any) => s + i.count, 0)
  const children = bookingItems
    .filter((i: any) => ["CHILD", "INFANT", "YOUTH"].includes(i.category))
    .reduce((s: number, i: any) => s + i.count, 0)

  let totalAmountCents = 0
  for (const item of bookingItems) {
    totalAmountCents += (item.retailPrice || 0) * item.count
  }
  if (addonItems) {
    for (const addon of addonItems) {
      totalAmountCents += (addon.retailPrice || 0) * addon.count
    }
  }
  const totalAmount = totalAmountCents / 100

  const leadTraveler = travelers[0]
  const customerName =
    `${leadTraveler?.firstName || ""} ${leadTraveler?.lastName || ""}`.trim() || "GYG Guest"

  const dateOnly = dateTime.split("T")[0]
  const timeMatch = dateTime.match(/T(\d{2}:\d{2})/)
  const pickupTime = timeMatch ? timeMatch[1] : "07:30"

  const refPrefix = product.destinationTable === "samana_reservations" ? "SAM" : "SAO"
  const bookingReference = `${refPrefix}-${randomBytes(4).toString("hex").toUpperCase()}`

  const noteParts = [
    `GYG Ref: ${gygBookingReference}`,
    comment && comment.trim() !== "\n" ? `Comment: ${comment}` : "",
    language ? `Language: ${language}` : "",
  ].filter(Boolean)

  const commonFields: Record<string, any> = {
    customer_name: customerName,
    phone: leadTraveler?.phoneNumber || "",
    email: leadTraveler?.email || "",
    hotel: travelerHotel || "",
    location: "",
    guests: adults || totalParticipants,
    children,
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

  const insertPayload = { ...commonFields, ...(product.extraInsertFields || {}) }

  const { data: destRow, error: destError } = await supabase
    .from(product.destinationTable)
    .insert(insertPayload)
    .select("id")
    .single()

  if (destError) {
    return { success: false, error: `Insert failed: ${destError.message}` }
  }

  // Upsert into gyg_bookings for tracking (best effort)
  try {
    await supabase.from("gyg_bookings").insert({
      reservation_id: reservationReference || null,
      saona_reservation_id: destRow.id,
      product_id: productId,
      gyg_booking_ref: gygBookingReference,
      gyg_activity_ref: gygActivityReference || null,
      booking_reference: bookingReference,
      date_time: dateTime,
      currency: currency || "USD",
      booking_items: bookingItems,
      addon_items: addonItems || [],
      travelers,
      traveler_hotel: travelerHotel || null,
      comment: comment || null,
      language: language || null,
      tickets: [],
      total_participants: totalParticipants,
      status: "confirmed",
    })
  } catch {}

  return { success: true, bookingReference, destinationId: destRow.id }
}
