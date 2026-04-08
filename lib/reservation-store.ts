/**
 * Almacén compartido de reservas enviadas a choferes.
 * Usa localStorage como puente entre la vista de operaciones y la del chofer.
 * Cuando haya backend real, reemplazar por queries a Supabase.
 */

const STORAGE_KEY = "macao_sent_reservations"

export type SentReservation = {
  id: string
  customerName: string
  phone: string
  email: string
  hotel: string
  location: string
  timeslot: string
  guests: number
  children: number
  pickupTime: string
  pickupPoint: "lobby" | "barrera"
  transportType: string
  experience: string
  channel: string
  date: string
  choferId: string
  choferName: string
  sentAt: string
}

/** Guardar una reserva asignada a un chofer */
export function saveSentReservation(reservation: SentReservation) {
  const current = getSentReservations()
  // Evitar duplicados por ID
  const updated = current.filter((r) => r.id !== reservation.id)
  updated.push(reservation)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/** Obtener todas las reservas enviadas */
export function getSentReservations(): SentReservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Obtener reservas enviadas a un chofer específico */
export function getReservationsForChofer(choferId: string): SentReservation[] {
  return getSentReservations().filter((r) => r.choferId === choferId)
}

/* ── Estado de confirmación del chofer ── */

export type ChoferCardStatus = "none" | "recibida" | "confirmada"

const CARD_STATUS_KEY = "macao_chofer_card_status"

/** Obtener todos los estados de tarjeta del chofer */
export function loadChoferCardStatuses(): Record<string, ChoferCardStatus> {
  try {
    const raw = localStorage.getItem(CARD_STATUS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

/** Persistir todos los estados de tarjeta */
export function persistChoferCardStatuses(statuses: Record<string, ChoferCardStatus>) {
  localStorage.setItem(CARD_STATUS_KEY, JSON.stringify(statuses))
}
