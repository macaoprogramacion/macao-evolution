// ─── Types ─────────────────────────────────────────────────────────
export interface Representative {
  id: string
  name: string
  phone: string
  email: string
  company: string
  type: "tour_operator" | "local_seller" | "hotel_concierge" | "agency"
  hotel?: string
  commissionPercent: number
  initials: string
}

export interface Booking {
  id: string
  repId: string
  repName: string
  travelerName: string
  guestCount: number
  experience: string
  pickupTime: string
  hotel: string
  salePrice: number
  amountPaid: number
  amountPending: number
  date: string
  status: "confirmed" | "pending" | "completed" | "cancelled"
  notes: string
  createdAt: string
}

export interface Experience {
  name: string
  category: string
  basePrice: number
}

// ─── Experiences catalog ───────────────────────────────────────────
export const experiences: Experience[] = [
  { name: "Elite Couple Experience", category: "Buggies", basePrice: 160 },
  { name: "Elite Family Experience", category: "Buggies", basePrice: 200 },
  { name: "Apex Predator", category: "Buggies", basePrice: 130 },
  { name: "Predator Family Experience", category: "Buggies", basePrice: 145 },
  { name: "Flintstone Era", category: "Buggies", basePrice: 85 },
  { name: "The Flintstone Family", category: "Buggies", basePrice: 100 },
  { name: "ATV Quad Experience", category: "ATV", basePrice: 90 },
  { name: "The Combined", category: "ATV + Horseback", basePrice: 90 },
  { name: "Full Ride Experience", category: "Horseback Ride", basePrice: 75 },
  { name: "Party Boat Experience", category: "Party Boat", basePrice: 120 },
  { name: "Saona Island Tour", category: "Saona Island", basePrice: 95 },
]

// ─── Hotels catalog ────────────────────────────────────────────────
export const hotels = [
  "Hard Rock Hotel & Casino",
  "Barceló Bávaro Palace",
  "Dreams Macao Beach",
  "Secrets Royal Beach",
  "Iberostar Grand Bávaro",
  "Grand Palladium Punta Cana",
  "Riu Palace Macao",
  "Bahia Principe Fantasia",
  "Majestic Elegance",
  "Lopesan Costa Bávaro",
  "Hyatt Zilara Cap Cana",
  "Club Med Punta Cana",
  "Paradisus Palma Real",
  "Excellence Punta Cana",
  "Breathless Punta Cana",
  "Occidental Caribe",
  "Ocean Blue & Sand",
  "Now Onyx Punta Cana",
  "Royalton Punta Cana",
  "Otro hotel",
]

// ─── Pickup schedule ───────────────────────────────────────────────
export const pickupTimes = [
  "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM",
  "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
]

// ─── Representatives ──────────────────────────────────────────────
export const representatives: Representative[] = [
  {
    id: "REP-001",
    name: "Carlos Méndez",
    phone: "+1 809-555-1001",
    email: "carlos.mendez@excursionesPCana.com",
    company: "Excursiones Punta Cana",
    type: "tour_operator",
    hotel: "Hard Rock Hotel & Casino",
    commissionPercent: 25,
    initials: "CM",
  },
  {
    id: "REP-002",
    name: "Ana Rodríguez",
    phone: "+1 829-555-2002",
    email: "ana.rodriguez@viajesdominicanos.com",
    company: "Viajes Dominicanos",
    type: "agency",
    commissionPercent: 20,
    initials: "AR",
  },
  {
    id: "REP-003",
    name: "Miguel Torres",
    phone: "+1 849-555-3003",
    email: "miguel.torres@barcelo.com",
    company: "Barceló Concierge",
    type: "hotel_concierge",
    hotel: "Barceló Bávaro Palace",
    commissionPercent: 30,
    initials: "MT",
  },
  {
    id: "REP-004",
    name: "Laura Peña",
    phone: "+1 809-555-4004",
    email: "laura.pena@gmail.com",
    company: "Independiente",
    type: "local_seller",
    commissionPercent: 15,
    initials: "LP",
  },
  {
    id: "REP-005",
    name: "Fernando Rosario",
    phone: "+1 829-555-5005",
    email: "f.rosario@dreamsresort.com",
    company: "Dreams Concierge",
    type: "hotel_concierge",
    hotel: "Dreams Macao Beach",
    commissionPercent: 28,
    initials: "FR",
  },
]

// ─── Mock bookings ─────────────────────────────────────────────────
export const mockBookings: Booking[] = [
  {
    id: "BK-001",
    repId: "REP-001",
    repName: "Carlos Méndez",
    travelerName: "James Wilson",
    guestCount: 2,
    experience: "Elite Couple Experience",
    pickupTime: "7:30 AM",
    hotel: "Hard Rock Hotel & Casino",
    salePrice: 200,
    amountPaid: 200,
    amountPending: 0,
    date: "2026-02-15",
    status: "confirmed",
    notes: "Aniversario de bodas, solicitan fotos",
    createdAt: "2026-02-12 09:30",
  },
  {
    id: "BK-002",
    repId: "REP-003",
    repName: "Miguel Torres",
    travelerName: "Sophie Lambert",
    guestCount: 4,
    experience: "Elite Family Experience",
    pickupTime: "10:00 AM",
    hotel: "Barceló Bávaro Palace",
    salePrice: 260,
    amountPaid: 130,
    amountPending: 130,
    date: "2026-02-15",
    status: "pending",
    notes: "2 adultos y 2 niños. Hablan francés e inglés.",
    createdAt: "2026-02-13 14:15",
  },
  {
    id: "BK-003",
    repId: "REP-002",
    repName: "Ana Rodríguez",
    travelerName: "Marco Bianchi",
    guestCount: 1,
    experience: "Apex Predator",
    pickupTime: "7:00 AM",
    hotel: "Iberostar Grand Bávaro",
    salePrice: 160,
    amountPaid: 160,
    amountPending: 0,
    date: "2026-02-14",
    status: "completed",
    notes: "",
    createdAt: "2026-02-11 11:00",
  },
  {
    id: "BK-004",
    repId: "REP-004",
    repName: "Laura Peña",
    travelerName: "Emily Chen",
    guestCount: 6,
    experience: "The Flintstone Family",
    pickupTime: "10:30 AM",
    hotel: "Majestic Elegance",
    salePrice: 140,
    amountPaid: 0,
    amountPending: 140,
    date: "2026-02-16",
    status: "pending",
    notes: "Grupo grande, confirmar disponibilidad de buggy 6 pax",
    createdAt: "2026-02-13 16:45",
  },
  {
    id: "BK-005",
    repId: "REP-001",
    repName: "Carlos Méndez",
    travelerName: "Hans Mueller",
    guestCount: 2,
    experience: "ATV Quad Experience",
    pickupTime: "2:30 PM",
    hotel: "Hard Rock Hotel & Casino",
    salePrice: 120,
    amountPaid: 120,
    amountPending: 0,
    date: "2026-02-14",
    status: "confirmed",
    notes: "Hablan alemán, necesitan guía bilingüe",
    createdAt: "2026-02-12 10:20",
  },
  {
    id: "BK-006",
    repId: "REP-003",
    repName: "Miguel Torres",
    travelerName: "Patricia Nunes",
    guestCount: 3,
    experience: "Saona Island Tour",
    pickupTime: "6:30 AM",
    hotel: "Barceló Bávaro Palace",
    salePrice: 130,
    amountPaid: 130,
    amountPending: 0,
    date: "2026-02-16",
    status: "confirmed",
    notes: "Brasileños, hablan portugués",
    createdAt: "2026-02-14 08:00",
  },
  {
    id: "BK-007",
    repId: "REP-002",
    repName: "Ana Rodríguez",
    travelerName: "David & Sarah Brown",
    guestCount: 5,
    experience: "Party Boat Experience",
    pickupTime: "9:30 AM",
    hotel: "Secrets Royal Beach",
    salePrice: 180,
    amountPaid: 90,
    amountPending: 90,
    date: "2026-02-17",
    status: "pending",
    notes: "Despedida de soltero. Pagan el resto en el punto de encuentro.",
    createdAt: "2026-02-14 09:30",
  },
  {
    id: "BK-008",
    repId: "REP-001",
    repName: "Carlos Méndez",
    travelerName: "Yuki Tanaka",
    guestCount: 2,
    experience: "Full Ride Experience",
    pickupTime: "8:00 AM",
    hotel: "Hyatt Zilara Cap Cana",
    salePrice: 95,
    amountPaid: 95,
    amountPending: 0,
    date: "2026-02-17",
    status: "confirmed",
    notes: "Japoneses. Hablan poco inglés.",
    createdAt: "2026-02-15 07:00",
  },
  {
    id: "BK-009",
    repId: "REP-004",
    repName: "Laura Peña",
    travelerName: "Ricardo Gómez",
    guestCount: 3,
    experience: "Predator Family Experience",
    pickupTime: "10:00 AM",
    hotel: "Grand Palladium Punta Cana",
    salePrice: 175,
    amountPaid: 100,
    amountPending: 75,
    date: "2026-02-18",
    status: "pending",
    notes: "Familia dominicana, niño de 8 años",
    createdAt: "2026-02-15 12:00",
  },
  {
    id: "BK-010",
    repId: "REP-003",
    repName: "Miguel Torres",
    travelerName: "Olga Petrova",
    guestCount: 2,
    experience: "Flintstone Era",
    pickupTime: "2:00 PM",
    hotel: "Barceló Bávaro Palace",
    salePrice: 110,
    amountPaid: 110,
    amountPending: 0,
    date: "2026-02-18",
    status: "confirmed",
    notes: "Pareja rusa, solo inglés básico",
    createdAt: "2026-02-16 09:00",
  },
]

// ─── Helpers ───────────────────────────────────────────────────────

/** Retrieves all registered reps from localStorage (client-side only) */
function getRegisteredReps(): Representative[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("macao-registered-reps")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/** Get all representatives (mock + dynamically registered) */
export function getAllRepresentatives(): Representative[] {
  return [...representatives, ...getRegisteredReps()]
}

export function getRepById(id: string) {
  return representatives.find((r) => r.id === id) ?? getRegisteredReps().find((r) => r.id === id)
}

export function getBookingsByRep(repId: string) {
  return mockBookings.filter((b) => b.repId === repId)
}
