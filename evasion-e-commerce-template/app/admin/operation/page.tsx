"use client"

import { useState } from "react"
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
import { DashboardLayout } from "@/components/admin/dashboard-layout"

// Data de reservas
const reservations = [
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
    channelColor: "#f97316",
    date: "2026-02-15",
    status: "confirmed",
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
    status: "confirmed",
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
    status: "confirmed",
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
    status: "pending",
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
    status: "confirmed",
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
    channelColor: "#f97316",
    date: "2026-02-16",
    status: "confirmed",
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
    status: "confirmed",
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
    status: "pending",
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
    status: "confirmed",
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
    status: "pending",
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
    status: "pending",
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
    status: "pending",
  },
]

export default function OperationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [timeslotFilter, setTimeslotFilter] = useState("all")
  const [transportFilter, setTransportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Confirmada</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendiente</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operation</h1>
            <p className="text-gray-600 mt-1">Gestión de reservas de todas las plataformas</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reservas
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
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
                        <div className="flex items-center gap-2">{getStatusBadge(reservation.status)}</div>
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
    </DashboardLayout>
  )
}
