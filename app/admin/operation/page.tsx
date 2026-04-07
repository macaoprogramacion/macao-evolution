"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Download,
  MapPin,
  Hotel,
  Clock,
  Users,
  Car,
  Phone,
  Mail,
  Globe,
  Calendar,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { supabase } from "@/lib/supabase"

// Data de reservas (mock — todas inician como pendientes)
const initialReservations = [
  {
    id: "RES-001",
    customerName: "John Smith",
    phone: "+1 809-555-0123",
    email: "john.smith@email.com",
    hotel: "Hard Rock Hotel & Casino",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    pickupTime: "7:30 AM",
    transportType: "Privado",
    experience: "Elite Couple",
    channel: "Macao Off Road",
    channelUrl: "macaooffroad.com",
    channelColor: "#dc2626",
    date: "2026-02-15",
    status: "pending" as const,
  },
  {
    id: "RES-002",
    customerName: "María García",
    phone: "+1 829-555-0456",
    email: "maria.garcia@email.com",
    hotel: "Barceló Bávaro Palace",
    location: "Bávaro",
    timeslot: "11 AM",
    guests: 4,
    pickupTime: "10:15 AM",
    transportType: "Colectivo",
    experience: "Elite Family",
    channel: "Viator",
    channelUrl: "viator.com",
    channelColor: "#ef4444",
    date: "2026-02-15",
    status: "pending" as const,
  },
  {
    id: "RES-003",
    customerName: "Robert Johnson",
    phone: "+1 849-555-0789",
    email: "r.johnson@email.com",
    hotel: "Dreams Macao Beach",
    location: "Macao",
    timeslot: "3 PM",
    guests: 2,
    pickupTime: "2:30 PM",
    transportType: "Privado",
    experience: "Apex Predator",
    channel: "Caribe Buggy",
    channelUrl: "caribebuggy.com",
    channelColor: "#3b82f6",
    date: "2026-02-15",
    status: "pending" as const,
  },
  {
    id: "RES-004",
    customerName: "Sophie Laurent",
    phone: "+33 6-55-55-01-23",
    email: "sophie.laurent@email.fr",
    hotel: "Royalton Punta Cana",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 3,
    pickupTime: "7:45 AM",
    transportType: "Colectivo",
    experience: "Flintstone Era",
    channel: "GetYourGuide",
    channelUrl: "getyourguide.com",
    channelColor: "#8b5cf6",
    date: "2026-02-16",
    status: "pending" as const,
  },
  {
    id: "RES-005",
    customerName: "Carlos Rodríguez",
    phone: "+1 809-555-3456",
    email: "carlos.r@email.com",
    hotel: "Secrets Cap Cana",
    location: "Cap Cana",
    timeslot: "11 AM",
    guests: 2,
    pickupTime: "10:30 AM",
    transportType: "Privado",
    experience: "ATV QUAD",
    channel: "Saona Island",
    channelUrl: "saonaislandpuntacana.com",
    channelColor: "#10b981",
    date: "2026-02-16",
    status: "pending" as const,
  },
  {
    id: "RES-006",
    customerName: "Anna Müller",
    phone: "+49 151-555-7890",
    email: "anna.mueller@email.de",
    hotel: "Majestic Elegance",
    location: "Punta Cana",
    timeslot: "3 PM",
    guests: 5,
    pickupTime: "2:15 PM",
    transportType: "Privado",
    experience: "Predator Family",
    channel: "Macao Off Road",
    channelUrl: "macaooffroad.com",
    channelColor: "#dc2626",
    date: "2026-02-16",
    status: "pending" as const,
  },
  {
    id: "RES-007",
    customerName: "James Wilson",
    phone: "+1 829-555-9012",
    email: "j.wilson@email.com",
    hotel: "Excellence Punta Cana",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    pickupTime: "7:30 AM",
    transportType: "Colectivo",
    experience: "THE COMBINED",
    channel: "Viator",
    channelUrl: "viator.com",
    channelColor: "#ef4444",
    date: "2026-02-17",
    status: "pending" as const,
  },
  {
    id: "RES-008",
    customerName: "Isabella Costa",
    phone: "+55 11-555-3456",
    email: "isabella.costa@email.com.br",
    hotel: "Paradisus Palma Real",
    location: "Bávaro",
    timeslot: "11 AM",
    guests: 4,
    pickupTime: "10:00 AM",
    transportType: "Privado",
    experience: "Flintstone Family",
    channel: "Caribe Buggy",
    channelUrl: "caribebuggy.com",
    channelColor: "#3b82f6",
    date: "2026-02-17",
    status: "pending" as const,
  },
  // ── Reservas de Representantes (Sellers Portal) ──────────────────
  {
    id: "REP-BK-001",
    customerName: "James Wilson",
    phone: "—",
    email: "—",
    hotel: "Hard Rock Hotel & Casino",
    location: "Punta Cana",
    timeslot: "8 AM",
    guests: 2,
    pickupTime: "7:30 AM",
    transportType: "Privado",
    experience: "Elite Couple Experience",
    channel: "Representante",
    channelUrl: "Carlos Méndez — Excursiones PC",
    channelColor: "#d97706",
    date: "2026-02-15",
    status: "pending" as const,
  },
  {
    id: "REP-BK-002",
    customerName: "Sophie Lambert",
    phone: "—",
    email: "—",
    hotel: "Barceló Bávaro Palace",
    location: "Bávaro",
    timeslot: "11 AM",
    guests: 4,
    pickupTime: "10:00 AM",
    transportType: "Colectivo",
    experience: "Elite Family Experience",
    channel: "Representante",
    channelUrl: "Miguel Torres — Barceló Concierge",
    channelColor: "#d97706",
    date: "2026-02-15",
    status: "pending" as const,
  },
  {
    id: "REP-BK-003",
    customerName: "Emily Chen",
    phone: "—",
    email: "—",
    hotel: "Majestic Elegance",
    location: "Punta Cana",
    timeslot: "11 AM",
    guests: 6,
    pickupTime: "10:30 AM",
    transportType: "Privado",
    experience: "The Flintstone Family",
    channel: "Representante",
    channelUrl: "Laura Peña — Independiente",
    channelColor: "#d97706",
    date: "2026-02-16",
    status: "pending" as const,
  },
  {
    id: "REP-BK-004",
    customerName: "David & Sarah Brown",
    phone: "—",
    email: "—",
    hotel: "Secrets Royal Beach",
    location: "Punta Cana",
    timeslot: "11 AM",
    guests: 5,
    pickupTime: "9:30 AM",
    transportType: "Colectivo",
    experience: "Party Boat Experience",
    channel: "Representante",
    channelUrl: "Ana Rodríguez — Viajes Dominicanos",
    channelColor: "#d97706",
    date: "2026-02-17",
    status: "pending" as const,
  },
]

type Reservation = typeof initialReservations[number] & {
  assignedChofer?: string
}

type Chofer = {
  id: string
  name: string
  phone: string
}

export default function OperationPage() {
  const [reservations, setReservations] = useState<Reservation[]>(
    initialReservations.map((r) => ({ ...r }))
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [timeslotFilter, setTimeslotFilter] = useState("all")
  const [transportFilter, setTransportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal enviar a chofer
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedChofer, setSelectedChofer] = useState<string>("")
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loadingChoferes, setLoadingChoferes] = useState(false)
  const [sending, setSending] = useState(false)

  // Cargar choferes desde Supabase
  const fetchChoferes = async () => {
    setLoadingChoferes(true)
    try {
      const { data, error } = await supabase
        .from("dashboard_users")
        .select("id, name, phone")
        .eq("role", "chofer")
        .eq("active", true)
      if (!error && data) {
        setChoferes(data)
      }
    } catch (e) {
      console.error("Error fetching choferes:", e)
    } finally {
      setLoadingChoferes(false)
    }
  }

  // Abrir modal de enviar a chofer
  const openSendDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setSelectedChofer("")
    setSendDialogOpen(true)
    fetchChoferes()
  }

  // Confirmar envío a chofer
  const confirmSendToChofer = async () => {
    if (!selectedReservation || !selectedChofer) return
    setSending(true)
    // Simular envío (cuando haya backend real, aquí va el update en Supabase)
    await new Promise((r) => setTimeout(r, 600))
    setReservations((prev) =>
      prev.map((r) =>
        r.id === selectedReservation.id
          ? { ...r, assignedChofer: selectedChofer }
          : r
      )
    )
    setSending(false)
    setSendDialogOpen(false)
    setSelectedReservation(null)
    setSelectedChofer("")
  }

  // Cambiar estado de reserva
  const toggleStatus = (id: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "pending" ? "confirmed" : r.status }
          : r
      )
    )
  }

  // Filtrar reservas
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.phone.includes(searchQuery) ||
      reservation.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesChannel = channelFilter === "all" || reservation.channel === channelFilter
    const matchesTimeslot = timeslotFilter === "all" || reservation.timeslot === timeslotFilter
    const matchesTransport = transportFilter === "all" || reservation.transportType === transportFilter
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    return matchesSearch && matchesChannel && matchesTimeslot && matchesTransport && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusButton = (reservation: Reservation) => {
    if (reservation.status === "confirmed") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 cursor-default">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmada
        </Badge>
      )
    }
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-green-100 hover:text-green-700 hover:border-green-300"
        onClick={() => toggleStatus(reservation.id)}
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        Pendiente
      </Button>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-title text-gray-900">Operation</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Gestión de reservas de todas las plataformas</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reservas
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Personas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  <SelectItem value="Macao Off Road">Macao Off Road</SelectItem>
                  <SelectItem value="Caribe Buggy">Caribe Buggy</SelectItem>
                  <SelectItem value="Saona Island">Saona Island</SelectItem>
                  <SelectItem value="Viator">Viator</SelectItem>
                  <SelectItem value="GetYourGuide">GetYourGuide</SelectItem>
                  <SelectItem value="Representante">Representante</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeslotFilter} onValueChange={setTimeslotFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los horarios</SelectItem>
                  <SelectItem value="8 AM">8:00 AM</SelectItem>
                  <SelectItem value="11 AM">11:00 AM</SelectItem>
                  <SelectItem value="3 PM">3:00 PM</SelectItem>
                </SelectContent>
              </Select>

              <Select value={transportFilter} onValueChange={setTransportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Privado">Privado</SelectItem>
                  <SelectItem value="Colectivo">Colectivo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>
                  Mostrando {filteredReservations.length} de {reservations.length} reservas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Más filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Hotel / Ubicación</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Recogida</TableHead>
                    <TableHead>Personas</TableHead>
                    <TableHead>Transporte</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono text-sm">{reservation.id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{reservation.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {reservation.phone}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {reservation.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                            <Hotel className="w-3 h-3" />
                            {reservation.hotel}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {reservation.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="w-3 h-3" />
                          {new Date(reservation.date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {reservation.timeslot}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Clock className="w-3 h-3" />
                          {reservation.pickupTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Users className="w-3 h-3" />
                          {reservation.guests}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            reservation.transportType === "Privado"
                              ? "bg-gray-200 text-gray-900 hover:bg-gray-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          <Car className="w-3 h-3 mr-1" />
                          {reservation.transportType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{reservation.experience}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            className="flex items-center gap-1 w-fit"
                            style={{
                              backgroundColor: `${reservation.channelColor}20`,
                              color: reservation.channelColor,
                            }}
                          >
                            <Globe className="w-3 h-3" />
                            {reservation.channel}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ExternalLink className="w-2 h-2" />
                            {reservation.channelUrl}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">{getStatusButton(reservation)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reservation.assignedChofer ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              <Send className="w-3 h-3 mr-1" />
                              Enviada
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => openSendDialog(reservation)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Enviar a Chofer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron reservas con los filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Enviar reserva a chofer */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reserva a Chofer</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de enviar esta reserva? Selecciona el chofer al que deseas asignarla.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="rounded-lg border p-3 bg-gray-50 space-y-1 text-sm">
              <p className="font-medium text-gray-900">{selectedReservation.customerName}</p>
              <p className="text-gray-600">{selectedReservation.hotel} — {selectedReservation.location}</p>
              <p className="text-gray-600">{selectedReservation.date} · {selectedReservation.timeslot} · Recogida {selectedReservation.pickupTime}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Seleccionar Chofer</label>
            {loadingChoferes ? (
              <div className="flex items-center gap-2 py-4 justify-center text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando choferes...
              </div>
            ) : choferes.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No hay choferes registrados. Agrega choferes desde el panel de usuarios.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {choferes.map((chofer) => (
                  <button
                    key={chofer.id}
                    onClick={() => setSelectedChofer(chofer.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedChofer === chofer.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedChofer === chofer.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {chofer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{chofer.name}</p>
                      {chofer.phone && (
                        <p className="text-xs text-gray-500">{chofer.phone}</p>
                      )}
                    </div>
                    {selectedChofer === chofer.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={confirmSendToChofer}
              disabled={!selectedChofer || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Envío
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
