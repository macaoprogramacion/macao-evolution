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
  Car,
  Phone,
  Mail,
  Globe,
  Calendar,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Copy,
  MessageSquare,
  Loader2,
  Plus,
  Ticket,
  DollarSign,
  UserX,
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
import { Label } from "@/components/ui/label"

function inferTimeslotFromPickup(pickupValue: string) {
  const firstTimeMatch = pickupValue.match(/(\d{1,2}):\d{2}\s*([AP]M)/i)
  if (!firstTimeMatch) return "8 AM"

  let hour = Number(firstTimeMatch[1])
  const ampm = firstTimeMatch[2].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0

  if (hour <= 9) return "8 AM"
  if (hour <= 12) return "11 AM"
  return "3 PM"
}

type Reservation = {
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
  pickupPoint: string
  transportType: string
  experience: string
  channel: string
  channelUrl: string
  channelColor: string
  date: string
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  assignedChoferId: string | null
  assignedChoferName: string | null
  choferStatus: "none" | "recibida" | "confirmada"
  amount: number | null
  notes: string
}

type Chofer = {
  id: string
  name: string
  phone: string
}

function getPickupDeadline(dateValue: string, pickupValue: string, timeslotFallback?: string) {
  const source = `${pickupValue || ""} ${timeslotFallback || ""}`
  const timeMatch = source.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/i)
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

/** Mapear fila de Supabase a formato del componente */
function mapRow(r: any): Reservation {
  return {
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone || "—",
    email: r.email || "—",
    hotel: r.hotel || "",
    location: r.location || "",
    timeslot: r.timeslot || "",
    guests: r.guests || 0,
    children: r.children || 0,
    pickupTime: r.pickup_time || "",
    pickupPoint: r.pickup_point || "lobby",
    transportType: r.transport_type || "",
    experience: r.experience || "",
    channel: r.channel || "",
    channelUrl: r.channel_url || "",
    channelColor: r.channel_color || "#6b7280",
    date: r.date,
    status: r.status,
    assignedChoferId: r.assigned_chofer_id,
    assignedChoferName: r.assigned_chofer_name,
    choferStatus: r.chofer_status || "none",
    amount: r.amount != null ? Number(r.amount) : null,
    notes: r.notes || "",
  }
}

export default function OperationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [timeslotFilter, setTimeslotFilter] = useState("all")
  const [transportFilter, setTransportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal enviar a chofer
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedChofer, setSelectedChofer] = useState<string>("")
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loadingChoferes, setLoadingChoferes] = useState(false)
  const [sending, setSending] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState("")

  // Modal agregar reserva
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [externalReservationText, setExternalReservationText] = useState("")
  const [externalParseSummary, setExternalParseSummary] = useState<string | null>(null)
  const [newRes, setNewRes] = useState({
    customer_name: "",
    phone: "",
    email: "",
    hotel: "",
    location: "",
    timeslot: "8 AM",
    guests: 1,
    children: 0,
    pickup_time: "",
    pickup_point: "lobby",
    transport_type: "included",
    experience: "",
    channel: "phone",
    channel_url: "",
    channel_color: "#6b7280",
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    notes: "",
  })

  const resetNewRes = () => {
    setNewRes({
      customer_name: "",
      phone: "",
      email: "",
      hotel: "",
      location: "",
      timeslot: "8 AM",
      guests: 1,
      children: 0,
      pickup_time: "",
      pickup_point: "lobby",
      transport_type: "included",
      experience: "",
      channel: "phone",
      channel_url: "",
      channel_color: "#6b7280",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      notes: "",
    })
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
  }

  const applyExternalReservation = () => {
    if (!externalReservationText.trim()) {
      setExternalParseSummary("Pega el texto de la reserva primero.")
      return
    }

    const parsed = parseExternalReservationText(externalReservationText)
    const pickupValue = parsed.pickupWindow || parsed.pickupTime || ""
    const notesFromPaste = [
      parsed.bookingReference ? `Booking ref: ${parsed.bookingReference}` : "",
      parsed.ticketCodes.length > 0 ? `Tickets: ${parsed.ticketCodes.join(" | ")}` : "",
    ].filter(Boolean).join("\n")

    setNewRes((prev) => ({
      ...prev,
      customer_name: parsed.customerName || prev.customer_name,
      phone: parsed.phone || prev.phone,
      hotel: parsed.hotel || prev.hotel,
      location: parsed.location || prev.location,
      date: parsed.reservationDate || prev.date,
      pickup_time: pickupValue || prev.pickup_time,
      timeslot: pickupValue ? inferTimeslotFromPickup(pickupValue) : prev.timeslot,
      pickup_point: /barrera/i.test(`${parsed.location || ""} ${parsed.hotel || ""}`) ? "barrera" : prev.pickup_point,
      guests: parsed.guests || prev.guests,
      children: parsed.children ?? prev.children,
      amount: parsed.amount ?? prev.amount,
      channel: "ota",
      channel_url: parsed.bookingReference || prev.channel_url,
      experience: parsed.optionTitle || parsed.productTitle || prev.experience,
      notes: [prev.notes, notesFromPaste].filter(Boolean).join(prev.notes && notesFromPaste ? "\n" : ""),
    }))

    setExternalParseSummary(
      `Autocompletado: ${parsed.source.toUpperCase()}${parsed.bookingReference ? ` | Ref: ${parsed.bookingReference}` : ""}${parsed.customerName ? ` | Cliente: ${parsed.customerName}` : ""}`
    )
  }

  // Guardar nueva reserva
  const saveNewReservation = async () => {
    if (!newRes.customer_name || !newRes.date) return
    setSaving(true)
    try {
      console.log("Attempting to save reservation:", newRes)
      const insertPayload = {
        ...newRes,
        channel_color: channelColors[newRes.channel] || "#6b7280",
      }
      console.log("Insert payload:", insertPayload)
      
      const { error } = await supabase.from("reservations").insert(insertPayload)
      
      if (error) {
        console.error("Error creating reservation:", error)
        alert("Error al crear reserva: " + (error.message || JSON.stringify(error)))
      } else {
        console.log("Reservation created successfully, fetching updated list...")
        await fetchReservations()
        setAddDialogOpen(false)
        resetNewRes()
      }
    } catch (e) {
      console.error("Error creating reservation:", e)
      alert("Error inesperado: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  // ── Cargar reservas desde Supabase ──
  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
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
    // Polling cada 5s para ver cambios del chofer
    const interval = setInterval(fetchReservations, 5000)
    return () => clearInterval(interval)
  }, [])

  // Cargar choferes desde Supabase
  const fetchChoferes = async () => {
    setLoadingChoferes(true)
    try {
      const { data, error } = await supabase
        .from("dashboard_users")
        .select("id, name, phone")
        .eq("role", "chofer")
        .eq("active", true)
      if (!error && data) {
        setChoferes(data)
      }
    } catch (e) {
      console.error("Error fetching choferes:", e)
    } finally {
      setLoadingChoferes(false)
    }
  }

  // Abrir modal de enviar a chofer
  const openSendDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setSelectedChofer("")
    setSendDialogOpen(true)
    fetchChoferes()
  }

  // Confirmar envío a chofer
  const confirmSendToChofer = async () => {
    if (!selectedReservation || !selectedChofer) return
    setSending(true)

    try {
      const { error } = await supabase.rpc("assign_reservation_to_chofer", {
        p_reservation_id: selectedReservation.id,
        p_chofer_id: selectedChofer,
      })
      if (error) {
        console.error("Error assigning chofer:", error)
      } else {
        await fetchReservations()
      }
    } catch (e) {
      console.error("Error assigning chofer:", e)
    }

    setSending(false)
    setSendDialogOpen(false)
    setSelectedReservation(null)
    setSelectedChofer("")
  }

  // Cambiar estado de reserva
  const updateReservationStatus = async (id: string, status: Reservation["status"]) => {
    try {
      const { error } = await supabase.rpc("update_reservation_status", {
        p_reservation_id: id,
        p_status: status,
      })
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
  }

  const generateClientMessage = (res: Reservation) => {
    const totalPax = res.guests + res.children
    const dateStr = new Date(res.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const pickupLocation = res.location || res.hotel
    const pickup = res.pickupTime || res.timeslot
    return `Hola ${res.customerName} 👋\n¡Gracias por reservar con Macao Evolution!\n\nTu recogida está confirmada a las ${pickup}.\n📍 Te esperamos en ${pickupLocation}\n⏰ Por favor sé puntual 🌊⚓\n\n📋 Detalles de tu reserva\n• 🌊 Tour: Macao Beach Experience\n• 👥 Pasajeros: ${totalPax} PAX (${res.guests} adultos, ${res.children} niños)\n• 📅 Fecha: ${dateStr}${res.experience ? `\n• 🎟️ Experiencia: ${res.experience}` : ""}`
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

  // Generar y descargar ticket para el cliente
  const downloadTicket = (res: Reservation) => {
    const formatDate = (d: string) => {
      const date = new Date(d + "T12:00:00")
      return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    }

    const transportLabel: Record<string, string> = {
      included: "Incluido",
      self: "Transporte propio",
      hotel_shuttle: "Shuttle del hotel",
    }

    const amountBlock = res.amount != null && res.amount > 0
      ? '<div class="amount-box"><div class="label">MONTO A PAGAR</div><div class="amount">$' + res.amount.toFixed(2) + ' USD</div></div>'
      : ""

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket - ${res.customerName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
  .ticket { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #fff; padding: 28px 24px; text-align: center; }
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
  .amount-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0; }
  .amount-box .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .amount-box .amount { font-size: 32px; font-weight: 800; color: #dc2626; }
  .footer { text-align: center; padding: 16px 24px 24px; color: #9ca3af; font-size: 11px; line-height: 1.5; }
  .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 0; }
  @media print { body { background: #fff; padding: 0; } .ticket { box-shadow: none; } }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <h1>MACAO OFF ROAD</h1>
    <p>EXPERIENCE TICKET</p>
  </div>
  <div class="status"><span>✓ RESERVA CONFIRMADA</span></div>
  <div class="body">
    <div class="guest-name">${res.customerName}</div>
    <div class="section">
      <div class="section-title">Detalles de la Experiencia</div>
      <div class="row"><span class="label">Experiencia</span><span class="value">${res.experience || "—"}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(res.date)}</span></div>
      <div class="row"><span class="label">Horario</span><span class="value">${res.timeslot}</span></div>
      <div class="row"><span class="label">Personas</span><span class="value">${res.guests} adulto${res.guests !== 1 ? "s" : ""}${res.children > 0 ? ` + ${res.children} niño${res.children > 1 ? "s" : ""}` : ""}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Recogida</div>
      <div class="row"><span class="label">Hotel</span><span class="value">${res.hotel}</span></div>
      <div class="row"><span class="label">Ubicación</span><span class="value">${res.location}</span></div>
      <div class="row"><span class="label">Hora de recogida</span><span class="value" style="font-size:16px;color:#dc2626;font-weight:800">${res.pickupTime}</span></div>
      <div class="row"><span class="label">Punto</span><span class="value">${res.pickupPoint === "lobby" ? "Lobby del hotel" : "Barrera de seguridad"}</span></div>
      <div class="row"><span class="label">Transporte</span><span class="value">${transportLabel[res.transportType] || res.transportType}</span></div>
    </div>
    ${amountBlock}
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
    a.download = "ticket-" + res.customerName.replace(/\s+/g, "-").toLowerCase() + "-" + res.date + ".html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filtrar reservas
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.phone.includes(searchQuery) ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesChannel = channelFilter === "all" || reservation.channel === channelFilter
    const matchesTimeslot = timeslotFilter === "all" || reservation.timeslot === timeslotFilter
    const matchesTransport = transportFilter === "all" || reservation.transportType === transportFilter
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    return matchesSearch && matchesChannel && matchesTimeslot && matchesTransport && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusButton = (reservation: Reservation) => {
    const pickupDeadline = getPickupDeadline(reservation.date, reservation.pickupTime, reservation.timeslot)
    const canNoShow =
      (reservation.status === "pending" || reservation.status === "confirmed") &&
      pickupDeadline != null &&
      new Date().getTime() > pickupDeadline.getTime()

    if (reservation.status === "no_show") {
      return (
        <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 cursor-default">
          <UserX className="w-3 h-3 mr-1" />
          NO SHOW
        </Badge>
      )
    }

    if (reservation.status === "cancelled") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 cursor-default">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelada
        </Badge>
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
            className="border-gray-400 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            onClick={() => markAsNoShow(reservation.id)}
            title={canNoShow ? "Marcar como NO SHOW" : "Solo disponible despues de la hora de recogida"}
          >
            <UserX className="w-3 h-3 mr-1" />
            NO SHOW
          </Button>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-title text-gray-900">Operation</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Gestión de reservas de todas las plataformas</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Reserva
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <SelectItem value="Macao Off Road">Macao Off Road</SelectItem>
                  <SelectItem value="Caribe Buggy">Caribe Buggy</SelectItem>
                  <SelectItem value="Saona Island">Saona Island</SelectItem>
                  <SelectItem value="Viator">Viator</SelectItem>
                  <SelectItem value="GetYourGuide">GetYourGuide</SelectItem>
                  <SelectItem value="Representante">Representante</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeslotFilter} onValueChange={setTimeslotFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los horarios</SelectItem>
                  <SelectItem value="8 AM">8:00 AM</SelectItem>
                  <SelectItem value="11 AM">11:00 AM</SelectItem>
                  <SelectItem value="3 PM">3:00 PM</SelectItem>
                </SelectContent>
              </Select>

              <Select value={transportFilter} onValueChange={setTransportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Privado">Privado</SelectItem>
                  <SelectItem value="Colectivo">Colectivo</SelectItem>
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
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>
                  Mostrando {filteredReservations.length} de {reservations.length} reservas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Más filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-4 space-y-3 hover:border-red-200 transition-colors">
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
                    {reservation.channelUrl && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {reservation.channelUrl}
                      </Badge>
                    )}
                    {reservation.amount != null && reservation.amount > 0 && (
                      <span className="ml-auto text-sm font-bold text-green-700">${reservation.amount.toFixed(2)} USD</span>
                    )}
                  </div>

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
                        {new Date(reservation.date + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-1 text-base text-red-700 font-bold sm:justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {reservation.pickupTime || reservation.timeslot}
                      </div>
                    </div>
                  </div>

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

                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                      <Users className="w-3 h-3 mr-1" />
                      {reservation.guests} + {reservation.children} niños | {reservation.guests + reservation.children} PAX
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                      <Clock className="w-3 h-3 mr-1" />
                      {reservation.timeslot || "Sin horario"}
                    </Badge>
                    <Badge className={reservation.transportType === "included" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
                      <Car className="w-3 h-3 mr-1" />
                      {reservation.transportType}
                    </Badge>
                    {reservation.experience && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {reservation.experience}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                    {reservation.assignedChoferId ? (
                      <>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          <Send className="w-3 h-3 mr-1" />
                          Enviada
                        </Badge>
                        {reservation.choferStatus === "confirmada" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Recogida OK
                          </Badge>
                        ) : reservation.choferStatus === "recibida" ? (
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Recibida
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Sin respuesta
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => openSendDialog(reservation)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar a Chofer
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => downloadTicket(reservation)}
                    >
                      <Ticket className="w-3 h-3 mr-1" />
                      Ticket
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={copiedMsg === `client-${reservation.id}` ? "border-green-500 bg-green-50 text-green-700" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
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
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron reservas con los filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Enviar reserva a chofer */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reserva a Chofer</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de enviar esta reserva? Selecciona el chofer al que deseas asignarla.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-900 space-y-1 text-sm">
              <p className="font-medium text-gray-900">{selectedReservation.customerName}</p>
              <p className="text-gray-600">{selectedReservation.hotel} — {selectedReservation.location}</p>
              <p className="text-gray-600">{selectedReservation.date} · {selectedReservation.timeslot} · Recogida {selectedReservation.pickupTime}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Seleccionar Chofer</label>
            {loadingChoferes ? (
              <div className="flex items-center gap-2 py-4 justify-center text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando choferes...
              </div>
            ) : choferes.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No hay choferes registrados. Agrega choferes desde el panel de usuarios.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {choferes.map((chofer) => (
                  <button
                    key={chofer.id}
                    onClick={() => setSelectedChofer(chofer.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedChofer === chofer.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedChofer === chofer.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {chofer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{chofer.name}</p>
                      {chofer.phone && (
                        <p className="text-xs text-gray-500">{chofer.phone}</p>
                      )}
                    </div>
                    {selectedChofer === chofer.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={confirmSendToChofer}
              disabled={!selectedChofer || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Envío
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar reserva manual */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetNewRes() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Reserva</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva reserva manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2 rounded-md border border-dashed border-blue-300 bg-blue-50/50 p-3">
              <Label>Pegar reserva externa (GetYourGuide / Viator)</Label>
              <Textarea
                value={externalReservationText}
                onChange={(e) => setExternalReservationText(e.target.value)}
                placeholder="Pega aqui el texto completo de la reserva..."
                className="min-h-[120px]"
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button type="button" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={applyExternalReservation}>
                  Autocompletar campos
                </Button>
                {externalParseSummary && <p className="text-xs text-blue-700">{externalParseSummary}</p>}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del cliente *</Label>
              <Input
                value={newRes.customer_name}
                onChange={(e) => setNewRes({ ...newRes, customer_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={newRes.phone}
                onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                placeholder="+1 809-555-0000"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={newRes.email}
                onChange={(e) => setNewRes({ ...newRes, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            {/* Hotel */}
            <div className="space-y-1.5">
              <Label>Hotel</Label>
              <Input
                value={newRes.hotel}
                onChange={(e) => setNewRes({ ...newRes, hotel: e.target.value })}
                placeholder="Hard Rock Hotel & Casino"
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input
                value={newRes.location}
                onChange={(e) => setNewRes({ ...newRes, location: e.target.value })}
                placeholder="Punta Cana"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={newRes.date}
                onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
              />
            </div>

            {/* Horario */}
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Select value={newRes.timeslot} onValueChange={(v) => setNewRes({ ...newRes, timeslot: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8 AM">8:00 AM</SelectItem>
                  <SelectItem value="11 AM">11:00 AM</SelectItem>
                  <SelectItem value="3 PM">3:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hora de recogida */}
            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input
                value={newRes.pickup_time}
                onChange={(e) => setNewRes({ ...newRes, pickup_time: e.target.value })}
                placeholder="7:30 AM"
              />
            </div>

            {/* Punto de recogida */}
            <div className="space-y-1.5">
              <Label>Punto de recogida</Label>
              <Select value={newRes.pickup_point} onValueChange={(v) => setNewRes({ ...newRes, pickup_point: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lobby">Lobby</SelectItem>
                  <SelectItem value="barrera">Barrera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personas */}
            <div className="space-y-1.5">
              <Label>Adultos</Label>
              <Input
                type="number"
                min={1}
                value={newRes.guests}
                onChange={(e) => setNewRes({ ...newRes, guests: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Niños */}
            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input
                type="number"
                min={0}
                value={newRes.children}
                onChange={(e) => setNewRes({ ...newRes, children: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Transporte */}
            <div className="space-y-1.5">
              <Label>Transporte</Label>
              <Select value={newRes.transport_type} onValueChange={(v) => setNewRes({ ...newRes, transport_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="included">Incluido</SelectItem>
                  <SelectItem value="self">Propio</SelectItem>
                  <SelectItem value="hotel_shuttle">Shuttle Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experiencia */}
            <div className="space-y-1.5">
              <Label>Experiencia</Label>
              <Input
                value={newRes.experience}
                onChange={(e) => setNewRes({ ...newRes, experience: e.target.value })}
                placeholder="Elite Couple, Apex Predator..."
              />
            </div>

            {/* Monto */}
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

            {/* Canal */}
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

            {/* URL / Referencia del canal */}
            <div className="space-y-1.5">
              <Label>Referencia del canal</Label>
              <Input
                value={newRes.channel_url}
                onChange={(e) => setNewRes({ ...newRes, channel_url: e.target.value })}
                placeholder="viator.com, nombre del rep..."
              />
            </div>

            {/* Notas */}
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
