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
  FileSpreadsheet,
  ScanLine,
  ShieldCheck,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { DriverPickupSheet } from "@/components/admin/driver-pickup-sheet"
import { BillingCollections } from "@/components/admin/billing-collections"
import { supabase } from "@/lib/supabase"
import { parseExternalReservationText } from "@/lib/external-reservation-parser"
import { getBuggyPickupSuggestion, type TurnSlot } from "@/lib/hotel-pickup-schedules"
import { createPickupReservationCode, parsePickupReservationCode } from "@/lib/pickup-reservation-code"
import {
  listCancellationRequests,
  upsertCancellationRequest,
  type CancellationRequest,
} from "@/lib/cancellation-requests"
import { Label } from "@/components/ui/label"
import { insertBillingRecord } from "@/lib/billing-records"

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

type ServiceRule = {
  id: string
  label: string
  minPeople: number
  maxPeople: number
  machineCapacity?: number
  horseRule: "none" | "range" | "equal_people"
  horseMin?: number
  horseMax?: number
}

const SERVICE_RULES: ServiceRule[] = [
  { id: "buggy_single", label: "Buggy Single", minPeople: 1, maxPeople: 1, machineCapacity: 1, horseRule: "none" },
  { id: "buggy_double", label: "Buggy Doble", minPeople: 1, maxPeople: 2, machineCapacity: 2, horseRule: "none" },
  { id: "vip_buggy_double", label: "VIP Shared Predator", minPeople: 1, maxPeople: 2, machineCapacity: 2, horseRule: "none" },
  { id: "buggy_family", label: "Family Buggy", minPeople: 3, maxPeople: 4, machineCapacity: 4, horseRule: "none" },
  { id: "vip_buggy_family", label: "VIP Family Predator", minPeople: 3, maxPeople: 4, machineCapacity: 4, horseRule: "none" },
  { id: "moto_single", label: "Single Moto", minPeople: 1, maxPeople: 1, machineCapacity: 1, horseRule: "none" },
  { id: "moto_double", label: "Doble Moto", minPeople: 1, maxPeople: 2, machineCapacity: 2, horseRule: "none" },
  { id: "horse15_buggy_double", label: "15 Min Caballos + Buggy Doble", minPeople: 1, maxPeople: 2, machineCapacity: 2, horseRule: "range", horseMin: 1, horseMax: 2 },
  { id: "horse15_buggy_family", label: "15 Min Caballos + Family Buggy", minPeople: 3, maxPeople: 4, machineCapacity: 4, horseRule: "range", horseMin: 3, horseMax: 4 },
  { id: "sunset_ride", label: "Sunset Ride", minPeople: 1, maxPeople: 12, horseRule: "equal_people" },
  { id: "sunset_tour", label: "Sunset Tour", minPeople: 1, maxPeople: 12, horseRule: "equal_people" },
  { id: "caballos", label: "Caballos", minPeople: 1, maxPeople: 12, horseRule: "equal_people" },
  { id: "full_ride", label: "Full Ride", minPeople: 1, maxPeople: 12, horseRule: "equal_people" },
]

const UPGRADE_SERVICE_OPTIONS = SERVICE_RULES.map((rule) => rule.label)

function getServiceRule(experience: string) {
  return SERVICE_RULES.find((rule) => rule.label === experience) || null
}

function inferHorseExperienceFromExternalOption(optionTitle?: string, productTitle?: string) {
  const source = `${optionTitle || ""} ${productTitle || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (/sunset\s*tour|sunset\s*ride/.test(source)) return "Sunset Tour"
  if (/\bcaballos\b|horseback|horse\s*ride|equestrian/.test(source)) return "Caballos"
  return ""
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
  createdAt: string | null
  isEdited: boolean
  editedAt: string | null
  editReason: string
}

type UpgradeDraft = {
  targetService: string
  extraAmount: string
  paymentMethod: "tarjeta" | "paypal" | "efectivo"
  notes: string
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

type Chofer = {
  id: string
  name: string
  phone: string
}

type ExportRow = {
  pickupTime: string
  customerName: string
  hotel: string
  room: string
  agency: string
  pax: number
  notes: string
  isGhost: boolean
}

type GhostReservationSeed = {
  customerName: string
  hotel: string
  room?: string
  agency: string
  pax: number
  notes?: string
}

// Random data for ghost pickups
const RANDOM_FIRST_NAMES = ["Juan", "Maria", "Carlos", "Ana", "Miguel", "Rosa", "Jose", "Laura", "Luis", "Sofia", "Pedro", "Isabel", "Diego", "Elena", "Fernando"]
const RANDOM_LAST_NAMES = ["Garcia", "Rodriguez", "Martinez", "Hernandez", "Sanchez", "Lopez", "Gonzalez", "Perez", "Torres", "Rivera", "Ramirez", "Cruz", "Morales", "Vargas", "Ruiz"]
const HOTEL_OPTIONS = ["Sunscape Coco", "Barcelo Palace", "Palladium Bavaro", "Iberostar B Collection", "Impressive", "Grand Palladium", "Barcelo Aruba", "Hard Rock Cafe", "Hilton La Romana", "CasaBlanca"]
const PICKUP_TIMES = ["8:00 AM", "8:30 AM", "9:00 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"]

function generateRandomName(): string {
  const firstName = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)]
  const lastName = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)]
  return `${firstName} ${lastName}`
}

function generateRandomHotel(): string {
  return HOTEL_OPTIONS[Math.floor(Math.random() * HOTEL_OPTIONS.length)]
}

function generateRandomPickupTime(): string {
  return PICKUP_TIMES[Math.floor(Math.random() * PICKUP_TIMES.length)]
}

function generateGhostPickup(): ExportRow {
  return {
    pickupTime: generateRandomPickupTime(),
    customerName: generateRandomName(),
    hotel: generateRandomHotel(),
    room: "",
    agency: "—",
    pax: 0,
    notes: "",
    isGhost: true,
  }
}

const GHOST_RESERVATIONS: GhostReservationSeed[] = [
  { customerName: "Mario Dimitrova", hotel: "Sunscape Coco", agency: "GYG", pax: 2, notes: "1-ATV" },
  { customerName: "Laura Daniela", hotel: "Barcelo Palace", room: "4031", agency: "Vacation On", pax: 0 },
  { customerName: "Jeffrey Campell", hotel: "Palladium Bavaro", room: "4223", agency: "Viator", pax: 0 },
  { customerName: "Kathy Wilson", hotel: "Iberostar B Collection", agency: "GYG", pax: 0 },
  { customerName: "Jayce Lima", hotel: "Impressive", agency: "GYG", pax: 8, notes: "3-BD 1-FAM" },
]

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

function getLocalISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Mapear fila de Supabase a formato del componente */
function mapRow(r: any): Reservation {
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
    notes: stripEditAuditFromNotes(rawNotes),
    createdAt: r.created_at || null,
    isEdited: Boolean(r.is_edited || resolvedEditReason || resolvedEditedAt),
    editedAt: resolvedEditedAt,
    editReason: resolvedEditReason,
  }
}

export default function OperationPage() {
  const [activeTab, setActiveTab] = useState("reservas")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [timeslotFilter, setTimeslotFilter] = useState("all")
  const [transportFilter, setTransportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [closureFeedback, setClosureFeedback] = useState<string>("")
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([])
  const [scanCodeInput, setScanCodeInput] = useState("")
  const [scanResult, setScanResult] = useState<{ valid: boolean; message: string } | null>(null)

  // Modal exportar recogidas
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10))
  const [exportTurno, setExportTurno] = useState("all")
  const [customGhosts, setCustomGhosts] = useState<ExportRow[]>([])

  const toMinFromTime = (t: string) => {
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/i)
    if (!m) return 9999
    let h = Number(m[1])
    const min = Number(m[2] || "0")
    const ap = m[3].toUpperCase()
    if (ap === "PM" && h !== 12) h += 12
    if (ap === "AM" && h === 12) h = 0
    return h * 60 + min
  }

  const selectedTurnSlots = (): TurnSlot[] => {
    if (exportTurno === "8 AM" || exportTurno === "11 AM" || exportTurno === "3 PM") {
      return [exportTurno as TurnSlot]
    }
    return ["8 AM", "11 AM", "3 PM"]
  }

  const handleSendOperationsClosure = () => {
    if (reservations.length === 0) {
      alert("No hay reservas para enviar en el cierre de operaciones")
      return
    }

    const summary = {
      id: `buggy-ops-${Date.now()}`,
      sentAt: new Date().toISOString(),
      totalReservations: reservations.length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      pending: reservations.filter((r) => r.status === "pending").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      totalPax: reservations.reduce((sum, r) => sum + (r.guests + r.children), 0),
      totalRevenue: reservations.reduce((sum, r) => sum + (r.amount || 0), 0),
      channels: [...new Set(reservations.map((r) => r.channel))].join(", "),
    }

    try {
      const currentRaw = typeof window !== "undefined" ? localStorage.getItem("macao_operation_closures") : "[]"
      const current = currentRaw ? JSON.parse(currentRaw) : []
      const next = Array.isArray(current) ? [summary, ...current].slice(0, 50) : [summary]
      localStorage.setItem("macao_operation_closures", JSON.stringify(next))
      window.dispatchEvent(new CustomEvent("macao-operation-closure-sent", { detail: summary }))
      setClosureFeedback("Cierre de operaciones enviado a contabilidad.")
      window.setTimeout(() => setClosureFeedback(""), 5000)
    } catch {
      alert("No se pudo enviar el cierre de operaciones")
    }
  }

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

  const buildExportRows = (): ExportRow[] => {
    const slots = selectedTurnSlots()

    const realRows: ExportRow[] = reservations
      .filter((r) => r.date === exportDate && slots.includes(r.timeslot as TurnSlot))
      .map((r) => {
        const totalPax = r.guests + r.children
        const agency = r.channel || ""
        const notes = r.experience
          ? r.experience
          : r.transportType && r.transportType !== "included"
          ? r.transportType
          : ""
        return {
          pickupTime: r.pickupTime || r.timeslot,
          customerName: r.customerName,
          hotel: r.hotel,
          room: r.notes.match(/hab[.:]?\s*(\S+)/i)?.[1] ?? "",
          agency,
          pax: totalPax > 0 ? totalPax : 0,
          notes,
          isGhost: false,
        }
      })

    // NO incluir fantasmas por defecto - solo incluir los que el usuario agregó manualmente
    const ghostRows = customGhosts.filter((g) =>
      g.pickupTime && // debe tener una hora
      slots.some((slot) => {
        // Verificar que el slot esté en los slots seleccionados (si es posible)
        return true
      }),
    )

    return [...realRows, ...ghostRows].sort((a, b) => toMinFromTime(a.pickupTime) - toMinFromTime(b.pickupTime))
  }

  const exportRows = buildExportRows()
  const exportRealCount = exportRows.filter((r) => !r.isGhost).length
  const exportGhostCount = exportRows.filter((r) => r.isGhost).length
  const exportPaxCount = exportRows.reduce((s, r) => s + r.pax, 0)

  // Exportar recogidas a Excel
  const exportRecogidas = () => {
    const toExport = exportRows

    const dateLabel = new Date(exportDate + "T12:00:00").toLocaleDateString("es-DO", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
    const turnoLabel =
      exportTurno === "all" ? "Todos los turnos" : `Turno ${exportTurno}`

    // Build HTML table styled like the reference spreadsheet
    const rows = toExport
      .map((r) => {
        const isReal = !r.isGhost
        const bg = isReal ? "background:#ffff00" : ""
        const paxStr = r.pax > 0 ? String(r.pax) : ""
        const agencia = r.agency || ""
        const vehicleInfo = r.notes || ""
        return `<tr style="${bg}">
          <td style="border:1px solid #999;padding:4px 8px;font-weight:700">${r.pickupTime}</td>
          <td style="border:1px solid #999;padding:4px 8px;font-style:italic;font-weight:700">${r.customerName.toUpperCase()}</td>
          <td style="border:1px solid #999;padding:4px 8px;font-style:italic;font-weight:700">${r.hotel.toUpperCase()}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:center">${r.room}</td>
          <td style="border:1px solid #999;padding:4px 8px;font-weight:700">${agencia.toUpperCase()}</td>
          <td style="border:1px solid #999;padding:4px 8px;text-align:right;font-weight:700">${paxStr}</td>
          <td style="border:1px solid #999;padding:4px 8px">${vehicleInfo}</td>
        </tr>
        <tr><td colspan="7" style="border:none;height:6px"></td></tr>
        <tr><td colspan="7" style="border:none;height:6px"></td></tr>`
      })
      .join("")

    const totalPaxAll = toExport.reduce((s, r) => s + r.pax, 0)

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Recogidas</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;width:100%">
  <!-- Logo row -->
  <tr>
    <td colspan="7" style="padding:12px 8px;text-align:center">
      <span style="font-size:24px;font-weight:900;color:#cc0000;letter-spacing:2px;font-family:Impact,Arial">MACAO</span>
      <span style="font-size:10px;color:#555;display:block">OFFROAD EXPERIENCE</span>
    </td>
  </tr>
  <!-- Date + title -->
  <tr>
    <td colspan="2" style="padding:4px 8px;font-weight:700;font-size:11px">${dateLabel}</td>
    <td colspan="5" style="padding:4px 8px;font-weight:700;font-size:13px;color:#333">ORDEN DE RECOGIDA — ${turnoLabel}</td>
  </tr>
  <!-- Empty row -->
  <tr><td colspan="7" style="height:8px"></td></tr>
  <!-- Header -->
  <tr style="background:#e8a000;color:#000">
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:left">HORARIO</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:left">NOMBRE</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:left">HOTEL</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:center">HAB.</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:left">AGENCIA</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:right">PAX</th>
    <th style="border:1px solid #999;padding:6px 8px;font-weight:700;text-align:left">NOTAS</th>
  </tr>
  ${rows}
  <!-- Footer -->
  <tr><td colspan="7" style="height:12px"></td></tr>
  <tr>
    <td colspan="4" style="font-size:10px;color:#555;padding:4px 8px">(OPERACIONES)</td>
    <td colspan="3" style="font-size:10px;color:#555;padding:4px 8px;text-align:right">Total PAX: <strong>${totalPaxAll}</strong></td>
  </tr>
</table>
</body></html>`

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recogidas-${exportDate}-${exportTurno === "all" ? "todos" : exportTurno.replace(" ", "")}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportDialogOpen(false)
  }

  // Modal enviar a chofer
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedChofer, setSelectedChofer] = useState<string>("")
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loadingChoferes, setLoadingChoferes] = useState(false)
  const [sending, setSending] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState("")
  const [noShowConfirmId, setNoShowConfirmId] = useState<string | null>(null)
  const [pickupAutoHint, setPickupAutoHint] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editing, setEditing] = useState(false)
  const [editReason, setEditReason] = useState("")
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [upgradeReservation, setUpgradeReservation] = useState<Reservation | null>(null)
  const [savingUpgrade, setSavingUpgrade] = useState(false)
  const [upgradeDraft, setUpgradeDraft] = useState<UpgradeDraft>({
    targetService: "",
    extraAmount: "",
    paymentMethod: "efectivo",
    notes: "",
  })
  const [editRes, setEditRes] = useState({
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
    machine_count: 0,
    horses: 0,
    channel: "phone",
    channel_url: "",
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    notes: "",
  })

  // Modal agregar reserva
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [externalReservationText, setExternalReservationText] = useState("")
  const [externalParseSummary, setExternalParseSummary] = useState<string | null>(null)
  const [externalHorseAutoSummary, setExternalHorseAutoSummary] = useState<string | null>(null)
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
    machine_count: 0,
    horses: 0,
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
      machine_count: 0,
      horses: 0,
      channel: "phone",
      channel_url: "",
      channel_color: "#6b7280",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      notes: "",
    })
    setExternalReservationText("")
    setExternalParseSummary(null)
    setExternalHorseAutoSummary(null)
  }

  const channelColors: Record<string, string> = {
    website: "#dc2626",
    whatsapp: "#22c55e",
    phone: "#3b82f6",
    walk_in: "#8b5cf6",
    seller: "#d97706",
    ota: "#ef4444",
  }

  const withBuggyAutoPickup = (draft: typeof newRes) => {
    const slot = (draft.timeslot === "11 AM" || draft.timeslot === "3 PM" ? draft.timeslot : "8 AM") as TurnSlot
    const source = `${draft.hotel} ${draft.location}`.trim()
    const suggestion = getBuggyPickupSuggestion(source, slot)

    if (!suggestion) {
      setPickupAutoHint(null)
      return draft
    }

    setPickupAutoHint(
      `Horario sugerido: ${suggestion.pickupTime} | Punto: ${suggestion.pickupPoint.toUpperCase()} (${suggestion.hotel})`,
    )

    return {
      ...draft,
      pickup_time: suggestion.pickupTime || draft.pickup_time,
      pickup_point: suggestion.pickupPoint,
    }
  }

  const applyExternalReservation = () => {
    if (!externalReservationText.trim()) {
      setExternalParseSummary("Pega el texto de la reserva primero.")
      return
    }

    const parsed = parseExternalReservationText(externalReservationText)
    const pickupValue = parsed.pickupWindow || parsed.pickupTime || ""
    const inferredHorseExperience = inferHorseExperienceFromExternalOption(parsed.optionTitle, parsed.productTitle)
    const notesFromPaste = [
      parsed.bookingReference ? `Booking ref: ${parsed.bookingReference}` : "",
      parsed.ticketCodes.length > 0 ? `Tickets: ${parsed.ticketCodes.join(" | ")}` : "",
      parsed.machineCount ? `Maquinas: ${parsed.machineCount}` : "",
      parsed.machineLabel ? `Tipo maquina: ${parsed.machineLabel}` : "",
    ].filter(Boolean).join("\n")

    let nextHorseAutoSummary: string | null = null

    setNewRes((prev) => {
      const nextGuests = parsed.guests || prev.guests
      const nextChildren = parsed.children ?? prev.children
      const nextExperience = inferredHorseExperience || parsed.normalizedExperience || parsed.optionTitle || parsed.productTitle || prev.experience
      const totalPeople = nextGuests + nextChildren
      const nextRule = getServiceRule(nextExperience)
      const nextHorses = nextRule?.horseRule === "equal_people"
        ? totalPeople
        : prev.horses
      const nextMachineCount = parsed.machineCount || Math.max(prev.machine_count, getSuggestedMachineCount(nextExperience, nextGuests, nextChildren))

      if (nextRule?.horseRule === "equal_people") {
        nextHorseAutoSummary = `Caballos auto: ${nextHorses} (${nextExperience})`
      }

      return withBuggyAutoPickup({
        ...prev,
        customer_name: parsed.customerName || prev.customer_name,
        phone: parsed.phone || prev.phone,
        hotel: parsed.hotel || prev.hotel,
        location: parsed.location || prev.location,
        date: parsed.reservationDate || prev.date,
        pickup_time: pickupValue || prev.pickup_time,
        timeslot: pickupValue ? inferTimeslotFromPickup(pickupValue) : prev.timeslot,
        pickup_point: /barrera/i.test(`${parsed.location || ""} ${parsed.hotel || ""}`) ? "barrera" : prev.pickup_point,
        guests: nextGuests,
        children: nextChildren,
        amount: parsed.amount ?? prev.amount,
        channel: "ota",
        channel_url: parsed.bookingReference || prev.channel_url,
        experience: nextExperience,
        machine_count: nextMachineCount,
        horses: nextHorses,
        notes: [prev.notes, notesFromPaste].filter(Boolean).join(prev.notes && notesFromPaste ? "\n" : ""),
      })
    })

    setExternalHorseAutoSummary(nextHorseAutoSummary)

    setExternalParseSummary(
      `Autocompletado: ${parsed.source.toUpperCase()}${parsed.bookingReference ? ` | Ref: ${parsed.bookingReference}` : ""}${parsed.customerName ? ` | Cliente: ${parsed.customerName}` : ""}${parsed.machineCount ? ` | Maquinas: ${parsed.machineCount}` : ""}${parsed.machineLabel ? ` (${parsed.machineLabel})` : ""}`
    )

    setExternalReservationText("")
  }

  // Guardar nueva reserva
  const saveNewReservation = async () => {
    if (!newRes.customer_name || !newRes.date) return

    const validationError = validateServiceCapacity(newRes)
    if (validationError) {
      alert(validationError)
      return
    }

    setSaving(true)
    try {
      console.log("Attempting to save reservation:", newRes)
      const { horses, machine_count, ...newResWithoutCounts } = newRes
      const insertPayload = {
        ...newResWithoutCounts,
        notes: upsertReservationCountsInNotes(newRes.notes, horses, machine_count),
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
    setNoShowConfirmId(null)
  }

  const getCancellationRequest = (reservationId: string) => {
    return cancellationRequests.find((item) => item.reservationId === reservationId)
  }

  const requestCancellation = async (reservation: Reservation) => {
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
      operationType: "buggy",
      reservationId: reservation.id,
      customerName: reservation.customerName,
      reason: reason.trim(),
      requestedAt: new Date().toISOString(),
      requestedBy: "Operaciones Buggy",
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

  const generateClientMessage = (res: Reservation) => {
    const totalPax = res.guests + res.children
    const dateStr = new Date(res.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const pickupLocation = res.location || res.hotel
    const pickup = res.pickupTime || res.timeslot
    return `Hola ${res.customerName} 👋\n¡Gracias por reservar con Macao Evolution!\n\nTu recogida está confirmada a las ${pickup}.\n📍 Te esperamos en ${pickupLocation}\n⏰ Por favor sé puntual 🌊⚓\n\n📋 Detalles de tu reserva\n• 🌊 Tour: Macao Offroad Experience\n• 👥 Pasajeros: ${totalPax} PAX (${res.guests} adultos, ${res.children} niños)\n• 📅 Fecha: ${dateStr}${res.experience ? `\n• 🎟️ Experiencia: ${res.experience}` : ""}`
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

  const buildConfirmationNumber = (res: Reservation) => {
    const cleanId = String(res.id || "").replace(/-/g, "").toUpperCase()
    return `MC-${cleanId.slice(0, 10)}`
  }

  const buildPickupCode = (res: Reservation) => {
    const roomMatch = (res.notes || "").match(/hab[.:]?\s*(\S+)/i)
    return createPickupReservationCode({
      reservationId: res.id,
      customerName: res.customerName,
      hotel: res.hotel,
      pickupTime: res.pickupTime || res.timeslot,
      agency: res.channel || "",
      persons: res.guests + res.children,
      room: roomMatch?.[1] || "",
      serviceType: res.experience || "Buggy",
    })
  }

  const parseHorseCountFromNotes = (notes: string) => {
    const match = (notes || "").match(/caballos\s*:\s*(\d+)/i)
    return match ? Number(match[1]) : 0
  }

  const parseMachineCountFromNotes = (notes: string) => {
    const match = (notes || "").match(/maquinas\s*:\s*(\d+)/i)
    return match ? Number(match[1]) : 0
  }

  const getTotalPeople = (draft: { guests: number; children: number }) => {
    return Math.max(0, Number(draft.guests || 0) + Number(draft.children || 0))
  }

  const getSuggestedMachineCount = (experience: string, guests: number, children: number) => {
    const rule = getServiceRule(experience)
    if (!rule?.machineCapacity) return 0

    const totalPeople = Math.max(0, Number(guests || 0) + Number(children || 0))
    if (totalPeople <= 0) return 0

    return Math.max(1, Math.ceil(totalPeople / rule.machineCapacity))
  }

  const upsertReservationCountsInNotes = (notes: string, horses: number, machineCount: number) => {
    const base = (notes || "")
      .replace(/\n?caballos\s*:\s*\d+/gi, "")
      .replace(/\n?maquinas\s*:\s*\d+/gi, "")
      .trim()

    return [
      base,
      machineCount > 0 ? `Maquinas: ${machineCount}` : "",
      horses > 0 ? `Caballos: ${horses}` : "",
    ].filter(Boolean).join("\n")
  }

  const validateServiceCapacity = (draft: { experience: string; guests: number; children: number; horses: number; machine_count: number }) => {
    const rule = getServiceRule(draft.experience)
    if (!rule) return null

    const totalPeople = getTotalPeople(draft)
    const machineCount = Math.max(0, Number(draft.machine_count || 0))
    const maxPeopleAllowed = rule.machineCapacity && machineCount > 0
      ? rule.machineCapacity * machineCount
      : rule.maxPeople

    if (rule.machineCapacity && machineCount <= 0) {
      return `${rule.label}: debes indicar la cantidad de maquinas.`
    }

    if (totalPeople < rule.minPeople || totalPeople > maxPeopleAllowed) {
      if (rule.machineCapacity && machineCount > 0) {
        return `${rule.label}: permitido hasta ${maxPeopleAllowed} persona(s) con ${machineCount} maquina(s). Actual: ${totalPeople}.`
      }
      return `${rule.label}: permitido ${rule.minPeople}-${rule.maxPeople} persona(s). Actual: ${totalPeople}.`
    }

    if (rule.horseRule === "range") {
      const minHorse = rule.horseMin || rule.minPeople
      const maxHorse = rule.horseMax || rule.maxPeople
      if (draft.horses < minHorse || draft.horses > maxHorse) {
        return `${rule.label}: la cantidad de caballos debe ser de ${minHorse} a ${maxHorse}.`
      }
    }

    if (rule.horseRule === "equal_people" && draft.horses !== totalPeople) {
      return `${rule.label}: la cantidad de caballos debe ser igual al total de personas (${totalPeople}).`
    }

    return null
  }

  const validateScannedTicket = () => {
    const raw = scanCodeInput.trim()
    if (!raw) {
      setScanResult({ valid: false, message: "Ingresa o escanea un código de confirmación." })
      return
    }

    try {
      const parsed = parsePickupReservationCode(raw)
      const found = reservations.find((r) => r.id === parsed.reservationId)
      if (!found) {
        setScanResult({ valid: false, message: "Código inválido: la reserva no existe en operación." })
        return
      }

      if (found.status === "cancelled" || found.status === "no_show") {
        setScanResult({ valid: false, message: `Código detectado, pero la reserva está ${found.status}.` })
        return
      }

      const expectedCode = buildPickupCode(found)
      if (expectedCode !== raw) {
        setScanResult({ valid: false, message: "Código inválido: no coincide con los datos de la reserva." })
        return
      }

      setScanResult({ valid: true, message: `Válido: ${found.customerName} (${buildConfirmationNumber(found)}) - ${found.date} ${found.timeslot}.` })
    } catch (error) {
      setScanResult({ valid: false, message: error instanceof Error ? error.message : "Código inválido." })
    }
  }

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setEditReason(reservation.editReason || "")
    setEditRes({
      customer_name: reservation.customerName || "",
      phone: reservation.phone === "—" ? "" : reservation.phone,
      email: reservation.email === "—" ? "" : reservation.email,
      hotel: reservation.hotel || "",
      location: reservation.location || "",
      timeslot: reservation.timeslot || "8 AM",
      guests: reservation.guests || 1,
      children: reservation.children || 0,
      pickup_time: reservation.pickupTime || "",
      pickup_point: reservation.pickupPoint || "lobby",
      transport_type: reservation.transportType || "included",
      experience: reservation.experience || "",
      machine_count: parseMachineCountFromNotes(reservation.notes || "") || getSuggestedMachineCount(reservation.experience || "", reservation.guests || 1, reservation.children || 0),
      horses: parseHorseCountFromNotes(reservation.notes || ""),
      channel: reservation.channel || "phone",
      channel_url: reservation.channelUrl || "",
      date: reservation.date,
      amount: reservation.amount || 0,
      notes: reservation.notes || "",
    })
    setEditDialogOpen(true)
  }

  const saveEditedReservation = async () => {
    if (!editingReservation) return
    if (!editRes.customer_name || !editRes.date) {
      alert("Nombre y fecha son obligatorios")
      return
    }
    const normalizedEditReason = editReason.trim()
    if (!normalizedEditReason) {
      alert("Debes indicar un motivo de edición antes de guardar.")
      return
    }

    const validationError = validateServiceCapacity(editRes)
    if (validationError) {
      alert(validationError)
      return
    }

    setEditing(true)
    try {
      const editedAt = new Date().toISOString()
      const previousAmount = editingReservation.amount ?? 0
      const nextAmount = editRes.amount ?? 0
      const notesWithAudit = buildNotesWithEditAudit(
        upsertReservationCountsInNotes(editRes.notes, editRes.horses, editRes.machine_count) || "",
        normalizedEditReason,
        editedAt,
        previousAmount,
        nextAmount,
      )

      const payloadBase = {
        customer_name: editRes.customer_name,
        phone: editRes.phone || null,
        email: editRes.email || null,
        hotel: editRes.hotel || null,
        location: editRes.location || null,
        timeslot: editRes.timeslot,
        guests: editRes.guests,
        children: editRes.children,
        pickup_time: editRes.pickup_time || null,
        pickup_point: editRes.pickup_point,
        transport_type: editRes.transport_type,
        experience: editRes.experience || null,
        channel: editRes.channel,
        channel_url: editRes.channel_url || null,
        channel_color: channelColors[editRes.channel] || "#6b7280",
        date: editRes.date,
        amount: editRes.amount || 0,
        notes: notesWithAudit || null,
      }

      const payloadWithAudit = {
        ...payloadBase,
        is_edited: true,
        edited_at: editedAt,
        edit_reason: normalizedEditReason,
      }

      let { error } = await supabase
        .from("reservations")
        .update(payloadWithAudit)
        .eq("id", editingReservation.id)

      if (error && /column .* does not exist/i.test(error.message || "")) {
        const fallback = await supabase
          .from("reservations")
          .update(payloadBase)
          .eq("id", editingReservation.id)
        error = fallback.error
      }

      if (error) {
        alert("No se pudo actualizar la reserva: " + error.message)
      } else {
        await fetchReservations()
        setEditDialogOpen(false)
        setEditingReservation(null)
        setEditReason("")
      }
    } catch (e) {
      alert("Error inesperado al actualizar reserva")
      console.error(e)
    } finally {
      setEditing(false)
    }
  }

  const openUpgradeDialog = (reservation: Reservation) => {
    setUpgradeReservation(reservation)
    setUpgradeDraft({
      targetService: "",
      extraAmount: "",
      paymentMethod: "efectivo",
      notes: `Upgrade sobre reserva ${reservation.id}`,
    })
    setUpgradeDialogOpen(true)
  }

  const handleCreateUpgrade = async () => {
    if (!upgradeReservation) return

    const targetService = upgradeDraft.targetService.trim()
    const extraAmount = Number(upgradeDraft.extraAmount || "0")
    if (!targetService || !Number.isFinite(extraAmount) || extraAmount <= 0) {
      alert("Debes seleccionar el servicio de upgrade y un monto extra mayor a 0.")
      return
    }

    setSavingUpgrade(true)
    try {
      const cleanPhone = upgradeReservation.phone === "—" ? undefined : (upgradeReservation.phone || undefined)
      const billingNotes = [
        upgradeDraft.notes.trim(),
        `Upgrade desde: ${upgradeReservation.experience || "Servicio base"}`,
        `Upgrade origen reserva: ${upgradeReservation.id}`,
      ]
        .filter(Boolean)
        .join("\n")

      await insertBillingRecord({
        type: "venta_directa",
        client_name: upgradeReservation.customerName,
        phone: cleanPhone,
        vendor_name: undefined,
        currency: "USD",
        amount: extraAmount,
        customer_amount: null,
        payment_method: upgradeDraft.paymentMethod,
        courtesy: false,
        service_type: `Upgrade a ${targetService}`,
        status: "pendiente",
        date: new Date().toISOString().slice(0, 10),
        notes: billingNotes,
      })

      setUpgradeDialogOpen(false)
      setUpgradeReservation(null)
      alert("Upgrade registrado en Facturación correctamente.")
    } catch (error) {
      console.error("Error creating reservation upgrade:", error)
      alert("No se pudo registrar el upgrade en facturación")
    } finally {
      setSavingUpgrade(false)
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
    const confirmationNumber = buildConfirmationNumber(res)
    const validationCode = buildPickupCode(res)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(validationCode)}`
    const logoUrl = `${window.location.origin}/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png`

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
  .header .logo { width: 170px; max-width: 80%; margin: 0 auto 10px; display: block; }
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
    <img class="logo" src="${logoUrl}" alt="MACAO OFFROAD EXPERIENCE" />
    <h1>MACAO OFFROAD EXPERIENCE</h1>
    <p>EXPERIENCE TICKET</p>
  </div>
  <div class="status"><span>✓ RESERVA CONFIRMADA</span></div>
  <div class="body">
    <div class="guest-name">${res.customerName}</div>
    <div class="section">
      <div class="section-title">Detalles de la Experiencia</div>
      <div class="row"><span class="label">Confirmación</span><span class="value">${confirmationNumber}</span></div>
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
    <div class="confirm">Número de confirmación: <strong>${confirmationNumber}</strong></div>
    <div class="qr-wrap">
      <img src="${qrUrl}" alt="QR de validación" />
      <p>${validationCode}</p>
    </div>
  </div>
  <hr class="divider" />
  <div class="footer">
    Ticket generado el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}<br/>
    Para cualquier consulta: info@jonathanarache.com
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
    const matchesDateFrom = !dateFromFilter || reservation.date >= dateFromFilter
    const matchesDateTo = !dateToFilter || reservation.date <= dateToFilter

    return matchesSearch && matchesChannel && matchesTimeslot && matchesTransport && matchesStatus && matchesDateFrom && matchesDateTo
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
    const cancelRequest = getCancellationRequest(reservation.id)
    const pickupDeadline = getPickupDeadline(reservation.date, reservation.pickupTime, reservation.timeslot)
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
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default">
              Aprobada por contabilidad
            </Badge>
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
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 cursor-default">
            Cancelación solicitada
          </Badge>
        ) : null}
        {cancelRequest?.status === "approved" ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default">
            Cancelación aprobada
          </Badge>
        ) : null}
        {cancelRequest?.status === "rejected" ? (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 cursor-default">
            Cancelación rechazada
          </Badge>
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
            <h1 className="text-2xl md:text-3xl font-title text-gray-900 dark:text-gray-100">Operacion Buggy</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Gestión de reservas, recogidas y cobros</p>
          </div>
        </div>

        {/* Cierre de operaciones card */}
        <Card className="border-gray-200 dark:border-gray-800 bg-amber-50 dark:bg-amber-950">
          <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900">Cierre de operaciones</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Envía un resumen para notificar al usuario de contabilidad.</p>
            </div>
            <Button onClick={handleSendOperationsClosure} className="bg-amber-600 hover:bg-amber-700 text-white">
              Enviar cierre a contabilidad
            </Button>
          </CardContent>
        </Card>

        {closureFeedback ? (
          <div className="text-sm text-green-700 dark:text-green-400">{closureFeedback}</div>
        ) : null}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="recogidas">Hoja de Recogida</TabsTrigger>
            <TabsTrigger value="cobros">Cobros y Facturación</TabsTrigger>
          </TabsList>

          {/* Reservas Tab */}
          <TabsContent value="reservas" className="space-y-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Reserva
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none border-green-600 text-green-700 hover:bg-green-50" onClick={() => setExportDialogOpen(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Recogidas
              </Button>
            </div>

            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 md:w-72">
                    <ScanLine className="w-4 h-4 text-blue-600" />
                    Escanear / validar ticket
                  </div>
                  <Input
                    value={scanCodeInput}
                    onChange={(e) => setScanCodeInput(e.target.value)}
                    placeholder="Pega o escanea el código MRC1:..."
                  />
                  <Button type="button" onClick={validateScannedTicket} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Validar
                  </Button>
                </div>
                {scanResult && (
                  <div className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${scanResult.valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <ShieldCheck className="w-4 h-4" />
                    {scanResult.message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
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
                  <SelectItem value="website">Website</SelectItem>
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div key={reservation.id} className={`border rounded-lg p-4 space-y-3 transition-colors ${reservation.status === "no_show" ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700" : reservation.channel === "website" ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700" : "hover:border-red-200"}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusButton(reservation)}
                            {reservation.channel === "website" && (
                              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Atención Web
                              </Badge>
                            )}
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

                  {reservation.channel === "website" && (
                    <div className="rounded-md border border-amber-300 bg-amber-100/70 px-3 py-2 text-xs font-medium text-amber-900">
                      Nueva reserva recibida desde la web. Requiere atención del operador.
                    </div>
                  )}

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
                      <div className="flex items-center gap-1 text-base text-red-700 font-bold sm:justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {reservation.pickupTime || reservation.timeslot}
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
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40">
                        {reservation.experience}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                    {reservation.assignedChoferId ? (
                      <>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40">
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
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/30"
                        onClick={() => openSendDialog(reservation)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar a Chofer
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className={copiedMsg === `pickup-${reservation.id}` ? "border-green-500 bg-green-50 text-green-700" : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"}
                      onClick={() => copyToClipboard(buildPickupCode(reservation), `pickup-${reservation.id}`)}
                    >
                      {copiedMsg === `pickup-${reservation.id}` ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Codigo copiado</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5 mr-1" />Codigo Recogida</>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => openEditDialog(reservation)}
                    >
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => openUpgradeDialog(reservation)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Upgrade
                    </Button>

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
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={
                        reservation.status === "cancelled" ||
                        reservation.status === "no_show" ||
                        getCancellationRequest(reservation.id)?.status === "pending"
                      }
                      onClick={() => requestCancellation(reservation)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      {getCancellationRequest(reservation.id)?.status === "pending"
                        ? "Pendiente Contabilidad"
                        : "Solicitar Cancelación"}
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
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron reservas con los filtros aplicados</p>
              </div>
            )}
            </CardContent>
            </Card>
          </TabsContent>

          {/* Recogidas Tab */}
          <TabsContent value="recogidas" className="mt-6">
            <DriverPickupSheet />
          </TabsContent>

          {/* Cobros y Facturación Tab */}
          <TabsContent value="cobros" className="mt-6">
            <BillingCollections />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal: Exportar Recogidas */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Exportar Recogidas
            </DialogTitle>
            <DialogDescription>
              Selecciona el día y turno para generar la hoja de recogidas en Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Día</Label>
              <Input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Turno</Label>
              <Select value={exportTurno} onValueChange={setExportTurno}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los turnos</SelectItem>
                  <SelectItem value="8 AM">Turno 8:00 AM</SelectItem>
                  <SelectItem value="11 AM">Turno 11:00 AM</SelectItem>
                  <SelectItem value="3 PM">Turno 3:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add phantom pickups section */}
            <div className="space-y-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-semibold text-blue-900">Agregar Recogidas Fantasmas</p>
              <p className="text-xs text-blue-700">Máximo 3 recogidas. Sin datos de PAX ni habitación.</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (customGhosts.length < 3) {
                    setCustomGhosts([...customGhosts, generateGhostPickup()])
                  }
                }}
                disabled={customGhosts.length >= 3}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Fantasma ({customGhosts.length}/3)
              </Button>
              {customGhosts.length > 0 && (
                <div className="space-y-1 mt-2">
                  {customGhosts.map((ghost, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-blue-200">
                      <span className="text-gray-700">
                        {ghost.customerName} • {ghost.hotel} • {ghost.pickupTime}
                      </span>
                      <button
                        onClick={() => setCustomGhosts(customGhosts.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Preview count */}
            {(() => {
              return exportRows.length > 0 ? (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  <span className="font-semibold">{exportRows.length} fila{exportRows.length !== 1 ? "s" : ""}</span> para exportar
                  {" — "}<span className="font-semibold">{exportPaxCount} PAX</span> en total
                  <div className="mt-1 text-xs text-green-700">
                    Reales: {exportRealCount} | Fantasma: {exportGhostCount}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
                  No hay filas disponibles para esta selección.
                </div>
              )
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={exportRecogidas}
              disabled={exportRows.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Descargar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setEditingReservation(null)
          setEditReason("")
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
            <DialogDescription>
              Actualiza los campos necesarios de la reserva seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del cliente *</Label>
              <Input value={editRes.customer_name} onChange={(e) => setEditRes({ ...editRes, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={editRes.phone} onChange={(e) => setEditRes({ ...editRes, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={editRes.email} onChange={(e) => setEditRes({ ...editRes, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Hotel</Label>
              <Input value={editRes.hotel} onChange={(e) => setEditRes({ ...editRes, hotel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input value={editRes.location} onChange={(e) => setEditRes({ ...editRes, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={editRes.date} onChange={(e) => setEditRes({ ...editRes, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Select value={editRes.timeslot} onValueChange={(v) => setEditRes({ ...editRes, timeslot: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8 AM">8:00 AM</SelectItem>
                  <SelectItem value="11 AM">11:00 AM</SelectItem>
                  <SelectItem value="3 PM">3:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input value={editRes.pickup_time} onChange={(e) => setEditRes({ ...editRes, pickup_time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Adultos</Label>
              <Input
                type="number"
                min={1}
                value={editRes.guests}
                onChange={(e) => {
                  const nextGuests = parseInt(e.target.value) || 1
                  const totalPeople = nextGuests + editRes.children
                  const rule = getServiceRule(editRes.experience)
                  const suggestedMachineCount = getSuggestedMachineCount(editRes.experience, nextGuests, editRes.children)
                  setEditRes({
                    ...editRes,
                    guests: nextGuests,
                    machine_count: suggestedMachineCount > 0 ? Math.max(editRes.machine_count, suggestedMachineCount) : editRes.machine_count,
                    horses: rule?.horseRule === "equal_people" ? totalPeople : editRes.horses,
                  })
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input
                type="number"
                min={0}
                value={editRes.children}
                onChange={(e) => {
                  const nextChildren = parseInt(e.target.value) || 0
                  const totalPeople = editRes.guests + nextChildren
                  const rule = getServiceRule(editRes.experience)
                  const suggestedMachineCount = getSuggestedMachineCount(editRes.experience, editRes.guests, nextChildren)
                  setEditRes({
                    ...editRes,
                    children: nextChildren,
                    machine_count: suggestedMachineCount > 0 ? Math.max(editRes.machine_count, suggestedMachineCount) : editRes.machine_count,
                    horses: rule?.horseRule === "equal_people" ? totalPeople : editRes.horses,
                  })
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Experiencia</Label>
              <Select
                value={editRes.experience || "custom"}
                onValueChange={(v) => {
                  if (v === "custom") {
                    setEditRes({ ...editRes, experience: "" })
                    return
                  }
                  const rule = getServiceRule(v)
                  const totalPeople = editRes.guests + editRes.children
                  let nextHorses = editRes.horses
                  const nextMachineCount = getSuggestedMachineCount(v, editRes.guests, editRes.children)
                  if (rule?.horseRule === "equal_people") nextHorses = totalPeople
                  if (rule?.horseRule === "range") nextHorses = Math.min(Math.max(totalPeople, rule.horseMin || 1), rule.horseMax || totalPeople)
                  setEditRes({ ...editRes, experience: v, machine_count: nextMachineCount, horses: nextHorses })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar experiencia" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_RULES.map((rule) => (
                    <SelectItem key={rule.id} value={rule.label}>{rule.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Otra (manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const rule = getServiceRule(editRes.experience)
              if (!rule?.machineCapacity) return null
              return (
                <div className="space-y-1.5">
                  <Label>Cantidad de maquinas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editRes.machine_count}
                    onChange={(e) => setEditRes({ ...editRes, machine_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Sugerido: {getSuggestedMachineCount(editRes.experience, editRes.guests, editRes.children)} maquina(s).</p>
                </div>
              )
            })()}
            {(() => {
              const rule = getServiceRule(editRes.experience)
              if (!rule || rule.horseRule === "none") return null
              return (
                <div className="space-y-1.5">
                  <Label>Cantidad de caballos</Label>
                  <Input
                    type="number"
                    min={rule.horseRule === "equal_people" ? editRes.guests + editRes.children : (rule.horseMin || 1)}
                    max={rule.horseRule === "equal_people" ? editRes.guests + editRes.children : (rule.horseMax || 30)}
                    value={editRes.horses}
                    onChange={(e) => setEditRes({ ...editRes, horses: parseInt(e.target.value) || 0 })}
                    disabled={rule.horseRule === "equal_people"}
                  />
                </div>
              )
            })()}
            <div className="space-y-1.5">
              <Label>Monto (USD)</Label>
              <Input type="number" min={0} step={0.01} value={editRes.amount} onChange={(e) => setEditRes({ ...editRes, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notas</Label>
              <Input value={editRes.notes} onChange={(e) => setEditRes({ ...editRes, notes: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Motivo de edición *</Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ejemplo: corrección de monto por descuento aplicado"
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editing}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={saveEditedReservation} disabled={editing || !editRes.customer_name || !editRes.date || !editReason.trim()}>
              {editing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={upgradeDialogOpen}
        onOpenChange={(open) => {
          setUpgradeDialogOpen(open)
          if (!open) setUpgradeReservation(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Upgrade</DialogTitle>
            <DialogDescription>
              Registra servicio destino, precio extra y método de pago. Este cobro se envía a Facturación.
            </DialogDescription>
          </DialogHeader>

          {upgradeReservation ? (
            <div className="space-y-3">
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 text-sm">
                <p className="font-medium">{upgradeReservation.customerName}</p>
                <p className="text-gray-600 dark:text-gray-300">Reserva: {upgradeReservation.id}</p>
                <p className="text-gray-600 dark:text-gray-300">Servicio actual: {upgradeReservation.experience || "No definido"}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Servicio al que sube (Upgrade) *</Label>
                <Select
                  value={upgradeDraft.targetService}
                  onValueChange={(value) => setUpgradeDraft((prev) => ({ ...prev, targetService: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona servicio" /></SelectTrigger>
                  <SelectContent>
                    {UPGRADE_SERVICE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Precio extra (USD) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={upgradeDraft.extraAmount}
                  onChange={(e) => setUpgradeDraft((prev) => ({ ...prev, extraAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Método de pago *</Label>
                <Select
                  value={upgradeDraft.paymentMethod}
                  onValueChange={(value: "tarjeta" | "paypal" | "efectivo") =>
                    setUpgradeDraft((prev) => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarjeta">Pago con Tarjeta</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={upgradeDraft.notes}
                  onChange={(e) => setUpgradeDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Motivo o detalle del upgrade"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} disabled={savingUpgrade}>Cancelar</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleCreateUpgrade}
              disabled={savingUpgrade || !upgradeDraft.targetService || Number(upgradeDraft.extraAmount || 0) <= 0}
            >
              {savingUpgrade ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Upgrade"
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
                <Button type="button" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/30" onClick={applyExternalReservation}>
                  Autocompletar campos
                </Button>
                {externalParseSummary && <p className="text-xs text-blue-700 dark:text-blue-300">{externalParseSummary}</p>}
              </div>
              {externalHorseAutoSummary ? (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{externalHorseAutoSummary}</p>
              ) : null}
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
                onChange={(e) => setNewRes((prev) => withBuggyAutoPickup({ ...prev, hotel: e.target.value }))}
                placeholder="Hard Rock Hotel & Casino"
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input
                value={newRes.location}
                onChange={(e) => setNewRes((prev) => withBuggyAutoPickup({ ...prev, location: e.target.value }))}
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
              <Select value={newRes.timeslot} onValueChange={(v) => setNewRes((prev) => withBuggyAutoPickup({ ...prev, timeslot: v }))}>
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
              {pickupAutoHint && <p className="text-xs text-blue-700">{pickupAutoHint}</p>}
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
                onChange={(e) => {
                  const nextGuests = parseInt(e.target.value) || 1
                  const totalPeople = nextGuests + newRes.children
                  const rule = getServiceRule(newRes.experience)
                  const suggestedMachineCount = getSuggestedMachineCount(newRes.experience, nextGuests, newRes.children)
                  setNewRes({
                    ...newRes,
                    guests: nextGuests,
                    machine_count: suggestedMachineCount > 0 ? Math.max(newRes.machine_count, suggestedMachineCount) : newRes.machine_count,
                    horses: rule?.horseRule === "equal_people" ? totalPeople : newRes.horses,
                  })
                }}
              />
            </div>

            {/* Niños */}
            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input
                type="number"
                min={0}
                value={newRes.children}
                onChange={(e) => {
                  const nextChildren = parseInt(e.target.value) || 0
                  const totalPeople = newRes.guests + nextChildren
                  const rule = getServiceRule(newRes.experience)
                  const suggestedMachineCount = getSuggestedMachineCount(newRes.experience, newRes.guests, nextChildren)
                  setNewRes({
                    ...newRes,
                    children: nextChildren,
                    machine_count: suggestedMachineCount > 0 ? Math.max(newRes.machine_count, suggestedMachineCount) : newRes.machine_count,
                    horses: rule?.horseRule === "equal_people" ? totalPeople : newRes.horses,
                  })
                }}
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
              <Select
                value={newRes.experience || "custom"}
                onValueChange={(v) => {
                  if (v === "custom") {
                    setNewRes({ ...newRes, experience: "" })
                    return
                  }
                  const rule = getServiceRule(v)
                  const totalPeople = newRes.guests + newRes.children
                  let nextHorses = newRes.horses
                  const nextMachineCount = getSuggestedMachineCount(v, newRes.guests, newRes.children)
                  if (rule?.horseRule === "equal_people") {
                    nextHorses = totalPeople
                  }
                  if (rule?.horseRule === "range") {
                    nextHorses = Math.min(Math.max(totalPeople, rule.horseMin || 1), rule.horseMax || totalPeople)
                  }
                  setNewRes({ ...newRes, experience: v, machine_count: nextMachineCount, horses: nextHorses })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar experiencia" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_RULES.map((rule) => (
                    <SelectItem key={rule.id} value={rule.label}>{rule.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Otra (manual)</SelectItem>
                </SelectContent>
              </Select>
              {newRes.experience === "" && (
                <Input
                  value={newRes.experience}
                  onChange={(e) => setNewRes({ ...newRes, experience: e.target.value })}
                  placeholder="Escribe experiencia personalizada"
                />
              )}
            </div>

            {(() => {
              const rule = getServiceRule(newRes.experience)
              if (!rule?.machineCapacity) return null
              return (
                <div className="space-y-1.5">
                  <Label>Cantidad de maquinas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newRes.machine_count}
                    onChange={(e) => setNewRes({ ...newRes, machine_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Sugerido: {getSuggestedMachineCount(newRes.experience, newRes.guests, newRes.children)} maquina(s).</p>
                </div>
              )
            })()}

            {(() => {
              const rule = getServiceRule(newRes.experience)
              if (!rule || rule.horseRule === "none") return null
              return (
                <div className="space-y-1.5">
                  <Label>Cantidad de caballos</Label>
                  <Input
                    type="number"
                    min={rule.horseRule === "equal_people" ? newRes.guests + newRes.children : (rule.horseMin || 1)}
                    max={rule.horseRule === "equal_people" ? newRes.guests + newRes.children : (rule.horseMax || 30)}
                    value={newRes.horses}
                    onChange={(e) => setNewRes({ ...newRes, horses: parseInt(e.target.value) || 0 })}
                    disabled={rule.horseRule === "equal_people"}
                  />
                  {rule.horseRule === "equal_people" && (
                    <p className="text-xs text-muted-foreground">Se asigna automáticamente según la cantidad de personas.</p>
                  )}
                </div>
              )
            })()}

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
