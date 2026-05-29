"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Trash2, Loader2, Printer, Send, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { insertBillingRecord, getTodayBillingRecords, updateBillingRecord, deleteBillingRecord } from "@/lib/billing-records"
import type { BillingRecord as DBBillingRecord } from "@/lib/billing-records"
import { supabase } from "@/lib/supabase"
import { createPickupReservationCode, parsePickupReservationCode } from "@/lib/pickup-reservation-code"
import { addPickupSheetRows, getOrCreateDraftPickupSheet } from "@/lib/pickup-sheets"
import { getDashboardSession } from "@/lib/dashboard-session"
import { hotelDirectory } from "@/lib/hotel-locations"
import { getBuggyPickupSuggestion } from "@/lib/hotel-pickup-schedules"
import type { TurnSlot as HotelTurnSlot } from "@/lib/hotel-pickup-schedules"
import {
  listCancellationRequests,
  updateCancellationRequestDecision,
  type CancellationRequest,
} from "@/lib/cancellation-requests"

interface BillingRecord {
  id: string
  type: "pago_al_llegar" | "credito_vendedor" | "venta_directa"
  clientName: string
  phone: string
  currency: "USD" | "DOP" | "EUR" | "GBP"
  amount: number
  customerAmount?: number | null
  paymentMethod: "tarjeta" | "paypal" | "efectivo"
  courtesy: boolean
  serviceType: string
  status: "pendiente" | "pagado" | "cancelado"
  date: string
  notes: string
  vendorName?: string
  serviceItems?: ServiceLine[]
  pickupCode?: string
}

interface UpgradeDraft {
  serviceType: string
  extraAmount: string
  paymentMethod: "tarjeta" | "paypal" | "efectivo"
  notes: string
}

interface ServiceLine {
  serviceType: string
  quantity: number
  unitAmount: string
}

const SERVICE_OPTIONS = [
  "Buggy Doble",
  "Buggy Familiar",
  "Moto",
  "Predactor Doble",
  "Predactor Familiar",
  "Kayo",
  "Polari Doble",
  "Polari Familiar",
  "Caballo",
  "Single Buggy",
  "Doble Buggy",
  "Family Buggy",
  "Single Moto",
  "Doble Moto",
  "15 Min Caballos + Doble Buggy",
  "15 Min Caballos + Family Buggy",
  "Sunset Ride",
  "Full Ride",
]

const CREDIT_VENDORS = [
  "ANDY PERDOMO",
  "ANDY VALDEZ",
  "DAVID FELIX (BUEY TOUR)",
  "ALE HUERTA",
  "BUEY TOUR",
]

const DEFAULT_VENDOR_SERVICE_PRICES: Record<string, Record<string, number>> = {
  "ALE HUERTA": {
    "Buggy Doble": 30,
    "Buggy Familiar": 60,
    "Moto": 30,
    "Predactor Doble": 55,
    "Predactor Familiar": 85,
    "Kayo": 55,
    "Polari Doble": 70,
    "Polari Familiar": 110,
    "Caballo": 25,
  },
  "DAVID FELIX (BUEY TOUR)": {
    "Buggy Doble": 35,
    "Buggy Familiar": 65,
    "Moto": 35,
    "Predactor Doble": 60,
    "Predactor Familiar": 90,
    "Kayo": 60,
    "Polari Doble": 75,
    "Polari Familiar": 115,
    "Caballo": 30,
  },
  "BUEY TOUR": {
    "Buggy Doble": 30,
    "Buggy Familiar": 60,
    "Moto": 30,
    "Predactor Doble": 55,
    "Predactor Familiar": 85,
    "Kayo": 55,
    "Polari Doble": 70,
    "Polari Familiar": 110,
    "Caballo": 25,
  },
  "ANDY VALDEZ": {
    "Buggy Doble": 30,
    "Buggy Familiar": 60,
    "Moto": 30,
    "Predactor Doble": 55,
    "Predactor Familiar": 85,
    "Kayo": 55,
    "Polari Doble": 70,
    "Polari Familiar": 110,
    "Caballo": 25,
  },
  "ANDY PERDOMO": {
    "Buggy Doble": 30,
    "Buggy Familiar": 60,
    "Moto": 30,
    "Predactor Doble": 55,
    "Predactor Familiar": 85,
    "Kayo": 55,
    "Polari Doble": 70,
    "Polari Familiar": 110,
    "Caballo": 25,
  },
}

function normalizeServiceName(serviceType: string) {
  const raw = (serviceType || "").trim().toLowerCase()
  if (raw === "doble buggy") return "Buggy Doble"
  if (raw === "family buggy") return "Buggy Familiar"
  if (raw === "single moto" || raw === "doble moto") return "Moto"
  if (raw === "predator doble") return "Predactor Doble"
  if (raw === "predator familiar") return "Predactor Familiar"
  return serviceType
}

function getDefaultVendorPrice(vendor: string, serviceType: string) {
  const vendorPrices = DEFAULT_VENDOR_SERVICE_PRICES[vendor] || {}
  const normalized = normalizeServiceName(serviceType)
  return vendorPrices[normalized]
}

const CURRENCY_SYMBOLS: Record<"USD" | "DOP" | "EUR" | "GBP", string> = {
  USD: "US$",
  DOP: "RD$",
  EUR: "EUR",
  GBP: "GBP",
}

const PAYMENT_METHOD_LABELS: Record<"tarjeta" | "paypal" | "efectivo", string> = {
  tarjeta: "Pago con Tarjeta",
  paypal: "PayPal",
  efectivo: "Efectivo",
}

const TYPE_LABELS: Record<string, string> = {
  pago_al_llegar: "Pago al Llegar",
  credito_vendedor: "Crédito Vendedor",
  venta_directa: "Venta Directa Rancho",
}

const TYPE_COLORS: Record<string, string> = {
  pago_al_llegar: "bg-yellow-100 text-yellow-800",
  credito_vendedor: "bg-blue-100 text-blue-800",
  venta_directa: "bg-green-100 text-green-800",
}

const SERVICE_NOTES_TAG = "[SERVICES_JSON]"
const PICKUP_CODE_TAG = "[PICKUP_CODE]"

function extractPickupCodeFromNotes(rawNotes?: string) {
  const notes = rawNotes || ""
  const markerIndex = notes.indexOf(PICKUP_CODE_TAG)
  if (markerIndex < 0) return ""
  return notes.slice(markerIndex + PICKUP_CODE_TAG.length).trim()
}

function removePickupCodeTag(rawNotes?: string) {
  const notes = rawNotes || ""
  const markerIndex = notes.indexOf(PICKUP_CODE_TAG)
  if (markerIndex < 0) return notes
  return notes.slice(0, markerIndex).trim()
}

function parseServiceItemsFromNotes(rawNotes?: string) {
  const notes = rawNotes || ""
  const markerIndex = notes.indexOf(SERVICE_NOTES_TAG)
  if (markerIndex < 0) {
    return { cleanNotes: notes, serviceItems: [] as ServiceLine[] }
  }

  const cleanNotes = notes.slice(0, markerIndex).trim()
  const encoded = notes.slice(markerIndex + SERVICE_NOTES_TAG.length).trim()

  try {
    const parsed = JSON.parse(encoded)
    const items = Array.isArray(parsed?.items)
      ? parsed.items
          .map((item: any) => ({
            serviceType: String(item?.serviceType || ""),
            quantity: Math.max(1, Number(item?.quantity || 1)),
            unitAmount: String(item?.unitAmount || ""),
          }))
          .filter((item: ServiceLine) => item.serviceType)
      : []
    return { cleanNotes, serviceItems: items }
  } catch {
    return { cleanNotes: notes, serviceItems: [] as ServiceLine[] }
  }
}

const HOTEL_OPTIONS = Array.from(new Set(Object.values(hotelDirectory).map((hotel) => hotel.name))).sort((a, b) =>
  a.localeCompare(b),
)

type BillingTurnSlot = "8 AM" | "11 AM" | "2 PM"

const TURN_OPTIONS: BillingTurnSlot[] = ["8 AM", "11 AM", "2 PM"]
const UNKNOWN_PICKUP_TIME_BY_TURN: Record<BillingTurnSlot, string> = {
  "8 AM": "8:00 AM",
  "11 AM": "11:00 AM",
  "2 PM": "2:00 PM",
}

function toHotelTurnSlot(turn: BillingTurnSlot): HotelTurnSlot {
  if (turn === "2 PM") return "3 PM"
  return turn
}

function normalizeLooseText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function BillingCollections() {
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [closureFeedback, setClosureFeedback] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedPickupRecordId, setCopiedPickupRecordId] = useState<string | null>(null)

  // Form state
  const [type, setType] = useState<"pago_al_llegar" | "credito_vendedor" | "venta_directa">("pago_al_llegar")
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [customerAmount, setCustomerAmount] = useState("")
  const [currency, setCurrency] = useState<"USD" | "DOP" | "EUR" | "GBP">("USD")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "paypal" | "efectivo">("efectivo")
  const [courtesy, setCourtesy] = useState(false)
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([{ serviceType: "", quantity: 1, unitAmount: "" }])
  const [pickupHotel, setPickupHotel] = useState("")
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false)
  const [pickupTurn, setPickupTurn] = useState<BillingTurnSlot>("8 AM")
  const [pickupTime, setPickupTime] = useState("")
  const [pickupRoom, setPickupRoom] = useState("")
  const [pickupPax, setPickupPax] = useState("1")
  const [notes, setNotes] = useState("")
  const [cancelRequests, setCancelRequests] = useState<CancellationRequest[]>([])
  const [canManageAccountingRequests, setCanManageAccountingRequests] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [upgradeSourceRecord, setUpgradeSourceRecord] = useState<BillingRecord | null>(null)
  const [upgradeDraft, setUpgradeDraft] = useState<UpgradeDraft>({
    serviceType: "",
    extraAmount: "",
    paymentMethod: "efectivo",
    notes: "",
  })

  const mapDbRecord = (r: DBBillingRecord): BillingRecord => {
    const { cleanNotes, serviceItems } = parseServiceItemsFromNotes(r.notes || "")
    const noteWithoutCode = removePickupCodeTag(cleanNotes)
    return {
      id: r.id,
      type: r.type,
      clientName: r.client_name,
      phone: r.phone || "",
      currency: r.currency,
      amount: r.amount,
      customerAmount: r.customer_amount != null ? Number(r.customer_amount) : null,
      paymentMethod: r.payment_method,
      courtesy: r.courtesy,
      serviceType: r.service_type,
      status: r.status,
      date: r.date,
      notes: noteWithoutCode,
      vendorName: r.vendor_name,
      serviceItems,
      pickupCode: extractPickupCodeFromNotes(r.notes || ""),
    }
  }

  const reloadRecords = async () => {
    const dbRecords = await getTodayBillingRecords()
    setRecords(dbRecords.map((r: DBBillingRecord) => mapDbRecord(r)))
  }

  // Load records from Supabase on mount
  useEffect(() => {
    const loadRecords = async () => {
      setIsLoading(true)
      try {
        await reloadRecords()
      } catch (err) {
        console.error("Error loading billing records:", err)
      } finally {
        setIsLoading(false)
      }
    }

    void loadRecords()
  }, [])

  useEffect(() => {
    let mounted = true

    const resolveRole = async () => {
      const session = await getDashboardSession()
      if (!mounted) return
      const role = session?.role || ""
      const allowed = role === "contabilidad" || role === "admin" || role === "both"
      setCanManageAccountingRequests(allowed)
    }

    void resolveRole()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!canManageAccountingRequests) {
      setCancelRequests([])
      return
    }

    void loadCancelRequests()
    const interval = window.setInterval(() => {
      void loadCancelRequests()
    }, 5000)
    return () => window.clearInterval(interval)
  }, [canManageAccountingRequests])

  useEffect(() => {
    if (type !== "credito_vendedor") return

    if (!vendorName && CREDIT_VENDORS.length > 0) {
      setVendorName(CREDIT_VENDORS[0])
    }
  }, [type, vendorName])

  useEffect(() => {
    if (type !== "credito_vendedor" || !vendorName) return

    setServiceLines((prev) =>
      prev.map((line) => {
        const defaultPrice = getDefaultVendorPrice(vendorName, line.serviceType)
        if (defaultPrice == null) return line
        return { ...line, unitAmount: String(defaultPrice) }
      }),
    )
  }, [type, vendorName])

  const normalizedPickupHotel = useMemo(() => normalizeLooseText(pickupHotel), [pickupHotel])

  const hotelSuggestions = useMemo(() => {
    if (!normalizedPickupHotel) return HOTEL_OPTIONS.slice(0, 12)

    const withScore = HOTEL_OPTIONS.map((name) => {
      const n = normalizeLooseText(name)
      let score = 0
      if (n === normalizedPickupHotel) score = 100
      else if (n.startsWith(normalizedPickupHotel)) score = 80
      else if (n.includes(normalizedPickupHotel)) score = 60
      return { name, score }
    }).filter((item) => item.score > 0)

    return withScore
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((item) => item.name)
  }, [normalizedPickupHotel])

  const hasExactRegisteredHotel = useMemo(
    () => HOTEL_OPTIONS.some((name) => normalizeLooseText(name) === normalizedPickupHotel),
    [normalizedPickupHotel],
  )

  const pickupScheduleSuggestion = useMemo(() => {
    if (!pickupHotel.trim()) return null
    const suggestion = getBuggyPickupSuggestion(pickupHotel, toHotelTurnSlot(pickupTurn))
    if (!suggestion || suggestion.score < 0.6) return null
    return suggestion
  }, [pickupHotel, pickupTurn])

  useEffect(() => {
    if (!pickupHotel.trim()) return

    if (pickupScheduleSuggestion?.pickupTime) {
      setPickupTime(pickupScheduleSuggestion.pickupTime)
      return
    }

    setPickupTime((prev) => (prev.trim() ? prev : UNKNOWN_PICKUP_TIME_BY_TURN[pickupTurn]))
  }, [pickupHotel, pickupScheduleSuggestion, pickupTurn])

  const chooseHotel = (value: string) => {
    setPickupHotel(value)
    setShowHotelSuggestions(false)
  }

  const handleSelectPickupTurn = (turn: BillingTurnSlot) => {
    setPickupTurn(turn)
    if (pickupScheduleSuggestion?.pickupTime) {
      setPickupTime(pickupScheduleSuggestion.pickupTime)
      return
    }
    setPickupTime(UNKNOWN_PICKUP_TIME_BY_TURN[turn])
  }

  const supportsMultiCurrency = type === "pago_al_llegar" || type === "venta_directa"

  const formatMoney = (code: "USD" | "DOP" | "EUR" | "GBP", value: number) => {
    const locale = code === "DOP" ? "es-DO" : "en-US"
    return `${CURRENCY_SYMBOLS[code]} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const loadCancelRequests = async () => {
    try {
      const requests = await listCancellationRequests()
      setCancelRequests(requests)
    } catch (error) {
      console.error("Error loading cancellation requests:", error)
      setCancelRequests([])
    }
  }

  const handleCancelDecision = async (request: CancellationRequest, status: "approved" | "rejected") => {
    const accountingNote = window.prompt(
      status === "approved"
        ? "Nota de aprobación (opcional):"
        : "Motivo de rechazo (opcional):",
      "",
    )

    if (status === "approved") {
      try {
        if (request.operationType === "buggy") {
          await supabase.rpc("update_reservation_status", {
            p_reservation_id: request.reservationId,
            p_status: "cancelled",
          })
        } else if (request.operationType === "saona") {
          await supabase
            .from("saona_reservations")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", request.reservationId)
        } else {
          await supabase
            .from("samana_reservations")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", request.reservationId)
        }
      } catch (error) {
        console.error("Error approving cancellation:", error)
        alert("No se pudo aplicar la cancelación en la reserva")
      }
    }

    try {
      await updateCancellationRequestDecision(
        request.id,
        status,
        accountingNote?.trim() || undefined,
        "Contabilidad",
      )
      await loadCancelRequests()
    } catch (error) {
      console.error("Error updating cancellation decision:", error)
      alert(error instanceof Error ? error.message : "No se pudo guardar la decisión de contabilidad")
    }
  }

  const printBillingInvoice = (record: BillingRecord) => {
    const generatedAt = new Date().toLocaleString("es-DO")
    const total = formatMoney(record.currency, record.amount)
    const customerAmountLine =
      record.type === "credito_vendedor" && record.customerAmount != null && record.customerAmount > 0
        ? `<div class="row"><span class="label">Monto a pagar por cliente</span><span class="value">${formatMoney("USD", record.customerAmount)}</span></div>`
        : ""
    const logoUrl = "/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png"
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Factura ${record.id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
    .invoice { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .header { padding: 20px; background: #111827; color: white; }
    .header-top { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
    .logo { width: 74px; height: auto; object-fit: contain; background: #fff; border-radius: 8px; padding: 6px; }
    .header h1 { margin: 0; font-size: 20px; line-height: 1.15; }
    .header p { margin: 4px 0 0; }
    .content { padding: 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .row:last-child { border-bottom: none; }
    .label { color: #6b7280; }
    .value { font-weight: 600; }
    .total { margin-top: 18px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: right; font-size: 20px; font-weight: 700; }
    @media print { body { padding: 0; } .invoice { border: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="header-top">
        <img src="${logoUrl}" alt="Macao Offroad Logo" class="logo" />
        <div>
          <h1>MACAO OFFROAD EXPERIENCE</h1>
          <p>Factura de Cobro/Venta</p>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="row"><span class="label">Factura</span><span class="value">${record.id}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${record.date}</span></div>
      <div class="row"><span class="label">Cliente</span><span class="value">${record.clientName}</span></div>
      <div class="row"><span class="label">Teléfono</span><span class="value">${record.phone || "—"}</span></div>
      <div class="row"><span class="label">Tipo</span><span class="value">${TYPE_LABELS[record.type]}</span></div>
      <div class="row"><span class="label">Servicio</span><span class="value">${record.serviceType}</span></div>
      ${customerAmountLine}
      <div class="row"><span class="label">Método de pago</span><span class="value">${PAYMENT_METHOD_LABELS[record.paymentMethod]}</span></div>
      <div class="row"><span class="label">Estado</span><span class="value">${record.status}</span></div>
      <div class="total">Total: ${total}</div>
      <p style="margin-top: 14px; font-size: 12px; color: #6b7280;">Generada: ${generatedAt}</p>
    </div>
  </div>
</body>
</html>`

    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 200)
  }

  const sendPickupCodeToDriverSheet = async (rawCode: string) => {
    const parsed = parsePickupReservationCode(rawCode)
    const today = new Date().toISOString().slice(0, 10)
    const sheet = await getOrCreateDraftPickupSheet(today, "8 AM", "billing")

    await addPickupSheetRows(sheet.id, [
      {
        pickup_time: parsed.pickupTime,
        customer_name: parsed.customerName,
        hotel: parsed.hotel,
        room: parsed.room || null,
        agency: parsed.agency || "Facturación",
        pax: parsed.persons > 0 ? parsed.persons : 1,
        notes: parsed.serviceType || "",
        is_ghost: false,
        ghost_hotel_random: null,
        ghost_name_random: null,
        reservation_id: parsed.reservationId || null,
      },
    ])
  }

  const handleAddRecord = async () => {
    const normalizedLines = serviceLines
      .map((line) => ({
        serviceType: line.serviceType.trim(),
        quantity: Math.max(1, Number(line.quantity || 1)),
        unitAmount: String(line.unitAmount || "").trim(),
      }))
      .filter((line) => line.serviceType && Number(line.unitAmount) > 0)

    if (!clientName || normalizedLines.length === 0 || (type === "credito_vendedor" && !vendorName)) {
      alert("Por favor completa los campos requeridos")
      return
    }

    if (!pickupHotel.trim() || !pickupTime.trim()) {
      alert("Para generar codigo MRC1 automatico debes completar Hotel y Hora de recogida.")
      return
    }

    setIsSaving(true)
    try {
      const recordCurrency = supportsMultiCurrency ? currency : "USD"
      const parsedCustomerAmount = Number(customerAmount || "0")
      const hasCustomerAmount = type === "credito_vendedor" && Number.isFinite(parsedCustomerAmount) && parsedCustomerAmount > 0
      const totalAmount = normalizedLines.reduce(
        (sum, line) => sum + Number(line.unitAmount) * line.quantity,
        0,
      )
      const serviceSummary = normalizedLines
        .map((line) => `${line.quantity}x ${line.serviceType}`)
        .join(" + ")

      const serializedServiceItems = `${SERVICE_NOTES_TAG}${JSON.stringify({
        version: 1,
        items: normalizedLines,
      })}`

      const finalNotes = [notes.trim(), serializedServiceItems].filter(Boolean).join("\n")

      const inserted = await insertBillingRecord({
        type,
        client_name: clientName,
        phone: phone || null,
        currency: recordCurrency,
        amount: totalAmount,
        customer_amount: hasCustomerAmount ? parsedCustomerAmount : null,
        payment_method: paymentMethod,
        courtesy,
        service_type: serviceSummary,
        status: "pendiente",
        date: new Date().toISOString().slice(0, 10),
        notes: finalNotes,
        vendor_name: type === "credito_vendedor" ? vendorName : null,
      })

      let effectivePickupCode = ""

      if (inserted) {
        effectivePickupCode = createPickupReservationCode({
          reservationId: inserted.id,
          customerName: clientName,
          hotel: pickupHotel.trim(),
          pickupTime: pickupTime.trim(),
          agency: type === "credito_vendedor" ? vendorName.trim() : "Facturacion",
          persons: Math.max(1, Number(pickupPax || "1")),
          room: pickupRoom.trim(),
          serviceType: serviceSummary,
        })

        if (effectivePickupCode) {
          const notesWithCode = [
            notes.trim(),
            serializedServiceItems,
            `${PICKUP_CODE_TAG}${effectivePickupCode}`,
          ]
            .filter(Boolean)
            .join("\n")

          await updateBillingRecord(inserted.id, { notes: notesWithCode })
        }

        // Reload records from DB after optional code update
        await reloadRecords()

        const createdRecord: BillingRecord = {
          id: inserted.id,
          type: inserted.type,
          clientName: inserted.client_name,
          phone: inserted.phone || "",
          currency: inserted.currency,
          amount: inserted.amount,
          customerAmount: inserted.customer_amount != null ? Number(inserted.customer_amount) : null,
          paymentMethod: inserted.payment_method,
          courtesy: inserted.courtesy,
          serviceType: inserted.service_type,
          status: inserted.status,
          date: inserted.date,
          notes,
          vendorName: inserted.vendor_name || undefined,
          serviceItems: normalizedLines,
          pickupCode: effectivePickupCode || undefined,
        }

        if (window.confirm("Venta creada correctamente. ¿Deseas imprimir la factura ahora?")) {
          printBillingInvoice(createdRecord)
        }
      }
      resetForm()
    } catch (err) {
      console.error("Error saving record:", err)
      const message = err instanceof Error ? err.message : "Error desconocido"
      alert(`No se pudo guardar el registro: ${message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setType("pago_al_llegar")
    setClientName("")
    setPhone("")
    setVendorName("")
    setCustomerAmount("")
    setCurrency("USD")
    setAmount("")
    setPaymentMethod("efectivo")
    setCourtesy(false)
    setServiceLines([{ serviceType: "", quantity: 1, unitAmount: "" }])
    setPickupHotel("")
    setPickupTurn("8 AM")
    setPickupTime("")
    setPickupRoom("")
    setPickupPax("1")
    setNotes("")
  }

  const updateServiceLine = (index: number, updates: Partial<ServiceLine>) => {
    setServiceLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...updates } : line)),
    )
  }

  const handleServiceTypeChange = (index: number, serviceType: string) => {
    const updates: Partial<ServiceLine> = { serviceType }
    if (type === "credito_vendedor" && vendorName) {
      const defaultPrice = getDefaultVendorPrice(vendorName, serviceType)
      if (defaultPrice != null) {
        updates.unitAmount = String(defaultPrice)
      }
    }
    updateServiceLine(index, updates)
  }

  const addServiceLine = () => {
    setServiceLines((prev) => [...prev, { serviceType: "", quantity: 1, unitAmount: "" }])
  }

  const removeServiceLine = (index: number) => {
    setServiceLines((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const computedTotal = serviceLines.reduce((sum, line) => {
    const qty = Math.max(1, Number(line.quantity || 1))
    const unit = Number(line.unitAmount || 0)
    return sum + qty * unit
  }, 0)

  const handleUpdateStatus = async (id: string, newStatus: "pendiente" | "pagado" | "cancelado") => {
    setIsSaving(true)
    try {
      await updateBillingRecord(id, { status: newStatus })
      setRecords(
        records.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r,
        ),
      )
    } catch (err) {
      console.error("Error updating record:", err)
      alert("No se pudo actualizar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      return
    }

    setIsSaving(true)
    try {
      await deleteBillingRecord(id)
      setRecords(records.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Error deleting record:", err)
      alert("No se pudo eliminar el registro")
    } finally {
      setIsSaving(false)
    }
  }

  const openUpgradeDialog = (record: BillingRecord) => {
    setUpgradeSourceRecord(record)
    setUpgradeDraft({
      serviceType: "",
      extraAmount: "",
      paymentMethod: record.paymentMethod,
      notes: `Upgrade sobre ${record.serviceType}`,
    })
    setUpgradeDialogOpen(true)
  }

  const handleCreateUpgrade = async () => {
    if (!upgradeSourceRecord) return

    const nextService = upgradeDraft.serviceType.trim()
    const extraAmount = Number(upgradeDraft.extraAmount || "0")
    if (!nextService || !Number.isFinite(extraAmount) || extraAmount <= 0) {
      alert("Debes seleccionar el servicio de upgrade y un monto extra mayor a 0.")
      return
    }

    setIsSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const upgradeNotes = [
        upgradeDraft.notes.trim(),
        `Upgrade desde: ${upgradeSourceRecord.serviceType}`,
        `Upgrade origen facturacion: ${upgradeSourceRecord.id}`,
      ]
        .filter(Boolean)
        .join("\n")

      await insertBillingRecord({
        type: "venta_directa",
        client_name: upgradeSourceRecord.clientName,
        phone: upgradeSourceRecord.phone || null,
        vendor_name: null,
        currency: upgradeSourceRecord.currency,
        amount: extraAmount,
        customer_amount: null,
        payment_method: upgradeDraft.paymentMethod,
        courtesy: false,
        service_type: `Upgrade a ${nextService}`,
        status: "pendiente",
        date: today,
        notes: upgradeNotes,
      })

      await reloadRecords()
      setUpgradeDialogOpen(false)
      setUpgradeSourceRecord(null)
      alert("Upgrade registrado en Facturación correctamente.")
    } catch (err) {
      console.error("Error creating upgrade:", err)
      alert("No se pudo registrar el upgrade")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendToPickupSheet = async (record: BillingRecord) => {
    const codeToSend = (record.pickupCode || "").trim()
    if (!codeToSend) {
      alert("Este registro no tiene codigo MRC1. Edita o vuelve a crear el cobro para que se genere.")
      return
    }

    setIsSaving(true)
    try {
      await sendPickupCodeToDriverSheet(codeToSend)
      alert("Reserva enviada a Hoja de Recogida correctamente")
    } catch (err) {
      console.error("Error sending to pickup sheet:", err)
      alert(err instanceof Error ? err.message : "No se pudo enviar la reserva a Hoja de Recogida")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyPickupCode = async (record: BillingRecord) => {
    const code = (record.pickupCode || "").trim()
    if (!code) {
      alert("Este registro no tiene codigo MRC1 guardado")
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setCopiedPickupRecordId(record.id)
      window.setTimeout(() => setCopiedPickupRecordId((prev) => (prev === record.id ? null : prev)), 1800)
    } catch {
      alert("No se pudo copiar el codigo al portapapeles")
    }
  }

  const calculateVendorReceivables = () => {
    const CREDIT_VENDORS = ["ANDY PERDOMO", "ANDY VALDEZ", "DAVID FELIX (BUEY TOUR)", "ALE HUERTA"]
    const byVendor = new Map<string, { owed: number; inFavor: number }>()

    for (const vendor of CREDIT_VENDORS) {
      byVendor.set(vendor, { owed: 0, inFavor: 0 })
    }

    const creditRecords = records.filter(
      (r) => r.type === "credito_vendedor" && r.status !== "cancelado" && r.vendorName
    )

    for (const record of creditRecords) {
      const vendor = record.vendorName || ""
      if (!CREDIT_VENDORS.includes(vendor)) continue

      const operativeCost = record.amount
      const clientPayment = record.customerAmount || 0
      const current = byVendor.get(vendor) || { owed: 0, inFavor: 0 }

      if (clientPayment === 0) {
        current.owed += operativeCost
      } else if (clientPayment > operativeCost) {
        current.inFavor += clientPayment - operativeCost
      } else {
        current.owed += operativeCost - clientPayment
      }

      byVendor.set(vendor, current)
    }

    return Object.fromEntries(byVendor)
  }

  const handleSendOperationsClosure = () => {
    if (records.length === 0) {
      alert("No hay registros para enviar en el cierre de operaciones")
      return
    }

    const vendorReceivables = calculateVendorReceivables()

    const summary = {
      id: `ops-${Date.now()}`,
      sentAt: new Date().toISOString(),
      totalRecords: records.length,
      paid: records.filter((r) => r.status === "pagado").length,
      pending: records.filter((r) => r.status === "pendiente").length,
      cancelled: records.filter((r) => r.status === "cancelado").length,
      totalsByCurrency: {
        USD: records.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
        DOP: records.filter((r) => r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
        EUR: records.filter((r) => r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
        GBP: records.filter((r) => r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
      },
      vendorReceivables,
    }

    try {
      const currentRaw = typeof window !== "undefined" ? localStorage.getItem("macao_operation_closures") : "[]"
      const current = currentRaw ? JSON.parse(currentRaw) : []
      const next = Array.isArray(current) ? [summary, ...current].slice(0, 50) : [summary]
      localStorage.setItem("macao_operation_closures", JSON.stringify(next))
      window.dispatchEvent(new CustomEvent("macao-operation-closure-sent", { detail: summary }))
      setClosureFeedback("Cierre de operaciones enviado a contabilidad (incluye cuentas por cobrar).")
      window.setTimeout(() => setClosureFeedback(""), 5000)
    } catch {
      alert("No se pudo enviar el cierre de operaciones")
    }
  }

  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === "pendiente").length,
    paid: records.filter((r) => r.status === "pagado").length,
    totalByCurrency: {
      USD: records.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
      DOP: records.filter((r) => r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
      EUR: records.filter((r) => r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
      GBP: records.filter((r) => r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
    },
    pendingByCurrency: {
      USD: records.filter((r) => r.status === "pendiente" && r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
      DOP: records.filter((r) => r.status === "pendiente" && r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
      EUR: records.filter((r) => r.status === "pendiente" && r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
      GBP: records.filter((r) => r.status === "pendiente" && r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
    },
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pagados</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total por Moneda</p>
            <p className="text-sm font-semibold">{formatMoney("USD", stats.totalByCurrency.USD)}</p>
            <p className="text-sm font-semibold">{formatMoney("DOP", stats.totalByCurrency.DOP)}</p>
            <p className="text-sm font-semibold">{formatMoney("EUR", stats.totalByCurrency.EUR)}</p>
            <p className="text-sm font-semibold">{formatMoney("GBP", stats.totalByCurrency.GBP)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Por Cobrar por Moneda</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("USD", stats.pendingByCurrency.USD)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("DOP", stats.pendingByCurrency.DOP)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("EUR", stats.pendingByCurrency.EUR)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("GBP", stats.pendingByCurrency.GBP)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Cierre de operaciones</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Envía un resumen para notificar al usuario de contabilidad.</p>
          </div>
          <Button onClick={handleSendOperationsClosure}>Enviar cierre a contabilidad</Button>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Flujo de chofer actualizado</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Cobros y facturación genera el codigo MRC1 automaticamente y el operador envia la reserva a Hoja de Recogida solo con el boton Enviar en cada fila.
          </p>
        </CardContent>
      </Card>

      {canManageAccountingRequests ? (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Solicitudes de cancelación (Contabilidad)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cancelRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No hay solicitudes de cancelación registradas.</p>
            ) : (
              cancelRequests
                .slice()
                .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
                .map((request) => (
                  <div key={request.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{request.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {request.operationType.toUpperCase()} • Reserva {request.reservationId}
                        </p>
                      </div>
                      <Badge
                        className={
                          request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {request.status === "pending"
                          ? "Pendiente"
                          : request.status === "approved"
                          ? "Aprobada"
                          : "Rechazada"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
                    {request.accountingNote ? (
                      <p className="text-xs text-gray-500">Nota contabilidad: {request.accountingNote}</p>
                    ) : null}
                    {request.status === "pending" ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCancelDecision(request, "approved")}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleCancelDecision(request, "rejected")}
                        >
                          Rechazar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {closureFeedback ? (
        <div className="text-sm text-green-700 dark:text-green-400">{closureFeedback}</div>
      ) : null}

      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">Registrar Cobro/Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo de Transacción *</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_al_llegar">Pago al Llegar</SelectItem>
                  <SelectItem value="credito_vendedor">Crédito Vendedor</SelectItem>
                  <SelectItem value="venta_directa">Venta Directa Rancho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multi Services */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Servicios *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar servicio
                </Button>
              </div>
              <div className="space-y-2">
                {serviceLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <div className="md:col-span-6">
                      <Select value={line.serviceType} onValueChange={(v) => handleServiceTypeChange(idx, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_OPTIONS.map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateServiceLine(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        placeholder="Cant"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitAmount}
                        onChange={(e) => updateServiceLine(idx, { unitAmount: e.target.value })}
                        placeholder="Precio unitario"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeServiceLine(idx)}
                        disabled={serviceLines.length === 1}
                        title="Quitar servicio"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <Label>Nombre Cliente *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 1234-5678"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label>Método de Pago *</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarjeta">Pago con Tarjeta</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Courtesy */}
            <div className="space-y-1.5">
              <Label>Cortesia (Opcional)</Label>
              <Select
                value={courtesy ? "si" : "no"}
                onValueChange={(val) => setCourtesy(val === "si")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Si, cubierta por el rancho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Name (if credito_vendedor) */}
            {type === "credito_vendedor" && (
              <div className="space-y-1.5">
                <Label>Nombre Vendedor *</Label>
                <Select
                  value={vendorName}
                  onValueChange={setVendorName}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDIT_VENDORS.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "credito_vendedor" && (
              <div className="space-y-1.5">
                <Label>Monto a pagar por cliente (USD) (Opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customerAmount}
                  onChange={(e) => setCustomerAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                  Este monto es independiente del costo por maquina al vendedor y puede ser mayor.
                </p>
              </div>
            )}

            {/* Currency (only for pago_al_llegar and venta_directa) */}
            {supportsMultiCurrency && (
              <div className="space-y-1.5">
                <Label>Moneda *</Label>
                <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dolar (USD)</SelectItem>
                    <SelectItem value="DOP">Peso Dominicano (DOP)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">Libra Esterlina (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>Total ({supportsMultiCurrency ? currency : "USD"}) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={computedTotal.toFixed(2)}
                readOnly
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hotel / Punto de recogida *</Label>
              <div className="space-y-2">
                <Input
                  value={pickupHotel}
                  onChange={(e) => {
                    setPickupHotel(e.target.value)
                    setShowHotelSuggestions(true)
                  }}
                  onFocus={() => setShowHotelSuggestions(true)}
                  placeholder="Escribe hotel o lugar de recogida"
                />
                {showHotelSuggestions ? (
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto">
                    {hotelSuggestions.length > 0 ? (
                      hotelSuggestions.map((hotelName) => (
                        <button
                          key={hotelName}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => chooseHotel(hotelName)}
                        >
                          {hotelName}
                        </button>
                      ))
                    ) : null}

                    {pickupHotel.trim() && !hasExactRegisteredHotel ? (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-t border-gray-200 dark:border-gray-700"
                        onClick={() => chooseHotel(pickupHotel.trim())}
                      >
                        Agregar lugar desconocido: {pickupHotel.trim()}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <p className="text-xs text-gray-500">
                  Puedes escribir para buscar por nombre. Si no existe, puedes agregar el lugar manualmente.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Turno de recogida</Label>
              <div className="flex flex-wrap gap-2">
                {TURN_OPTIONS.map((turn) => (
                  <Button
                    key={turn}
                    type="button"
                    variant={pickupTurn === turn ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectPickupTurn(turn)}
                  >
                    {turn}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Hora de recogida *</Label>
              <Input
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="Ej: 08:00"
              />
              {!pickupScheduleSuggestion ? (
                <div className="flex flex-wrap gap-2">
                  {TURN_OPTIONS.map((turn) => (
                    <Button
                      key={turn}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectPickupTurn(turn)}
                    >
                      {UNKNOWN_PICKUP_TIME_BY_TURN[turn]}
                    </Button>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-gray-500">
                {pickupScheduleSuggestion
                  ? `Hora autocompletada segun hotel: ${pickupScheduleSuggestion.pickupTime}. Puedes editarla si lo necesitas.`
                  : "Lugar no registrado: se muestran horarios estandar (8:00, 11:00, 2:00) y puedes editarlos."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Habitación</Label>
              <Input
                value={pickupRoom}
                onChange={(e) => setPickupRoom(e.target.value)}
                placeholder="Ej: 2041"
              />
            </div>

            <div className="space-y-1.5">
              <Label>PAX recogida</Label>
              <Input
                type="number"
                min="1"
                value={pickupPax}
                onChange={(e) => setPickupPax(e.target.value)}
                placeholder="1"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Codigo de Reserva MRC1</Label>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40">
                Se genera automaticamente al registrar. Luego puedes copiarlo en la lista de transacciones.
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el cobro..."
              rows={2}
            />
          </div>

          <Button
            onClick={handleAddRecord}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Records List */}
      {records.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Registro de Transacciones ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-2 font-semibold">Servicio</th>
                    <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-2 font-semibold">Teléfono</th>
                    <th className="text-left py-3 px-2 font-semibold">Vendedor</th>
                    <th className="text-right py-3 px-2 font-semibold">Monto cliente</th>
                    <th className="text-left py-3 px-2 font-semibold">Pago</th>
                    <th className="text-left py-3 px-2 font-semibold">Cortesia</th>
                    <th className="text-right py-3 px-2 font-semibold">Monto</th>
                    <th className="text-center py-3 px-2 font-semibold">Estado</th>
                    <th className="text-center py-3 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="py-3 px-2">
                        <Badge className={TYPE_COLORS[record.type]}>
                          {TYPE_LABELS[record.type]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{record.serviceType}</td>
                      
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{record.clientName}</p>
                          {record.serviceItems && record.serviceItems.length > 1 && (
                            <p className="text-xs text-blue-600">{record.serviceItems.length} servicios en esta reserva</p>
                          )}
                          {record.notes && <p className="text-xs text-gray-500">{record.notes}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-2">{record.phone || "—"}</td>
                      <td className="py-3 px-2">{record.vendorName || "—"}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        {record.type === "credito_vendedor" && record.customerAmount != null && record.customerAmount > 0
                          ? formatMoney("USD", record.customerAmount)
                          : "—"}
                      </td>
                      <td className="py-3 px-2">{PAYMENT_METHOD_LABELS[record.paymentMethod]}</td>
                      <td className="py-3 px-2">
                        {record.courtesy ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Cortesia</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatMoney(record.currency, record.amount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Select
                          value={record.status}
                          onValueChange={(v: any) => handleUpdateStatus(record.id, v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="pagado">Pagado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleCopyPickupCode(record)}
                            className={copiedPickupRecordId === record.id ? "text-green-600 hover:text-green-700 inline-flex" : "text-violet-600 hover:text-violet-700 inline-flex"}
                            title="Copiar codigo MRC1"
                          >
                            {copiedPickupRecordId === record.id ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleSendToPickupSheet(record)}
                            className="text-blue-600 hover:text-blue-700 inline-flex"
                            title="Enviar a hoja de recogida"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printBillingInvoice(record)}
                            className="text-indigo-600 hover:text-indigo-700 inline-flex"
                            title="Imprimir factura"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openUpgradeDialog(record)}
                            className="text-amber-600 hover:text-amber-700 inline-flex"
                            title="Registrar upgrade"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700 inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={upgradeDialogOpen}
        onOpenChange={(open) => {
          setUpgradeDialogOpen(open)
          if (!open) setUpgradeSourceRecord(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Upgrade</DialogTitle>
            <DialogDescription>
              Registra el cobro extra por upgrade y se enviará directamente a Facturación.
            </DialogDescription>
          </DialogHeader>

          {upgradeSourceRecord ? (
            <div className="space-y-3">
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 text-sm">
                <p className="font-medium">{upgradeSourceRecord.clientName}</p>
                <p className="text-gray-600 dark:text-gray-300">Reserva base: {upgradeSourceRecord.serviceType}</p>
                <p className="text-gray-600 dark:text-gray-300">Origen: {upgradeSourceRecord.id}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Servicio de upgrade *</Label>
                <Select
                  value={upgradeDraft.serviceType}
                  onValueChange={(value) => setUpgradeDraft((prev) => ({ ...prev, serviceType: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona servicio" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Precio extra ({upgradeSourceRecord.currency}) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
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
                  placeholder="Detalle del motivo del upgrade"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleCreateUpgrade}
              disabled={isSaving || !upgradeDraft.serviceType || Number(upgradeDraft.extraAmount || 0) <= 0}
            >
              {isSaving ? (
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
    </div>
  )
}
