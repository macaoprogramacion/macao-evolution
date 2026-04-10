import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"
import type { AvailabilityResponse, AvailabilityItem } from "@/lib/gyg/types"

/**
 * GET /api/gyg/availability
 * GYG calls: GET /1/get-availabilities/?productId=X&fromDateTime=Y&toDateTime=Z
 *
 * Returns availability slots for the requested product & date range.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only GET is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  const productId = req.query.productId as string
  const fromDateTime = req.query.fromDateTime as string
  const toDateTime = req.query.toDateTime as string

  // Validate required params
  if (!productId || !fromDateTime || !toDateTime) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", "productId, fromDateTime, and toDateTime are required.")
    )
  }

  const product = getProduct(productId)
  if (!product) {
    return res.status(200).json(gygError("INVALID_PRODUCT", `Product '${productId}' does not exist.`))
  }

  try {
    const from = new Date(fromDateTime)
    const to = new Date(toDateTime)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(200).json(
        gygError("VALIDATION_FAILURE", "Invalid date format. Expected ISO 8601.")
      )
    }

    // Count existing confirmed reservations per date to calculate remaining vacancies
    const fromDate = from.toISOString().split("T")[0]
    const toDate = to.toISOString().split("T")[0]

    const { data: existingReservations } = await supabase
      .from(product.destinationTable)
      .select("date, guests, children")
      .gte("date", fromDate)
      .lte("date", toDate)
      .in("status", ["confirmed", "pending"])

    // Build a map of booked guests per date
    const bookedPerDate: Record<string, number> = {}
    if (existingReservations) {
      for (const r of existingReservations) {
        const d = r.date
        bookedPerDate[d] = (bookedPerDate[d] || 0) + (r.guests || 0) + (r.children || 0)
      }
    }

    // Also count active GYG reservations (holds) that haven't expired
    const { data: activeHolds } = await supabase
      .from("gyg_reservations")
      .select("date_time, total_participants")
      .eq("product_id", productId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())

    if (activeHolds) {
      for (const h of activeHolds) {
        const d = new Date(h.date_time).toISOString().split("T")[0]
        bookedPerDate[d] = (bookedPerDate[d] || 0) + (h.total_participants || 0)
      }
    }

    // Generate availability for each day in the range
    const availabilities: AvailabilityItem[] = []
    const current = new Date(fromDate)
    const end = new Date(toDate)

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]
      const booked = bookedPerDate[dateStr] || 0
      const vacancies = Math.max(0, product.defaultVacancies - booked)

      if (product.type === "time_point") {
        // Time point: specific departure time (e.g. 07:30 AM)
        const dateTime = `${dateStr}T07:30:00${product.timezone}`
        availabilities.push({
          productId: product.id,
          dateTime,
          vacancies,
          cutoffSeconds: product.cutoffSeconds,
          currency: product.currency,
          pricesByCategory: {
            retailPrices: product.prices.map((p) => ({
              category: p.category as any,
              price: p.price,
            })),
          },
        })
      } else {
        // Time period: opening hours
        const dateTime = `${dateStr}T00:00:00${product.timezone}`
        availabilities.push({
          productId: product.id,
          dateTime,
          vacancies,
          cutoffSeconds: product.cutoffSeconds,
          openingTimes: product.openingTimes,
          currency: product.currency,
          pricesByCategory: {
            retailPrices: product.prices.map((p) => ({
              category: p.category as any,
              price: p.price,
            })),
          },
        })
      }

      current.setDate(current.getDate() + 1)
    }

    const response: AvailabilityResponse = { data: { availabilities } }
    return res.status(200).json(response)
  } catch (err: any) {
    return res.status(200).json(
      gygError("INTERNAL_SYSTEM_FAILURE", err.message || "Unexpected error during availability query.")
    )
  }
}
