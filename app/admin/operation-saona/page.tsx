"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
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
  XCircle,
  Send,
  Loader2,
  Plus,
  Ticket,
  Ship,
  Anchor,
  RefreshCw,
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
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { parseExternalReservationText } from "@/lib/external-reservation-parser"
import { getSaonaPickupSuggestionAuto } from "@/lib/hotel-pickup-schedules"
import {
  listCancellationRequests,
  upsertCancellationRequest,
  type CancellationRequest,
} from "@/lib/cancellation-requests"
import { Label } from "@/components/ui/label"

const SAONA_DEFAULT_PICKUP_TIME = "7:30 AM"

type SaonaReservation = {
  id: string
  customerName: string
  phone: string
  email: string
  hotel: string
  location: string
  guests: number
  children: number
  pickupTime: string
  boatType: string
  channel: string
  channelUrl: string
  channelColor: string
  date: string
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  amount: number | null
  notes: string
  lunchIncluded: boolean
  drinkPackage: string
  gygBookingRef: string
  gygBookingReference: string
}

function mapRow(r: any): SaonaReservation {
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
    boatType: r.boat_type || "catamaran",
    channel: r.channel || "",
    channelUrl: r.channel_url || "",
    channelColor: r.channel_color || "#6b7280",
    date: r.date,
    status: r.status,
    amount: r.amount != null ? Number(r.amount) : null,
    notes: r.notes || "",
    lunchIncluded: r.lunch_included ?? true,
    drinkPackage: r.drink_package || "standard",
    gygBookingRef: r.gyg_booking_ref || "",
    gygBookingReference: r.gyg_booking_reference || "",
  }
}

function getLocalISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function OperationSaonaPage() {
  const [reservations, setReservations] = useState<SaonaReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [boatFilter, setBoatFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([])

  // Modal agregar reserva
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [externalReservationText, setExternalReservationText] = useState("")
  const [externalParseSummary, setExternalParseSummary] = useState<string | null>(null)
  const [pickupTimeNotice, setPickupTimeNotice] = useState<string | null>(null)
  const [newRes, setNewRes] = useState({
    customer_name: "",
    phone: "",
    email: "",
    hotel: "",
    location: "",
    guests: 1,
    children: 0,
    pickup_time: "",
    boat_type: "catamaran",
    channel: "phone",
    channel_url: "",
    channel_color: "#6b7280",
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    notes: "",
    lunch_included: true,
    drink_package: "standard",
  })

  const resetNewRes = () => {
    setExternalReservationText("")
    setExternalParseSummary(null)
    setPickupTimeNotice(null)
    setNewRes({
      customer_name: "",
      phone: "",
      email: "",
      hotel: "",
      location: "",
      guests: 1,
      children: 0,
      pickup_time: "",
      boat_type: "catamaran",
      channel: "phone",
      channel_url: "",
      channel_color: "#6b7280",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      notes: "",
      lunch_included: true,
      drink_package: "standard",
    })
  }

  const applySaonaAutoPickup = (reservation: typeof newRes) => {
    const source = `${reservation.hotel || ""} ${reservation.location || ""}`.trim()
    if (!source) {
      setPickupTimeNotice(null)
      return reservation
    }

    const suggestion = getSaonaPickupSuggestionAuto(source)
    if (suggestion?.pickupTime) {
      setPickupTimeNotice(null)
      return { ...reservation, pickup_time: suggestion.pickupTime }
    }

    setPickupTimeNotice("La hora del hotel no esta registrada.")
    return { ...reservation, pickup_time: SAONA_DEFAULT_PICKUP_TIME }
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

    const parsed = parseExternalReservationText(externalReservationText)
    const updates: Partial<typeof newRes> = {}
    const detected: string[] = []

    if (parsed.source === "gyg") {
      updates.channel = "GetYourGuide"
      detected.push("Canal: GetYourGuide")
    } else if (parsed.source === "viator") {
      updates.channel = "Viator"
      detected.push("Canal: Viator")
    }

    if (parsed.bookingReference) {
      updates.channel_url = parsed.bookingReference
      detected.push(`Referencia: ${parsed.bookingReference}`)
    }

    if (parsed.customerName) {
      updates.customer_name = parsed.customerName
      detected.push(`Cliente: ${parsed.customerName}`)
    }

    if (parsed.phone) {
      updates.phone = parsed.phone
      detected.push(`Telefono: ${parsed.phone}`)
    }

    if (parsed.reservationDate) {
      updates.date = parsed.reservationDate
      detected.push(`Fecha: ${parsed.reservationDate}`)
    }

    const pickupValue = parsed.pickupWindow || parsed.pickupTime
    if (pickupValue) {
      updates.pickup_time = pickupValue
      detected.push(`Recogida: ${pickupValue}`)
    }

    if (typeof parsed.guests === "number") {
      updates.guests = Math.max(1, parsed.guests)
      detected.push(`Adultos: ${updates.guests}`)
    }

    if (typeof parsed.children === "number") {
      updates.children = Math.max(0, parsed.children)
      detected.push(`Ninos: ${updates.children}`)
    }

    if (typeof parsed.amount === "number") {
      updates.amount = parsed.amount
      detected.push(`Monto: USD ${parsed.amount}`)
    }

    if (parsed.hotel) {
      updates.hotel = parsed.hotel
      detected.push(`Hotel: ${parsed.hotel}`)
    }

    if (parsed.location) {
      updates.location = parsed.location
      detected.push("Ubicacion detectada")
    }

    if (parsed.boatType) {
      updates.boat_type = parsed.boatType
      detected.push(`Embarcacion: ${parsed.boatType === "catamaran" ? "Catamaran" : "Lancha"}`)
    }

    if (typeof parsed.includesLunch === "boolean") {
      updates.lunch_included = parsed.includesLunch
    }

    if (parsed.includesOpenBar) {
      updates.drink_package = "premium"
      detected.push("Bebidas: Premium Open Bar")
    }

    if (detected.length === 0) {
      setExternalParseSummary("No se pudo detectar informacion util. Revisa el formato pegado.")
      return
    }

    setNewRes((prev) => applySaonaAutoPickup({ ...prev, ...updates }))
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
        setSyncResult("Todo sincronizado \u2014 sin pendientes")
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
      const { error } = await supabase.from("saona_reservations").insert({
        ...newRes,
        channel_color: channelColors[newRes.channel] || "#6b7280",
      })
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

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("saona_reservations")
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

  useEffect(() => {
    fetchReservations()
    const interval = setInterval(fetchReservations, 5000)
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

  const requestCancellation = async (reservation: SaonaReservation) => {
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
      operationType: "saona",
      reservationId: reservation.id,
      customerName: reservation.customerName,
      reason: reason.trim(),
      requestedAt: new Date().toISOString(),
      requestedBy: "Operaciones Saona",
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

  const toggleStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saona_reservations")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("Error updating status:", error)
        alert("Error al confirmar: " + error.message)
      } else {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "confirmed" as const } : r
          )
        )
      }
    } catch (e) {
      console.error("Error updating status:", e)
    }
  }

  const downloadTicket = (res: SaonaReservation) => {
    const formatDate = (d: string) => {
      const date = new Date(d + "T12:00:00")
      return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    }

    const boatLabel: Record<string, string> = {
      catamaran: "Catamarán",
      speedboat: "Lancha Rápida",
    }

    const drinkLabel: Record<string, string> = {
      standard: "Bebidas Estándar",
      premium: "Premium Open Bar",
      none: "No incluido",
    }

    const amountBlock = res.amount != null && res.amount > 0
      ? '<div class="amount-box"><div class="label">MONTO A PAGAR</div><div class="amount">$' + res.amount.toFixed(2) + ' USD</div></div>'
      : ""

    const confirmationNumber = (res.gygBookingReference || res.gygBookingRef || `SAO-${res.id.slice(0, 8).toUpperCase()}`).toUpperCase()
    const qrValue = `SAONA|${confirmationNumber}|${res.date}|${res.customerName}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Saona - ${res.customerName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
  .ticket { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #0891b2 0%, #065f73 100%); color: #fff; padding: 28px 24px; text-align: center; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.85; letter-spacing: 1px; }
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
  .amount-box { background: #f0fdfa; border: 2px solid #99f6e4; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
  .amount-box .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .amount-box .amount { font-size: 32px; font-weight: 800; color: #0891b2; }
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
    <h1>SAONA ISLAND</h1>
    <p>EXPERIENCE TICKET</p>
  </div>
  <div class="status"><span>✓ RESERVA CONFIRMADA</span></div>
  <div class="body">
    <div class="guest-name">${res.customerName}</div>
    <div class="section">
      <div class="section-title">Detalles del Tour</div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(res.date)}</span></div>
      <div class="row"><span class="label">Embarcación</span><span class="value">${boatLabel[res.boatType] || res.boatType}</span></div>
      <div class="row"><span class="label">Personas</span><span class="value">${res.guests} adulto${res.guests !== 1 ? "s" : ""}${res.children > 0 ? " + " + res.children + " niño" + (res.children > 1 ? "s" : "") : ""}</span></div>
      <div class="row"><span class="label">Almuerzo</span><span class="value">${res.lunchIncluded ? "Incluido" : "No incluido"}</span></div>
      <div class="row"><span class="label">Bebidas</span><span class="value">${drinkLabel[res.drinkPackage] || res.drinkPackage}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Recogida</div>
      <div class="row"><span class="label">Hotel</span><span class="value">${res.hotel}</span></div>
      <div class="row"><span class="label">Ubicación</span><span class="value">${res.location}</span></div>
      <div class="row"><span class="label">Hora de recogida</span><span class="value" style="font-size:16px;color:#0891b2;font-weight:800">${res.pickupTime}</span></div>
    </div>
    ${amountBlock}
    <div class="confirm">Número de confirmación: <strong>${confirmationNumber}</strong></div>
    <div class="qr-wrap">
      <img src="${qrUrl}" alt="QR de validación" />
      <p>${qrValue}</p>
    </div>
  </div>
  <hr class="divider" />
  <div class="footer">
    Ticket generado el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}<br/>
    Para cualquier consulta: info@macaooffroad.com
  </div>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ticket-saona-" + res.customerName.replace(/\s+/g, "-").toLowerCase() + "-" + res.date + ".html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filtrar
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.phone.includes(searchQuery) ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesChannel = channelFilter === "all" || reservation.channel === channelFilter
    const matchesBoat = boatFilter === "all" || reservation.boatType === boatFilter
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesDateFrom = !dateFromFilter || reservation.date >= dateFromFilter
    const matchesDateTo = !dateToFilter || reservation.date <= dateToFilter

    return matchesSearch && matchesChannel && matchesBoat && matchesStatus && matchesDateFrom && matchesDateTo
  })

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
  }

  const getStatusButton = (reservation: SaonaReservation) => {
    const cancelRequest = getCancellationRequest(reservation.id)
    if (reservation.status === "cancelled") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 cursor-default">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
          {cancelRequest?.status === "approved" ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default">
              Aprobada por contabilidad
            </Badge>
          ) : null}
        </div>
      )
    }
    if (reservation.status === "confirmed") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 cursor-default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
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
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-green-100 hover:text-green-700 hover:border-green-300"
          onClick={() => toggleStatus(reservation.id)}
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Pendiente
        </Button>
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
            <h1 className="text-2xl md:text-3xl font-title text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Ship className="w-7 h-7 text-cyan-600" />
              Operacion Saona
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Gestión de reservas del tour Saona Island</p>
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
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Reserva
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
                  <p className="text-sm text-gray-600">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmadas</p>
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
                  <p className="text-sm text-gray-600">Pendientes</p>
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
                  <p className="text-sm text-gray-600">Total Personas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <SelectItem value="Saona Island">Saona Island</SelectItem>
                  <SelectItem value="Viator">Viator</SelectItem>
                  <SelectItem value="GetYourGuide">GetYourGuide</SelectItem>
                  <SelectItem value="Representante">Representante</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={boatFilter} onValueChange={setBoatFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Embarcación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="catamaran">Catamarán</SelectItem>
                  <SelectItem value="speedboat">Lancha Rápida</SelectItem>
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
                <CardTitle>Reservas Saona Island</CardTitle>
                <CardDescription>
                  Mostrando {filteredReservations.length} de {reservations.length} reservas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-4 space-y-3 transition-colors hover:border-cyan-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusButton(reservation)}
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
                    {reservation.gygBookingRef ? (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {reservation.gygBookingRef}
                      </Badge>
                    ) : null}
                    {reservation.amount != null && reservation.amount > 0 ? (
                      <span className="ml-auto text-sm font-bold text-green-700">${reservation.amount.toFixed(2)} USD</span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">{reservation.customerName}</div>
                      <div className="font-mono text-xs text-gray-500 mt-0.5 break-all">{reservation.id}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reservation.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{reservation.email}</span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 sm:justify-end">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Travel Date:</span>
                        {new Date(`${reservation.date}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-1 text-base text-red-700 font-bold sm:justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {reservation.pickupTime || "Sin hora"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                      <Hotel className="w-3.5 h-3.5 text-gray-500" />
                      {reservation.hotel}
                    </div>
                    {reservation.location ? (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {reservation.location}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                      <Users className="w-3 h-3 mr-1" />
                      {reservation.guests} + {reservation.children} ninos | {reservation.guests + reservation.children} PAX
                    </Badge>
                    <Badge className={reservation.boatType === "catamaran" ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"}>
                      <Ship className="w-3 h-3 mr-1" />
                      {reservation.boatType === "catamaran" ? "Catamaran" : "Lancha"}
                    </Badge>
                    <Badge className={reservation.lunchIncluded ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
                      {reservation.lunchIncluded ? "Almuerzo incluido" : "Sin almuerzo"}
                    </Badge>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      {reservation.drinkPackage === "premium" ? "Open Bar Premium" : reservation.drinkPackage === "standard" ? "Bebidas estandar" : "Sin bebidas"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                      onClick={() => downloadTicket(reservation)}
                    >
                      <Ticket className="w-3 h-3 mr-1" />
                      Ticket
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={
                        reservation.status === "cancelled" ||
                        getCancellationRequest(reservation.id)?.status === "pending"
                      }
                      onClick={() => requestCancellation(reservation)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      {getCancellationRequest(reservation.id)?.status === "pending"
                        ? "Pendiente Contabilidad"
                        : "Solicitar Cancelación"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Anchor className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron reservas de Saona Island</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Agregar reserva */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetNewRes() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Reserva — Saona Island</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva reserva del tour Saona Island.
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
                onChange={(e) => setNewRes((prev) => applySaonaAutoPickup({ ...prev, hotel: e.target.value }))}
                placeholder="Hard Rock Hotel & Casino"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input
                value={newRes.location}
                onChange={(e) => setNewRes((prev) => applySaonaAutoPickup({ ...prev, location: e.target.value }))}
                placeholder="Punta Cana"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={newRes.date}
                onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input
                value={newRes.pickup_time}
                onChange={(e) => setNewRes({ ...newRes, pickup_time: e.target.value })}
                placeholder="6:00 AM"
              />
              {pickupTimeNotice && <p className="text-xs text-amber-700 dark:text-amber-300">{pickupTimeNotice}</p>}
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
              <Label>Embarcación</Label>
              <Select value={newRes.boat_type} onValueChange={(v) => setNewRes({ ...newRes, boat_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="catamaran">Catamarán</SelectItem>
                  <SelectItem value="speedboat">Lancha Rápida</SelectItem>
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
              <Label>Paquete de bebidas</Label>
              <Select value={newRes.drink_package} onValueChange={(v) => setNewRes({ ...newRes, drink_package: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="premium">Premium Open Bar</SelectItem>
                  <SelectItem value="none">No incluido</SelectItem>
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
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={saveNewReservation}
              disabled={!newRes.customer_name || !newRes.date || saving}
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
    </DashboardLayout>
  )
}
