"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

type ReservationStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"

type ReservationRow = {
  id: string
  date: string
  customer_name: string
  experience: string
  channel: string
  channel_url: string
  amount: number
  notes: string
  status: ReservationStatus
  guests: number
  children: number
}

type ServiceCostRule = {
  key: string
  label: string
  unitCost: number
  machineCapacity: number
  aliases: string[]
}

type GygProfitRow = {
  id: string
  date: string
  customerName: string
  serviceLabel: string
  machineCount: number
  unitOperationalCost: number
  operationalCost: number
  grossAmount: number
  platformCommission: number
  netAfterCommission: number
  realProfit: number
  status: ReservationStatus
  unmappedService: boolean
}

const PLATFORM_COMMISSION_RATE = 0.25

const SERVICE_COST_RULES: ServiceCostRule[] = [
  {
    key: "shared_atv",
    label: "Shared ATV",
    unitCost: 30,
    machineCapacity: 2,
    aliases: ["shared atv", "atv", "doble moto", "single moto", "moto double", "moto single"],
  },
  {
    key: "shared_buggy",
    label: "Shared Buggy",
    unitCost: 30,
    machineCapacity: 2,
    aliases: ["shared buggy", "buggy doble", "buggy double"],
  },
  {
    key: "shared_vip_predator",
    label: "Shared VIP Predator",
    unitCost: 55,
    machineCapacity: 2,
    aliases: ["shared vip predator", "shared vip predactor", "vip shared predator", "vip shared predactor"],
  },
  {
    key: "familiar_predator",
    label: "Familiar Predator",
    unitCost: 85,
    machineCapacity: 4,
    aliases: ["familiar predator", "familiar predactor", "vip family predator", "vip family predactor"],
  },
  {
    key: "family_buggy",
    label: "Family Buggy",
    unitCost: 60,
    machineCapacity: 4,
    aliases: ["family buggy"],
  },
  {
    key: "single_buggy",
    label: "Single Buggy",
    unitCost: 30,
    machineCapacity: 1,
    aliases: ["single buggy", "buggy single"],
  },
]

function normalizeText(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function formatMoney(amount: number) {
  return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getLocalISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfMonthISO(dateISO: string) {
  return `${dateISO.slice(0, 7)}-01`
}

function parseMachineCountFromNotes(notes: string) {
  const match = (notes || "").match(/maquinas\s*:\s*(\d+)/i)
  return match ? Number(match[1]) : 0
}

function getServiceRule(experience: string) {
  const normalized = normalizeText(experience)
  if (!normalized) return null

  return (
    SERVICE_COST_RULES.find((rule) =>
      rule.aliases.some((alias) => normalized.includes(normalizeText(alias))),
    ) || null
  )
}

function inferMachineCount(row: ReservationRow, machineCapacity: number) {
  const explicit = parseMachineCountFromNotes(row.notes)
  if (explicit > 0) return explicit

  const totalPax = Math.max(0, Number(row.guests || 0) + Number(row.children || 0))
  if (totalPax <= 0 || machineCapacity <= 0) return 1

  return Math.max(1, Math.ceil(totalPax / machineCapacity))
}

function isGygReservation(row: ReservationRow) {
  const channelText = normalizeText(`${row.channel || ""} ${row.channel_url || ""}`)
  const notesText = normalizeText(row.notes || "")

  if (channelText.includes("getyourguide") || channelText.includes("gyg")) return true
  if (notesText.includes("gyg ref")) return true

  return false
}

function mapToProfitRow(row: ReservationRow): GygProfitRow {
  const serviceRule = getServiceRule(row.experience)
  const machineCount = inferMachineCount(row, serviceRule?.machineCapacity || 1)
  const unitOperationalCost = serviceRule?.unitCost || 0
  const operationalCost = machineCount * unitOperationalCost

  const grossAmount = Number(row.amount || 0)
  const platformCommission = grossAmount * PLATFORM_COMMISSION_RATE
  const netAfterCommission = grossAmount - platformCommission
  const realProfit = netAfterCommission - operationalCost

  return {
    id: row.id,
    date: row.date,
    customerName: row.customer_name,
    serviceLabel: serviceRule?.label || (row.experience || "Sin servicio"),
    machineCount,
    unitOperationalCost,
    operationalCost,
    grossAmount,
    platformCommission,
    netAfterCommission,
    realProfit,
    status: row.status,
    unmappedService: !serviceRule,
  }
}

export function GygProfitability() {
  const today = getLocalISODate()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<GygProfitRow[]>([])
  const [fromDate, setFromDate] = useState(startOfMonthISO(today))
  const [toDate, setToDate] = useState(today)
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all")
  const [serviceFilter, setServiceFilter] = useState<"all" | string>("all")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select("id, date, customer_name, experience, channel, channel_url, amount, notes, status, guests, children")
          .order("date", { ascending: false })
          .limit(5000)

        if (error) throw error

        const mappedRows: ReservationRow[] = (data || []).map((row: any) => ({
          id: String(row.id || ""),
          date: row.date || "",
          customer_name: row.customer_name || "Cliente sin nombre",
          experience: row.experience || "",
          channel: row.channel || "",
          channel_url: row.channel_url || "",
          amount: Number(row.amount || 0),
          notes: row.notes || "",
          status: (row.status || "pending") as ReservationStatus,
          guests: Number(row.guests || 0),
          children: Number(row.children || 0),
        }))

        const onlyGyg = mappedRows.filter((row) => isGygReservation(row))
        setRows(onlyGyg.map((row) => mapToProfitRow(row)))
      } catch (error) {
        console.error("Error loading GYG profitability rows:", error)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(interval)
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (fromDate && row.date < fromDate) return false
      if (toDate && row.date > toDate) return false
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      if (serviceFilter !== "all") {
        const serviceRule = getServiceRule(row.serviceLabel)
        if (!serviceRule || serviceRule.key !== serviceFilter) return false
      }
      return true
    })
  }, [rows, fromDate, toDate, statusFilter, serviceFilter])

  const totals = useMemo(() => {
    return {
      totalReservations: filteredRows.length,
      totalOperationalCost: filteredRows.reduce((sum, row) => sum + row.operationalCost, 0),
      totalGrossAmount: filteredRows.reduce((sum, row) => sum + row.grossAmount, 0),
      totalCommission: filteredRows.reduce((sum, row) => sum + row.platformCommission, 0),
      totalNetAfterCommission: filteredRows.reduce((sum, row) => sum + row.netAfterCommission, 0),
      totalRealProfit: filteredRows.reduce((sum, row) => sum + row.realProfit, 0),
    }
  }, [filteredRows])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando rentabilidad de GetYourGuide...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidad real - GetYourGuide</CardTitle>
          <CardDescription>
            Costo operativo por maquina + comision de plataforma (25%) con detalle por reserva y totales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gyg-from-date">Desde</Label>
              <Input
                id="gyg-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gyg-to-date">Hasta</Label>
              <Input
                id="gyg-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ReservationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value as "all" | string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SERVICE_COST_RULES.map((rule) => (
                    <SelectItem key={rule.key} value={rule.key}>
                      {rule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total reservas GYG</p>
            <p className="text-2xl font-bold">{totals.totalReservations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total costo operativo</p>
            <p className="text-2xl font-bold text-red-600">{formatMoney(totals.totalOperationalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Comision plataforma (25%)</p>
            <p className="text-2xl font-bold text-orange-600">{formatMoney(totals.totalCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total cobrado a GYG</p>
            <p className="text-2xl font-bold">{formatMoney(totals.totalGrossAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Neto tras comision</p>
            <p className="text-2xl font-bold">{formatMoney(totals.totalNetAfterCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ganancia real</p>
            <p className={`text-2xl font-bold ${totals.totalRealProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(totals.totalRealProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3">Fecha</th>
                  <th className="text-left py-3 px-3">Cliente</th>
                  <th className="text-left py-3 px-3">Servicio</th>
                  <th className="text-right py-3 px-3">Maquinas</th>
                  <th className="text-right py-3 px-3">Cobro GYG</th>
                  <th className="text-right py-3 px-3">Comision 25%</th>
                  <th className="text-right py-3 px-3">Neto</th>
                  <th className="text-right py-3 px-3">Costo operativo</th>
                  <th className="text-right py-3 px-3">Ganancia real</th>
                  <th className="text-center py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="py-3 px-3">{row.date}</td>
                      <td className="py-3 px-3">{row.customerName}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span>{row.serviceLabel}</span>
                          {row.unmappedService ? <Badge variant="secondary">Sin mapeo</Badge> : null}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">{row.machineCount}</td>
                      <td className="py-3 px-3 text-right">{formatMoney(row.grossAmount)}</td>
                      <td className="py-3 px-3 text-right text-orange-600">{formatMoney(row.platformCommission)}</td>
                      <td className="py-3 px-3 text-right">{formatMoney(row.netAfterCommission)}</td>
                      <td className="py-3 px-3 text-right text-red-600">{formatMoney(row.operationalCost)}</td>
                      <td className={`py-3 px-3 text-right font-semibold ${row.realProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatMoney(row.realProfit)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.status === "cancelled" ? (
                          <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
                        ) : row.status === "completed" ? (
                          <Badge className="bg-green-100 text-green-800">Completada</Badge>
                        ) : (
                          <Badge variant="secondary">{row.status}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-500">
                      No hay reservas de GetYourGuide con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
