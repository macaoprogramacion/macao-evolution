"use client"

import { Fragment, useState, useMemo, useEffect } from "react"
import { Plus, X, Printer, Lock, AlertCircle } from "lucide-react"
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
import { hotelDirectory } from "@/lib/hotel-locations"
import { getBuggyPickupSuggestion, type TurnSlot } from "@/lib/hotel-pickup-schedules"
import {
  createPickupSheet,
  getPickupSheetByDate,
  getPickupSheetRows,
  addPickupSheetRows,
  removePickupSheetRow,
  markPickupSheetPrinted,
  type PickupSheet,
  type PickupSheetRow,
} from "@/lib/pickup-sheets"

interface PickupEntry {
  id: string
  hotel: string
  zoneId: PickupZoneId
  shift: ShiftOption
  pickupTime: string
  agency: string
  customerName: string
  persons: number
  room: string
  serviceType: string
}

type ShiftOption = "9 AM" | "12 PM" | "3 PM"
type PickupZoneId = "zona4" | "zona3" | "zona2" | "zona1"

const ZONE_ORDER: PickupZoneId[] = ["zona4", "zona3", "zona2", "zona1"]

const ZONE_CONFIG: Record<PickupZoneId, {
  label: string
  subtitle: string
  tableClass: string
  badgeClass: string
  printBg: string
  printText: string
}> = {
  zona4: {
    label: "Zona 4",
    subtitle: "Cabeza de Toro y Cap Cana",
    tableClass: "bg-rose-100 dark:bg-rose-900/30",
    badgeClass: "bg-rose-100 text-rose-800",
    printBg: "#fecaca",
    printText: "#7f1d1d",
  },
  zona3: {
    label: "Zona 3",
    subtitle: "Bavaro",
    tableClass: "bg-amber-100 dark:bg-amber-900/30",
    badgeClass: "bg-amber-100 text-amber-800",
    printBg: "#fde68a",
    printText: "#78350f",
  },
  zona2: {
    label: "Zona 2",
    subtitle: "Centro y Machiplan",
    tableClass: "bg-sky-100 dark:bg-sky-900/30",
    badgeClass: "bg-sky-100 text-sky-800",
    printBg: "#bae6fd",
    printText: "#0c4a6e",
  },
  zona1: {
    label: "Zona 1",
    subtitle: "Macao y Uvero Alto",
    tableClass: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeClass: "bg-emerald-100 text-emerald-800",
    printBg: "#bbf7d0",
    printText: "#14532d",
  },
}

const SHIFT_TO_SLOT: Record<ShiftOption, TurnSlot> = {
  "9 AM": "8 AM",
  "12 PM": "11 AM",
  "3 PM": "3 PM",
}

const SERVICES = [
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

function normalizeText(value: string) {
  return value.trim().toUpperCase()
}

function toMinutes(timeValue: string) {
  const parts = timeValue.split(":")
  if (parts.length !== 2) return 9999
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 9999
  return hh * 60 + mm
}

function resolveHotelInfo(hotelInput: string) {
  const query = normalizeText(hotelInput)
  const found = Object.entries(hotelDirectory).find(([key, value]) => {
    const keyNorm = normalizeText(key)
    const nameNorm = normalizeText(value.name)
    return query === keyNorm || query === nameNorm
  })

  if (!found) {
    return {
      displayName: hotelInput,
      zone: "Sin Zona",
      section: 999,
      defaultZoneId: "zona3" as PickupZoneId,
    }
  }

  const section = found[1].section
  let defaultZoneId: PickupZoneId = "zona3"
  if (section >= 1 && section <= 3) defaultZoneId = "zona4"
  else if (section >= 4 && section <= 5) defaultZoneId = "zona3"
  else if (section >= 6 && section <= 8) defaultZoneId = "zona2"
  else if (section >= 9 && section <= 10) defaultZoneId = "zona1"

  return {
    displayName: found[1].name,
    zone: found[1].zone,
    section,
    defaultZoneId,
  }
}

export function DriverPickupSheet() {
  const [pickups, setPickups] = useState<PickupEntry[]>([])
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [sheetStatus, setSheetStatus] = useState<"draft" | "locked" | "printed">("draft")
  const [isLoading, setIsLoading] = useState(true)
  const [hotel, setHotel] = useState("")
  const [zoneId, setZoneId] = useState<PickupZoneId>("zona4")
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false)
  const [shift, setShift] = useState<ShiftOption>("9 AM")
  const [time, setTime] = useState("")
  const [agency, setAgency] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [persons, setPersons] = useState("1")
  const [room, setRoom] = useState("")
  const [serviceType, setServiceType] = useState("")

  // Load pickup sheet for today on mount
  useEffect(() => {
    const loadSheet = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        // Try to find existing sheet for today
        const existingSheet = await getPickupSheetByDate(today)
        
        if (existingSheet?.id) {
          setSheetId(existingSheet.id)
          setSheetStatus(existingSheet.status as "draft" | "locked" | "printed")
          
          // Load rows
          const rows = await getPickupSheetRows(existingSheet.id)
          if (rows && rows.length > 0) {
            // Convert DB rows to PickupEntry format
            const entries: PickupEntry[] = rows.map((row: PickupSheetRow) => ({
              id: row.id,
              hotel: row.hotel || "",
              zoneId: "zona3" as PickupZoneId,
              shift: "9 AM" as ShiftOption,
              pickupTime: row.pickup_time || "",
              agency: row.agency || "",
              customerName: row.customer_name || "",
              persons: row.pax || 1,
              room: row.room || "",
              serviceType: "",
            }))
            setPickups(entries)
          }
        } else {
          // Create new sheet for today
          const newSheet = await createPickupSheet(today, "8 AM", "system")
          if (newSheet?.id) {
            setSheetId(newSheet.id)
            setSheetStatus("draft")
          }
        }
      } catch (error) {
        console.error("Error loading pickup sheet:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSheet()
  }, [])

  const hotelList = Object.keys(hotelDirectory).sort()
  const hotelOptions = useMemo(
    () =>
      hotelList.map((key) => ({
        key,
        label: hotelDirectory[key]?.name || key,
        defaultZoneId: resolveHotelInfo(key).defaultZoneId,
      })),
    [hotelList],
  )

  const toTimeInputValue = (raw: string) => {
    const value = raw.trim()
    const already24h = value.match(/^(\d{1,2}):(\d{2})$/)
    if (already24h) {
      const hh = Math.max(0, Math.min(23, Number(already24h[1])))
      const mm = Math.max(0, Math.min(59, Number(already24h[2])))
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
    }

    const withMeridiem = value.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
    if (!withMeridiem) return ""

    let hh = Number(withMeridiem[1])
    const mm = Number(withMeridiem[2])
    const meridiem = withMeridiem[3].toUpperCase()

    if (meridiem === "PM" && hh !== 12) hh += 12
    if (meridiem === "AM" && hh === 12) hh = 0

    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  }

  const getScheduledTime = (hotelInput: string, shiftInput: ShiftOption) => {
    if (!hotelInput) return ""
    const slot = SHIFT_TO_SLOT[shiftInput]

    const direct = getBuggyPickupSuggestion(hotelInput, slot)
    if (direct?.pickupTime) return toTimeInputValue(direct.pickupTime)

    const match = hotelOptions.find(
      (opt) => normalizeText(opt.label) === normalizeText(hotelInput) || normalizeText(opt.key) === normalizeText(hotelInput),
    )
    if (!match) return ""

    const byKey = getBuggyPickupSuggestion(match.key, slot)
    if (byKey?.pickupTime) return toTimeInputValue(byKey.pickupTime)

    const byLabel = getBuggyPickupSuggestion(match.label, slot)
    if (byLabel?.pickupTime) return toTimeInputValue(byLabel.pickupTime)

    return ""
  }

  const filteredHotels = useMemo(
    () =>
      hotelOptions.filter((opt) => {
        const query = normalizeText(hotel)
        const zoneMatch = opt.defaultZoneId === zoneId
        const queryMatch = !query || normalizeText(opt.label).includes(query) || normalizeText(opt.key).includes(query)
        return zoneMatch && queryMatch
      }),
    [hotel, hotelOptions, zoneId],
  )

  const groupedPickups = useMemo(() => {
    const map = new Map<PickupZoneId, { zoneId: PickupZoneId; items: PickupEntry[] }>()

    for (const pickup of pickups) {
      const key = pickup.zoneId
      if (!map.has(key)) {
        map.set(key, { zoneId: key, items: [] })
      }
      map.get(key)!.items.push(pickup)
    }

    return ZONE_ORDER
      .filter((zone) => map.has(zone))
      .map((zone) => map.get(zone)!)
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => {
          const byTime = toMinutes(a.pickupTime) - toMinutes(b.pickupTime)
          if (byTime !== 0) return byTime
          return resolveHotelInfo(a.hotel).displayName.localeCompare(resolveHotelInfo(b.hotel).displayName)
        }),
      }))
  }, [pickups])

  const suggestedTime = useMemo(() => {
    return getScheduledTime(hotel, shift)
  }, [hotel, shift])

  const handleAddPickup = () => {
    if (!hotel || !zoneId || !time || !agency || !customerName || !persons || !serviceType) {
      alert("Por favor completa todos los campos")
      return
    }

    const handleAddAsync = async () => {
      try {
        const newEntry: PickupEntry = {
          id: Date.now().toString(),
          hotel,
          zoneId,
          shift,
          pickupTime: time,
          agency,
          customerName,
          persons: parseInt(persons),
          room,
          serviceType,
        }

        // Save to BD
        if (sheetId) {
          await addPickupSheetRows(sheetId, [
            {
              pickup_time: time,
              customer_name: customerName,
              hotel: agency,
              room: room || null,
              is_ghost: false,
              ghost_hotel_random: null,
              ghost_name_random: null,
              reservation_id: null,
            },
          ])
        }

        setPickups([...pickups, newEntry])
        setHotel("")
        setZoneId("zona4")
        setShowHotelSuggestions(false)
        setShift("9 AM")
        setTime("")
        setAgency("")
        setCustomerName("")
        setPersons("1")
        setRoom("")
        setServiceType("")
      } catch (error) {
        console.error("Error adding pickup:", error)
        alert("No se pudo guardar la recogida")
      }
    }

    handleAddAsync()
  }

  const handleRemovePickup = (id: string) => {
    const handleRemoveAsync = async () => {
      try {
        // Remove from BD
        await removePickupSheetRow(id)
        setPickups(pickups.filter((p) => p.id !== id))
      } catch (error) {
        console.error("Error removing pickup:", error)
        alert("No se pudo eliminar la recogida")
      }
    }

    handleRemoveAsync()
  }

  const handlePrint = () => {
    if (pickups.length === 0) {
      alert("Agrega al menos una recogida antes de imprimir")
      return
    }

    const handlePrintAsync = async () => {
      try {
        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        const html = generatePrintHTML(pickups)
        printWindow.document.write(html)
        printWindow.document.close()

        setTimeout(() => {
          printWindow.print()
        }, 250)

        // Mark as printed in BD
        if (sheetId) {
          await markPickupSheetPrinted(sheetId)
          setSheetStatus("printed")
        }
      } catch (error) {
        console.error("Error printing:", error)
        alert("No se pudo guardar la impresión")
      }
    }

    handlePrintAsync()
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Cargando hoja de recogida...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Badge */}
          {sheetStatus !== "draft" && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Hoja de recogida {sheetStatus === "printed" ? "impresa" : "bloqueada"}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No se pueden agregar o eliminar recogidas después de {sheetStatus === "printed" ? "imprimir" : "crear"}.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <Card className={`border-gray-200 dark:border-gray-800 ${sheetStatus !== "draft" ? "opacity-50" : ""}`}>
            <CardHeader>
              <CardTitle className="text-base">Agregar Recogida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zone */}
                <div className="space-y-1.5">
                  <Label>Zona *</Label>
                  <Select
                    value={zoneId}
                    onValueChange={(value) => {
                      setZoneId(value as PickupZoneId)
                      setHotel("")
                      setTime("")
                      setShowHotelSuggestions(false)
                    }}
                    disabled={sheetStatus !== "draft"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zona4">Zona 4 - Cabeza de Toro y Cap Cana</SelectItem>
                      <SelectItem value="zona3">Zona 3 - Bavaro</SelectItem>
                      <SelectItem value="zona2">Zona 2 - Centro y Machiplan</SelectItem>
                      <SelectItem value="zona1">Zona 1 - Macao y Uvero Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hotel */}
                <div className="space-y-1.5">
                  <Label>Hotel *</Label>
                  <div className="relative">
                    <Input
                      value={hotel}
                      onFocus={() => setShowHotelSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowHotelSuggestions(false), 120)
                      }}
                      onChange={(e) => {
                        const nextHotel = e.target.value
                        setHotel(nextHotel)
                        setShowHotelSuggestions(true)
                        const nextTime = getScheduledTime(nextHotel, shift)
                        if (nextTime) setTime(nextTime)
                      }}
                      placeholder="Busca el hotel..."
                      className="w-full"
                      disabled={sheetStatus !== "draft"}
                    />
                    {showHotelSuggestions && filteredHotels.length > 0 && (
                      <div className="absolute top-full left-0 right-0 border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto z-10">
                        {filteredHotels.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setHotel(opt.label)
                              setZoneId(opt.defaultZoneId)
                              setShowHotelSuggestions(false)
                              const nextSuggestion = getScheduledTime(opt.label, shift)
                              setTime(nextSuggestion)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Mostrando hoteles de {ZONE_CONFIG[zoneId].label}: {ZONE_CONFIG[zoneId].subtitle}
                  </p>
                  {suggestedTime && hotel && (
                    <p className="text-xs text-blue-600">Horario del hotel para este turno: {suggestedTime}</p>
                  )}
                </div>

                {/* Pickup Time */}
                <div className="space-y-1.5">
                  <Label>Hora de Recogida *</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="07:30"
                    disabled={sheetStatus !== "draft"}
                  />
                </div>

                {/* Shift */}
                <div className="space-y-1.5">
                  <Label>Turno *</Label>
                  <Select
                    value={shift}
                    onValueChange={(val) => {
                      const nextShift = val as ShiftOption
                      setShift(nextShift)
                      if (hotel) {
                        const nextSuggestion = getScheduledTime(hotel, nextShift)
                        setTime(nextSuggestion)
                      }
                    }}
                    disabled={sheetStatus !== "draft"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9 AM">Turno 9:00 AM</SelectItem>
                      <SelectItem value="12 PM">Turno 12:00 PM</SelectItem>
                      <SelectItem value="3 PM">Turno 3:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agency */}
                <div className="space-y-1.5">
                  <Label>Agencia *</Label>
                  <Input
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    placeholder="Nombre de la agencia"
                    disabled={sheetStatus !== "draft"}
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-1.5">
                  <Label>Nombre del Cliente *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                    disabled={sheetStatus !== "draft"}
                  />
                </div>

                {/* Persons */}
                <div className="space-y-1.5">
                  <Label>Cantidad de Personas *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={persons}
                    onChange={(e) => setPersons(e.target.value)}
                    placeholder="1"
                    disabled={sheetStatus !== "draft"}
                  />
                </div>

                {/* Room */}
                <div className="space-y-1.5">
                  <Label>Número de Habitación</Label>
                  <Input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Ej: 4231"
                    disabled={sheetStatus !== "draft"}
                  />
                </div>

                {/* Service Type */}
                <div className="space-y-1.5">
                  <Label>Servicios *</Label>
                  <Select value={serviceType} onValueChange={setServiceType} disabled={sheetStatus !== "draft"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddPickup}
                disabled={sheetStatus !== "draft"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Recogida
              </Button>
            </CardContent>
          </Card>

          {/* Pickups List */}
          {pickups.length > 0 && (
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recogidas del Día ({pickups.length})</CardTitle>
                <Button
                  onClick={handlePrint}
                  disabled={sheetStatus !== "draft"}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Hoja A4
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-semibold">Hotel</th>
                        <th className="text-left py-3 px-2 font-semibold">Zona</th>
                        <th className="text-left py-3 px-2 font-semibold">Turno</th>
                        <th className="text-left py-3 px-2 font-semibold">Hora</th>
                        <th className="text-left py-3 px-2 font-semibold">Agencia</th>
                        <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                        <th className="text-center py-3 px-2 font-semibold">Personas</th>
                        <th className="text-left py-3 px-2 font-semibold">Hab.</th>
                        <th className="text-left py-3 px-2 font-semibold">Servicio</th>
                        <th className="text-center py-3 px-2 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPickups.map((group) => (
                        <Fragment key={`zone-${group.zoneId}`}>
                          <tr className={ZONE_CONFIG[group.zoneId].tableClass}>
                            <td colSpan={10} className="py-2 px-2 font-semibold text-gray-800 dark:text-gray-100">
                              {ZONE_CONFIG[group.zoneId].label} - {ZONE_CONFIG[group.zoneId].subtitle}
                            </td>
                          </tr>
                          {group.items.map((pickup) => {
                            const info = resolveHotelInfo(pickup.hotel)
                            return (
                              <tr
                                key={pickup.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                              >
                                <td className="py-3 px-2">
                                  <span className="font-medium">{info.displayName}</span>
                                </td>
                                <td className="py-3 px-2">
                                  <Badge className={ZONE_CONFIG[pickup.zoneId].badgeClass}>{ZONE_CONFIG[pickup.zoneId].label}</Badge>
                                </td>
                                <td className="py-3 px-2">{pickup.shift}</td>
                                <td className="py-3 px-2">{pickup.pickupTime}</td>
                                <td className="py-3 px-2">{pickup.agency}</td>
                                <td className="py-3 px-2">{pickup.customerName}</td>
                                <td className="py-3 px-2 text-center">
                                  <Badge variant="outline">{pickup.persons}</Badge>
                                </td>
                                <td className="py-3 px-2">{pickup.room || "—"}</td>
                                <td className="py-3 px-2">{pickup.serviceType}</td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    onClick={() => handleRemovePickup(pickup.id)}
                                    disabled={sheetStatus !== "draft"}
                                    className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function generatePrintHTML(pickups: PickupEntry[]): string {
  const logoUrl = "/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png"
  const today = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const groupsMap = new Map<PickupZoneId, { zoneId: PickupZoneId; items: PickupEntry[] }>()
  for (const pickup of pickups) {
    const key = pickup.zoneId
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { zoneId: key, items: [] })
    }
    groupsMap.get(key)!.items.push(pickup)
  }

  const groups = ZONE_ORDER
    .filter((zone) => groupsMap.has(zone))
    .map((zone) => groupsMap.get(zone)!)
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => toMinutes(a.pickupTime) - toMinutes(b.pickupTime)),
    }))

  const rows = groups
    .map((group) => {
      const zoneCfg = ZONE_CONFIG[group.zoneId]
      const zoneHeader = `
        <tr class="zone-row" style="background:${zoneCfg.printBg};color:${zoneCfg.printText};">
          <td colspan="9">${zoneCfg.label} - ${zoneCfg.subtitle}</td>
        </tr>
      `

      const zoneRows = group.items
        .map((p) => {
          const info = resolveHotelInfo(p.hotel)
          return `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.shift}</td>
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${p.pickupTime}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${info.displayName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${ZONE_CONFIG[p.zoneId].label}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.room || "—"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.persons}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.agency}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.customerName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.serviceType}</td>
            </tr>
          `
        })
        .join("")

      return `${zoneHeader}${zoneRows}`
    })
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hoja de Recogida - MACAO</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
    }
    .container {
      max-width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 3px solid #dc2626;
      padding-bottom: 15px;
    }
    .logo {
      max-width: 120px;
      height: auto;
    }
    .header-info {
      text-align: right;
    }
    .header-info h1 {
      font-size: 24px;
      color: #dc2626;
      margin-bottom: 5px;
    }
    .header-info p {
      font-size: 12px;
      color: #666;
    }
    .date {
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #dc2626;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
    }
    td {
      border: 1px solid #ddd;
      padding: 8px;
      font-size: 11px;
    }
    .zone-row td {
      background: #fee2e2;
      color: #991b1b;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      text-align: center;
      color: #666;
    }
    @media print {
      .container {
        box-shadow: none;
        max-width: 100%;
        height: auto;
        padding: 20mm;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="MACAO Logo" class="logo" />
      <div class="header-info">
        <h1>HOJA DE RECOGIDA</h1>
        <p>Operaciones de Transporte</p>
      </div>
    </div>
    
    <div class="date">Fecha: ${today}</div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">TURNO</th>
          <th style="width: 10%;">HORARIO</th>
          <th style="width: 17%;">HOTEL</th>
          <th style="width: 10%;">ZONA</th>
          <th style="width: 8%;">HAB.</th>
          <th style="width: 7%;">PAX</th>
          <th style="width: 13%;">AGENCIA</th>
          <th style="width: 13%;">CLIENTE</th>
          <th style="width: 12%;">SERVICIO</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Impreso por: MACAO • ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
</body>
</html>
  `
}
