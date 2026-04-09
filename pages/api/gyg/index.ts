import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { timingSafeEqual } from "crypto"

/* ────────────────────────────────────────────────────────────────
   HTTP Basic Auth – compared with timing-safe equality
   ──────────────────────────────────────────────────────────────── */

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function authenticate(req: NextApiRequest): boolean {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Basic ")) return false

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8")
  const idx = decoded.indexOf(":")
  if (idx === -1) return false

  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)
  const expectedUser = process.env.GYG_USER ?? ""
  const expectedPass = process.env.GYG_PASSWORD ?? ""

  if (!expectedUser || !expectedPass) return false

  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)
}

/* ────────────────────────────────────────────────────────────────
   Handler
   ──────────────────────────────────────────────────────────────── */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  /* ---------- Auth ---------- */
  if (!authenticate(req)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="GYG Supplier API"')
    return res.status(401).json({ data: { errorCode: "UNAUTHORIZED", errorMessage: "Invalid credentials" } })
  }

  /* ================================================================
     GET  →  /api/gyg?action=availability  (Get Availabilities)
             Equivalent to  /1/get-availabilities/
     ================================================================ */
  if (req.method === "GET") {
    const productId = (req.query.productId as string) || "default"
    const dateTime = (req.query.dateTime as string) || new Date().toISOString()

    return res.status(200).json({
      data: {
        availabilities: [
          {
            productId,
            dateTime,
            vacancies: 50,
          },
        ],
      },
    })
  }

  /* ---------- Only POST beyond this point ---------- */
  if (req.method !== "POST") {
    return res.status(405).json({ data: { errorCode: "METHOD_NOT_ALLOWED", errorMessage: "Use GET or POST" } })
  }

  const body = req.body

  /* ================================================================
     POST + bookingReference  →  BOOK  (Confirmation)
     ================================================================ */
  if (body.bookingReference) {
    const { bookingReference } = body

    const { data, error } = await supabase
      .from("saona_reservations")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", bookingReference)
      .select("id")
      .single()

    if (error) {
      return res.status(500).json({
        data: { errorCode: "INTERNAL_ERROR", errorMessage: error.message },
      })
    }

    return res.status(200).json({
      data: {
        bookingReference: data.id,
        tickets: [
          {
            ticketCode: `SAO-${data.id}`,
            ticketCodeType: "TEXT",
          },
        ],
      },
    })
  }

  /* ================================================================
     POST sin bookingReference  →  RESERVE
     ================================================================ */
  const traveler = body.travelers?.[0] || {}

  const customerName = [traveler.firstName, traveler.lastName]
    .filter(Boolean)
    .join(" ") || "Guest"

  const totalGuests = Array.isArray(body.bookingItems)
    ? body.bookingItems.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
    : 1

  const dateOnly = body.dateTime
    ? body.dateTime.split("T")[0]
    : new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("saona_reservations")
    .insert({
      customer_name: customerName,
      phone: traveler.phone || "",
      email: traveler.email || "",
      hotel: body.travelerHotel || "",
      location: "",
      guests: totalGuests,
      children: 0,
      pickup_time: "",
      boat_type: "catamaran",
      channel: "GetYourGuide",
      channel_url: "",
      channel_color: "#ef4444",
      date: dateOnly,
      status: "confirmed",
      amount: null,
      notes: body.bookingId ? `GYG Booking: ${body.bookingId}` : "",
      lunch_included: true,
      drink_package: "standard",
    })
    .select("id")
    .single()

  if (error) {
    return res.status(500).json({
      data: { errorCode: "INTERNAL_ERROR", errorMessage: error.message },
    })
  }

  return res.status(200).json({
    data: {
      bookingReference: data.id,
    },
  })
}
