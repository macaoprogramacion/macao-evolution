"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Clock,
  Users,
  Phone,
  CheckCircle2,
  Navigation,
  CalendarDays,
  RefreshCw,
  Baby,
  DoorOpen,
  PackageCheck,
  UserCheck,
  MapPinned,
  X,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { findHotel } from "@/lib/hotel-locations"

/* ──────────────────────────────────────────────────────────────
   DATOS — Solo las reservas CONFIRMADAS por operaciones llegan aquí.
   Cuando haya backend, este array se sustituye por un fetch filtrado
   con status = "confirmed".
   ────────────────────────────────────────────────────────────── */
const confirmedReservations = [
  {
    id: "RES-001",
    customerName: "John Smith",
    phone: "+1 809-555-0123",
    hotel: "Hard Rock Hotel & Casino",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    children: 0,
    pickupTime: "7:30 AM",
    pickupPoint: "lobby" as const,
    experience: "Elite Couple",
    date: "2026-02-15",
  },
  {
    id: "RES-002",
    customerName: "María García",
    phone: "+1 829-555-0456",
    hotel: "Barceló Bávaro Palace",
    location: "Bávaro",
    timeslot: "11 AM",
    guests: 4,
    children: 2,
    pickupTime: "10:15 AM",
    pickupPoint: "lobby" as const,
    experience: "Elite Family",
    date: "2026-02-15",
  },
  {
    id: "RES-003",
    customerName: "Robert Johnson",
    phone: "+1 849-555-0789",
    hotel: "Dreams Macao Beach",
    location: "Macao",
    timeslot: "3 PM",
    guests: 2,
    children: 0,
    pickupTime: "2:30 PM",
    pickupPoint: "barrera" as const,
    experience: "Apex Predator",
    date: "2026-02-15",
  },
  {
    id: "RES-005",
    customerName: "Carlos Rodríguez",
    phone: "+1 809-555-3456",
    hotel: "Secrets Cap Cana",
    location: "Cap Cana",
    timeslot: "11 AM",
    guests: 2,
    children: 0,
    pickupTime: "10:30 AM",
    pickupPoint: "lobby" as const,
    experience: "ATV QUAD",
    date: "2026-02-16",
  },
  {
    id: "RES-006",
    customerName: "Anna Müller",
    phone: "+49 151-555-7890",
    hotel: "Majestic Elegance",
    location: "Punta Cana",
    timeslot: "3 PM",
    guests: 5,
    children: 3,
    pickupTime: "2:15 PM",
    pickupPoint: "barrera" as const,
    experience: "Predator Family",
    date: "2026-02-16",
  },
  {
    id: "RES-007",
    customerName: "James Wilson",
    phone: "+1 829-555-9012",
    hotel: "Excellence Punta Cana",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    children: 0,
    pickupTime: "7:30 AM",
    pickupPoint: "lobby" as const,
    experience: "THE COMBINED",
    date: "2026-02-17",
  },
  {
    id: "REP-BK-001",
    customerName: "James Wilson",
    phone: "—",
    hotel: "Hard Rock Hotel & Casino",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    children: 0,
    pickupTime: "7:30 AM",
    pickupPoint: "lobby" as const,
    experience: "Elite Couple Experience",
    date: "2026-02-15",
  },
  {
    id: "REP-BK-004",
    customerName: "David & Sarah Brown",
    phone: "—",
    hotel: "Secrets Royal Beach",
    location: "Punta Cana",
    timeslot: "3 PM",
    guests: 2,
    children: 0,
    pickupTime: "2:45 PM",
    pickupPoint: "barrera" as const,
    experience: "Apex Predator",
    date: "2026-02-17",
  },
]

/* ──────────────────────────────────────────────────────────────── */

export default function ChoferDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("all")
  const [cardStatus, setCardStatus] = useState<Record<string, "none" | "recibida" | "confirmada">>({})
  const [mapOpen, setMapOpen] = useState<string | null>(null)
  const uniqueDates = useMemo(
    () => [...new Set(confirmedReservations.map((r) => r.date))].sort(),
    []
  )

  const filtered = useMemo(() => {
    let list = confirmedReservations
    if (selectedDate !== "all") list = list.filter((r) => r.date === selectedDate)
    if (selectedTimeslot !== "all") list = list.filter((r) => r.timeslot === selectedTimeslot)
    return list.sort((a, b) => {
      // Sort by date, then by pickup time
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.pickupTime.localeCompare(b.pickupTime)
    })
  }, [selectedDate, selectedTimeslot])

  const totalGuests = filtered.reduce((sum, r) => sum + r.guests, 0)

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short" })
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Navigation className="h-6 w-6 text-red-600" />
              Mis Recogidas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Reservas confirmadas por operaciones
            </p>
          </div>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters — simple, big touch targets */}
        <div className="flex gap-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-11 text-sm flex-1">
              <CalendarDays className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              {uniqueDates.map((d) => (
                <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeslot} onValueChange={setSelectedTimeslot}>
            <SelectTrigger className="h-11 text-sm w-[130px]">
              <Clock className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Horario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="8 AM">8 AM</SelectItem>
              <SelectItem value="11 AM">11 AM</SelectItem>
              <SelectItem value="3 PM">3 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary bar */}
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {filtered.length} recogidas
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 font-medium">
            <Users className="h-4 w-4 text-blue-600" />
            {totalGuests} personas
          </div>
        </div>

        {/* Reservation cards — big, easy to read */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Navigation className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay recogidas</p>
            <p className="text-sm mt-1">Ajusta los filtros o espera a que operaciones confirme nuevas reservas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => {
              const status = cardStatus[r.id] || "none"
              const isMapOpen = mapOpen === r.id
              const hotelInfo = findHotel(r.hotel)
              const mapQuery = encodeURIComponent(hotelInfo ? hotelInfo.name : `${r.hotel}, ${r.location}, Dominican Republic`)
              return (
              <Card key={r.id} className={`border-l-4 shadow-sm ${
                status === "confirmada" ? "border-l-blue-500 bg-blue-50/50" :
                status === "recibida" ? "border-l-yellow-500 bg-yellow-50/50" :
                "border-l-green-500"
              }`}>
                <CardContent className="p-5 space-y-4">
                  {/* Row 1: Pickup time BIG on top, then name */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="bg-red-600 text-white rounded-lg px-4 py-2 text-2xl font-bold leading-none inline-block mb-2">
                        {r.pickupTime}
                      </div>
                      <p className="font-bold text-2xl leading-tight">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.id}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-sm px-2.5 py-1">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {r.guests}
                    </Badge>
                  </div>

                  {/* Row 2: Hotel + location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-base">{r.hotel}</p>
                      <p className="text-muted-foreground text-sm">{r.location}</p>
                    </div>
                  </div>

                  {/* Row 3: Big badges — lobby/barrera + turno + adultos + niños */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-sm gap-1.5 px-3 py-1.5 ${
                        r.pickupPoint === "lobby"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      <DoorOpen className="h-4 w-4" />
                      {r.pickupPoint === "lobby" ? "Lobby" : "Barrera"}
                    </Badge>
                    <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1.5">
                      <Clock className="h-4 w-4" />
                      {r.timeslot}
                    </Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      {formatDate(r.date)}
                    </Badge>
                    <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700">
                      <Users className="h-4 w-4" />
                      {r.guests - r.children} adulto{(r.guests - r.children) !== 1 ? "s" : ""}
                    </Badge>
                    {r.children > 0 && (
                      <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700">
                        <Baby className="h-4 w-4" />
                        {r.children} niño{r.children > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  {/* Row 4: Phone */}
                  {r.phone !== "—" && (
                    <a
                      href={`tel:${r.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-base text-blue-600 font-medium py-1"
                    >
                      <Phone className="h-5 w-5" />
                      {r.phone}
                    </a>
                  )}

                  {/* Row 5: Ubicación Exacta */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-11 text-sm font-semibold"
                    onClick={() => setMapOpen(isMapOpen ? null : r.id)}
                  >
                    <MapPinned className="h-4 w-4 text-red-500" />
                    {isMapOpen ? "Cerrar Mapa" : "Ubicación Exacta"}
                  </Button>

                  {isMapOpen && (
                    <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        className="w-full h-56 rounded-t-lg"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapQuery}&zoom=16`}
                        allowFullScreen
                      />
                      <a
                        href={hotelInfo ? hotelInfo.mapUrl : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 border-b border-gray-200 bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors"
                      >
                        <MapPinned className="h-4 w-4 text-red-500" />
                        Ver en Google Maps
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        Cómo Llegar
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Row 6: Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={status === "recibida" || status === "confirmada" ? "default" : "outline"}
                      disabled={status === "recibida" || status === "confirmada"}
                      className={`flex-1 text-xs h-11 gap-1.5 ${
                        status === "recibida" || status === "confirmada"
                          ? "bg-yellow-500 text-white opacity-100"
                          : ""
                      }`}
                      onClick={() =>
                        setCardStatus((prev) => ({
                          ...prev,
                          [r.id]: "recibida",
                        }))
                      }
                    >
                      <PackageCheck className="h-4 w-4" />
                      Reserva Recibida
                    </Button>
                    <Button
                      size="sm"
                      variant={status === "confirmada" ? "default" : "outline"}
                      disabled={status !== "recibida"}
                      className={`flex-1 text-xs h-11 gap-1.5 ${
                        status === "confirmada"
                          ? "bg-blue-600 text-white opacity-100"
                          : ""
                      }`}
                      onClick={() =>
                        setCardStatus((prev) => ({
                          ...prev,
                          [r.id]: "confirmada",
                        }))
                      }
                    >
                      <UserCheck className="h-4 w-4" />
                      Recogida Confirmada
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
