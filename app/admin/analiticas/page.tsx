"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  TrendingUp,
  Users,
  Camera,
  Ship,
  Mountain,
  Car,
  DollarSign,
  CalendarDays,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuggyReservation {
  id: string
  date: string
  status: string
  guests: number
  children: number
  amount: number | null
  notes: string
}

interface SaonaReservation {
  id: string
  date: string
  status: string
  guests: number
  amount: number | null
  notes: string
}

interface SamanaReservation {
  id: string
  date: string
  status: string
  guests: number
  amount: number | null
  notes: string
}

type EditedReservation = {
  id: string
  operation: "buggy" | "saona" | "samana"
  date: string
  reason: string
  editedAt: string
  amountBefore: number | null
  amountAfter: number | null
}

interface PhotoClosure {
  closure_date: string
  total_invoices: number
  by_currency: Record<string, { total: number; count: number }> | null
  closed_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayISO = new Date().toISOString().slice(0, 10)
const todayDate = new Date()
const EDIT_REASON_TAG = "[EDIT_REASON]:"
const EDITED_AT_TAG = "[EDITED_AT]:"
const EDIT_AMOUNT_BEFORE_TAG = "[EDIT_AMOUNT_BEFORE]:"
const EDIT_AMOUNT_AFTER_TAG = "[EDIT_AMOUNT_AFTER]:"

function startOfWeekISO() {
  const d = new Date(todayDate)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

function startOfMonthISO() {
  return `${todayISO.slice(0, 7)}-01`
}

function fmtCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getEditAuditFromNotes(notes: string) {
  const lines = (notes || "").split("\n")
  const reasonLine = lines.find((line) => line.startsWith(EDIT_REASON_TAG))
  const editedAtLine = lines.find((line) => line.startsWith(EDITED_AT_TAG))
  const amountBeforeLine = lines.find((line) => line.startsWith(EDIT_AMOUNT_BEFORE_TAG))
  const amountAfterLine = lines.find((line) => line.startsWith(EDIT_AMOUNT_AFTER_TAG))

  const beforeValue = Number((amountBeforeLine || "").slice(EDIT_AMOUNT_BEFORE_TAG.length).trim())
  const afterValue = Number((amountAfterLine || "").slice(EDIT_AMOUNT_AFTER_TAG.length).trim())

  return {
    reason: reasonLine ? reasonLine.slice(EDIT_REASON_TAG.length).trim() : "",
    editedAt: editedAtLine ? editedAtLine.slice(EDITED_AT_TAG.length).trim() : "",
    amountBefore: Number.isFinite(beforeValue) ? beforeValue : null,
    amountAfter: Number.isFinite(afterValue) ? afterValue : null,
  }
}

function statCard(
  label: string,
  value: string | number,
  sub: string,
  Icon: React.ElementType,
  color: string,
) {
  return (
    <Card key={label}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnaliticasPage() {
  const [buggy, setBuggy] = useState<BuggyReservation[]>([])
  const [saona, setSaona] = useState<SaonaReservation[]>([])
  const [samana, setSamana] = useState<SamanaReservation[]>([])
  const [photoClosures, setPhotoClosures] = useState<PhotoClosure[]>([])
  const [billingRecords, setBillingRecords] = useState<Array<{ date: string; amount: number; currency: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [buggyRes, saonaRes, samanaRes, photoRes, billingRes] = await Promise.allSettled([
        supabase
          .from("reservations")
          .select("id, date, status, guests, children, amount, notes")
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("saona_reservations")
          .select("id, date, status, guests, amount, notes")
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("samana_reservations")
          .select("id, date, status, guests, amount, notes")
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("photo_daily_closures")
          .select("closure_date, total_invoices, by_currency, closed_at")
          .order("closure_date", { ascending: false })
          .limit(500),
        supabase
          .from("billing_records")
          .select("date, amount, currency")
          .order("date", { ascending: false })
          .limit(2000),
      ])

      if (buggyRes.status === "fulfilled" && buggyRes.value.data) {
        setBuggy(
          buggyRes.value.data.map((r: any) => ({
            id: r.id,
            date: r.date,
            status: r.status,
            guests: Number(r.guests || 0) + Number(r.children || 0),
            children: Number(r.children || 0),
            amount: r.amount != null ? Number(r.amount) : null,
            notes: r.notes || "",
          })),
        )
      }

      if (saonaRes.status === "fulfilled" && saonaRes.value.data) {
        setSaona(
          saonaRes.value.data.map((r: any) => ({
            id: r.id,
            date: r.date,
            status: r.status,
            guests: Number(r.guests || 0),
            amount: r.amount != null ? Number(r.amount) : null,
            notes: r.notes || "",
          })),
        )
      }

      if (samanaRes.status === "fulfilled" && samanaRes.value.data) {
        setSamana(
          samanaRes.value.data.map((r: any) => ({
            id: r.id,
            date: r.date,
            status: r.status,
            guests: Number(r.guests || 0),
            amount: r.amount != null ? Number(r.amount) : null,
            notes: r.notes || "",
          })),
        )
      }

      if (photoRes.status === "fulfilled" && photoRes.value.data) {
        setPhotoClosures(
          photoRes.value.data.map((r: any) => ({
            closure_date: r.closure_date,
            total_invoices: Number(r.total_invoices || 0),
            by_currency: r.by_currency || null,
            closed_at: r.closed_at || r.closure_date,
          })),
        )
      }

      if (billingRes.status === "fulfilled" && billingRes.value.data) {
        setBillingRecords(
          billingRes.value.data.map((r: any) => ({
            date: r.date,
            amount: Number(r.amount || 0),
            currency: r.currency,
          })),
        )
      }

      setLoading(false)
    }

    void load()
  }, [])

  // ── Derived numbers ──────────────────────────────────────────────────────────

  const weekStart = startOfWeekISO()
  const monthStart = startOfMonthISO()

  const inRange = (date: string, from: string) => date >= from && date <= todayISO

  const buggyToday = useMemo(() => buggy.filter((r) => r.date === todayISO), [buggy])
  const buggyWeek = useMemo(() => buggy.filter((r) => inRange(r.date, weekStart)), [buggy, weekStart])
  const buggyMonth = useMemo(() => buggy.filter((r) => inRange(r.date, monthStart)), [buggy, monthStart])

  const saonaToday = useMemo(() => saona.filter((r) => r.date === todayISO), [saona])
  const saonaMonth = useMemo(() => saona.filter((r) => inRange(r.date, monthStart)), [saona, monthStart])

  const samanaToday = useMemo(() => samana.filter((r) => r.date === todayISO), [samana])
  const samanaMonth = useMemo(() => samana.filter((r) => inRange(r.date, monthStart)), [samana, monthStart])

  const photoToday = useMemo(
    () => photoClosures.filter((c) => c.closure_date === todayISO),
    [photoClosures],
  )
  const photoMonth = useMemo(
    () => photoClosures.filter((c) => inRange(c.closure_date, monthStart)),
    [photoClosures, monthStart],
  )

  const sumAmounts = (rows: Array<{ amount: number | null }>) =>
    rows.reduce((s, r) => s + (r.amount ?? 0), 0)

  const photoMonthUSD = useMemo(
    () =>
      photoMonth.reduce((sum, c) => {
        const byCur = c.by_currency || {}
        return sum + Number(byCur["USD"]?.total || byCur["usd"]?.total || 0)
      }, 0),
    [photoMonth],
  )

  const photoTodayInvoices = useMemo(
    () => photoToday.reduce((s, c) => s + c.total_invoices, 0),
    [photoToday],
  )
  const photoMonthInvoices = useMemo(
    () => photoMonth.reduce((s, c) => s + c.total_invoices, 0),
    [photoMonth],
  )

  // Billing records (cobros y facturación)
  const billingToday = useMemo(() => billingRecords.filter((r) => r.date === todayISO), [billingRecords])
  const billingMonth = useMemo(() => billingRecords.filter((r) => inRange(r.date, monthStart)), [billingRecords, monthStart])

  const billingTodayUSD = useMemo(
    () => billingToday.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
    [billingToday],
  )
  const billingMonthUSD = useMemo(
    () => billingMonth.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
    [billingMonth],
  )

  // Combined guests today
  const totalGuestsToday = buggyToday.reduce((s, r) => s + r.guests, 0)
    + saonaToday.reduce((s, r) => s + r.guests, 0)
    + samanaToday.reduce((s, r) => s + r.guests, 0)

  // Combined guests month
  const totalGuestsMonth = buggyMonth.reduce((s, r) => s + r.guests, 0)
    + saonaMonth.reduce((s, r) => s + r.guests, 0)
    + samanaMonth.reduce((s, r) => s + r.guests, 0)

  // Revenue this month (operations)
  const operationsRevenueMonth =
    sumAmounts(buggyMonth) + sumAmounts(saonaMonth) + sumAmounts(samanaMonth)

  const editedReservationsMonth = useMemo<EditedReservation[]>(() => {
    const fromRows = <T extends { id: string; date: string; notes: string }>(
      rows: T[],
      operation: EditedReservation["operation"],
    ) =>
      rows
        .map((row) => {
          const audit = getEditAuditFromNotes(row.notes)
          if (!audit.reason && !audit.editedAt) return null
          return {
            id: row.id,
            operation,
            date: row.date,
            reason: audit.reason,
            editedAt: audit.editedAt,
            amountBefore: audit.amountBefore,
            amountAfter: audit.amountAfter,
          } as EditedReservation
        })
        .filter((row): row is EditedReservation => Boolean(row))

    return [
      ...fromRows(buggyMonth, "buggy"),
      ...fromRows(saonaMonth, "saona"),
      ...fromRows(samanaMonth, "samana"),
    ].sort((a, b) => (b.editedAt || b.date).localeCompare(a.editedAt || a.date))
  }, [buggyMonth, saonaMonth, samanaMonth])

  const editedPriceDeltaMonth = useMemo(
    () =>
      editedReservationsMonth.reduce((sum, row) => {
        if (row.amountBefore == null || row.amountAfter == null) return sum
        return sum + (row.amountAfter - row.amountBefore)
      }, 0),
    [editedReservationsMonth],
  )

  const editedWithPriceChangeMonth = useMemo(
    () =>
      editedReservationsMonth.filter(
        (row) => row.amountBefore != null && row.amountAfter != null && row.amountBefore !== row.amountAfter,
      ).length,
    [editedReservationsMonth],
  )

  // Last 30 days chart: operations + photography combined per day
  const last30 = useMemo(() => {
    const days: Array<{ label: string; dateKey: string; buggy: number; saona: number; samana: number; photo: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
      days.push({
        label,
        dateKey: key,
        buggy: buggy.filter((r) => r.date === key).length,
        saona: saona.filter((r) => r.date === key).length,
        samana: samana.filter((r) => r.date === key).length,
        photo: photoClosures
          .filter((c) => c.closure_date === key)
          .reduce((s, c) => s + c.total_invoices, 0),
      })
    }
    return days
  }, [buggy, saona, samana, photoClosures])

  const maxBar = Math.max(1, ...last30.map((d) => d.buggy + d.saona + d.samana + d.photo))

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-red-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analíticas Generales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ventas y reservas de todas las operaciones
          </p>
        </div>

        {/* KPI cards – Today */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Hoy</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCard("Pax Hoy (Ops)", totalGuestsToday, `${buggyToday.length} buggy · ${saonaToday.length} saona · ${samanaToday.length} samaná`, Users, "bg-blue-500")}
            {statCard("Facturas Foto Hoy", photoTodayInvoices, "cierres enviados hoy", Camera, "bg-violet-500")}
            {statCard("Ingresos Cobros Hoy", fmtCurrency(billingTodayUSD), `${billingToday.length} registros`, DollarSign, "bg-red-500")}
            {statCard("Res. Buggy Hoy", buggyToday.length, `${buggyToday.filter((r) => r.status === "confirmed").length} confirmadas`, Car, "bg-orange-500")}
            {statCard("Res. Saona Hoy", saonaToday.length, `${saonaToday.filter((r) => r.status === "confirmed").length} confirmadas`, Ship, "bg-cyan-500")}
          </div>
        </div>

        {/* KPI cards – Month */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Este mes</p>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {statCard("Pax Mes (Ops)", totalGuestsMonth, "buggy + saona + samaná", Users, "bg-blue-600")}
            {statCard("Ingresos Buggy USD", fmtCurrency(sumAmounts(buggyMonth)), "ventas de buggy del mes", Car, "bg-orange-600")}
            {statCard("Ingresos Cobros USD", fmtCurrency(billingMonthUSD), "cobros y facturación del mes", DollarSign, "bg-red-600")}
            {statCard("Ingresos Ops (USD)", fmtCurrency(operationsRevenueMonth), "suma de importes registrados", DollarSign, "bg-green-600")}
            {statCard("Facturas Foto Mes", photoMonthInvoices, "total de cierres del mes", Camera, "bg-violet-600")}
            {statCard("Ingresos Foto USD", fmtCurrency(photoMonthUSD), "ventas en USD del mes", DollarSign, "bg-emerald-600")}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Reservas editadas (mes)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statCard("Reservas editadas", editedReservationsMonth.length, "con motivo de edición", CalendarDays, "bg-amber-600")}
            {statCard("Con cambio de precio", editedWithPriceChangeMonth, "ediciones con monto anterior/nuevo", DollarSign, "bg-fuchsia-600")}
            {statCard("Ajuste neto precio", fmtCurrency(editedPriceDeltaMonth), "impacto total por edición de precio", TrendingUp, "bg-slate-700")}
          </div>
        </div>

        {/* Per-service breakdown this month */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="w-4 h-4 text-orange-500" /> Operación Buggy
              </CardTitle>
              <CardDescription>Mes actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total reservas</span><strong>{buggyMonth.length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Confirmadas</span><strong className="text-green-600">{buggyMonth.filter((r) => r.status === "confirmed").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pendientes</span><strong className="text-yellow-600">{buggyMonth.filter((r) => r.status === "pending").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pax total</span><strong>{buggyMonth.reduce((s, r) => s + r.guests, 0)}</strong></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="text-gray-500">Ingresos USD</span><strong>{fmtCurrency(sumAmounts(buggyMonth))}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-500" /> Operación Saona
              </CardTitle>
              <CardDescription>Mes actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total reservas</span><strong>{saonaMonth.length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Confirmadas</span><strong className="text-green-600">{saonaMonth.filter((r) => r.status === "confirmed").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pendientes</span><strong className="text-yellow-600">{saonaMonth.filter((r) => r.status === "pending").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pax total</span><strong>{saonaMonth.reduce((s, r) => s + r.guests, 0)}</strong></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="text-gray-500">Ingresos USD</span><strong>{fmtCurrency(sumAmounts(saonaMonth))}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mountain className="w-4 h-4 text-green-500" /> Operación Samaná
              </CardTitle>
              <CardDescription>Mes actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total reservas</span><strong>{samanaMonth.length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Confirmadas</span><strong className="text-green-600">{samanaMonth.filter((r) => r.status === "confirmed").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pendientes</span><strong className="text-yellow-600">{samanaMonth.filter((r) => r.status === "pending").length}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">Pax total</span><strong>{samanaMonth.reduce((s, r) => s + r.guests, 0)}</strong></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="text-gray-500">Ingresos USD</span><strong>{fmtCurrency(sumAmounts(samanaMonth))}</strong></div>
            </CardContent>
          </Card>
        </div>

        {/* 30-day activity bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Actividad últimos 30 días
            </CardTitle>
            <CardDescription>Reservas/cierres por día (Buggy · Saona · Samaná · Fotografía)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32 overflow-x-auto pb-2">
              {last30.map((day) => {
                const total = day.buggy + day.saona + day.samana + day.photo
                const pct = (total / maxBar) * 100
                const isToday = day.dateKey === todayISO
                return (
                  <div key={day.dateKey} className="flex flex-col items-center min-w-[18px] group relative" title={`${day.label}: buggy ${day.buggy}, saona ${day.saona}, samaná ${day.samana}, foto ${day.photo}`}>
                    <div
                      className={`w-3 rounded-t transition-all ${isToday ? "bg-red-500" : "bg-blue-400 dark:bg-blue-500 group-hover:bg-blue-600"}`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                    {isToday && <span className="text-[9px] text-red-500 mt-0.5">hoy</span>}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-2 flex-wrap text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400 inline-block" /> Buggy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" /> Saona</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400 inline-block" /> Samaná</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" /> Fotografía</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Hoy</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent photo closures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-500" /> Cierres de fotografía recientes
            </CardTitle>
            <CardDescription>Últimos 10 cierres enviados</CardDescription>
          </CardHeader>
          <CardContent>
            {photoClosures.length === 0 ? (
              <p className="text-sm text-gray-400">No hay cierres registrados.</p>
            ) : (
              <div className="space-y-2">
                {photoClosures.slice(0, 10).map((c) => {
                  const usd = c.by_currency?.["USD"]?.total ?? c.by_currency?.["usd"]?.total ?? 0
                  const dop = c.by_currency?.["DOP"]?.total ?? c.by_currency?.["dop"]?.total ?? 0
                  return (
                    <div key={c.closure_date} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{c.closure_date}</span>
                        <Badge variant="outline" className="text-xs">{c.total_invoices} facturas</Badge>
                      </div>
                      <div className="text-sm text-right">
                        {usd > 0 && <span className="text-green-700 dark:text-green-400 font-medium mr-2">{fmtCurrency(usd)} USD</span>}
                        {dop > 0 && <span className="text-blue-700 dark:text-blue-400 font-medium">RD${dop.toLocaleString("es-DO")} DOP</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas editadas recientes</CardTitle>
            <CardDescription>Últimas 10 reservas editadas con motivo e impacto de precio (si existe)</CardDescription>
          </CardHeader>
          <CardContent>
            {editedReservationsMonth.length === 0 ? (
              <p className="text-sm text-gray-400">No hay reservas editadas registradas en este mes.</p>
            ) : (
              <div className="space-y-2">
                {editedReservationsMonth.slice(0, 10).map((row) => {
                  const hasPrice = row.amountBefore != null && row.amountAfter != null
                  return (
                    <div key={`${row.operation}-${row.id}-${row.editedAt || row.date}`} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium uppercase">{row.operation} · {row.id}</p>
                        <p className="text-xs text-gray-500">{row.editedAt || row.date} · {row.reason || "Sin motivo"}</p>
                      </div>
                      <div className="text-sm">
                        {hasPrice ? (
                          <span className="font-medium">
                            {fmtCurrency(row.amountBefore || 0)} → {fmtCurrency(row.amountAfter || 0)}
                          </span>
                        ) : (
                          <span className="text-gray-500">Sin cambio de precio</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

