import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { PRODUCTS, type ProductConfig } from "@/lib/gyg/config"

/**
 * POST /api/gyg/push-availability
 *
 * Internal endpoint (not called by GYG) to push availability updates TO GetYourGuide.
 * Call this when availability changes (new booking, cancellation, manual edit, etc.)
 *
 * Body: { productId: string, date: string } or { productId: string, fromDate: string, toDate: string }
 *
 * Uses GYG's notify-availability-update endpoint:
 * POST https://supplier-api.getyourguide.com/1/notify-availability-update
 */

const GYG_API_BASE = (process.env.GYG_API_BASE_URL || "https://supplier-api.getyourguide.com").trim()
const GYG_API_USER = (process.env.GYG_API_USER || "").trim()
const GYG_API_PASS = (process.env.GYG_API_PASSWORD || "").trim()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Simple internal auth - require a secret header to prevent external calls
  const internalSecret = req.headers["x-internal-secret"]
  if (internalSecret !== process.env.GYG_INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const { productId, date, fromDate, toDate } = req.body

    if (!productId) {
      return res.status(400).json({ error: "productId is required" })
    }

    const product = PRODUCTS[productId]
    if (!product) {
      return res.status(400).json({ error: `Product '${productId}' not found` })
    }

    const startDate = date || fromDate || new Date().toISOString().split("T")[0]
    const endDate = date || toDate || startDate

    // Build availabilities to push
    const availabilities = await buildAvailabilities(product, startDate, endDate)

    if (!GYG_API_USER || !GYG_API_PASS) {
      return res.status(200).json({
        message: "GYG API credentials not configured. Availability not pushed.",
        availabilities,
      })
    }

    // Push to GYG
    const authHeader = "Basic " + Buffer.from(`${GYG_API_USER}:${GYG_API_PASS}`).toString("base64")

    const gygResponse = await fetch(`${GYG_API_BASE}/1/notify-availability-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ data: { availabilities } }),
    })

    const gygData = await gygResponse.json()

    return res.status(200).json({
      message: "Availability pushed to GYG",
      gygStatus: gygResponse.status,
      gygResponse: gygData,
      availabilities,
    })
  } catch (err: any) {
    console.error("[GYG Push Availability Error]", err)
    return res.status(500).json({ error: err.message })
  }
}

async function buildAvailabilities(product: ProductConfig, fromDate: string, toDate: string) {
  const availabilities: any[] = []

  // Get booked counts per date from the correct destination table
  const { data: existing } = await supabase
    .from(product.destinationTable)
    .select("date, guests, children")
    .gte("date", fromDate)
    .lte("date", toDate)
    .in("status", ["confirmed", "pending"])

  const bookedPerDate: Record<string, number> = {}
  if (existing) {
    for (const r of existing) {
      bookedPerDate[r.date] = (bookedPerDate[r.date] || 0) + (r.guests || 0) + (r.children || 0)
    }
  }

  // Active GYG holds
  const { data: holds } = await supabase
    .from("gyg_reservations")
    .select("date_time, total_participants")
    .eq("product_id", product.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())

  if (holds) {
    for (const h of holds) {
      const d = new Date(h.date_time).toISOString().split("T")[0]
      bookedPerDate[d] = (bookedPerDate[d] || 0) + (h.total_participants || 0)
    }
  }

  const current = new Date(fromDate)
  const end = new Date(toDate)

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0]
    const booked = bookedPerDate[dateStr] || 0
    const vacancies = Math.max(0, product.defaultVacancies - booked)

    const dateTime =
      product.type === "time_point"
        ? `${dateStr}T07:30:00${product.timezone}`
        : `${dateStr}T00:00:00${product.timezone}`

    availabilities.push({
      productId: product.id,
      dateTime,
      vacancies,
      currency: product.currency,
      pricesByCategory: {
        retailPrices: product.prices.map((p) => ({
          category: p.category,
          price: p.price,
        })),
      },
    })

    current.setDate(current.getDate() + 1)
  }

  return availabilities
}
