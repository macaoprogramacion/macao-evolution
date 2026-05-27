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
  machineType?: "shared_atv" | "single_atv" | "shared_buggy" | "family_buggy" | "single_buggy" | "vip_shared_predator" | "vip_family_predator"
  machineLabel?: string
  machineCapacity?: number
  machineCount?: number
  normalizedExperience?: string
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

type MachineCatalogRule = {
  machineType: NonNullable<ParsedExternalReservation["machineType"]>
  machineLabel: string
  machineCapacity: number
  normalizedExperience: string
  perPersonPrice?: number
  groupPriceByPeople?: Record<number, number>
}

const MACHINE_CATALOG: MachineCatalogRule[] = [
  {
    machineType: "shared_atv",
    machineLabel: "Shared ATV",
    machineCapacity: 2,
    normalizedExperience: "Doble Moto",
    perPersonPrice: 69,
  },
  {
    machineType: "single_atv",
    machineLabel: "ATV",
    machineCapacity: 1,
    normalizedExperience: "Single Moto",
    perPersonPrice: 75,
  },
  {
    machineType: "shared_buggy",
    machineLabel: "Shared Buggy",
    machineCapacity: 2,
    normalizedExperience: "Buggy Doble",
    perPersonPrice: 75,
  },
  {
    machineType: "family_buggy",
    machineLabel: "Family Buggy",
    machineCapacity: 4,
    normalizedExperience: "Family Buggy",
    groupPriceByPeople: {
      1: 75,
      2: 90,
      3: 98.01,
      4: 110,
    },
  },
  {
    machineType: "single_buggy",
    machineLabel: "Single Buggy",
    machineCapacity: 1,
    normalizedExperience: "Buggy Single",
    perPersonPrice: 96,
  },
  {
    machineType: "vip_shared_predator",
    machineLabel: "Shared VIP Predator",
    machineCapacity: 2,
    normalizedExperience: "VIP Shared Predator",
    perPersonPrice: 69,
  },
  {
    machineType: "vip_family_predator",
    machineLabel: "VIP Family Predator",
    machineCapacity: 4,
    normalizedExperience: "VIP Family Predator",
    perPersonPrice: 69,
  },
]

type MachineAliasRule = {
  pattern: RegExp
  machineType: NonNullable<ParsedExternalReservation["machineType"]> | null
}

const MACHINE_OPTION_ALIASES: MachineAliasRule[] = [
  { pattern: /shared\s*vip\s*(predator|predactor|predacter)|vip\s*(predator|predactor|predacter)\s*shared|predator\s*vip\s*shared|predactor\s*vip\s*shared/i, machineType: "vip_shared_predator" },
  { pattern: /shared\s*atv/i, machineType: "shared_atv" },
  { pattern: /shared\s*buggy/i, machineType: "shared_buggy" },
  { pattern: /vip\s*family|family\s*vip|vip\s*family\s*(predator|predactor|predacter)|vip\s*(predator|predactor|predacter)\s*family|predator\s*vip\s*family|predactor\s*vip\s*family/i, machineType: "vip_family_predator" },
  { pattern: /\bvip\b.*\b(predator|predactor|predacter)\b/i, machineType: "vip_shared_predator" },
  { pattern: /family\s*buggy|familiar\s*predator|familiar\s*predactor/i, machineType: "family_buggy" },
  { pattern: /single\s*buggy|individual\s*buggy|individual\b.*\bbuggy/i, machineType: "single_buggy" },
  { pattern: /\batv\b|quad\s*four\s*wheeler/i, machineType: "single_atv" },
  { pattern: /sunset\s*tour|sunset\s*ride/i, machineType: null },
  { pattern: /\bcaballos\b|horseback|horse\s*ride|equestrian/i, machineType: null },
]

function getRuleByType(machineType: NonNullable<ParsedExternalReservation["machineType"]>) {
  return MACHINE_CATALOG.find((rule) => rule.machineType === machineType) || null
}

function inferMachineTypeFromText(optionTitle?: string, productTitle?: string) {
  const optionSource = normalizeText(optionTitle || "")
  const productSource = normalizeText(productTitle || "")
  const source = `${optionSource} ${productSource}`.trim()

  for (const alias of MACHINE_OPTION_ALIASES) {
    if (alias.pattern.test(optionSource)) {
      if (alias.machineType === null) return null
      return getRuleByType(alias.machineType)
    }
  }

  for (const alias of MACHINE_OPTION_ALIASES) {
    if (alias.pattern.test(source)) {
      if (alias.machineType === null) return null
      return getRuleByType(alias.machineType)
    }
  }

  const hasShared = /\bshared\b/.test(source)
  const hasAtv = /\batv\b|quad\s*four\s*wheeler/.test(source)
  const hasBuggy = /\bbuggy\b/.test(source)
  const hasFamily = /\bfamily\b|\bfamiliar\b/.test(source)
  const hasVip = /\bvip\b/.test(source)
  const hasPredator = /predator|predactor|predacter/.test(source)
  const hasSingle = /\bsingle\b|\bindividual\b|1\s*pax/.test(source)

  if (hasVip && hasFamily && hasPredator) {
    return getRuleByType("vip_family_predator")
  }

  if (hasVip && hasShared && hasPredator) {
    return getRuleByType("vip_shared_predator")
  }

  if (hasVip && hasPredator && hasFamily) {
    return getRuleByType("vip_family_predator")
  }

  if (hasVip && hasPredator) {
    return getRuleByType("vip_shared_predator")
  }

  if (hasFamily && hasPredator && !hasVip) {
    return getRuleByType("family_buggy")
  }

  if ((hasFamily && hasBuggy) || /punta\s*cana\s*family\s*buggy/.test(source)) {
    return getRuleByType("family_buggy")
  }

  if (hasBuggy && hasSingle) {
    return getRuleByType("single_buggy")
  }

  if (hasShared && hasBuggy) {
    return getRuleByType("shared_buggy")
  }

  if (hasAtv && hasShared) {
    return getRuleByType("shared_atv")
  }

  if (hasAtv) {
    return getRuleByType("single_atv")
  }

  return null
}

function getAmountDistance(rule: MachineCatalogRule, totalPeople: number, amount: number) {
  const expectedValues: number[] = []

  if (rule.groupPriceByPeople && totalPeople > 0) {
    const direct = rule.groupPriceByPeople[totalPeople]
    if (direct != null) expectedValues.push(direct)
  }

  if (rule.perPersonPrice && totalPeople > 0) {
    expectedValues.push(rule.perPersonPrice)
    expectedValues.push(rule.perPersonPrice * totalPeople)
  }

  if (expectedValues.length === 0) return Number.POSITIVE_INFINITY

  return expectedValues.reduce((best, expected) => {
    const normalized = Math.abs(amount - expected) / Math.max(1, expected)
    return Math.min(best, normalized)
  }, Number.POSITIVE_INFINITY)
}

function inferMachineTypeFromPeopleAndPrice(totalPeople: number, amount?: number, hint?: MachineCatalogRule | null) {
  if (hint) return hint
  if (totalPeople <= 0) return null
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null

  const candidates = MACHINE_CATALOG

  let selected: MachineCatalogRule | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const rule of candidates) {
    const score = getAmountDistance(rule, totalPeople, amount)
    if (score < bestScore) {
      bestScore = score
      selected = rule
    }
  }

  // Avoid wild guesses when price clearly doesn't match any known rule.
  if (!selected || bestScore > 0.45) return null
  return selected
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseMoney(value: string) {
  const cleaned = value.replace(/\s/g, "")
  const hasComma = cleaned.includes(",")
  const hasDot = cleaned.includes(".")

  let normalized = cleaned
  if (hasComma && hasDot) {
    // Keep the last separator as decimal and strip the other as thousands separator.
    normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(/,/g, ".")
      : cleaned.replace(/,/g, "")
  } else if (hasComma) {
    normalized = /,\d{1,2}$/.test(cleaned)
      ? cleaned.replace(/\./g, "").replace(/,/g, ".")
      : cleaned.replace(/,/g, "")
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseSpanishDate(day: string, monthRaw: string, year: string) {
  const monthMap: Record<string, number> = {
    ene: 0,
    enero: 0,
    feb: 1,
    febrero: 1,
    mar: 2,
    marzo: 2,
    abr: 3,
    abril: 3,
    may: 4,
    mayo: 4,
    jun: 5,
    junio: 5,
    jul: 6,
    julio: 6,
    ago: 7,
    agosto: 7,
    sep: 8,
    sept: 8,
    septiembre: 8,
    oct: 9,
    octubre: 9,
    nov: 10,
    noviembre: 10,
    dic: 11,
    diciembre: 11,
  }

  const key = monthRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const month = monthMap[key]
  if (month == null) return undefined

  const parsedDate = new Date(Number(year), month, Number(day), 12, 0, 0, 0)
  return Number.isNaN(parsedDate.getTime()) ? undefined : toDateInputValue(parsedDate)
}

export function parseExternalReservationText(rawText: string): ParsedExternalReservation {
  const text = rawText.replace(/\r/g, "")
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const lowerText = text.toLowerCase()

  const result: ParsedExternalReservation = {
    source: /getyourguide|\bgyg[A-Z0-9]/i.test(text)
      ? "gyg"
      : /\bviator\b|\bBR-\d{6,}\b|\bVIA-\d{6,}\b/i.test(text)
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

  if (!result.bookingReference) {
    const viatorRef = text.match(/\bBR-\d{6,}\b/i)
    if (viatorRef?.[0]) {
      result.bookingReference = viatorRef[0]
    }
  }

  const topTitle = lines.find(
    (line) =>
      line.length > 6
      && !/(hide details|ocultar detalles|confirmaci[oó]n|confirmada|enviada|historial|imprimir|reembolsar|no-show|viajero principal|nombres de los viajeros|idioma de la excursi[oó]n|servicios incluidos|requisitos especiales|punto de recogida|origen de las reservas|c[oó]digo del producto|n[uú]mero de confirmaci[oó]n|autorizada por la api|importe que recibir[aá])/i.test(line),
  )
  if (topTitle) {
    result.productTitle = topTitle
  }

  const optionLine = lines.find((line) => /^option\s*:/i.test(line))
  if (optionLine) {
    result.optionTitle = optionLine.replace(/^option\s*:\s*/i, "").trim()
  } else {
    const optionFallback = lines.find((line) => /(saona|saman[aá]|macao|exclusive|tour|party\s*boat|paryboat|family)/i.test(line) && /\b\d{1,2}:\d{2}\b/.test(line))
    if (optionFallback) {
      result.optionTitle = optionFallback
    }
  }

  const leadLine = lines.find((line) => /^(lead traveler|viajero principal)\s*:/i.test(line))
  if (leadLine) {
    const name = leadLine.replace(/^(lead traveler|viajero principal)\s*:/i, "").replace(/\([^)]*\)/g, "").trim()
    if (name) result.customerName = name
  } else {
    const leadIdx = lines.findIndex((line) => /lead traveler/i.test(line))
    if (leadIdx >= 0 && lines[leadIdx + 1]) {
      const name = lines[leadIdx + 1].replace(/\([^)]*\)/g, "").trim()
      if (name) result.customerName = name
    }
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

  if (!result.reservationDate) {
    const esDate = text.match(/(?:lun|mar|mi[eé]|jue|vie|s[áa]b|dom)\.?[,]?\s*(\d{1,2})\s+([a-zA-Záéíóúñ]+)\s+(\d{4})/i)
    if (esDate) {
      result.reservationDate = parseSpanishDate(esDate[1], esDate[2], esDate[3])
    }
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

  if (!result.pickupTime) {
    const optionTime = (result.optionTitle || "").match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
    if (optionTime) {
      const hh = Number(optionTime[1])
      const mm = optionTime[2]
      const ampm = hh >= 12 ? "PM" : "AM"
      const h12 = hh % 12 === 0 ? 12 : hh % 12
      result.pickupTime = `${h12}:${mm} ${ampm}`
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
  const adultsLineEs = text.match(/(\d+)\s+adultos?/i)
  if (adultsLineEs) {
    result.guests = Number(adultsLineEs[1]) || result.guests
  }
  const childrenLine = text.match(/(\d+)\s+Children/i)
  if (childrenLine) {
    result.children = Number(childrenLine[1]) || 0
  }
  const youthLineEs = text.match(/(\d+)\s+j[oó]venes?/i)
  if (youthLineEs) {
    result.children = Number(youthLineEs[1]) || result.children || 0
  }
  const childrenLineEs = text.match(/(\d+)\s+ni[nñ]os?/i)
  if (childrenLineEs) {
    result.children = Number(childrenLineEs[1]) || result.children || 0
  }

  const langMatch = text.match(/Live guide:\s*([A-Za-zÀ-ÿ]+)/i)
  if (langMatch) {
    result.language = langMatch[1]
  } else {
    const langMatchEs = text.match(/Idioma[^:\n]*:\s*([A-Za-zÀ-ÿ]+)/i)
    if (langMatchEs) {
      result.language = langMatchEs[1]
    }
  }

  const locationIdx = lines.findIndex((line) => /^location$/i.test(line))
  if (locationIdx >= 0 && lines[locationIdx + 1]) {
    const locationLine = lines[locationIdx + 1]
    result.location = locationLine
    result.hotel = locationLine.split(",")[0]?.trim() || locationLine
  }

  if (!result.location) {
    const pickupLocation = text.match(/Punto de recogida:\s*([^\n]+)/i)
    if (pickupLocation?.[1]) {
      const locationLine = pickupLocation[1].trim()
      result.location = locationLine
      result.hotel = locationLine.split(",")[0]?.trim() || locationLine
    }
  }

  if (result.amount == null) {
    const amountMatch = text.match(/Importe que recibir[aá]:\s*([\d.,]+)\s*USD/i)
    if (amountMatch?.[1]) {
      result.amount = parseMoney(amountMatch[1])
    }
  }

  const longCodes = (text.match(/[A-Z0-9]{20,}(?:-[A-Z0-9]{4,})?/g) || []).filter((code) => code.length >= 24)
  const shortCodes = text.match(/\b(?:BR-\d{6,}|VIA-\d{6,}|GYG[A-Z0-9]{6,})\b/gi) || []

  result.ticketCodes = Array.from(new Set([...longCodes, ...shortCodes]))

  const totalPeople = Math.max(0, Number(result.guests || 0) + Number(result.children || 0))
  const machineByText = inferMachineTypeFromText(result.optionTitle, result.productTitle)
  const machine = inferMachineTypeFromPeopleAndPrice(totalPeople, result.amount, machineByText)
  if (machine) {
    result.machineType = machine.machineType
    result.machineLabel = machine.machineLabel
    result.machineCapacity = machine.machineCapacity
    result.normalizedExperience = machine.normalizedExperience

    if (totalPeople > 0) {
      result.machineCount = Math.max(1, Math.ceil(totalPeople / machine.machineCapacity))
    }
  }

  return result
}
