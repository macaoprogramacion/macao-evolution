"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Clock,
  Users,
  Car,
  Phone,
  ChevronDown,
  CheckCircle2,
  Navigation,
  CalendarDays,
  RefreshCw,
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
    pickupTime: "7:30 AM",
    transportType: "Privado",
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
    pickupTime: "10:15 AM",
    transportType: "Colectivo",
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
    pickupTime: "2:30 PM",
    transportType: "Privado",
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
    pickupTime: "10:30 AM",
    transportType: "Privado",
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
    pickupTime: "2:15 PM",
    transportType: "Privado",
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
    pickupTime: "7:30 AM",
    transportType: "Colectivo",
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
    pickupTime: "7:30 AM",
    transportType: "Privado",
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
    pickupTime: "2:45 PM",
    transportType: "Privado",
    experience: "Apex Predator",
    date: "2026-02-17",
  },
]

/* ──────────────────────────────────────────────────────────────── */

export default function ChoferDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("all")

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
          <div className="space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className="border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {/* Row 1: Pickup time + experience */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-lg font-bold leading-none">
                        {r.pickupTime}
                      </div>
                      <div>
                        <p className="font-semibold text-base leading-tight">{r.customerName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.id}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {r.guests}
                    </Badge>
                  </div>

                  {/* Row 2: Hotel + location */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{r.hotel}</p>
                      <p className="text-muted-foreground text-xs">{r.location}</p>
                    </div>
                  </div>

                  {/* Row 3: Details chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Car className="h-3 w-3" />
                      {r.transportType}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {r.timeslot}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {r.experience}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(r.date)}
                    </Badge>
                  </div>

                  {/* Row 4: Phone — big tap target */}
                  {r.phone !== "—" && (
                    <a
                      href={`tel:${r.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-sm text-blue-600 font-medium py-1"
                    >
                      <Phone className="h-4 w-4" />
                      {r.phone}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
