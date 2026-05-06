"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  Search,
  Unlock,
} from "lucide-react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type AvailabilityDayRow = {
  date: string
  booked: number
  holds: number
  baseCapacity: number
  manualCapacity: number | null
  isBlocked: boolean
  available: number
}

const SAMANA_PRODUCT_ID = "1068932"
const SAMANA_PRODUCT_NAME = "Samana Whale - Samana: Hidden Waterfall & the virgin island Bacardi"
const SAMANA_DEFAULT_CAPACITY = 40
const SAMANA_DEPARTURE_TIME = "07:30"
const SAMANA_CUTOFF_HOURS = 10
const AVAILABILITY_WINDOW_DAYS = 45

export default function SamanaAvailabilityPage() {
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityDayRow[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilitySavingDate, setAvailabilitySavingDate] = useState<string | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [manualCapacityInputs, setManualCapacityInputs] = useState<Record<string, string>>({})

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")

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
      setTimeout(() => setAvailabilityMessage(null), 3500)
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
        setAvailabilityMessage("Ingresa un numero valido de cupos (0 o mayor)")
        setTimeout(() => setAvailabilityMessage(null), 3000)
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

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return availabilityRows.filter((row) => {
      if (selectedDate && row.date !== selectedDate) return false

      if (!query) return true

      const dateLabel = new Date(row.date + "T12:00:00")
        .toLocaleDateString("es-DO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
        .toLowerCase()

      const statusText = row.isBlocked ? "bloqueado" : row.available > 0 ? "bookable" : "sin cupos"

      return (
        row.date.includes(query) ||
        dateLabel.includes(query) ||
        SAMANA_PRODUCT_NAME.toLowerCase().includes(query) ||
        statusText.includes(query)
      )
    })
  }, [availabilityRows, searchQuery, selectedDate])

  useEffect(() => {
    fetchAvailabilityOverview()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-title text-gray-900 dark:text-gray-100">Disponibilidad Samana</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Controla bloqueos y cupos por fecha sin perder la integracion actual.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/operation-samana">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" onClick={fetchAvailabilityOverview} disabled={availabilityLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${availabilityLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Buscar disponibilidad</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Filtra por fecha o por texto para ubicar rapido el dia que quieres editar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por fecha, estado o producto"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {selectedDate && (
              <div className="mt-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate("")} className="text-gray-700 dark:text-gray-300">Limpiar fecha</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {availabilityMessage && (
          <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
            availabilityMessage.includes("Error") || availabilityMessage.includes("No se pudo") || availabilityMessage.includes("Falta")
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
              : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
          }`}>
            {availabilityMessage}
          </div>
        )}

        {availabilityLoading ? (
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando disponibilidad...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => {
              const isSaving = availabilitySavingDate === row.date
              return (
                <Card key={row.date} className="border-gray-200 dark:border-gray-800">
                  <CardContent className="pt-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          {new Date(row.date + "T12:00:00").toLocaleDateString("es-DO", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{SAMANA_PRODUCT_NAME}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Salida {SAMANA_DEPARTURE_TIME} | Cut-off {SAMANA_CUTOFF_HOURS} horas
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={row.available > 0 && !row.isBlocked ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                          {row.available > 0 && !row.isBlocked ? "Bookable" : "No disponible"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                      <div className="lg:col-span-4 flex flex-wrap gap-2">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">Disponibilidad {row.available} / {(row.manualCapacity ?? row.baseCapacity)} participantes</Badge>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/40">Reservado {row.booked}</Badge>
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/40">Holds {row.holds}</Badge>
                      </div>

                      <div className="lg:col-span-3">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Cupos manuales"
                          value={manualCapacityInputs[row.date] ?? ""}
                          onChange={(e) => setManualCapacityInputs((prev) => ({ ...prev, [row.date]: e.target.value }))}
                        />
                      </div>

                      <div className="lg:col-span-3 flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2">
                        <Label htmlFor={`block-${row.date}`} className="text-sm text-gray-700 dark:text-gray-300">Block</Label>
                        <Switch
                          id={`block-${row.date}`}
                          checked={row.isBlocked}
                          onCheckedChange={() => toggleDateBlocked(row.date)}
                          disabled={isSaving}
                        />
                        {row.isBlocked ? (
                          <span className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Bloqueado</span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Unlock className="w-3.5 h-3.5" />Activo</span>
                        )}
                      </div>

                      <div className="lg:col-span-2 flex justify-start lg:justify-end">
                        <Button size="sm" variant="outline" disabled={isSaving} onClick={() => saveManualCapacity(row.date)}>
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredRows.length === 0 && (
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6 text-sm text-gray-600 dark:text-gray-400">No hay resultados para los filtros actuales.</CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
