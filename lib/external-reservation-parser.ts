export type ParsedExternalReservation = {
  source: "gyg" | "viator" | "unknown"
  bookingReference?: string
  customerName?: string
  phone?: string
  reservationDate?: string
  pickupTime?: string
  pickupWindow?: string
  guests?: number
  children?: number
  amount?: number
  location?: string
  hotel?: string
  language?: string
  productTitle?: string
  optionTitle?: string
  ticketCodes: string[]
  includesLunch?: boolean
  includesOpenBar?: boolean
  boatType?: "catamaran" | "speedboat"
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseMoney(value: string) {
  const normalized = value.replace(/,/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseExternalReservationText(rawText: string): ParsedExternalReservation {
  const text = rawText.replace(/\r/g, "")
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const lowerText = text.toLowerCase()

  const result: ParsedExternalReservation = {
    source: /getyourguide|\bgyg[A-Z0-9]/i.test(text)
      ? "gyg"
      : /\bviator\b/i.test(text)
        ? "viator"
        : "unknown",
    ticketCodes: [],
  }

  result.includesLunch = /(food|lunch|almuerzo)/i.test(lowerText)
  result.includesOpenBar = /(open bar|premium open bar)/i.test(lowerText)

  if (/catamaran|catamar[aá]n/i.test(lowerText)) {
    result.boatType = "catamaran"
  } else if (/speedboat|lancha/i.test(lowerText)) {
    result.boatType = "speedboat"
  }

  const gygRefMatch = text.match(/\bGYG[A-Z0-9]{6,}\b/i)
  if (gygRefMatch?.[0]) {
    result.bookingReference = gygRefMatch[0]
  }

  const topTitle = lines[0]
  if (topTitle && !/hide details/i.test(topTitle)) {
    result.productTitle = topTitle
  }

  const optionLine = lines.find((line) => /^option\s*:/i.test(line))
  if (optionLine) {
    result.optionTitle = optionLine.replace(/^option\s*:\s*/i, "").trim()
  }

  const leadIdx = lines.findIndex((line) => /lead traveler/i.test(line))
  if (leadIdx >= 0 && lines[leadIdx + 1]) {
    const name = lines[leadIdx + 1].replace(/\([^)]*\)/g, "").trim()
    if (name) result.customerName = name
  }

  // Phone line often appears as a standalone value (e.g. +351912643517)
  const phoneLine = lines.find((line) => /^\+?\d[\d\s\-()]{7,}\d$/.test(line))
  if (phoneLine) {
    result.phone = phoneLine.replace(/\s+/g, "")
  }

  const dateTimeMatch = text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4})\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (dateTimeMatch) {
    const datePart = dateTimeMatch[1].replace(/(\d)(st|nd|rd|th)/gi, "$1")
    const parsedDate = new Date(`${datePart} 12:00:00`)
    if (!isNaN(parsedDate.getTime())) {
      result.reservationDate = toDateInputValue(parsedDate)
    }
    result.pickupTime = dateTimeMatch[2].toUpperCase()
  }

  const pickupWindow = text.match(/picked up between\s+(\d{1,2}:\d{2}\s*[AP]M)\s+and\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (pickupWindow) {
    result.pickupWindow = `${pickupWindow[1].toUpperCase()} - ${pickupWindow[2].toUpperCase()}`
  }

  // Explicit pickup line in GYG details (e.g. Pickup at 7:50 AM)
  const pickupAt = text.match(/pickup\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (pickupAt) {
    result.pickupTime = pickupAt[1].toUpperCase()
  }

  // Message templates can include time as 7h50 / 07h50
  if (!result.pickupTime) {
    const pickupHFormat = text.match(/(?:pickup|embarque|recogida)[^\n]{0,50}?(\d{1,2})h(\d{2})/i)
    if (pickupHFormat) {
      const h = Number(pickupHFormat[1])
      const m = pickupHFormat[2]
      const period = h >= 12 ? "PM" : "AM"
      const h12 = h % 12 === 0 ? 12 : h % 12
      result.pickupTime = `${h12}:${m} ${period}`
    }
  }

  const peopleLine = text.match(/(\d+)\s+people\s*-\s*\$([\d.,]+)/i)
  if (peopleLine) {
    result.guests = Number(peopleLine[1]) || undefined
    result.amount = parseMoney(peopleLine[2])
  }

  const adultsLine = text.match(/(\d+)\s+Adults?/i)
  if (adultsLine) {
    result.guests = Number(adultsLine[1]) || result.guests
  }
  const childrenLine = text.match(/(\d+)\s+Children/i)
  if (childrenLine) {
    result.children = Number(childrenLine[1]) || 0
  }

  const langMatch = text.match(/Live guide:\s*([A-Za-zÀ-ÿ]+)/i)
  if (langMatch) {
    result.language = langMatch[1]
  }

  const locationIdx = lines.findIndex((line) => /^location$/i.test(line))
  if (locationIdx >= 0 && lines[locationIdx + 1]) {
    const locationLine = lines[locationIdx + 1]
    result.location = locationLine
    result.hotel = locationLine.split(",")[0]?.trim() || locationLine
  }

  result.ticketCodes = Array.from(
    new Set((text.match(/[A-Z0-9]{20,}(?:-[A-Z0-9]{4,})?/g) || []).filter((code) => code.length >= 24)),
  )

  return result
}
