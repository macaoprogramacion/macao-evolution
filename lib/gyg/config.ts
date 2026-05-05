import type { NextApiRequest } from "next"
import { timingSafeEqual } from "crypto"
import type { GygError, GygErrorCode, AddonType, TicketCategory } from "./types"

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
  // Support both env naming schemes used across this project.
  const expectedUser = (process.env.GYG_USER || process.env.GYG_API_USER || "").trim()
  const expectedPass = (process.env.GYG_PASSWORD || process.env.GYG_API_PASSWORD || "").trim()

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
//   909291   → Saona Island Tour   → saona_reservations  → admin/operation-saona
//   1068932  → Samaná Tour         → samana_reservations → admin/operation-samana

export type DestinationTable = "saona_reservations" | "samana_reservations"

export interface AddonConfig {
  addonType: AddonType
  retailPrice: number
  currency: string
  addonDescription?: string
}

export interface TieredPriceConfig {
  category: TicketCategory
  tiers: { minParticipants: number; maxParticipants: number; price: number }[]
}

export interface ProductConfig {
  id: string
  name: string
  description: string
  type: "time_point" | "time_period"
  timezone: string // UTC offset, e.g. "-04:00" for Dominican Republic (AST)
  destinationTable: DestinationTable
  destinationLocation: { city: string; country: string }
  defaultVacancies: number
  /** Per-category vacancy limits; if set, availability is reported per category */
  vacanciesByCategory?: { category: TicketCategory; defaultVacancies: number }[]
  minParticipants: number
  maxParticipants: number
  currency: string
  prices: { category: string; price: number }[]
  tieredPrices?: TieredPriceConfig[]
  addons?: AddonConfig[]
  openingTimes?: { fromTime: string; toTime: string }[]
  cutoffSeconds: number
  reserveHoldMinutes: number
  /** Extra default fields to insert into the destination table */
  extraInsertFields?: Record<string, any>
}

export const SUPPLIER_ID = process.env.GYG_SUPPLIER_ID || "macao-tours"
export const SUPPLIER_NAME = process.env.GYG_SUPPLIER_NAME || "Macao Tours"

export const PRODUCTS: Record<string, ProductConfig> = {
  // ─── SAONA (GYG product 909291) ─────────────────────────────────
  "909291": {
    id: "909291",
    name: "Saona Island Tour",
    description: "Full-day excursion to Saona Island with catamaran ride, lunch, and drinks included. Enjoy pristine beaches and natural pools in one of the most beautiful Caribbean destinations.",
    type: "time_point",
    timezone: "-04:00",
    destinationTable: "saona_reservations",
    destinationLocation: { city: "Punta Cana", country: "DOM" },
    defaultVacancies: 50,
    minParticipants: 1,
    maxParticipants: 30,
    currency: "USD",
    prices: [
      { category: "ADULT", price: 9500 },  // $95.00
      { category: "CHILD", price: 6500 },  // $65.00
    ],
    addons: [
      { addonType: "FOOD", retailPrice: 1500, currency: "USD", addonDescription: "Premium lunch upgrade" },
      { addonType: "DRINKS", retailPrice: 1000, currency: "USD", addonDescription: "Premium drink package" },
      { addonType: "TRANSPORT", retailPrice: 2500, currency: "USD", addonDescription: "Hotel pickup shuttle" },
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
    description: "Full-day adventure to the Samaná Peninsula including visits to Limón waterfall, whale watching (seasonal), and the charming town of Las Terrenas.",
    type: "time_point",
    timezone: "-04:00",
    destinationTable: "samana_reservations",
    destinationLocation: { city: "Punta Cana", country: "DOM" },
    defaultVacancies: 40,
    minParticipants: 1,
    maxParticipants: 20,
    currency: "USD",
    prices: [
      { category: "ADULT", price: 11500 }, // $115.00
    ],
    addons: [
      { addonType: "FOOD", retailPrice: 1500, currency: "USD", addonDescription: "Premium lunch upgrade" },
      { addonType: "TRANSPORT", retailPrice: 3000, currency: "USD", addonDescription: "Hotel pickup shuttle" },
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
