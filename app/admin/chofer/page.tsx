"use client"

import { useState, useMemo, useEffect } from "react"
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
  UserX,
  MapPinned,
  X,
  ExternalLink,
  Inbox,
  Truck,
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
import { supabase } from "@/lib/supabase"
import { getDashboardSession } from "@/lib/dashboard-session"

type ChoferReservation = {
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
  pickupPoint: "lobby" | "barrera"
  transportType: string
  experience: string
  channel: string
  date: string
  status: string
  choferStatus: "none" | "recibida" | "confirmada"
  choferId: string
  choferName: string
}

function mapChoferRow(r: any): ChoferReservation {
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
    date: r.date,
    status: r.status,
    choferStatus: r.chofer_status || "none",
    choferId: r.assigned_chofer_id || "",
    choferName: r.assigned_chofer_name || "",
  }
}

/* ──────────────────────────────────────────────────────────────── */

export default function ChoferDashboard() {
  const [reservations, setReservations] = useState<ChoferReservation[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("all")
  const [selectedChofer, setSelectedChofer] = useState<string>("all")
  const [mapOpen, setMapOpen] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Leer reservas desde Supabase
  const loadReservations = async () => {
    try {
      const session = await getDashboardSession()
      if (!session) return

      const role = session.role
      if (role === "admin" || role === "both" || role === "operaciones") {
        setIsAdmin(true)
        // Admin ve todas las reservas asignadas a algún chofer
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .not("assigned_chofer_id", "is", null)
          .order("date", { ascending: true })
          .order("pickup_time", { ascending: true })
        if (!error && data) {
          setReservations(data.map(mapChoferRow))
        }
      } else {
        setIsAdmin(false)
        if (session.id) {
          const { data, error } = await supabase
            .from("reservations")
            .select("*")
            .eq("assigned_chofer_id", session.id)
            .order("date", { ascending: true })
            .order("pickup_time", { ascending: true })
          if (!error && data) {
            setReservations(data.map(mapChoferRow))
          }
        }
      }
    } catch {
      setReservations([])
    }
  }

  // Actualizar chofer_status en Supabase
  const updateChoferStatus = async (reservationId: string, newStatus: "recibida" | "confirmada") => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ chofer_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reservationId)
      if (!error) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId ? { ...r, choferStatus: newStatus } : r
          )
        )
      } else {
        console.error("Error updating chofer status:", error)
        alert("Error al actualizar estado: " + error.message)
      }
    } catch (e) {
      console.error("Error updating chofer status:", e)
      alert("Error al actualizar estado")
    }
  }

  const markReservationNoShow = async (reservationId: string) => {
    try {
      const { error } = await supabase.rpc("update_reservation_status", {
        p_reservation_id: reservationId,
        p_status: "no_show",
      })

      if (!error) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId ? { ...r, status: "no_show" } : r
          )
        )
      } else {
        console.error("Error setting reservation no_show:", error)
        alert("No se pudo marcar como NO SHOW: " + error.message)
      }
    } catch (e) {
      console.error("Error setting reservation no_show:", e)
      alert("Error al marcar reserva como NO SHOW")
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  // Lista de choferes únicos (para filtro admin)
  const uniqueChoferes = useMemo(
    () => [...new Map(reservations.map((r) => [r.choferId, r.choferName])).entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [reservations]
  )

  const uniqueDates = useMemo(
    () => [...new Set(reservations.map((r) => r.date))].sort(),
    [reservations]
  )

  const filtered = useMemo(() => {
    let list = reservations
    if (selectedDate !== "all") list = list.filter((r) => r.date === selectedDate)
    if (selectedTimeslot !== "all") list = list.filter((r) => r.timeslot === selectedTimeslot)
    if (selectedChofer !== "all") list = list.filter((r) => r.choferId === selectedChofer)
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.pickupTime.localeCompare(b.pickupTime)
    })
  }, [reservations, selectedDate, selectedTimeslot, selectedChofer])

  // Agrupar por chofer para vista admin
  const groupedByChofer = useMemo(() => {
    if (!isAdmin) return null
    const groups: Record<string, { name: string; reservations: ChoferReservation[] }> = {}
    for (const r of filtered) {
      if (!groups[r.choferId]) {
        groups[r.choferId] = { name: r.choferName, reservations: [] }
      }
      groups[r.choferId].reservations.push(r)
    }
    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name))
  }, [filtered, isAdmin])

  const totalGuests = filtered.reduce((sum, r) => sum + r.guests, 0)

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short" })
  }

  return (
    <DashboardLayout>
      <div className={`mx-auto px-3 py-4 space-y-4 ${isAdmin ? "max-w-4xl" : "max-w-2xl"}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Navigation className="h-6 w-6 text-red-600" />
              {isAdmin ? "Recogida para Choferes" : "Mis Recogidas"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? "Todas las reservas enviadas a choferes" : "Reservas confirmadas por operaciones"}
            </p>
          </div>
          <Button variant="outline" size="icon" className="shrink-0" onClick={loadReservations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-11 text-sm flex-1 min-w-[160px]">
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

          {isAdmin && uniqueChoferes.length > 0 && (
            <Select value={selectedChofer} onValueChange={setSelectedChofer}>
              <SelectTrigger className="h-11 text-sm flex-1 min-w-[160px]">
                <Truck className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Chofer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los choferes</SelectItem>
                {uniqueChoferes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

        {/* Reservation cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay recogidas asignadas</p>
            <p className="text-sm mt-1">
              {isAdmin
                ? "Ve a Operation, selecciona una reserva y usa 'Enviar a Chofer' para asignarla."
                : "Cuando operaciones te envíe una reserva, aparecerá aquí. Presiona el botón de refrescar para actualizar."}
            </p>
          </div>
        ) : isAdmin && groupedByChofer ? (
          /* ── Vista Admin: agrupado por chofer ── */
          <div className="space-y-6">
            {groupedByChofer.map(([choferId, group]) => (
              <div key={choferId} className="space-y-3">
                <div className="flex items-center gap-2 sticky top-0 z-10 bg-background py-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-base">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.reservations.length} recogida{group.reservations.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {group.reservations.map((r) => (
                  <ReservationCard
                    key={r.id}
                    r={r}
                    showChoferBadge={false}
                    readOnly={true}
                    onUpdateStatus={updateChoferStatus}
                    onMarkNoShow={markReservationNoShow}
                    mapOpen={mapOpen}
                    setMapOpen={setMapOpen}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* ── Vista Chofer: lista simple ── */
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                r={r}
                showChoferBadge={false}
                readOnly={false}
                onUpdateStatus={updateChoferStatus}
                onMarkNoShow={markReservationNoShow}
                mapOpen={mapOpen}
                setMapOpen={setMapOpen}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

/* ── Componente de tarjeta de reserva ── */
function ReservationCard({
  r,
  showChoferBadge,
  readOnly = false,
  onUpdateStatus,
  onMarkNoShow,
  mapOpen,
  setMapOpen,
  formatDate,
}: {
  r: ChoferReservation
  showChoferBadge: boolean
  readOnly?: boolean
  onUpdateStatus: (id: string, status: "recibida" | "confirmada") => Promise<void>
  onMarkNoShow: (id: string) => Promise<void>
  mapOpen: string | null
  setMapOpen: React.Dispatch<React.SetStateAction<string | null>>
  formatDate: (d: string) => string
}) {
  const [updating, setUpdating] = useState(false)
  const status = r.choferStatus || "none"
  const isNoShow = r.status === "no_show"
  const isMapOpen = mapOpen === r.id
  const hotelInfo = findHotel(r.hotel)
  const searchName = hotelInfo ? hotelInfo.name : r.hotel
  const fullQuery = `${searchName}, ${r.location}, Punta Cana, Dominican Republic`
  const mapQuery = encodeURIComponent(fullQuery)

  return (
    <Card className={`border-l-4 shadow-sm ${
      isNoShow ? "border-l-red-600 bg-red-50/60" :
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

        {/* Row 3: Big badges */}
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
          {isNoShow && (
            <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1.5 bg-red-100 text-red-700">
              <UserX className="h-4 w-4" />
              NO SHOW
            </Badge>
          )}
          {showChoferBadge && r.choferName && (
            <Badge variant="secondary" className="text-sm gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700">
              <Truck className="h-4 w-4" />
              {r.choferName}
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
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapQuery}&zoom=17`}
              allowFullScreen
            />
            <a
              href={hotelInfo ? hotelInfo.mapUrl : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MapPinned className="h-4 w-4 text-red-500" />
              Ver en Google Maps
            </a>
            <a
              href={hotelInfo ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotelInfo.name + ', Punta Cana, Dominican Republic')}` : `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
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

        {/* Row 6: Action buttons (solo para choferes) */}
        {!readOnly && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant={status === "recibida" || status === "confirmada" ? "default" : "outline"}
            disabled={status === "recibida" || status === "confirmada" || updating || isNoShow}
            className={`flex-1 text-xs h-11 gap-1.5 ${
              status === "recibida" || status === "confirmada"
                ? "bg-yellow-500 text-white opacity-100"
                : ""
            }`}
            onClick={async () => { setUpdating(true); await onUpdateStatus(r.id, "recibida"); setUpdating(false) }}
          >
            <PackageCheck className="h-4 w-4" />
            {updating ? "Actualizando..." : "Reserva Recibida"}
          </Button>
          <Button
            size="sm"
            variant={status === "confirmada" ? "default" : "outline"}
            disabled={status !== "recibida" || updating || isNoShow}
            className={`flex-1 text-xs h-11 gap-1.5 ${
              status === "confirmada"
                ? "bg-blue-600 text-white opacity-100"
                : ""
            }`}
            onClick={async () => { setUpdating(true); await onUpdateStatus(r.id, "confirmada"); setUpdating(false) }}
          >
            <UserCheck className="h-4 w-4" />
            {updating ? "Actualizando..." : "Recogida Confirmada"}
          </Button>
          <Button
            size="sm"
            variant={isNoShow ? "default" : "outline"}
            disabled={updating || isNoShow || status === "confirmada"}
            className={`flex-1 text-xs h-11 gap-1.5 ${
              isNoShow ? "bg-red-600 text-white opacity-100" : "border-red-300 text-red-700 hover:bg-red-50"
            }`}
            onClick={async () => {
              const ok = window.confirm("¿Confirmas marcar esta reserva como NO SHOW?")
              if (!ok) return
              setUpdating(true)
              await onMarkNoShow(r.id)
              setUpdating(false)
            }}
          >
            <UserX className="h-4 w-4" />
            {updating ? "Actualizando..." : isNoShow ? "NO SHOW" : "Marcar NO SHOW"}
          </Button>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
