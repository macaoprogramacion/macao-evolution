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

    // Run all 3 Supabase queries in parallel to minimize latency
    const now = new Date().toISOString()
    const [overridesResult, reservationsResult, holdsResult] = await Promise.all([
      supabase
        .from("gyg_availability_overrides")
        .select("date, manual_vacancies, is_blocked")
        .eq("product_id", productId)
        .gte("date", fromDate)
        .lte("date", toDate),
      supabase
        .from(product.destinationTable)
        .select("date, guests, children")
        .gte("date", fromDate)
        .lte("date", toDate)
        .in("status", ["confirmed", "pending"]),
      supabase
        .from("gyg_reservations")
        .select("date_time, total_participants")
        .eq("product_id", productId)
        .eq("status", "active")
        .gte("expires_at", now),
    ])

    const { data: manualOverrides, error: overridesError } = overridesResult
    const { data: existingReservations } = reservationsResult
    const { data: activeHolds } = holdsResult

    // Keep integration backwards compatible if migration has not been applied yet.
    if (overridesError && !overridesError.message?.includes("gyg_availability_overrides")) {
      console.error("Failed to read availability overrides:", overridesError)
    }

    const overridesByDate: Record<string, { manualVacancies: number | null; isBlocked: boolean }> = {}
    if (manualOverrides) {
      for (const o of manualOverrides) {
        overridesByDate[o.date] = {
          manualVacancies: typeof o.manual_vacancies === "number" ? o.manual_vacancies : null,
          isBlocked: Boolean(o.is_blocked),
        }
      }
    }

    // Build a map of booked guests per date
    const bookedPerDate: Record<string, number> = {}
    if (existingReservations) {
      for (const r of existingReservations) {
        const d = r.date
        bookedPerDate[d] = (bookedPerDate[d] || 0) + (r.guests || 0) + (r.children || 0)
      }
    }

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
    const todayStr = new Date().toISOString().split("T")[0]

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]
      const booked = bookedPerDate[dateStr] || 0
      const dateOverride = overridesByDate[dateStr]
      const effectiveCapacity = dateOverride?.manualVacancies ?? product.defaultVacancies
      const isBlockedByOverride = dateOverride?.isBlocked === true
      // Past dates have 0 vacancies
      const vacancies = dateStr < todayStr || isBlockedByOverride ? 0 : Math.max(0, effectiveCapacity - booked)

      const pricesByCategory = {
        retailPrices: product.prices.map((p) => ({
          category: p.category as any,
          price: p.price,
        })),
      }

      // Build tiered prices if configured
      const tieredPricesByCategory = product.tieredPrices?.length
        ? {
            tieredRetailPrices: product.tieredPrices.map((tp) => ({
              category: tp.category,
              tiers: tp.tiers.map((t) => ({
                minParticipants: t.minParticipants,
                maxParticipants: t.maxParticipants,
                price: t.price,
              })),
            })),
          }
        : undefined

      // Build per-category or aggregated vacancies.
      // If explicit per-category limits are not configured, derive them from priced categories
      // so GYG "Availability By Ticket Category" tests still receive vacanciesByCategory.
      const configuredVacanciesByCategory = product.vacanciesByCategory && product.vacanciesByCategory.length > 0
        ? product.vacanciesByCategory
        : (product.prices?.length > 1
            ? product.prices.map((p) => ({
                category: p.category as any,
                defaultVacancies: product.defaultVacancies,
              }))
            : [])

      const hasVacanciesByCategory = configuredVacanciesByCategory.length > 0

      const vacanciesByCategoryValue = hasVacanciesByCategory
        ? configuredVacanciesByCategory.map((vc) => ({
            category: vc.category,
            vacancies: dateStr < todayStr || isBlockedByOverride ? 0 : Math.max(0, vc.defaultVacancies - booked),
          }))
        : undefined

      if (product.type === "time_period" && product.openingTimes && product.openingTimes.length > 0) {
        // Time period entry: T00:00:00 with openingTimes
        const timePeriodDateTime = `${dateStr}T00:00:00${product.timezone}`
        const item: any = {
          productId: product.id,
          dateTime: timePeriodDateTime,
          cutoffSeconds: product.cutoffSeconds,
          openingTimes: product.openingTimes,
          currency: product.currency,
          ...(hasVacanciesByCategory
            ? { vacanciesByCategory: vacanciesByCategoryValue }
            : { vacancies }),
          pricesByCategory,
          ...(tieredPricesByCategory ? { tieredPricesByCategory } : {}),
        }
        availabilities.push(item)
      } else {
        // Time point entry: specific departure time (e.g. 07:30 AM)
        const timePointDateTime = `${dateStr}T07:30:00${product.timezone}`
        const item: any = {
          productId: product.id,
          dateTime: timePointDateTime,
          cutoffSeconds: product.cutoffSeconds,
          currency: product.currency,
          ...(hasVacanciesByCategory
            ? { vacanciesByCategory: vacanciesByCategoryValue }
            : { vacancies }),
          pricesByCategory,
          ...(tieredPricesByCategory ? { tieredPricesByCategory } : {}),
        }
        availabilities.push(item)
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
