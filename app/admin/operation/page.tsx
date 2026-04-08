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
  Plus,
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
import { Label } from "@/components/ui/label"

type Reservation = {
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
  pickupPoint: string
  transportType: string
  experience: string
  channel: string
  channelUrl: string
  channelColor: string
  date: string
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  assignedChoferId: string | null
  assignedChoferName: string | null
  choferStatus: "none" | "recibida" | "confirmada"
}

type Chofer = {
  id: string
  name: string
  phone: string
}

/** Mapear fila de Supabase a formato del componente */
function mapRow(r: any): Reservation {
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
    channelUrl: r.channel_url || "",
    channelColor: r.channel_color || "#6b7280",
    date: r.date,
    status: r.status,
    assignedChoferId: r.assigned_chofer_id,
    assignedChoferName: r.assigned_chofer_name,
    choferStatus: r.chofer_status || "none",
  }
}

export default function OperationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
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

  // Modal agregar reserva
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newRes, setNewRes] = useState({
    customer_name: "",
    phone: "",
    email: "",
    hotel: "",
    location: "",
    timeslot: "8 AM",
    guests: 1,
    children: 0,
    pickup_time: "",
    pickup_point: "lobby",
    transport_type: "included",
    experience: "",
    channel: "phone",
    channel_url: "",
    channel_color: "#6b7280",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  const resetNewRes = () => setNewRes({
    customer_name: "",
    phone: "",
    email: "",
    hotel: "",
    location: "",
    timeslot: "8 AM",
    guests: 1,
    children: 0,
    pickup_time: "",
    pickup_point: "lobby",
    transport_type: "included",
    experience: "",
    channel: "phone",
    channel_url: "",
    channel_color: "#6b7280",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  const channelColors: Record<string, string> = {
    website: "#dc2626",
    whatsapp: "#22c55e",
    phone: "#3b82f6",
    walk_in: "#8b5cf6",
    seller: "#d97706",
    ota: "#ef4444",
  }

  // Guardar nueva reserva
  const saveNewReservation = async () => {
    if (!newRes.customer_name || !newRes.date) return
    setSaving(true)
    try {
      const { error } = await supabase.from("reservations").insert({
        ...newRes,
        channel_color: channelColors[newRes.channel] || "#6b7280",
      })
      if (error) {
        console.error("Error creating reservation:", error)
      } else {
        await fetchReservations()
        setAddDialogOpen(false)
        resetNewRes()
      }
    } catch (e) {
      console.error("Error creating reservation:", e)
    } finally {
      setSaving(false)
    }
  }

  // ── Cargar reservas desde Supabase ──
  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("pickup_time", { ascending: true })
      if (!error && data) {
        setReservations(data.map(mapRow))
      }
    } catch (e) {
      console.error("Error fetching reservations:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
    // Polling cada 5s para ver cambios del chofer
    const interval = setInterval(fetchReservations, 5000)
    return () => clearInterval(interval)
  }, [])

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

    try {
      const { error } = await supabase.rpc("assign_reservation_to_chofer", {
        p_reservation_id: selectedReservation.id,
        p_chofer_id: selectedChofer,
      })
      if (error) {
        console.error("Error assigning chofer:", error)
      } else {
        await fetchReservations()
      }
    } catch (e) {
      console.error("Error assigning chofer:", e)
    }

    setSending(false)
    setSendDialogOpen(false)
    setSelectedReservation(null)
    setSelectedChofer("")
  }

  // Cambiar estado de reserva
  const toggleStatus = async (id: string) => {
    try {
      const { error } = await supabase.rpc("update_reservation_status", {
        p_reservation_id: id,
        p_status: "confirmed",
      })
      if (error) {
        console.error("Error updating status:", error)
      } else {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "confirmed" as const } : r
          )
        )
      }
    } catch (e) {
      console.error("Error updating status:", e)
    }
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
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Reserva
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
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
                        <div className="flex flex-col items-start gap-1.5">
                          {reservation.assignedChoferId ? (
                            <>
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                <Send className="w-3 h-3 mr-1" />
                                Enviada
                              </Badge>
                              {reservation.choferStatus === "confirmada" ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Recogida OK
                                </Badge>
                              ) : reservation.choferStatus === "recibida" ? (
                                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Recibida
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400 border-gray-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Sin respuesta
                                </Badge>
                              )}
                            </>
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

      {/* Modal: Agregar reserva manual */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetNewRes() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Reserva</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva reserva manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del cliente *</Label>
              <Input
                value={newRes.customer_name}
                onChange={(e) => setNewRes({ ...newRes, customer_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={newRes.phone}
                onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                placeholder="+1 809-555-0000"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={newRes.email}
                onChange={(e) => setNewRes({ ...newRes, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            {/* Hotel */}
            <div className="space-y-1.5">
              <Label>Hotel</Label>
              <Input
                value={newRes.hotel}
                onChange={(e) => setNewRes({ ...newRes, hotel: e.target.value })}
                placeholder="Hard Rock Hotel & Casino"
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input
                value={newRes.location}
                onChange={(e) => setNewRes({ ...newRes, location: e.target.value })}
                placeholder="Punta Cana"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={newRes.date}
                onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
              />
            </div>

            {/* Horario */}
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Select value={newRes.timeslot} onValueChange={(v) => setNewRes({ ...newRes, timeslot: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8 AM">8:00 AM</SelectItem>
                  <SelectItem value="11 AM">11:00 AM</SelectItem>
                  <SelectItem value="3 PM">3:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hora de recogida */}
            <div className="space-y-1.5">
              <Label>Hora de recogida</Label>
              <Input
                value={newRes.pickup_time}
                onChange={(e) => setNewRes({ ...newRes, pickup_time: e.target.value })}
                placeholder="7:30 AM"
              />
            </div>

            {/* Punto de recogida */}
            <div className="space-y-1.5">
              <Label>Punto de recogida</Label>
              <Select value={newRes.pickup_point} onValueChange={(v) => setNewRes({ ...newRes, pickup_point: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lobby">Lobby</SelectItem>
                  <SelectItem value="barrera">Barrera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personas */}
            <div className="space-y-1.5">
              <Label>Adultos</Label>
              <Input
                type="number"
                min={1}
                value={newRes.guests}
                onChange={(e) => setNewRes({ ...newRes, guests: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Niños */}
            <div className="space-y-1.5">
              <Label>Niños</Label>
              <Input
                type="number"
                min={0}
                value={newRes.children}
                onChange={(e) => setNewRes({ ...newRes, children: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Transporte */}
            <div className="space-y-1.5">
              <Label>Transporte</Label>
              <Select value={newRes.transport_type} onValueChange={(v) => setNewRes({ ...newRes, transport_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="included">Incluido</SelectItem>
                  <SelectItem value="self">Propio</SelectItem>
                  <SelectItem value="hotel_shuttle">Shuttle Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experiencia */}
            <div className="space-y-1.5">
              <Label>Experiencia</Label>
              <Input
                value={newRes.experience}
                onChange={(e) => setNewRes({ ...newRes, experience: e.target.value })}
                placeholder="Elite Couple, Apex Predator..."
              />
            </div>

            {/* Canal */}
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={newRes.channel} onValueChange={(v) => setNewRes({ ...newRes, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="seller">Representante</SelectItem>
                  <SelectItem value="ota">OTA (Viator, GYG...)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL / Referencia del canal */}
            <div className="space-y-1.5">
              <Label>Referencia del canal</Label>
              <Input
                value={newRes.channel_url}
                onChange={(e) => setNewRes({ ...newRes, channel_url: e.target.value })}
                placeholder="viator.com, nombre del rep..."
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notas</Label>
              <Input
                value={newRes.notes}
                onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
                placeholder="Información adicional..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetNewRes() }} disabled={saving}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={saveNewReservation}
              disabled={!newRes.customer_name || !newRes.date || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
