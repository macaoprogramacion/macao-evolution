import type { NextApiRequest, NextApiResponse } from "next"
import { PRODUCTS } from "@/lib/gyg/config"

/**
 * POST /api/gyg/sandbox-test
 *
 * Runs all 6 GYG Supplier API sandbox tests:
 *   1. PUSH_AVAILABILITY          → notify-availability-update (no price)
 *   2. PUSH_AVAILABILITY_WITH_PRICE → notify-availability-update (with price)
 *   3. DEALS_OVER_API_CREATE      → POST /deals
 *   4. DEALS_OVER_API_LIST        → GET  /deals
 *   5. DEALS_OVER_API_DELETE      → DELETE /deals/{id}
 *   6. SUPPLIER_REGISTRATION      → POST /suppliers
 *
 * Auth: requires x-internal-secret header = GYG_INTERNAL_SECRET
 */

const SANDBOX_BASE = "https://supplier-api.getyourguide.com/sandbox/1"
const GYG_API_USER = (process.env.GYG_API_USER || "").trim()
const GYG_API_PASS = (process.env.GYG_API_PASSWORD || "").trim()

function authHeader(): string {
  return "Basic " + Buffer.from(`${GYG_API_USER}:${GYG_API_PASS}`).toString("base64")
}

async function callGYG(
  method: string,
  path: string,
  body?: any,
  queryParams?: Record<string, string>
): Promise<{ status: number; data: any }> {
  let url = `${SANDBOX_BASE}${path}`
  if (queryParams) {
    const qs = new URLSearchParams(queryParams).toString()
    url += `?${qs}`
  }
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const resp = await fetch(url, opts)
  const text = await resp.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: resp.status, data }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const internalSecret = req.headers["x-internal-secret"]
  if (internalSecret !== process.env.GYG_INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (!GYG_API_USER || !GYG_API_PASS) {
    return res.status(500).json({ error: "GYG_API_USER / GYG_API_PASSWORD not configured" })
  }

  const results: Record<string, any> = {}

  // Use the Samaná product for tests
  const product = PRODUCTS["1068932"]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 30) // Use a date 30 days from now
  const dateStr = tomorrow.toISOString().split("T")[0]
  const dateTime = `${dateStr}T07:30:00${product.timezone}`

  // ──────────────────────────────────────────────────────────────
  // 1. PUSH_AVAILABILITY (no price)
  // ──────────────────────────────────────────────────────────────
  try {
    const r = await callGYG("POST", "/notify-availability-update", {
      data: {
        productId: product.id,
        availabilities: [
          {
            dateTime,
            vacancies: 35,
          },
        ],
      },
    })
    results["PUSH_AVAILABILITY"] = { status: r.status, response: r.data }
  } catch (e: any) {
    results["PUSH_AVAILABILITY"] = { error: e.message }
  }

  // ──────────────────────────────────────────────────────────────
  // 2. PUSH_AVAILABILITY_WITH_PRICE
  // ──────────────────────────────────────────────────────────────
  try {
    const r = await callGYG("POST", "/notify-availability-update", {
      data: {
        productId: product.id,
        availabilities: [
          {
            dateTime,
            vacancies: 35,
            currency: product.currency,
            pricesByCategory: {
              retailPrices: product.prices.map((p) => ({
                category: p.category,
                price: p.price,
              })),
            },
          },
        ],
      },
    })
    results["PUSH_AVAILABILITY_WITH_PRICE"] = { status: r.status, response: r.data }
  } catch (e: any) {
    results["PUSH_AVAILABILITY_WITH_PRICE"] = { error: e.message }
  }

  // ──────────────────────────────────────────────────────────────
  // 3. DEALS_OVER_API_CREATE
  // ──────────────────────────────────────────────────────────────
  const dealStartDate = dateStr
  const dealEnd = new Date(tomorrow)
  dealEnd.setDate(dealEnd.getDate() + 14)
  const dealEndDate = dealEnd.toISOString().split("T")[0]

  let createdDealId: number | null = null
  try {
    const r = await callGYG("POST", "/deals", {
      data: {
        externalProductId: product.id,
        dealName: "Last minute deal",
        dateRange: {
          start: dealStartDate,
          end: dealEndDate,
        },
        dealType: "last_minute",
        maxVacancies: 10,
        discountPercentage: 10.5,
        noticePeriodDays: 3,
      },
    })
    results["DEALS_OVER_API_CREATE"] = { status: r.status, response: r.data }

    // Extract dealId for the DELETE test
    if (r.data?.deals?.[0]?.dealId) {
      createdDealId = r.data.deals[0].dealId
    }
  } catch (e: any) {
    results["DEALS_OVER_API_CREATE"] = { error: e.message }
  }

  // ──────────────────────────────────────────────────────────────
  // 4. DEALS_OVER_API_LIST
  // ──────────────────────────────────────────────────────────────
  try {
    const r = await callGYG("GET", "/deals", undefined, {
      externalProductId: product.id,
    })
    results["DEALS_OVER_API_LIST"] = { status: r.status, response: r.data }

    // If we didn't get dealId from CREATE, try to get it from LIST
    if (!createdDealId && r.data?.deals?.[0]?.dealId) {
      createdDealId = r.data.deals[0].dealId
    }
  } catch (e: any) {
    results["DEALS_OVER_API_LIST"] = { error: e.message }
  }

  // ──────────────────────────────────────────────────────────────
  // 5. DEALS_OVER_API_DELETE
  // ──────────────────────────────────────────────────────────────
  try {
    // Use the dealId from CREATE or LIST, or use a placeholder
    const dealId = createdDealId || 36457
    const r = await callGYG("DELETE", `/deals/${dealId}`)
    results["DEALS_OVER_API_DELETE"] = { status: r.status, response: r.data }
  } catch (e: any) {
    results["DEALS_OVER_API_DELETE"] = { error: e.message }
  }

  // ──────────────────────────────────────────────────────────────
  // 6. SUPPLIER_REGISTRATION_OVER_API
  // ──────────────────────────────────────────────────────────────
  try {
    const r = await callGYG("POST", "/suppliers", {
      data: {
        externalSupplierId: "TAVISA-001",
        firstName: "Tavisa",
        lastName: "Travel",
        legalCompanyName: "Tavisa Travel SRL",
        websiteUrl: "https://www.jonathanarache.com",
        country: "DOM",
        currency: "USD",
        email: "info@jonathanarache.com",
        legalStatus: "company",
        mobileNumber: "+18095550000",
      },
    })
    results["SUPPLIER_REGISTRATION_OVER_API"] = { status: r.status, response: r.data }
  } catch (e: any) {
    results["SUPPLIER_REGISTRATION_OVER_API"] = { error: e.message }
  }

  // Summary
  const allPassed = Object.values(results).every(
    (r) => !r.error && (r.status >= 200 && r.status < 300)
  )

  return res.status(200).json({
    success: allPassed,
    summary: Object.entries(results).map(([test, r]) => ({
      test,
      status: r.error ? "ERROR" : r.status >= 200 && r.status < 300 ? "PASS" : "FAIL",
      httpStatus: r.status ?? null,
    })),
    details: results,
  })
}
