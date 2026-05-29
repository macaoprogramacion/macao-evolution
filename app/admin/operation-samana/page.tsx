"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Download,
  MapPin,
  Hotel,
  Clock,
  Users,
  Phone,
  Mail,
  Globe,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Ticket,
  Mountain,
  TreePalm,
  Copy,
  MessageSquare,
  RefreshCw,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  UserX,
  XCircle,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { supabase } from "@/lib/supabase"
import {
  listCancellationRequests,
  upsertCancellationRequest,
  type CancellationRequest,
} from "@/lib/cancellation-requests"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as DateCalendar } from "@/components/ui/calendar"

type SamanaReservation = {
  id: string
  customerName: string
  phone: string
  email: string
  hotel: string
  location: string
  guests: number
  children: number
  pickupTime: string
  tourType: string
  channel: string
  channelUrl: string
  channelColor: string
  date: string
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  amount: number | null
  notes: string
  lunchIncluded: boolean
  whaleWatching: boolean
  gygBookingRef: string
  gygBookingReference: string
  language: string
  createdAt: string | null
  isEdited: boolean
  editedAt: string | null
  editReason: string
}

const EDIT_REASON_TAG = "[EDIT_REASON]:"
const EDITED_AT_TAG = "[EDITED_AT]:"
const EDIT_AMOUNT_BEFORE_TAG = "[EDIT_AMOUNT_BEFORE]:"
const EDIT_AMOUNT_AFTER_TAG = "[EDIT_AMOUNT_AFTER]:"

function getEditAuditFromNotes(notes: string) {
  const lines = notes.split("\n")
  const reasonLine = lines.find((line) => line.startsWith(EDIT_REASON_TAG))
  const editedAtLine = lines.find((line) => line.startsWith(EDITED_AT_TAG))

  return {
    reason: reasonLine ? reasonLine.slice(EDIT_REASON_TAG.length).trim() : "",
    editedAt: editedAtLine ? editedAtLine.slice(EDITED_AT_TAG.length).trim() : "",
  }
}

function stripEditAuditFromNotes(notes: string) {
  return notes
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith(EDIT_REASON_TAG)
        && !line.startsWith(EDITED_AT_TAG)
        && !line.startsWith(EDIT_AMOUNT_BEFORE_TAG)
        && !line.startsWith(EDIT_AMOUNT_AFTER_TAG),
    )
    .join("\n")
    .trim()
}

function buildNotesWithEditAudit(
  notes: string,
  reason: string,
  editedAt: string,
  previousAmount?: number | null,
  nextAmount?: number | null,
) {
  const cleanNotes = stripEditAuditFromNotes(notes)
  const lines = [`${EDITED_AT_TAG} ${editedAt}`, `${EDIT_REASON_TAG} ${reason}`]

  if (
    Number.isFinite(previousAmount)
    && Number.isFinite(nextAmount)
    && Number(previousAmount) !== Number(nextAmount)
  ) {
    lines.push(`${EDIT_AMOUNT_BEFORE_TAG} ${Number(previousAmount)}`)
    lines.push(`${EDIT_AMOUNT_AFTER_TAG} ${Number(nextAmount)}`)
  }

  const base = cleanNotes ? `${cleanNotes}\n` : ""
  return `${base}${lines.join("\n")}`
}

type AvailabilityDayRow = {
  date: string
  booked: number
  holds: number
  baseCapacity: number
  manualCapacity: number | null
  isBlocked: boolean
  available: number
}

type NewReservationForm = {
  customer_name: string
  phone: string
  email: string
  hotel: string
  location: string
  guests: number
  children: number
  pickup_time: string
  tour_type: string
  channel: string
  channel_url: string
  channel_color: string
  date: string
  amount: number
  notes: string
  lunch_included: boolean
  whale_watching: boolean
  language: string
}

const SAMANA_PRODUCT_ID = "1068932"
const SAMANA_DEFAULT_CAPACITY = 40
const AVAILABILITY_WINDOW_DAYS = 21

const createEmptyNewReservation = (): NewReservationForm => ({
  customer_name: "",
  phone: "",
  email: "",
  hotel: "",
  location: "",
  guests: 1,
  children: 0,
  pickup_time: "",
  tour_type: "full_day",
  channel: "phone",
  channel_url: "",
  channel_color: "#6b7280",
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  notes: "",
  lunch_included: true,
  whale_watching: false,
  language: "en",
})

const languageByName: Record<string, string> = {
  english: "en",
  spanish: "es",
  espanol: "es",
  français: "fr",
  french: "fr",
  deutsch: "de",
  german: "de",
  italiano: "it",
  italian: "it",
  portugues: "pt",
  portuguese: "pt",
  nederlands: "nl",
  dutch: "nl",
  русский: "ru",
  russian: "ru",
  polski: "pl",
  polish: "pl",
}

function parseMoney(value: string) {
  const normalized = value.replace(/,/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getLocalISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseExternalReservationText(rawText: string): { updates: Partial<NewReservationForm>; detected: string[] } {
  const text = rawText.replace(/\r/g, "")
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const lowerText = text.toLowerCase()
  const updates: Partial<NewReservationForm> = {}
  const detected: string[] = []

  // Channel detection
  if (/(getyourguide|\bgyg[A-Z0-9]+)/i.test(text)) {
    updates.channel = "GetYourGuide"
    detected.push("Canal: GetYourGuide")
  } else if (/\bviator\b/i.test(text)) {
    updates.channel = "Viator"
    detected.push("Canal: Viator")
  } else {
    updates.channel = "ota"
    detected.push("Canal: OTA")
  }

  // Booking reference
  const gygRefMatch = text.match(/\bGYG[A-Z0-9]{6,}\b/i)
  if (gygRefMatch?.[0]) {
    updates.channel_url = gygRefMatch[0]
    detected.push(`Referencia: ${gygRefMatch[0]}`)
  }

  // Lead traveler block
  const leadIdx = lines.findIndex((line) => /lead traveler/i.test(line))
  if (leadIdx >= 0 && lines[leadIdx + 1]) {
    const name = lines[leadIdx + 1].replace(/\([^)]*\)/g, "").trim()
    if (name) {
      updates.customer_name = name
      detected.push(`Cliente: ${name}`)
    }
  }

  // Phone line often appears standalone (e.g. +351912643517)
  const phoneLine = lines.find((line) => /^\+?\d[\d\s\-()]{7,}\d$/.test(line))
  if (phoneLine) {
    updates.phone = phoneLine.replace(/\s+/g, "")
    detected.push(`Telefono: ${updates.phone}`)
  }

  // Date + pickup time from schedule line (e.g. Thursday, June 4th, 2026 7:30 AM)
  const dateTimeMatch = text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4})\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (dateTimeMatch) {
    const datePart = dateTimeMatch[1].replace(/(\d)(st|nd|rd|th)/gi, "$1")
    const parsedDate = new Date(`${datePart} 12:00:00`)
    if (!isNaN(parsedDate.getTime())) {
      updates.date = toDateInputValue(parsedDate)
      detected.push(`Fecha: ${updates.date}`)
    }
    updates.pickup_time = dateTimeMatch[2].toUpperCase()
  }

  // Pickup expected window
  const pickupWindow = text.match(/picked up between\s+(\d{1,2}:\d{2}\s*[AP]M)\s+and\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (pickupWindow) {
    updates.pickup_time = `${pickupWindow[1].toUpperCase()} - ${pickupWindow[2].toUpperCase()}`
    detected.push(`Recogida: ${updates.pickup_time}`)
  }

  const pickupAt = text.match(/pickup\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (pickupAt) {
    updates.pickup_time = pickupAt[1].toUpperCase()
    detected.push(`Recogida: ${updates.pickup_time}`)
  }

  if (!updates.pickup_time) {
    const pickupHFormat = text.match(/(?:pickup|embarque|recogida)[^\n]{0,50}?(\d{1,2})h(\d{2})/i)
    if (pickupHFormat) {
      const h = Number(pickupHFormat[1])
      const m = pickupHFormat[2]
      const period = h >= 12 ? "PM" : "AM"
      const h12 = h % 12 === 0 ? 12 : h % 12
      updates.pickup_time = `${h12}:${m} ${period}`
      detected.push(`Recogida: ${updates.pickup_time}`)
    }
  }

  // Travelers and amount
  const peopleLine = text.match(/(\d+)\s+people\s*-\s*\$([\d.,]+)/i)
  if (peopleLine) {
    updates.guests = Number(peopleLine[1]) || 1
    updates.amount = parseMoney(peopleLine[2])
    detected.push(`PAX total: ${updates.guests}`)
  }

  const adultsLine = text.match(/(\d+)\s+Adults?/i)
  if (adultsLine) {
    updates.guests = Number(adultsLine[1]) || updates.guests || 1
  }
  const childrenLine = text.match(/(\d+)\s+Children/i)
  if (childrenLine) {
    updates.children = Number(childrenLine[1]) || 0
  }

  // Language
  const langMatch = text.match(/Live guide:\s*([A-Za-zÀ-ÿ]+)/i)
  if (langMatch) {
    const detectedLangName = langMatch[1].toLowerCase()
    updates.language = languageByName[detectedLangName] || "en"
    detected.push(`Idioma: ${langMatch[1]}`)
  }

  // Location block
  const locationIdx = lines.findIndex((line) => /^location$/i.test(line))
  if (locationIdx >= 0 && lines[locationIdx + 1]) {
    const locationLine = lines[locationIdx + 1]
    updates.location = locationLine
    updates.hotel = locationLine.split(",")[0]?.trim() || locationLine
    detected.push("Ubicacion y hotel detectados")
  }

  // Tour type + options
  if (/cayo levantado/i.test(lowerText)) {
    updates.tour_type = "cayo_levantado"
  } else if (/whale/i.test(lowerText) || /ballena/i.test(lowerText)) {
    updates.tour_type = "whale_only"
    updates.whale_watching = true
  } else if (/half day|medio dia/i.test(lowerText)) {
    updates.tour_type = "half_day"
  } else {
    updates.tour_type = "full_day"
  }

  updates.lunch_included = /(food|open bar|lunch|almuerzo)/i.test(lowerText)

  // Collect ticket codes into notes
  const ticketCodes = Array.from(new Set((text.match(/[A-Z0-9]{20,}(?:-[A-Z0-9]{4,})?/g) || []).filter((code) => code.length >= 24)))
  const notesParts = []
  if (ticketCodes.length > 0) {
    notesParts.push(`Tickets: ${ticketCodes.join(" | ")}`)
  }
  if (gygRefMatch?.[0]) {
    notesParts.push(`Booking ref: ${gygRefMatch[0]}`)
  }
  if (notesParts.length > 0) {
    updates.notes = notesParts.join("\n")
  }

  return { updates, detected }
}

function getPickupDeadline(dateValue: string, pickupValue: string) {
  const timeMatch = pickupValue.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/i)
  if (!timeMatch) return null

  let hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2] || "0")
  const ampm = timeMatch[3].toUpperCase()

  if (ampm === "PM" && hours !== 12) hours += 12
  if (ampm === "AM" && hours === 12) hours = 0

  const pickupDate = new Date(`${dateValue}T00:00:00`)
  pickupDate.setHours(hours, minutes, 0, 0)
  return pickupDate
}

function mapRow(r: any): SamanaReservation {
  const rawNotes = r.notes || ""
  const notesAudit = getEditAuditFromNotes(rawNotes)
  const dbEditReason = r.edit_reason || ""
  const dbEditedAt = r.edited_at || null
  const resolvedEditReason = dbEditReason || notesAudit.reason
  const resolvedEditedAt = dbEditedAt || notesAudit.editedAt || null

  return {
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone || "—",
    email: r.email || "—",
    hotel: r.hotel || "",
    location: r.location || "",
    guests: r.guests || 0,
    children: r.children || 0,
    pickupTime: r.pickup_time || "",
    tourType: r.tour_type || "full_day",
    channel: r.channel || "",
    channelUrl: r.channel_url || "",
    channelColor: r.channel_color || "#6b7280",
    date: r.date,
    status: r.status,
    amount: r.amount != null ? Number(r.amount) : null,
    notes: stripEditAuditFromNotes(rawNotes),
    lunchIncluded: r.lunch_included ?? true,
    whaleWatching: r.whale_watching ?? false,
    gygBookingRef: r.gyg_booking_ref || "",
    gygBookingReference: r.gyg_booking_reference || "",
    language: r.language || "en",
    createdAt: r.created_at || null,
    isEdited: Boolean(r.is_edited || resolvedEditReason || resolvedEditedAt),
    editedAt: resolvedEditedAt,
    editReason: resolvedEditReason,
  }
}

export default function OperationSamanaPage() {
  const [reservations, setReservations] = useState<SamanaReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [tourFilter, setTourFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [copiedMsg, setCopiedMsg] = useState("")
  const [noShowConfirmId, setNoShowConfirmId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([])
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityDayRow[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilitySavingDate, setAvailabilitySavingDate] = useState<string | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [manualCapacityInputs, setManualCapacityInputs] = useState<Record<string, string>>({})

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<SamanaReservation | null>(null)
  const [editRes, setEditRes] = useState<NewReservationForm>(createEmptyNewReservation())
  const [editReason, setEditReason] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [checkingSelectedDateBlocked, setCheckingSelectedDateBlocked] = useState(false)
  const [selectedDateBlocked, setSelectedDateBlocked] = useState(false)
  const [blockedReservationDates, setBlockedReservationDates] = useState<string[]>([])
  const [newRes, setNewRes] = useState<NewReservationForm>(createEmptyNewReservation())
  const [externalReservationText, setExternalReservationText] = useState("")
  const [externalParseSummary, setExternalParseSummary] = useState<string | null>(null)

  const resetNewRes = () => {
    setNewRes(createEmptyNewReservation())
    setExternalReservationText("")
    setExternalParseSummary(null)
  }

  const channelColors: Record<string, string> = {
    website: "#dc2626",
    whatsapp: "#22c55e",
    phone: "#3b82f6",
    walk_in: "#8b5cf6",
    seller: "#d97706",
    ota: "#ef4444",
    GetYourGuide: "#f97316",
    Viator: "#0ea5e9",
  }

  const applyExternalReservation = () => {
    if (!externalReservationText.trim()) {
      setExternalParseSummary("Pega el texto de la reserva primero.")
      return
    }

    const { updates, detected } = parseExternalReservationText(externalReservationText)
    const detectedCount = Object.keys(updates).length

    if (detectedCount === 0) {
      setExternalParseSummary("No se pudo detectar informacion util. Revisa el formato pegado.")
      return
    }

    setNewRes((prev) => {
      const mergedNotes = [prev.notes, updates.notes].filter(Boolean).join(prev.notes && updates.notes ? "\n" : "")
      return {
        ...prev,
        ...updates,
        notes: mergedNotes,
      }
    })

    setExternalParseSummary(`Autocompletado: ${detected.join(" | ")}`)
  }

  const syncGygBookings = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/gyg/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": "dashboard",
        },
      })
      const data = await res.json()
      const retried = data.retriedWebhooks?.filter((r: any) => r.success).length || 0
      const reconciled = data.reconciledBookings?.filter((r: any) => r.success).length || 0
      if (retried > 0 || reconciled > 0) {
        setSyncResult(`Sincronizado: ${retried} reintentos, ${reconciled} reconciliados`)
        await fetchReservations()
      } else {
        setSyncResult("Todo sincronizado — sin pendientes")
      }
    } catch (e) {
      console.error("Sync error:", e)
      setSyncResult("Error al sincronizar")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncResult(null), 5000)
    }
  }

  const saveNewReservation = async () => {
    if (!newRes.customer_name || !newRes.date) return
    setSaving(true)
    try {
      const { data: blockedOverride, error: blockedOverrideError } = await supabase
        .from("gyg_availability_overrides")
        .select("is_blocked")
        .eq("product_id", SAMANA_PRODUCT_ID)
        .eq("date", newRes.date)
        .maybeSingle()

      if (blockedOverrideError && !blockedOverrideError.message?.includes("gyg_availability_overrides")) {
        console.error("Error checking blocked availability:", blockedOverrideError)
        alert("No se pudo validar la disponibilidad para la fecha seleccionada.")
        return
      }

      if (blockedOverride?.is_blocked) {
        alert("Esta fecha esta bloqueada en disponibilidad y no permite reservas manuales.")
        return
      }

      const insertPayload = {
        ...newRes,
        channel_color: channelColors[newRes.channel] || "#6b7280",
      }

      let { error } = await supabase.from("samana_reservations").insert(insertPayload)

      // Backward-compatible fallback: production DB may not have the `language` column yet.
      if (error && /language.*column|Could not find the 'language' column/i.test(error.message || "")) {
        const { language, ...fallbackPayload } = insertPayload
        const retry = await supabase.from("samana_reservations").insert(fallbackPayload)
        error = retry.error
      }

      if (error) {
        console.error("Error creating reservation:", error)
        alert("Error al crear reserva: " + error.message)
      } else {
        await fetchReservations()
        setAddDialogOpen(false)
        resetNewRes()
      }
    } catch (e) {
      console.error("Error creating reservation:", e)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (res: SamanaReservation) => {
    setEditingReservation(res)
    setEditReason(res.editReason || "")
    setEditRes({
      customer_name: res.customerName,
      phone: res.phone === "—" ? "" : res.phone,
      email: res.email === "—" ? "" : res.email,
      hotel: res.hotel,
      location: res.location,
      guests: res.guests,
      children: res.children,
      pickup_time: res.pickupTime,
      tour_type: res.tourType,
      channel: res.channel,
      channel_url: res.channelUrl,
      channel_color: res.channelColor,
      date: res.date,
      amount: res.amount ?? 0,
      notes: res.notes,
      lunch_included: res.lunchIncluded,
      whale_watching: res.whaleWatching,
      language: res.language || "en",
    })
    setEditDialogOpen(true)
  }

  const saveEditReservation = async () => {
    if (!editingReservation || !editRes.customer_name || !editRes.date) return
    const normalizedEditReason = editReason.trim()
    if (!normalizedEditReason) {
      alert("Debes indicar un motivo de edición antes de guardar.")
      return
    }

    setSavingEdit(true)
    try {
      const editedAt = new Date().toISOString()
      const previousAmount = editingReservation.amount ?? 0
      const nextAmount = editRes.amount ?? 0
      const notesWithAudit = buildNotesWithEditAudit(
        editRes.notes || "",
        normalizedEditReason,
        editedAt,
        previousAmount,
        nextAmount,
      )

      const updatePayloadBase = {
        customer_name: editRes.customer_name,
        phone: editRes.phone || null,
        email: editRes.email || null,
        hotel: editRes.hotel,
        location: editRes.location,
        guests: editRes.guests,
        children: editRes.children,
        pickup_time: editRes.pickup_time,
        tour_type: editRes.tour_type,
        channel: editRes.channel,
        channel_url: editRes.channel_url,
        channel_color: channelColors[editRes.channel] || editRes.channel_color || "#6b7280",
        date: editRes.date,
        amount: editRes.amount,
        notes: notesWithAudit,
        lunch_included: editRes.lunch_included,
        whale_watching: editRes.whale_watching,
        language: editRes.language,
        updated_at: new Date().toISOString(),
      }

      const updatePayloadWithAudit = {
        ...updatePayloadBase,
        is_edited: true,
        edited_at: editedAt,
        edit_reason: normalizedEditReason,
      }

      let { error } = await supabase
        .from("samana_reservations")
        .update(updatePayloadWithAudit)
        .eq("id", editingReservation.id)

      if (error && /column .* does not exist/i.test(error.message || "")) {
        const fallback = await supabase
          .from("samana_reservations")
          .update(updatePayloadBase)
          .eq("id", editingReservation.id)
        error = fallback.error
      }

      if (error) {
        console.error("Error updating reservation:", error)
        alert("Error al actualizar reserva: " + error.message)
      } else {
        await fetchReservations()
        setEditDialogOpen(false)
        setEditingReservation(null)
        setEditReason("")
      }
    } catch (e) {
      console.error("Error updating reservation:", e)
    } finally {
      setSavingEdit(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("samana_reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("pickup_time", { ascending: true })
      if (!error && data) {
        setReservations(data.map(mapRow))
      }
    } catch (e) {
      console.error("Error fetching reservations:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailabilityOverview = async () => {
    setAvailabilityLoading(true)
    try {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const fromDate = today.toISOString().slice(0, 10)

      const endDate = new Date(today)
      endDate.setUTCDate(endDate.getUTCDate() + AVAILABILITY_WINDOW_DAYS - 1)
      const toDate = endDate.toISOString().slice(0, 10)

      const nowIso = new Date().toISOString()

      const [{ data: reservationData }, { data: holdData }, { data: overrideData, error: overrideError }] = await Promise.all([
        supabase
          .from("samana_reservations")
          .select("date, guests, children")
          .gte("date", fromDate)
          .lte("date", toDate)
          .in("status", ["confirmed", "pending"]),
        supabase
          .from("gyg_reservations")
          .select("date_time, total_participants")
          .eq("product_id", SAMANA_PRODUCT_ID)
          .eq("status", "active")
          .gte("expires_at", nowIso),
        supabase
          .from("gyg_availability_overrides")
          .select("date, manual_vacancies, is_blocked")
          .eq("product_id", SAMANA_PRODUCT_ID)
          .gte("date", fromDate)
          .lte("date", toDate),
      ])

      if (overrideError && !overrideError.message?.includes("gyg_availability_overrides")) {
        console.error("Error fetching availability overrides:", overrideError)
      }

      const bookedByDate: Record<string, number> = {}
      for (const row of reservationData || []) {
        const date = row.date
        bookedByDate[date] = (bookedByDate[date] || 0) + (row.guests || 0) + (row.children || 0)
      }

      const holdsByDate: Record<string, number> = {}
      for (const hold of holdData || []) {
        const holdDate = new Date(hold.date_time).toISOString().slice(0, 10)
        if (holdDate >= fromDate && holdDate <= toDate) {
          holdsByDate[holdDate] = (holdsByDate[holdDate] || 0) + (hold.total_participants || 0)
        }
      }

      const overrideByDate: Record<string, { manualCapacity: number | null; isBlocked: boolean }> = {}
      for (const row of overrideData || []) {
        overrideByDate[row.date] = {
          manualCapacity: typeof row.manual_vacancies === "number" ? row.manual_vacancies : null,
          isBlocked: Boolean(row.is_blocked),
        }
      }

      const rows: AvailabilityDayRow[] = []
      const walker = new Date(today)
      while (walker <= endDate) {
        const date = walker.toISOString().slice(0, 10)
        const booked = bookedByDate[date] || 0
        const holds = holdsByDate[date] || 0
        const override = overrideByDate[date]
        const manualCapacity = override?.manualCapacity ?? null
        const isBlocked = override?.isBlocked === true
        const capacity = manualCapacity ?? SAMANA_DEFAULT_CAPACITY
        const available = isBlocked ? 0 : Math.max(0, capacity - booked - holds)

        rows.push({
          date,
          booked,
          holds,
          baseCapacity: SAMANA_DEFAULT_CAPACITY,
          manualCapacity,
          isBlocked,
          available,
        })

        walker.setUTCDate(walker.getUTCDate() + 1)
      }

      setAvailabilityRows(rows)
      setManualCapacityInputs(
        rows.reduce<Record<string, string>>((acc, row) => {
          acc[row.date] = row.manualCapacity == null ? "" : String(row.manualCapacity)
          return acc
        }, {})
      )
    } catch (e) {
      console.error("Error fetching availability overview:", e)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const applyAvailabilityOverride = async (date: string, manualCapacity: number | null, isBlocked: boolean) => {
    setAvailabilitySavingDate(date)
    try {
      let error: any = null

      if (manualCapacity == null && !isBlocked) {
        ;({ error } = await supabase
          .from("gyg_availability_overrides")
          .delete()
          .eq("product_id", SAMANA_PRODUCT_ID)
          .eq("date", date))
      } else {
        ;({ error } = await supabase
          .from("gyg_availability_overrides")
          .upsert(
            {
              product_id: SAMANA_PRODUCT_ID,
              date,
              manual_vacancies: manualCapacity,
              is_blocked: isBlocked,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "product_id,date" }
          ))
      }

      if (error) {
        if (error.message?.includes("gyg_availability_overrides")) {
          setAvailabilityMessage("Falta migracion de disponibilidad. Ejecuta scripts/migration-gyg-availability-overrides.sql")
          return
        }
        setAvailabilityMessage("No se pudo guardar la disponibilidad")
        console.error("Error saving availability override:", error)
        return
      }

      setAvailabilityMessage("Disponibilidad actualizada")
      await fetchAvailabilityOverview()
    } catch (e) {
      console.error("Error updating availability override:", e)
      setAvailabilityMessage("Error inesperado al actualizar disponibilidad")
    } finally {
      setAvailabilitySavingDate(null)
      setTimeout(() => setAvailabilityMessage(null), 4000)
    }
  }

  const saveManualCapacity = async (date: string) => {
    const current = availabilityRows.find((row) => row.date === date)
    if (!current) return

    const rawValue = (manualCapacityInputs[date] || "").trim()
    let manualCapacity: number | null = null
    if (rawValue !== "") {
      const parsed = Number(rawValue)
      if (!Number.isFinite(parsed) || parsed < 0) {
        alert("Ingresa un numero valido de cupos (0 o mayor)")
        return
      }
      manualCapacity = Math.floor(parsed)
    }

    await applyAvailabilityOverride(date, manualCapacity, current.isBlocked)
  }

  const toggleDateBlocked = async (date: string) => {
    const current = availabilityRows.find((row) => row.date === date)
    if (!current) return
    await applyAvailabilityOverride(date, current.manualCapacity, !current.isBlocked)
  }

  const resetDateAvailability = async (date: string) => {
    await applyAvailabilityOverride(date, null, false)
  }

  useEffect(() => {
    fetchReservations()
    const interval = setInterval(() => {
      fetchReservations()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadCancellationRequests = async () => {
    try {
      const requests = await listCancellationRequests()
      setCancellationRequests(requests)
    } catch (error) {
      console.error("Error loading cancellation requests:", error)
      setCancellationRequests([])
    }
  }

  useEffect(() => {
    void loadCancellationRequests()
    const interval = window.setInterval(() => {
      void loadCancellationRequests()
    }, 5000)
    return () => window.clearInterval(interval)
  }, [])

  const getCancellationRequest = (reservationId: string) => {
    return cancellationRequests.find((item) => item.reservationId === reservationId)
  }

  const requestCancellation = async (reservation: SamanaReservation) => {
    const existing = getCancellationRequest(reservation.id)
    if (existing?.status === "pending") {
      alert("Esta reserva ya tiene una solicitud de cancelación pendiente de contabilidad.")
      return
    }

    const reason = window.prompt("Motivo de cancelación (obligatorio):", "")
    if (!reason || !reason.trim()) {
      alert("Debes indicar un motivo para solicitar la cancelación.")
      return
    }

    const request: CancellationRequest = {
      id: `cancel-${Date.now()}-${reservation.id}`,
      operationType: "samana",
      reservationId: reservation.id,
      customerName: reservation.customerName,
      reason: reason.trim(),
      requestedAt: new Date().toISOString(),
      requestedBy: "Operaciones Samana",
      status: "pending",
    }

    try {
      await upsertCancellationRequest(request)
      await loadCancellationRequests()
      alert("Solicitud enviada a contabilidad para aprobación/rechazo.")
    } catch (error) {
      console.error("Error creating cancellation request:", error)
      alert(error instanceof Error ? error.message : "No se pudo enviar la solicitud de cancelación.")
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadBlockedReservationDates = async () => {
      if (!addDialogOpen) {
        setBlockedReservationDates([])
        setSelectedDateBlocked(false)
        setCheckingSelectedDateBlocked(false)
        return
      }

      setCheckingSelectedDateBlocked(true)

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from("gyg_availability_overrides")
        .select("date")
        .eq("product_id", SAMANA_PRODUCT_ID)
        .eq("is_blocked", true)
        .gte("date", today.toISOString().slice(0, 10))

      if (cancelled) return

      if (error && !error.message?.includes("gyg_availability_overrides")) {
        console.error("Error checking selected date block status:", error)
        setBlockedReservationDates([])
      } else {
        setBlockedReservationDates((data || []).map((row) => row.date))
      }

      setCheckingSelectedDateBlocked(false)
    }

    loadBlockedReservationDates()

    return () => {
      cancelled = true
    }
  }, [addDialogOpen])

  useEffect(() => {
    if (!addDialogOpen || !newRes.date) {
      setSelectedDateBlocked(false)
      return
    }

    setSelectedDateBlocked(blockedReservationDates.includes(newRes.date))
  }, [addDialogOpen, newRes.date, blockedReservationDates])

  const formatDateLabel = (dateValue: string) => {
    return new Date(`${dateValue}T12:00:00`).toLocaleDateString("es-DO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const updateReservationStatus = async (id: string, status: SamanaReservation["status"]) => {
    try {
      const { error } = await supabase
        .from("samana_reservations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("Error updating status:", error)
        alert("Error al actualizar estado: " + error.message)
      } else {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status } : r
          )
        )
      }
    } catch (e) {
      console.error("Error updating status:", e)
    }
  }

  const toggleStatus = async (id: string) => {
    await updateReservationStatus(id, "confirmed")
  }

  const markAsNoShow = async (id: string) => {
    await updateReservationStatus(id, "no_show")
    setNoShowConfirmId(null)
  }

  const languageOptions = [
    { value: "en", label: "English", flag: "🇬🇧" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "it", label: "Italiano", flag: "🇮🇹" },
    { value: "pt", label: "Português", flag: "🇵🇹" },
    { value: "nl", label: "Nederlands", flag: "🇳🇱" },
    { value: "ru", label: "Русский", flag: "🇷🇺" },
    { value: "pl", label: "Polski", flag: "🇵🇱" },
  ]

  const langLocales: Record<string, string> = {
    en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL", ru: "ru-RU", pl: "pl-PL",
  }

  const t9n: Record<string, Record<string, string>> = {
    en: {
      greeting: "Hello", thankYou: "Thank you for booking the Samana Tour with Tavisa Travel.",
      pickupIs: "Your pickup time is", waitAt: "Please wait at", atTime: "at the indicated time.",
      beReady: "Please be ready 10 minutes in advance.", getReady: "Get ready for a unique experience in Samaná!",
      details: "TOUR DETAILS", type: "Type", guests: "Guests", adults: "adults", children: "children",
      date: "Date", ref: "Reference",
      ticket: "EXPERIENCE TICKET", confirmed: "RESERVATION CONFIRMED", tourDetails: "Tour Details",
      tourType: "Tour type", people: "People", lunch: "Lunch", included: "Included", notIncluded: "Not included",
      whaleWatch: "Whale watching", yes: "Yes", no: "No", pickup: "Pickup", hotel: "Hotel", location: "Location",
      pickupTime: "Pickup time", amount: "AMOUNT TO PAY", generated: "Ticket generated on",
      inquiries: "For any inquiries:", fullDay: "Full Day Tour", halfDay: "Half Day",
      whaleOnly: "Whale Watching", cayoLev: "Cayo Levantado",
    },
    es: {
      greeting: "Hola", thankYou: "Gracias por reservar el tour de Samaná con Tavisa Travel.",
      pickupIs: "Su hora de recogida es", waitAt: "Por favor espere en", atTime: "a la hora indicada.",
      beReady: "Por favor esté listo 10 minutos antes.", getReady: "¡Prepárese para una experiencia única en Samaná!",
      details: "DETALLES DEL TOUR", type: "Tipo", guests: "Personas", adults: "adultos", children: "niños",
      date: "Fecha", ref: "Referencia",
      ticket: "TICKET DE EXPERIENCIA", confirmed: "RESERVA CONFIRMADA", tourDetails: "Detalles del Tour",
      tourType: "Tipo de tour", people: "Personas", lunch: "Almuerzo", included: "Incluido", notIncluded: "No incluido",
      whaleWatch: "Avistamiento de ballenas", yes: "Sí", no: "No", pickup: "Recogida", hotel: "Hotel", location: "Ubicación",
      pickupTime: "Hora de recogida", amount: "MONTO A PAGAR", generated: "Ticket generado el",
      inquiries: "Para cualquier consulta:", fullDay: "Tour Completo (Día Entero)", halfDay: "Medio Día",
      whaleOnly: "Avistamiento de Ballenas", cayoLev: "Cayo Levantado",
    },
    fr: {
      greeting: "Bonjour", thankYou: "Merci d'avoir réservé le tour de Samaná avec Tavisa Travel.",
      pickupIs: "Votre heure de prise en charge est", waitAt: "Veuillez attendre à", atTime: "à l'heure indiquée.",
      beReady: "Merci d'être prêt 10 minutes à l'avance.", getReady: "Préparez-vous pour une expérience unique à Samaná !",
      details: "DÉTAILS DE LA VISITE", type: "Type", guests: "Personnes", adults: "adultes", children: "enfants",
      date: "Date", ref: "Référence",
      ticket: "TICKET D'EXPÉRIENCE", confirmed: "RÉSERVATION CONFIRMÉE", tourDetails: "Détails de la visite",
      tourType: "Type de visite", people: "Personnes", lunch: "Déjeuner", included: "Inclus", notIncluded: "Non inclus",
      whaleWatch: "Observation des baleines", yes: "Oui", no: "Non", pickup: "Prise en charge", hotel: "Hôtel", location: "Emplacement",
      pickupTime: "Heure de prise en charge", amount: "MONTANT À PAYER", generated: "Ticket généré le",
      inquiries: "Pour toute question :", fullDay: "Visite complète (journée entière)", halfDay: "Demi-journée",
      whaleOnly: "Observation des baleines", cayoLev: "Cayo Levantado",
    },
    de: {
      greeting: "Hallo", thankYou: "Vielen Dank für die Buchung der Samaná Tour mit Tavisa Travel.",
      pickupIs: "Ihre Abholzeit ist", waitAt: "Bitte warten Sie an", atTime: "zur angegebenen Zeit.",
      beReady: "Bitte seien Sie 10 Minuten vorher bereit.", getReady: "Machen Sie sich bereit für ein einzigartiges Erlebnis in Samaná!",
      details: "TOURDETAILS", type: "Typ", guests: "Personen", adults: "Erwachsene", children: "Kinder",
      date: "Datum", ref: "Referenz",
      ticket: "ERLEBNIS-TICKET", confirmed: "RESERVIERUNG BESTÄTIGT", tourDetails: "Tourdetails",
      tourType: "Tourtyp", people: "Personen", lunch: "Mittagessen", included: "Inbegriffen", notIncluded: "Nicht inbegriffen",
      whaleWatch: "Walbeobachtung", yes: "Ja", no: "Nein", pickup: "Abholung", hotel: "Hotel", location: "Standort",
      pickupTime: "Abholzeit", amount: "ZU ZAHLENDER BETRAG", generated: "Ticket erstellt am",
      inquiries: "Für Fragen:", fullDay: "Ganztägige Tour", halfDay: "Halbtägig",
      whaleOnly: "Walbeobachtung", cayoLev: "Cayo Levantado",
    },
    it: {
      greeting: "Ciao", thankYou: "Grazie per aver prenotato il tour di Samaná con Tavisa Travel.",
      pickupIs: "L'orario di ritiro è", waitAt: "Si prega di attendere a", atTime: "all'orario indicato.",
      beReady: "Si prega di essere pronti 10 minuti prima.", getReady: "Preparatevi per un'esperienza unica a Samaná!",
      details: "DETTAGLI DEL TOUR", type: "Tipo", guests: "Persone", adults: "adulti", children: "bambini",
      date: "Data", ref: "Riferimento",
      ticket: "BIGLIETTO ESPERIENZA", confirmed: "PRENOTAZIONE CONFERMATA", tourDetails: "Dettagli del tour",
      tourType: "Tipo di tour", people: "Persone", lunch: "Pranzo", included: "Incluso", notIncluded: "Non incluso",
      whaleWatch: "Avvistamento balene", yes: "Sì", no: "No", pickup: "Ritiro", hotel: "Hotel", location: "Posizione",
      pickupTime: "Orario di ritiro", amount: "IMPORTO DA PAGARE", generated: "Biglietto generato il",
      inquiries: "Per qualsiasi domanda:", fullDay: "Tour completo (giornata intera)", halfDay: "Mezza giornata",
      whaleOnly: "Avvistamento balene", cayoLev: "Cayo Levantado",
    },
    pt: {
      greeting: "Olá", thankYou: "Obrigado por reservar o tour de Samaná com a Tavisa Travel.",
      pickupIs: "Seu horário de busca é", waitAt: "Por favor, aguarde em", atTime: "no horário indicado.",
      beReady: "Por favor, esteja pronto 10 minutos antes.", getReady: "Prepare-se para uma experiência única em Samaná!",
      details: "DETALHES DO TOUR", type: "Tipo", guests: "Pessoas", adults: "adultos", children: "crianças",
      date: "Data", ref: "Referência",
      ticket: "BILHETE DE EXPERIÊNCIA", confirmed: "RESERVA CONFIRMADA", tourDetails: "Detalhes do tour",
      tourType: "Tipo de tour", people: "Pessoas", lunch: "Almoço", included: "Incluído", notIncluded: "Não incluído",
      whaleWatch: "Observação de baleias", yes: "Sim", no: "Não", pickup: "Busca", hotel: "Hotel", location: "Localização",
      pickupTime: "Horário de busca", amount: "VALOR A PAGAR", generated: "Bilhete gerado em",
      inquiries: "Para consultas:", fullDay: "Tour completo (dia inteiro)", halfDay: "Meio dia",
      whaleOnly: "Observação de baleias", cayoLev: "Cayo Levantado",
    },
    nl: {
      greeting: "Hallo", thankYou: "Bedankt voor het boeken van de Samaná Tour met Tavisa Travel.",
      pickupIs: "Uw ophaaltijd is", waitAt: "Wacht alstublieft bij", atTime: "op het aangegeven tijdstip.",
      beReady: "Wees alstublieft 10 minuten van tevoren klaar.", getReady: "Bereid u voor op een unieke ervaring in Samaná!",
      details: "TOURDETAILS", type: "Type", guests: "Personen", adults: "volwassenen", children: "kinderen",
      date: "Datum", ref: "Referentie",
      ticket: "BELEVINGSTICKET", confirmed: "RESERVERING BEVESTIGD", tourDetails: "Tourdetails",
      tourType: "Type tour", people: "Personen", lunch: "Lunch", included: "Inbegrepen", notIncluded: "Niet inbegrepen",
      whaleWatch: "Walvissen spotten", yes: "Ja", no: "Nee", pickup: "Ophalen", hotel: "Hotel", location: "Locatie",
      pickupTime: "Ophaaltijd", amount: "TE BETALEN BEDRAG", generated: "Ticket gegenereerd op",
      inquiries: "Voor vragen:", fullDay: "Volledige dagtour", halfDay: "Halve dag",
      whaleOnly: "Walvissen spotten", cayoLev: "Cayo Levantado",
    },
    ru: {
      greeting: "Здравствуйте", thankYou: "Спасибо за бронирование тура Самана с Tavisa Travel.",
      pickupIs: "Время встречи:", waitAt: "Пожалуйста, ожидайте в", atTime: "в указанное время.",
      beReady: "Пожалуйста, будьте готовы за 10 минут.", getReady: "Приготовьтесь к уникальному опыту в Самане!",
      details: "ДЕТАЛИ ТУРА", type: "Тип", guests: "Гости", adults: "взрослых", children: "детей",
      date: "Дата", ref: "Ссылка",
      ticket: "БИЛЕТ НА ЭКСКУРСИЮ", confirmed: "БРОНИРОВАНИЕ ПОДТВЕРЖДЕНО", tourDetails: "Детали тура",
      tourType: "Тип тура", people: "Человек", lunch: "Обед", included: "Включён", notIncluded: "Не включён",
      whaleWatch: "Наблюдение за китами", yes: "Да", no: "Нет", pickup: "Встреча", hotel: "Отель", location: "Место",
      pickupTime: "Время встречи", amount: "СУММА К ОПЛАТЕ", generated: "Билет создан",
      inquiries: "По вопросам:", fullDay: "Полный дневной тур", halfDay: "Полдня",
      whaleOnly: "Наблюдение за китами", cayoLev: "Кайо Левантадо",
    },
    pl: {
      greeting: "Cześć", thankYou: "Dziękujemy za rezerwację wycieczki Samaná z Tavisa Travel.",
      pickupIs: "Godzina odbioru to", waitAt: "Prosimy czekać w", atTime: "o wskazanej godzinie.",
      beReady: "Prosimy być gotowym 10 minut wcześniej.", getReady: "Przygotuj się na wyjątkowe doświadczenie w Samaná!",
      details: "SZCZEGÓŁY WYCIECZKI", type: "Typ", guests: "Osoby", adults: "dorosłych", children: "dzieci",
      date: "Data", ref: "Numer referencyjny",
      ticket: "BILET NA WYCIECZKĘ", confirmed: "REZERWACJA POTWIERDZONA", tourDetails: "Szczegóły wycieczki",
      tourType: "Typ wycieczki", people: "Osoby", lunch: "Lunch", included: "W cenie", notIncluded: "Nie w cenie",
      whaleWatch: "Obserwacja wielorybów", yes: "Tak", no: "Nie", pickup: "Odbiór", hotel: "Hotel", location: "Lokalizacja",
      pickupTime: "Godzina odbioru", amount: "KWOTA DO ZAPŁATY", generated: "Bilet wygenerowany",
      inquiries: "W razie pytań:", fullDay: "Całodniowa wycieczka", halfDay: "Pół dnia",
      whaleOnly: "Obserwacja wielorybów", cayoLev: "Cayo Levantado",
    },
  }

  const PRODUCT_NAME = "Samana: Hidden Waterfall & the virgin island Bacardi"

  const generateChoferMessage = (res: SamanaReservation) => {
    const totalPax = res.guests + res.children
    const dateObj = new Date(res.date + "T12:00:00")
    const dateStr = `${dateObj.getDate()} de ${dateObj.toLocaleDateString("es-ES", { month: "long" })} de ${dateObj.getFullYear()}`

    return `🚨 NUEVA RESERVA - SAMANA TOUR (SAMANÁ)
👤 Nombre: ${res.customerName}
📞 Teléfono: ${res.phone}
🛞 Producto: ${PRODUCT_NAME}
👥 PAX: ${res.guests} + ${res.children} | ${totalPax} PAX
📌 Hotel: ${res.hotel}
📍 Punto recogida: ${res.location || res.hotel}
🕖 Hora recogida: ${res.pickupTime}
📅 Fecha: ${dateStr}`
  }

  const generateClientMessage = (res: SamanaReservation) => {
    const lang = res.language || "en"
    const t = t9n[lang] || t9n.en
    const totalPax = res.guests + res.children
    const locale = langLocales[lang] || "en-US"
    const dateStr = new Date(res.date + "T12:00:00").toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
    const ref = res.gygBookingRef || res.gygBookingReference || "N/A"
    const pickupLocation = res.location || res.hotel

    return `${t.greeting} ${res.customerName} 👋
${t.thankYou}
${t.pickupIs} ${res.pickupTime}.
📍 ${t.waitAt} ${pickupLocation} ${t.atTime}
⏰ ${t.beReady}
${t.getReady} 🐋⚓

📋 ${t.details}
• 🐋 ${t.type}: Samana Hidden Tour
• 👥 ${t.guests}: ${totalPax} PAX (${res.guests} ${t.adults}, ${res.children} ${t.children})
• 📅 ${t.date}: ${dateStr}
• 🔖 ${t.ref}: ${ref}`
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMsg(key)
      setTimeout(() => setCopiedMsg(""), 2000)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopiedMsg(key)
      setTimeout(() => setCopiedMsg(""), 2000)
    }
  }

  const downloadTicket = (res: SamanaReservation) => {
    const lang = res.language || "en"
    const t = t9n[lang] || t9n.en
    const locale = langLocales[lang] || "en-US"

    const formatDate = (d: string) => {
      const date = new Date(d + "T12:00:00")
      return date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    }

    const tourLabel = t[
      res.tourType === "full_day" ? "fullDay"
        : res.tourType === "half_day" ? "halfDay"
        : res.tourType === "whale_only" ? "whaleOnly"
        : "cayoLev"
    ] || res.tourType

    const amountBlock = res.amount != null && res.amount > 0
      ? `<div class="amount-box"><div class="label">${t.amount}</div><div class="amount">$${res.amount.toFixed(2)} USD</div></div>`
      : ""
    const confirmationNumber = (res.gygBookingReference || res.gygBookingRef || `SAM-${res.id.slice(0, 8).toUpperCase()}`).toUpperCase()
    const qrValue = `SAMANA|${confirmationNumber}|${res.date}|${res.customerName}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`

    const pickupRef = `${res.location || ""} ${res.hotel || ""}`.toLowerCase()
    const pickupPoint = pickupRef.includes("barrera") ? "Barrera" : "Lobby"
    const pickupPointLabel = t.pickupPoint || "Pickup point"
    const tavisaLogoUrl = `${window.location.origin}/logo-tavisa/Logo%20Principal%20-%20Tavisa%20Travel.png`

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Samaná - ${res.customerName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
  .ticket { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #16a34a 0%, #166534 100%); color: #fff; padding: 28px 24px; text-align: center; }
  .logo { width: 170px; max-width: 80%; margin: 0 auto 12px; display: block; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.85; letter-spacing: 1px; }
  .product-name { text-align: center; padding: 10px 24px 0; font-size: 13px; color: #166534; font-weight: 600; }
  .status { text-align: center; padding: 12px; background: #f0fdf4; border-bottom: 1px solid #e5e7eb; }
  .status span { display: inline-block; background: #22c55e; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 16px; border-radius: 20px; letter-spacing: 0.5px; }
  .body { padding: 24px; }
  .guest-name { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 16px; text-align: center; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 600; color: #111; text-align: right; max-width: 60%; }
  .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
  .amount-box .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .amount-box .amount { font-size: 32px; font-weight: 800; color: #16a34a; }
  .confirm { margin-top: 10px; text-align: center; font-size: 12px; color: #374151; }
  .confirm strong { font-size: 16px; letter-spacing: 1px; color: #111827; }
  .qr-wrap { margin-top: 14px; border: 1px dashed #d1d5db; border-radius: 12px; padding: 12px; text-align: center; }
  .qr-wrap img { width: 140px; height: 140px; object-fit: contain; }
  .qr-wrap p { margin-top: 8px; font-size: 11px; color: #6b7280; word-break: break-all; }
  .footer { text-align: center; padding: 16px 24px 24px; color: #9ca3af; font-size: 11px; line-height: 1.5; }
  .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 0; }
  @media print { body { background: #fff; padding: 0; } .ticket { box-shadow: none; } }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <img class="logo" src="${tavisaLogoUrl}" alt="Tavisa Travel" />
    <h1>SAMANÁ</h1>
    <p>${t.ticket}</p>
  </div>
  <div class="status"><span>✓ ${t.confirmed}</span></div>
  <div class="product-name">${PRODUCT_NAME}</div>
  <div class="body">
    <div class="guest-name">${res.customerName}</div>
    <div class="section">
      <div class="section-title">${t.tourDetails}</div>
      <div class="row"><span class="label">${t.tourType}</span><span class="value">${tourLabel}</span></div>
      <div class="row"><span class="label">${t.date}</span><span class="value">${formatDate(res.date)}</span></div>
      <div class="row"><span class="label">${t.people}</span><span class="value">${res.guests} ${t.adults}${res.children > 0 ? " + " + res.children + " " + t.children : ""}</span></div>
      <div class="row"><span class="label">${t.lunch}</span><span class="value">${res.lunchIncluded ? t.included : t.notIncluded}</span></div>
      <div class="row"><span class="label">${t.whaleWatch}</span><span class="value">${res.whaleWatching ? t.yes : t.no}</span></div>
    </div>
    <div class="section">
      <div class="section-title">${t.pickup}</div>
      <div class="row"><span class="label">${pickupPointLabel}</span><span class="value">${pickupPoint}</span></div>
      <div class="row"><span class="label">${t.hotel}</span><span class="value">${res.hotel}</span></div>
      <div class="row"><span class="label">${t.location}</span><span class="value">${res.location}</span></div>
      <div class="row"><span class="label">${t.pickupTime}</span><span class="value" style="font-size:16px;color:#16a34a;font-weight:800">${res.pickupTime}</span></div>
    </div>
    ${amountBlock}
    <div class="confirm">${t.ref}: <strong>${confirmationNumber}</strong></div>
    <div class="qr-wrap">
      <img src="${qrUrl}" alt="QR de validación" />
      <p>${qrValue}</p>
    </div>
  </div>
  <hr class="divider" />
  <div class="footer">
    ${t.generated} ${new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}<br/>
    ${t.inquiries} tavisatravel@gmail.com | +1 (809) 870-1130
  </div>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ticket-samana-" + res.customerName.replace(/\s+/g, "-").toLowerCase() + "-" + res.date + ".html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.phone.includes(searchQuery) ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesChannel = channelFilter === "all" || reservation.channel === channelFilter
    const matchesTour = tourFilter === "all" || reservation.tourType === tourFilter
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDateFrom = !dateFromFilter || reservation.date >= dateFromFilter
    const matchesDateTo = !dateToFilter || reservation.date <= dateToFilter

    return matchesSearch && matchesChannel && matchesTour && matchesStatus && matchesDateFrom && matchesDateTo
  })

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
  }

  const getStatusButton = (reservation: SamanaReservation) => {
    const cancelRequest = getCancellationRequest(reservation.id)
    const pickupDeadline = getPickupDeadline(reservation.date, reservation.pickupTime)
    const canNoShow =
      (reservation.status === "pending" || reservation.status === "confirmed") &&
      pickupDeadline != null &&
      new Date().getTime() > pickupDeadline.getTime()

    if (reservation.status === "no_show") {
      return (
        <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 cursor-default">
          <UserX className="w-3 h-3 mr-1" />
          NO SHOW
        </Badge>
      )
    }

    if (reservation.status === "cancelled") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 cursor-default">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
          {cancelRequest?.status === "approved" ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default">Aprobada por contabilidad</Badge>
          ) : null}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {reservation.status === "confirmed" ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 cursor-default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-green-100 hover:text-green-700 hover:border-green-300"
            onClick={() => toggleStatus(reservation.id)}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Button>
        )}
        {(reservation.status === "pending" || reservation.status === "confirmed") && (
          <Button
            size="sm"
            variant="outline"
            disabled={!canNoShow}
            className="border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            onClick={() => setNoShowConfirmId(reservation.id)}
            title={canNoShow ? "Marcar como NO SHOW" : "Solo disponible despues de la hora de recogida"}
          >
            <UserX className="w-3 h-3 mr-1" />
            NO SHOW
          </Button>
        )}
        {cancelRequest?.status === "pending" ? (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 cursor-default">Cancelación solicitada</Badge>
        ) : null}
        {cancelRequest?.status === "approved" ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default">Cancelación aprobada</Badge>
        ) : null}
        {cancelRequest?.status === "rejected" ? (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 cursor-default">Cancelación rechazada</Badge>
        ) : null}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-title whitespace-nowrap text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mountain className="w-7 h-7 text-green-600" />
              Operacion Samana
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Gestión de reservas del tour Samaná</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={syncGygBookings}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sync GYG"}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Reserva
            </Button>
            <Button asChild variant="outline" className="flex-1 sm:flex-none border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/30">
              <Link href="/admin/operation-samana/disponibilidad">
                <Calendar className="w-4 h-4 mr-2" />
                Disponibilidad
              </Link>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            syncResult.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {syncResult}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Personas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalGuests}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestion de Disponibilidad</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Abre el panel dedicado para buscar por fecha y actualizar cupos o bloqueos.</p>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/admin/operation-samana/disponibilidad">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ir a Disponibilidad
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  <SelectItem value="Samaná Tours">Samaná Tours</SelectItem>
                  <SelectItem value="Viator">Viator</SelectItem>
                  <SelectItem value="GetYourGuide">GetYourGuide</SelectItem>
                  <SelectItem value="Representante">Representante</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tourFilter} onValueChange={setTourFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de tour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="full_day">Tour Completo</SelectItem>
                  <SelectItem value="half_day">Medio Día</SelectItem>
                  <SelectItem value="whale_only">Avistamiento Ballenas</SelectItem>
                  <SelectItem value="cayo_levantado">Cayo Levantado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                placeholder="Desde"
              />
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                placeholder="Hasta"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const today = getLocalISODate()
                  setDateFromFilter(today)
                  setDateToFilter(today)
                }}
              >
                Ver solo hoy
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDateFromFilter("")
                  setDateToFilter("")
                }}
              >
                Limpiar fechas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas Samaná</CardTitle>
                <CardDescription>
                  Mostrando {filteredReservations.length} de {reservations.length} reservas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className={`border rounded-lg p-4 space-y-3 transition-colors ${reservation.status === "no_show" ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700" : "hover:border-green-200"}`}>
                  {/* Row 1: Status + Channel + Ref + Language */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusButton(reservation)}
                    {reservation.isEdited && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Editada
                      </Badge>
                    )}
                    <Badge
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: `${reservation.channelColor}20`,
                        color: reservation.channelColor,
                      }}
                    >
                      <Globe className="w-3 h-3" />
                      {reservation.channel}
                    </Badge>
                    {(reservation.gygBookingRef || reservation.gygBookingReference) && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        {reservation.gygBookingReference || reservation.gygBookingRef}
                      </Badge>
                    )}
                    <span className="text-base" title={languageOptions.find(l => l.value === reservation.language)?.label || "English"}>
                      {languageOptions.find(l => l.value === reservation.language)?.flag || "🇬🇧"}
                    </span>
                    {reservation.amount != null && reservation.amount > 0 && (
                      <span className="ml-auto text-sm font-bold text-green-700">${reservation.amount.toFixed(2)} USD</span>
                    )}
                  </div>

                  {/* Row 2: Customer info + Date/Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">{reservation.customerName}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reservation.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{reservation.email}</span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 sm:justify-end">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Travel Date:</span>
                        {new Date(reservation.date + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-1 text-base text-green-700 font-bold sm:justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {reservation.pickupTime}
                      </div>
                      {reservation.createdAt && (
                        <div className="text-xs text-gray-500 mt-1 sm:text-right">
                          Agregada: {new Date(reservation.createdAt).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}, {new Date(reservation.createdAt).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      )}
                      {reservation.isEdited && reservation.editedAt && (
                        <div className="text-xs text-amber-700 mt-1 sm:text-right">
                          Editada: {new Date(reservation.editedAt).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}, {new Date(reservation.editedAt).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Hotel + Location */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                      <Hotel className="w-3.5 h-3.5 text-gray-500" />
                      {reservation.hotel}
                    </div>
                    {reservation.location && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {reservation.location}
                      </div>
                    )}
                  </div>

                  {/* Row 4: Details badges */}
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <Users className="w-3 h-3 mr-1" />
                      {reservation.guests} + {reservation.children} niños | {reservation.guests + reservation.children} PAX
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <Mountain className="w-3 h-3 mr-1" />
                      {reservation.tourType === "full_day" ? "Completo"
                        : reservation.tourType === "half_day" ? "Medio día"
                        : reservation.tourType === "whale_only" ? "Ballenas"
                        : "Cayo Levantado"}
                    </Badge>
                    <Badge className={reservation.lunchIncluded ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-100"}>
                      🍽️ {reservation.lunchIncluded ? "Almuerzo ✓" : "Sin almuerzo"}
                    </Badge>
                    <Badge className={reservation.whaleWatching ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40" : "bg-gray-100 text-gray-500 dark:text-gray-400 hover:bg-gray-100"}>
                      🐋 {reservation.whaleWatching ? "Ballenas ✓" : "Sin ballenas"}
                    </Badge>
                  </div>

                  {/* Row 5: Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => openEditDialog(reservation)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => downloadTicket(reservation)}
                    >
                      <Ticket className="w-3.5 h-3.5 mr-1" />
                      Ticket
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={
                        reservation.status === "cancelled" ||
                        reservation.status === "no_show" ||
                        getCancellationRequest(reservation.id)?.status === "pending"
                      }
                      onClick={() => requestCancellation(reservation)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      {getCancellationRequest(reservation.id)?.status === "pending"
                        ? "Pendiente Contabilidad"
                        : "Solicitar Cancelación"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={copiedMsg === `chofer-${reservation.id}` ? "border-green-500 bg-green-50 text-green-700" : "border-amber-300 text-amber-700 hover:bg-amber-50"}
                      onClick={() => copyToClipboard(generateChoferMessage(reservation), `chofer-${reservation.id}`)}
                    >
                      {copiedMsg === `chofer-${reservation.id}` ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Copiado</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5 mr-1" />Msg Chofer</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={copiedMsg === `client-${reservation.id}` ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/30"}
                      onClick={() => copyToClipboard(generateClientMessage(reservation), `client-${reservation.id}`)}
                    >
                      {copiedMsg === `client-${reservation.id}` ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Copiado</>
                      ) : (
                        <><MessageSquare className="w-3.5 h-3.5 mr-1" />Msg Cliente</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Mountain className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron reservas de Samaná</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Confirmar NO SHOW */}
      <Dialog open={!!noShowConfirmId} onOpenChange={(open) => { if (!open) setNoShowConfirmId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700">⚠️ Confirmar NO SHOW</DialogTitle>
            <DialogDescription>
              Estás a punto de marcar esta reserva como <strong>NO SHOW</strong>. Esta acción <strong>no se puede revertir</strong>. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setNoShowConfirmId(null)}>Cancelar</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => noShowConfirmId && markAsNoShow(noShowConfirmId)}
            >
              <UserX className="w-4 h-4 mr-2" />
              Confirmar NO SHOW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar reserva */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetNewRes() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Reserva — Samaná</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva reserva del tour Samaná.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2 rounded-md border border-dashed border-blue-300 bg-blue-50/50 p-3">
              <Label>Pegar reserva externa (GetYourGuide / Viator)</Label>
              <Textarea
                value={externalReservationText}
                onChange={(e) => setExternalReservationText(e.target.value)}
                placeholder="Pega aqui el texto completo de la reserva copiado desde GYG o Viator..."
                className="min-h-[140px]"
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button type="button" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/30" onClick={applyExternalReservation}>
                  Autocompletar campos
                </Button>
                {externalParseSummary && (
                  <p className="text-xs text-blue-700 dark:text-blue-300">{externalParseSummary}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del cliente *</Label>
              <Input
                value={newRes.customer_name}
                onChange={(e) => setNewRes({ ...newRes, customer_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={newRes.phone}
                onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                placeholder="+1 809-555-0000"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={newRes.email}
                onChange={(e) => setNewRes({ ...newRes, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hotel</Label>
              <Input
                value={newRes.hotel}
                onChange={(e) => setNewRes({ ...newRes, hotel: e.target.value })}
                placeholder="Hard Rock Hotel & Casino"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input
                value={newRes.location}
                onChange={(e) => setNewRes({ ...newRes, location: e.target.value })}
                placeholder="Punta Cana"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span>{newRes.date ? formatDateLabel(newRes.date) : "Selecciona una fecha"}</span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={newRes.date ? new Date(`${newRes.date}T12:00:00`) : undefined}
                    onSelect={(date) => {
                      if (!date) return
                      const nextDate = toDateInputValue(date)
                      if (blockedReservationDates.includes(nextDate)) return
                      setNewRes({ ...newRes, date: nextDate })
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today || blockedReservationDates.includes(toDateInputValue(date))
                    }}
                  />
                </PopoverContent>
              </Popover>
              {checkingSelectedDateBlocked && (
                <p className="text-xs text-gray-500">Validando disponibilidad de la fecha...</p>
              )}
              {!checkingSelectedDateBlocked && selectedDateBlocked && (
                <p className="text-xs text-red-600">Fecha bloqueada. No se pueden crear reservas manuales para este dia.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input
                value={newRes.pickup_time}
                onChange={(e) => setNewRes({ ...newRes, pickup_time: e.target.value })}
                placeholder="5:00 AM"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Idioma del cliente</Label>
              <Select value={newRes.language} onValueChange={(v) => setNewRes({ ...newRes, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.flag} {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Adultos</Label>
              <Input
                type="number"
                min={1}
                value={newRes.guests}
                onChange={(e) => setNewRes({ ...newRes, guests: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input
                type="number"
                min={0}
                value={newRes.children}
                onChange={(e) => setNewRes({ ...newRes, children: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de tour</Label>
              <Select value={newRes.tour_type} onValueChange={(v) => setNewRes({ ...newRes, tour_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">Tour Completo (Día Entero)</SelectItem>
                  <SelectItem value="half_day">Medio Día</SelectItem>
                  <SelectItem value="whale_only">Avistamiento de Ballenas</SelectItem>
                  <SelectItem value="cayo_levantado">Cayo Levantado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Almuerzo incluido</Label>
              <Select value={newRes.lunch_included ? "yes" : "no"} onValueChange={(v) => setNewRes({ ...newRes, lunch_included: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Avistamiento de ballenas</Label>
              <Select value={newRes.whale_watching ? "yes" : "no"} onValueChange={(v) => setNewRes({ ...newRes, whale_watching: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Monto (USD)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={newRes.amount}
                onChange={(e) => setNewRes({ ...newRes, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={newRes.channel} onValueChange={(v) => setNewRes({ ...newRes, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="seller">Representante</SelectItem>
                  <SelectItem value="ota">OTA (Viator, GYG...)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Referencia del canal</Label>
              <Input
                value={newRes.channel_url}
                onChange={(e) => setNewRes({ ...newRes, channel_url: e.target.value })}
                placeholder="viator.com, nombre del rep..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notas</Label>
              <Input
                value={newRes.notes}
                onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
                placeholder="Información adicional..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetNewRes() }} disabled={saving}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={saveNewReservation}
              disabled={!newRes.customer_name || !newRes.date || saving || checkingSelectedDateBlocked || selectedDateBlocked}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar reserva */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setEditingReservation(null)
          setEditReason("")
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Reserva — Samaná</DialogTitle>
            <DialogDescription>
              Modifica los datos de la reserva. Los cambios se guardarán en la base de datos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del cliente *</Label>
              <Input value={editRes.customer_name} onChange={(e) => setEditRes({ ...editRes, customer_name: e.target.value })} placeholder="John Smith" />
            </div>

            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={editRes.phone} onChange={(e) => setEditRes({ ...editRes, phone: e.target.value })} placeholder="+1 809-555-0000" />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editRes.email} onChange={(e) => setEditRes({ ...editRes, email: e.target.value })} placeholder="cliente@email.com" />
            </div>

            <div className="space-y-1.5">
              <Label>Hotel</Label>
              <Input value={editRes.hotel} onChange={(e) => setEditRes({ ...editRes, hotel: e.target.value })} placeholder="Hotel Las Ballenas" />
            </div>

            <div className="space-y-1.5">
              <Label>Ubicación exacta de recogida</Label>
              <Input value={editRes.location} onChange={(e) => setEditRes({ ...editRes, location: e.target.value })} placeholder="Lobby del hotel" />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={editRes.date} onChange={(e) => setEditRes({ ...editRes, date: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input value={editRes.pickup_time} onChange={(e) => setEditRes({ ...editRes, pickup_time: e.target.value })} placeholder="5:00 AM" />
            </div>

            <div className="space-y-1.5">
              <Label>Adultos</Label>
              <Input type="number" min={1} value={editRes.guests} onChange={(e) => setEditRes({ ...editRes, guests: parseInt(e.target.value) || 1 })} />
            </div>

            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input type="number" min={0} value={editRes.children} onChange={(e) => setEditRes({ ...editRes, children: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="space-y-1.5">
              <Label>Idioma del cliente</Label>
              <Select value={editRes.language} onValueChange={(v) => setEditRes({ ...editRes, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.flag} {lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de tour</Label>
              <Select value={editRes.tour_type} onValueChange={(v) => setEditRes({ ...editRes, tour_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">Tour Completo (Día Entero)</SelectItem>
                  <SelectItem value="half_day">Medio Día</SelectItem>
                  <SelectItem value="whale_only">Avistamiento de Ballenas</SelectItem>
                  <SelectItem value="cayo_levantado">Cayo Levantado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Almuerzo incluido</Label>
              <Select value={editRes.lunch_included ? "yes" : "no"} onValueChange={(v) => setEditRes({ ...editRes, lunch_included: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Avistamiento de ballenas</Label>
              <Select value={editRes.whale_watching ? "yes" : "no"} onValueChange={(v) => setEditRes({ ...editRes, whale_watching: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Monto (USD)</Label>
              <Input type="number" min={0} step={0.01} value={editRes.amount} onChange={(e) => setEditRes({ ...editRes, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={editRes.channel} onValueChange={(v) => setEditRes({ ...editRes, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="GetYourGuide">GetYourGuide</SelectItem>
                  <SelectItem value="Viator">Viator</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="seller">Representante</SelectItem>
                  <SelectItem value="ota">OTA (Viator, GYG...)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notas</Label>
              <Input value={editRes.notes} onChange={(e) => setEditRes({ ...editRes, notes: e.target.value })} placeholder="Información adicional..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Motivo de edición *</Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ejemplo: ajuste de precio por cambio de tour"
                className="min-h-[90px]"
              />
              {editingReservation?.isEdited && editingReservation.editReason && (
                <p className="text-xs text-muted-foreground">
                  Último motivo guardado: {editingReservation.editReason}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={saveEditReservation}
              disabled={!editRes.customer_name || !editRes.date || savingEdit || !editReason.trim()}
            >
              {savingEdit ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
