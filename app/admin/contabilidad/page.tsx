"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, Loader2, RotateCcw } from "lucide-react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { VendorReceivables } from "@/components/admin/vendor-receivables"
import { GygProfitability } from "@/components/admin/gyg-profitability"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  listCancellationRequests,
  updateCancellationRequestDecision,
  type CancellationRequest,
} from "@/lib/cancellation-requests"
import { supabase } from "@/lib/supabase"

type ReturnDecision = "aprobada" | "rechazada"

type PhotoReturnRequest = {
  id: string
  invoiceNumber: string
  clientName: string
  amount: number
  reason: string
  status: string
  createdAt: string
  updatedAt: string
}

type BuggyOpsReservation = {
  id: string
  date: string
  status: string
  guests: number
  children: number
  notes: string
  amount: number | null
}

type TourOpsReservation = {
  id: string
  date: string
  status: string
  guests: number
  children: number
  notes: string
  amount: number | null
}

type EditedReservationEntry = {
  id: string
  operation: "buggy" | "saona" | "samana"
  date: string
  editedAt: string
  reason: string
  amountBefore: number | null
  amountAfter: number | null
}

type OpsPeriodStats = {
  machines: number
  horses: number
  saonaPeople: number
  samanaPeople: number
}

function fmtMoney(amount: number) {
  return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getLocalISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfWeekISO(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00`)
  d.setDate(d.getDate() - d.getDay())
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfMonthISO(dateISO: string) {
  return `${dateISO.slice(0, 7)}-01`
}

function inRange(date: string, from: string, to: string) {
  return date >= from && date <= to
}

function parseCountFromNotes(notes: string, label: "maquinas" | "caballos") {
  const match = (notes || "").match(new RegExp(`${label}\\s*:\\s*(\\d+)`, "i"))
  return match ? Number(match[1] || 0) : 0
}

const EDIT_REASON_TAG = "[EDIT_REASON]:"
const EDITED_AT_TAG = "[EDITED_AT]:"
const EDIT_AMOUNT_BEFORE_TAG = "[EDIT_AMOUNT_BEFORE]:"
const EDIT_AMOUNT_AFTER_TAG = "[EDIT_AMOUNT_AFTER]:"

function getEditAuditFromNotes(notes: string) {
  const lines = (notes || "").split("\n")
  const reasonLine = lines.find((line) => line.startsWith(EDIT_REASON_TAG))
  const editedAtLine = lines.find((line) => line.startsWith(EDITED_AT_TAG))
  const amountBeforeLine = lines.find((line) => line.startsWith(EDIT_AMOUNT_BEFORE_TAG))
  const amountAfterLine = lines.find((line) => line.startsWith(EDIT_AMOUNT_AFTER_TAG))

  const amountBefore = Number((amountBeforeLine || "").slice(EDIT_AMOUNT_BEFORE_TAG.length).trim())
  const amountAfter = Number((amountAfterLine || "").slice(EDIT_AMOUNT_AFTER_TAG.length).trim())

  return {
    reason: reasonLine ? reasonLine.slice(EDIT_REASON_TAG.length).trim() : "",
    editedAt: editedAtLine ? editedAtLine.slice(EDITED_AT_TAG.length).trim() : "",
    amountBefore: Number.isFinite(amountBefore) ? amountBefore : null,
    amountAfter: Number.isFinite(amountAfter) ? amountAfter : null,
  }
}

function isSoldStatus(status: string) {
  return status !== "cancelled" && status !== "rejected"
}

function sumPax(rows: Array<{ guests: number; children: number }>) {
  return rows.reduce((sum, row) => sum + Number(row.guests || 0) + Number(row.children || 0), 0)
}

function statLabel(period: "day" | "week" | "month") {
  if (period === "day") return "Hoy"
  if (period === "week") return "Semana"
  return "Mes"
}

function statusBadge(status: string) {
  if (status === "pending" || status === "pendiente") {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
  }
  if (status === "approved" || status === "aprobada") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobada</Badge>
  }
  if (status === "rejected" || status === "rechazada") {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazada</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

function mapPhotoReturn(row: {
  id?: string | number
  invoice_number?: string | null
  client_name?: string | null
  amount?: number | string | null
  reason?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}): PhotoReturnRequest {
  const invoice = row.invoice_number || ""
  const createdAt = row.created_at || new Date().toISOString()

  return {
    id: String(row.id ?? `${invoice || "ret"}-${createdAt}`),
    invoiceNumber: invoice,
    clientName: row.client_name || "Cliente General",
    amount: Number(row.amount || 0),
    reason: row.reason || "",
    status: row.status || "pendiente",
    createdAt,
    updatedAt: row.updated_at || createdAt,
  }
}

export default function AccountingRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [savingCancellationId, setSavingCancellationId] = useState<string | null>(null)
  const [savingReturnId, setSavingReturnId] = useState<string | null>(null)
  const [cancelRequests, setCancelRequests] = useState<CancellationRequest[]>([])
  const [photoReturns, setPhotoReturns] = useState<PhotoReturnRequest[]>([])
  const [buggyOps, setBuggyOps] = useState<BuggyOpsReservation[]>([])
  const [saonaOps, setSaonaOps] = useState<TourOpsReservation[]>([])
  const [samanaOps, setSamanaOps] = useState<TourOpsReservation[]>([])

  const loadCancellationRequests = async () => {
    try {
      const requests = await listCancellationRequests()
      setCancelRequests(requests)
    } catch (error) {
      console.error("Error loading cancellation requests:", error)
      setCancelRequests([])
    }
  }

  const loadPhotoReturns = async () => {
    try {
      const { data, error } = await supabase
        .from("photo_returns")
        .select("id, invoice_number, client_name, amount, reason, status, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(300)

      if (error) throw error
      const mapped = (data || []).map((row) => mapPhotoReturn(row))
      setPhotoReturns(mapped)
    } catch (error) {
      console.error("Error loading photo returns:", error)
      setPhotoReturns([])
    }
  }

  const loadOperationsAnalytics = async () => {
    try {
      const [buggyRes, saonaRes, samanaRes] = await Promise.all([
        supabase
          .from("reservations")
          .select("id, date, status, guests, children, notes, amount")
          .order("date", { ascending: false })
          .limit(4000),
        supabase
          .from("saona_reservations")
          .select("id, date, status, guests, children, notes, amount")
          .order("date", { ascending: false })
          .limit(4000),
        supabase
          .from("samana_reservations")
          .select("id, date, status, guests, children, notes, amount")
          .order("date", { ascending: false })
          .limit(4000),
      ])

      if (buggyRes.error) throw buggyRes.error
      if (saonaRes.error) throw saonaRes.error
      if (samanaRes.error) throw samanaRes.error

      setBuggyOps(
        (buggyRes.data || []).map((row: any) => ({
          id: String(row.id),
          date: row.date || "",
          status: row.status || "pending",
          guests: Number(row.guests || 0),
          children: Number(row.children || 0),
          notes: row.notes || "",
          amount: row.amount != null ? Number(row.amount) : null,
        })),
      )

      const mapTourRows = (rows: any[]): TourOpsReservation[] =>
        rows.map((row) => ({
          id: String(row.id),
          date: row.date || "",
          status: row.status || "pending",
          guests: Number(row.guests || 0),
          children: Number(row.children || 0),
          notes: row.notes || "",
          amount: row.amount != null ? Number(row.amount) : null,
        }))

      setSaonaOps(mapTourRows(saonaRes.data || []))
      setSamanaOps(mapTourRows(samanaRes.data || []))
    } catch (error) {
      console.error("Error loading operations analytics:", error)
      setBuggyOps([])
      setSaonaOps([])
      setSamanaOps([])
    }
  }

  const reloadAll = async () => {
    setLoading(true)
    await Promise.all([loadCancellationRequests(), loadPhotoReturns(), loadOperationsAnalytics()])
    setLoading(false)
  }

  useEffect(() => {
    void reloadAll()

    const interval = window.setInterval(() => {
      void Promise.all([loadCancellationRequests(), loadPhotoReturns(), loadOperationsAnalytics()])
    }, 7000)

    return () => window.clearInterval(interval)
  }, [])

  const cancellationStats = useMemo(() => {
    const pending = cancelRequests.filter((item) => item.status === "pending").length
    const approved = cancelRequests.filter((item) => item.status === "approved").length
    const rejected = cancelRequests.filter((item) => item.status === "rejected").length
    return { total: cancelRequests.length, pending, approved, rejected }
  }, [cancelRequests])

  const returnStats = useMemo(() => {
    const pending = photoReturns.filter((item) => item.status === "pendiente").length
    const approved = photoReturns.filter((item) => item.status === "aprobada").length
    const rejected = photoReturns.filter((item) => item.status === "rechazada").length
    return { total: photoReturns.length, pending, approved, rejected }
  }, [photoReturns])

  const opsStats = useMemo(() => {
    const today = getLocalISODate()
    const weekStart = startOfWeekISO(today)
    const monthStart = startOfMonthISO(today)

    const soldBuggy = buggyOps.filter((row) => row.date && isSoldStatus(row.status))
    const soldSaona = saonaOps.filter((row) => row.date && isSoldStatus(row.status))
    const soldSamana = samanaOps.filter((row) => row.date && isSoldStatus(row.status))

    const buildPeriodStats = (fromDate: string): OpsPeriodStats => {
      const buggyRows = soldBuggy.filter((row) => inRange(row.date, fromDate, today))
      const saonaRows = soldSaona.filter((row) => inRange(row.date, fromDate, today))
      const samanaRows = soldSamana.filter((row) => inRange(row.date, fromDate, today))

      return {
        machines: buggyRows.reduce((sum, row) => sum + parseCountFromNotes(row.notes, "maquinas"), 0),
        horses: buggyRows.reduce((sum, row) => sum + parseCountFromNotes(row.notes, "caballos"), 0),
        saonaPeople: sumPax(saonaRows),
        samanaPeople: sumPax(samanaRows),
      }
    }

    return {
      day: buildPeriodStats(today),
      week: buildPeriodStats(weekStart),
      month: buildPeriodStats(monthStart),
    }
  }, [buggyOps, saonaOps, samanaOps])

  const editedReservations = useMemo<EditedReservationEntry[]>(() => {
    const fromRows = <T extends { id: string; date: string; notes: string }>(
      rows: T[],
      operation: EditedReservationEntry["operation"],
    ) =>
      rows
        .map((row) => {
          const audit = getEditAuditFromNotes(row.notes)
          if (!audit.reason && !audit.editedAt) return null
          return {
            id: row.id,
            operation,
            date: row.date,
            editedAt: audit.editedAt,
            reason: audit.reason,
            amountBefore: audit.amountBefore,
            amountAfter: audit.amountAfter,
          } as EditedReservationEntry
        })
        .filter((row): row is EditedReservationEntry => Boolean(row))

    return [
      ...fromRows(buggyOps, "buggy"),
      ...fromRows(saonaOps, "saona"),
      ...fromRows(samanaOps, "samana"),
    ].sort((a, b) => (b.editedAt || b.date).localeCompare(a.editedAt || a.date))
  }, [buggyOps, saonaOps, samanaOps])

  const editedPriceDelta = useMemo(
    () =>
      editedReservations.reduce((sum, row) => {
        if (row.amountBefore == null || row.amountAfter == null) return sum
        return sum + (row.amountAfter - row.amountBefore)
      }, 0),
    [editedReservations],
  )

  const editedWithPriceChange = useMemo(
    () =>
      editedReservations.filter(
        (row) => row.amountBefore != null && row.amountAfter != null && row.amountBefore !== row.amountAfter,
      ).length,
    [editedReservations],
  )

  const handleCancellationDecision = async (
    request: CancellationRequest,
    status: "approved" | "rejected",
  ) => {
    const accountingNote = window.prompt(
      status === "approved" ? "Nota de aprobación (opcional):" : "Motivo de rechazo (opcional):",
      "",
    )

    setSavingCancellationId(request.id)

    try {
      if (status === "approved") {
        if (request.operationType === "buggy") {
          const { error } = await supabase.rpc("update_reservation_status", {
            p_reservation_id: request.reservationId,
            p_status: "cancelled",
          })
          if (error) throw error
        } else if (request.operationType === "saona") {
          const { error } = await supabase
            .from("saona_reservations")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", request.reservationId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from("samana_reservations")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", request.reservationId)
          if (error) throw error
        }
      }

      await updateCancellationRequestDecision(
        request.id,
        status,
        accountingNote?.trim() || undefined,
        "Contabilidad",
      )

      await loadCancellationRequests()
    } catch (error) {
      console.error("Error updating cancellation request:", error)
      alert("No se pudo actualizar la solicitud de cancelación")
    } finally {
      setSavingCancellationId(null)
    }
  }

  const handlePhotoReturnDecision = async (item: PhotoReturnRequest, decision: ReturnDecision) => {
    if (!item.invoiceNumber.trim()) {
      alert("Esta devolución no tiene número de factura")
      return
    }

    setSavingReturnId(item.id)

    try {
      const { error: returnError } = await supabase
        .from("photo_returns")
        .update({ status: decision, updated_at: new Date().toISOString() })
        .eq("invoice_number", item.invoiceNumber)

      if (returnError) throw returnError

      if (decision === "aprobada") {
        const { error: invoiceError } = await supabase
          .from("photo_invoices")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancel_reason: item.reason || "Devolución aprobada",
          })
          .eq("invoice_number", item.invoiceNumber)

        if (invoiceError) throw invoiceError
      } else {
        const { error: invoiceError } = await supabase
          .from("photo_invoices")
          .update({ status: "active", cancelled_at: null, cancel_reason: null })
          .eq("invoice_number", item.invoiceNumber)

        if (invoiceError) throw invoiceError
      }

      await loadPhotoReturns()
    } catch (error) {
      console.error("Error updating photo return:", error)
      alert("No se pudo procesar la devolución de fotografía")
    } finally {
      setSavingReturnId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-title text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calculator className="w-7 h-7 text-orange-600" />
              Contabilidad
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Solicitudes de cancelación de reservas y devoluciones de fotografía.
            </p>
          </div>
          <Button variant="outline" onClick={() => void reloadAll()} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cancelaciones de reservas</CardTitle>
              <CardDescription>
                {cancellationStats.pending} pendientes · {cancellationStats.approved} aprobadas · {cancellationStats.rejected} rechazadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{cancellationStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Devoluciones de fotografía</CardTitle>
              <CardDescription>
                {returnStats.pending} pendientes · {returnStats.approved} aprobadas · {returnStats.rejected} rechazadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{returnStats.total}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reservas editadas</CardTitle>
              <CardDescription>Total auditado en operaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{editedReservations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ediciones con cambio de precio</CardTitle>
              <CardDescription>Con monto anterior y nuevo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{editedWithPriceChange}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Impacto neto por edición</CardTitle>
              <CardDescription>Ajuste acumulado en precios editados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{fmtMoney(editedPriceDelta)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analíticas operativas para contabilidad</CardTitle>
            <CardDescription>
              Cantidades vendidas de máquinas, caballos y personas en Saona/Samaná por período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["day", "week", "month"] as const).map((period) => {
                const stats = opsStats[period]
                return (
                  <div key={period} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{statLabel(period)}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Máquinas vendidas</span>
                      <span className="font-semibold">{stats.machines}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Caballos vendidos</span>
                      <span className="font-semibold">{stats.horses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Personas Saona</span>
                      <span className="font-semibold">{stats.saonaPeople}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Personas Samaná</span>
                      <span className="font-semibold">{stats.samanaPeople}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <VendorReceivables />

        <GygProfitability />

        <Card>
          <CardHeader>
            <CardTitle>Reservas editadas (auditoría)</CardTitle>
            <CardDescription>
              Motivos de edición y cambio de precio para análisis contable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {editedReservations.length === 0 ? (
              <p className="text-sm text-gray-500">No hay reservas editadas registradas.</p>
            ) : (
              editedReservations.slice(0, 30).map((item) => {
                const hasPrice = item.amountBefore != null && item.amountAfter != null
                return (
                  <div key={`${item.operation}-${item.id}-${item.editedAt || item.date}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold uppercase">{item.operation} · Reserva {item.id}</p>
                        <p className="text-xs text-gray-500">{item.editedAt || item.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.reason || "Sin motivo"}</p>
                    <p className="text-xs text-gray-500">
                      {hasPrice
                        ? `Precio: ${fmtMoney(item.amountBefore || 0)} → ${fmtMoney(item.amountAfter || 0)}`
                        : "Precio: sin cambio registrado"}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de cancelación</CardTitle>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{request.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {request.operationType.toUpperCase()} · Reserva {request.reservationId}
                        </p>
                      </div>
                      {statusBadge(request.status)}
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
                          onClick={() => void handleCancellationDecision(request, "approved")}
                          disabled={savingCancellationId === request.id}
                        >
                          {savingCancellationId === request.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => void handleCancellationDecision(request, "rejected")}
                          disabled={savingCancellationId === request.id}
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

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de devolución de fotografía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {photoReturns.length === 0 ? (
              <p className="text-sm text-gray-500">No hay devoluciones registradas.</p>
            ) : (
              photoReturns.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.clientName}</p>
                      <p className="text-xs text-gray-500">Factura {item.invoiceNumber || "Sin factura"}</p>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {fmtMoney(item.amount)} · {item.reason || "Sin motivo"}
                  </p>
                  {item.status === "pendiente" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => void handlePhotoReturnDecision(item, "aprobada")}
                        disabled={savingReturnId === item.id}
                      >
                        {savingReturnId === item.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => void handlePhotoReturnDecision(item, "rechazada")}
                        disabled={savingReturnId === item.id}
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
      </div>
    </DashboardLayout>
  )
}
