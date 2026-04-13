import type { NextApiRequest } from "next"
import { timingSafeEqual } from "crypto"
import type { GygError, GygErrorCode } from "./types"

// ─── Authentication ─────────────────────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function authenticate(req: NextApiRequest): boolean {
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

// ─── Error helpers ──────────────────────────────────────────────────────────

export function gygError(code: GygErrorCode, message: string, extra?: Partial<GygError>) {
  return { errorCode: code, errorMessage: message, ...extra }
}

export function authError() {
  return gygError("AUTHORIZATION_FAILURE", "The provided authentication credentials are not valid.")
}

// ─── Product configuration ──────────────────────────────────────────────────
// Maps product IDs to their configuration.
// GYG product codes:
//   90929    → Saona Island Tour   → saona_reservations  → admin/operation-saona
//   1068932  → Samaná Tour         → samana_reservations → admin/operation-samana

export type DestinationTable = "saona_reservations" | "samana_reservations"

export interface ProductConfig {
  id: string
  name: string
  type: "time_point" | "time_period"
  timezone: string // UTC offset, e.g. "-04:00" for Dominican Republic (AST)
  destinationTable: DestinationTable
  defaultVacancies: number
  minParticipants: number
  maxParticipants: number
  currency: string
  prices: { category: string; price: number }[]
  openingTimes?: { fromTime: string; toTime: string }[]
  cutoffSeconds: number
  reserveHoldMinutes: number
  /** Extra default fields to insert into the destination table */
  extraInsertFields?: Record<string, any>
}

export const PRODUCTS: Record<string, ProductConfig> = {
  // ─── SAONA (GYG product 90929) ──────────────────────────────────
  "90929": {
    id: "90929",
    name: "Saona Island Tour",
    type: "time_point",
    timezone: "-04:00",
    destinationTable: "saona_reservations",
    defaultVacancies: 50,
    minParticipants: 1,
    maxParticipants: 30,
    currency: "USD",
    prices: [
      { category: "ADULT", price: 9500 },  // $95.00
      { category: "CHILD", price: 6500 },  // $65.00
    ],
    openingTimes: [
      { fromTime: "06:00", toTime: "18:00" },
    ],
    cutoffSeconds: 86400, // 24h before
    reserveHoldMinutes: 60,
    extraInsertFields: {
      boat_type: "catamaran",
      lunch_included: true,
      drink_package: "standard",
    },
  },

  // ─── SAMANÁ (GYG product 1068932) ──────────────────────────────
  "1068932": {
    id: "1068932",
    name: "Samaná Tour",
    type: "time_point",
    timezone: "-04:00",
    destinationTable: "samana_reservations",
    defaultVacancies: 40,
    minParticipants: 1,
    maxParticipants: 25,
    currency: "USD",
    prices: [
      { category: "ADULT", price: 11500 }, // $115.00
      { category: "CHILD", price: 7500 },  // $75.00
    ],
    openingTimes: [
      { fromTime: "06:00", toTime: "19:00" },
    ],
    cutoffSeconds: 86400,
    reserveHoldMinutes: 60,
    extraInsertFields: {
      tour_type: "full_day",
      lunch_included: true,
      whale_watching: false,
    },
  },
}

export function getProduct(productId: string): ProductConfig | undefined {
  return PRODUCTS[productId]
}
