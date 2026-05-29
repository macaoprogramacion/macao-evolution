"use client"

import { useEffect, useMemo, useState } from "react"
import { DollarSign, Handshake, Loader2, Users } from "lucide-react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled"

type BookingRow = {
  id: string
  rep_id: string | null
  rep_name: string | null
  traveler_name: string
  guest_count: number
  experience: string | null
  sale_price: number
  amount_paid: number
  amount_pending: number
  date: string
  status: BookingStatus
  notes: string | null
}

type RepresentativeRow = {
  id: string
  name: string
  commission_percent: number
}

type MachineRule = {
  type: string
  capacity: number
  aliases: string[]
}

type DetailedReservation = {
  id: string
  repId: string
  repName: string
  travelerName: string
  date: string
  status: BookingStatus
  experience: string
  machineType: string
  machineCount: number
  totalPeople: number
  reservationAmount: number
  pendingCredit: number
  clientPayment: number
  totalCreditToPay: number
  totalGain: number
}

type VendorSummary = {
  repId: string
  repName: string
  reservations: number
  machines: number
  people: number
  amount: number
  pendingCredit: number
  clientPayment: number
  totalCreditToPay: number
  totalGain: number
  byMachineType: Record<string, number>
}

const MACHINE_RULES: MachineRule[] = [
  { type: "Shared ATV", capacity: 2, aliases: ["shared atv", "atv", "quad"] },
  { type: "Shared Buggy", capacity: 2, aliases: ["elite couple", "shared buggy", "buggy doble", "doble buggy"] },
  { type: "Shared VIP Predator", capacity: 2, aliases: ["apex predator", "shared vip predator", "vip shared"] },
  { type: "Familiar Predator", capacity: 4, aliases: ["predator family", "familiar predator", "vip family predator"] },
  { type: "Family Buggy", capacity: 4, aliases: ["elite family", "flintstone family", "family buggy"] },
  { type: "Single Buggy", capacity: 1, aliases: ["single buggy", "buggy single"] },
]

function normalize(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function formatMoney(value: number) {
  return `US$ ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getLocalISODate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function startOfMonthISO(dateISO: string) {
  return `${dateISO.slice(0, 7)}-01`
}

function getMachineRule(experience: string, notes: string) {
  const source = `${normalize(experience)} ${normalize(notes)}`
  if (!source) return null

  return (
    MACHINE_RULES.find((rule) => rule.aliases.some((alias) => source.includes(normalize(alias)))) || null
  )
}

function statusBadge(status: BookingStatus) {
  if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendiente</Badge>
  if (status === "confirmed") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmada</Badge>
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completada</Badge>
  return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>
}

function toDetailedReservation(row: BookingRow, commissionByRep: Map<string, number>): DetailedReservation {
  const totalPeople = Math.max(0, Number(row.guest_count || 0))
  const experience = row.experience || "Sin experiencia"
  const notes = row.notes || ""
  const machine = getMachineRule(experience, notes)
  const machineCount = machine ? Math.max(1, Math.ceil(totalPeople / machine.capacity)) : 0
  const machineType = machine?.type || "Sin maquina"

  const reservationAmount = Math.max(0, Number(row.sale_price || 0))
  const pendingCredit = Math.max(0, Number(row.amount_pending || 0))
  const clientPayment = Math.max(0, Number(row.amount_paid || 0))
  const totalCreditToPay = pendingCredit > 0 ? clientPayment + pendingCredit : 0

  const commissionPercent = commissionByRep.get(row.rep_id || "") || 0
  const totalGain = reservationAmount * (commissionPercent / 100)

  return {
    id: row.id,
    repId: row.rep_id || "sin-id",
    repName: row.rep_name || "Sin vendedor",
    travelerName: row.traveler_name || "Sin cliente",
    date: row.date || "",
    status: row.status,
    experience,
    machineType,
    machineCount,
    totalPeople,
    reservationAmount,
    pendingCredit,
    clientPayment,
    totalCreditToPay,
    totalGain,
  }
}

export default function RepresentativesAnalyticsPage() {
  const today = getLocalISODate()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<DetailedReservation[]>([])
  const [fromDate, setFromDate] = useState(startOfMonthISO(today))
  const [toDate, setToDate] = useState(today)
  const [repFilter, setRepFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [bookingsRes, repsRes] = await Promise.all([
          supabase
            .from("bookings")
            .select("id, rep_id, rep_name, traveler_name, guest_count, experience, sale_price, amount_paid, amount_pending, date, status, notes")
            .order("date", { ascending: false })
            .limit(8000),
          supabase
            .from("representatives")
            .select("id, name, commission_percent")
            .limit(2000),
        ])

        if (bookingsRes.error) throw bookingsRes.error
        if (repsRes.error) throw repsRes.error

        const reps: RepresentativeRow[] = (repsRes.data || []).map((r: any) => ({
          id: String(r.id || ""),
          name: String(r.name || ""),
          commission_percent: Number(r.commission_percent || 0),
        }))
        const commissionByRep = new Map<string, number>(reps.map((r) => [r.id, r.commission_percent]))

        const bookings: BookingRow[] = (bookingsRes.data || []).map((b: any) => ({
          id: String(b.id || ""),
          rep_id: b.rep_id || null,
          rep_name: b.rep_name || null,
          traveler_name: String(b.traveler_name || ""),
          guest_count: Number(b.guest_count || 0),
          experience: b.experience || null,
          sale_price: Number(b.sale_price || 0),
          amount_paid: Number(b.amount_paid || 0),
          amount_pending: Number(b.amount_pending || 0),
          date: String(b.date || ""),
          status: (b.status || "pending") as BookingStatus,
          notes: b.notes || null,
        }))

        setRows(bookings.map((row) => toDetailedReservation(row, commissionByRep)))
      } catch (error) {
        console.error("Error loading representatives analytics:", error)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 20000)
    return () => window.clearInterval(interval)
  }, [])

  const representativeOptions = useMemo(() => {
    const unique = new Map<string, string>()
    for (const row of rows) unique.set(row.repId, row.repName)
    return Array.from(unique.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (fromDate && row.date < fromDate) return false
      if (toDate && row.date > toDate) return false
      if (repFilter !== "all" && row.repId !== repFilter) return false
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      return true
    })
  }, [rows, fromDate, toDate, repFilter, statusFilter])

  const machineTotals = useMemo(() => {
    const byType = new Map<string, number>()
    for (const row of filteredRows) {
      byType.set(row.machineType, (byType.get(row.machineType) || 0) + row.machineCount)
    }
    return Array.from(byType.entries())
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total)
  }, [filteredRows])

  const vendorSummaries = useMemo(() => {
    const byVendor = new Map<string, VendorSummary>()

    for (const row of filteredRows) {
      if (!byVendor.has(row.repId)) {
        byVendor.set(row.repId, {
          repId: row.repId,
          repName: row.repName,
          reservations: 0,
          machines: 0,
          people: 0,
          amount: 0,
          pendingCredit: 0,
          clientPayment: 0,
          totalCreditToPay: 0,
          totalGain: 0,
          byMachineType: {},
        })
      }

      const current = byVendor.get(row.repId)!
      current.reservations += 1
      current.machines += row.machineCount
      current.people += row.totalPeople
      current.amount += row.reservationAmount
      current.pendingCredit += row.pendingCredit
      current.clientPayment += row.clientPayment
      current.totalCreditToPay += row.totalCreditToPay
      current.totalGain += row.totalGain
      current.byMachineType[row.machineType] = (current.byMachineType[row.machineType] || 0) + row.machineCount
    }

    return Array.from(byVendor.values()).sort((a, b) => b.amount - a.amount)
  }, [filteredRows])

  const totals = useMemo(() => {
    return {
      reservations: filteredRows.length,
      machines: filteredRows.reduce((sum, row) => sum + row.machineCount, 0),
      people: filteredRows.reduce((sum, row) => sum + row.totalPeople, 0),
      amount: filteredRows.reduce((sum, row) => sum + row.reservationAmount, 0),
      pendingCredit: filteredRows.reduce((sum, row) => sum + row.pendingCredit, 0),
      clientPayment: filteredRows.reduce((sum, row) => sum + row.clientPayment, 0),
      totalCreditToPay: filteredRows.reduce((sum, row) => sum + row.totalCreditToPay, 0),
      totalGain: filteredRows.reduce((sum, row) => sum + row.totalGain, 0),
    }
  }, [filteredRows])

  if (loading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Cargando dashboard de representantes...
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-title text-gray-900 dark:text-gray-100">Representantes - Reservas detalladas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detalle por reserva y totales generales de maquinas, personas, montos, credito, abonos y ganancias.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra por fecha, vendedor y estado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reps-from-date">Desde</Label>
                <Input id="reps-from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps-to-date">Hasta</Label>
                <Input id="reps-to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={repFilter} onValueChange={setRepFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {representativeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | BookingStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Reservas</p>
              <p className="text-2xl font-bold">{totals.reservations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Maquinas totales</p>
              <p className="text-2xl font-bold">{totals.machines}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Personas totales</p>
              <p className="text-2xl font-bold">{totals.people}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Monto total reservas</p>
              <p className="text-2xl font-bold">{formatMoney(totals.amount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Credito pendiente</p>
              <p className="text-2xl font-bold text-amber-600">{formatMoney(totals.pendingCredit)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Abono cliente</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(totals.clientPayment)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total credito a pagar</p>
              <p className="text-2xl font-bold text-orange-600">{formatMoney(totals.totalCreditToPay)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ganancia total (comision)</p>
              <p className="text-2xl font-bold text-blue-600">{formatMoney(totals.totalGain)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Resumen por vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Reservas</TableHead>
                      <TableHead className="text-right">Maquinas</TableHead>
                      <TableHead className="text-right">Personas</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Credito pendiente</TableHead>
                      <TableHead className="text-right">Abono</TableHead>
                      <TableHead className="text-right">Credito total</TableHead>
                      <TableHead className="text-right">Ganancia</TableHead>
                      <TableHead>Tipos de maquina</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorSummaries.length > 0 ? (
                      vendorSummaries.map((summary) => (
                        <TableRow key={summary.repId}>
                          <TableCell className="font-medium">{summary.repName}</TableCell>
                          <TableCell className="text-right">{summary.reservations}</TableCell>
                          <TableCell className="text-right">{summary.machines}</TableCell>
                          <TableCell className="text-right">{summary.people}</TableCell>
                          <TableCell className="text-right">{formatMoney(summary.amount)}</TableCell>
                          <TableCell className="text-right">{formatMoney(summary.pendingCredit)}</TableCell>
                          <TableCell className="text-right">{formatMoney(summary.clientPayment)}</TableCell>
                          <TableCell className="text-right">{formatMoney(summary.totalCreditToPay)}</TableCell>
                          <TableCell className="text-right">{formatMoney(summary.totalGain)}</TableCell>
                          <TableCell className="text-xs text-gray-600 dark:text-gray-300">
                            {Object.entries(summary.byMachineType)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type, total]) => `${type}: ${total}`)
                              .join(" | ") || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-500 py-6">
                          No hay datos para los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="w-4 h-4" />
                Maquinas por tipo
              </CardTitle>
              <CardDescription>Total general por tipo de maquina.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {machineTotals.length > 0 ? (
                machineTotals.map((machine) => (
                  <div key={machine.type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{machine.type}</span>
                    <Badge variant="secondary">{machine.total}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay maquinas para mostrar.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Detalle por reserva
            </CardTitle>
            <CardDescription>
              Incluye fecha, monto, credito pendiente, abono del cliente, credito total a pagar y ganancia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Tipo maquina</TableHead>
                    <TableHead className="text-right">Maquinas</TableHead>
                    <TableHead className="text-right">Personas</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Credito pendiente</TableHead>
                    <TableHead className="text-right">Abono cliente</TableHead>
                    <TableHead className="text-right">Credito total</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.repName}</TableCell>
                        <TableCell>{row.travelerName}</TableCell>
                        <TableCell>{row.experience}</TableCell>
                        <TableCell>{row.machineType}</TableCell>
                        <TableCell className="text-right">{row.machineCount}</TableCell>
                        <TableCell className="text-right">{row.totalPeople}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.reservationAmount)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.pendingCredit)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.clientPayment)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.totalCreditToPay)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.totalGain)}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-gray-500 py-6">
                        No hay reservas para los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
