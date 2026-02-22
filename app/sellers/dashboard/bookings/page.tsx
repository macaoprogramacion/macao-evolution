"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hotel,
  Eye,
  Calendar,
  Clock,
  Filter,
} from "lucide-react"
import { SellersLayout } from "@/components/sellers/sellers-layout"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { getRepById, getBookingsByRep, type Booking, type Representative } from "@/lib/sellers-data"

function statusBadge(status: Booking["status"]) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmada</Badge>
    case "pending":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
    case "completed":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><CheckCircle2 className="w-3 h-3 mr-1" />Completada</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>
  }
}

export default function BookingsPage() {
  const router = useRouter()
  const [rep, setRep] = useState<Representative | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const repId = localStorage.getItem("sellers-rep-id")
    if (!repId) { router.push("/sellers"); return }
    const found = getRepById(repId)
    if (!found) { router.push("/sellers"); return }
    setRep(found)
    setBookings(getBookingsByRep(repId))
  }, [router])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.travelerName.toLowerCase().includes(search.toLowerCase()) ||
        b.hotel.toLowerCase().includes(search.toLowerCase()) ||
        b.experience.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || b.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, search, statusFilter])

  if (!rep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <SellersLayout repName={rep.name} repInitials={rep.initials}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
            <p className="text-gray-500 mt-1">Todas tus reservas registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Link href="/dashboard/new-booking">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reserva
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por viajero, hotel, experiencia, ID..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Reservas</CardTitle>
            <CardDescription>
              Mostrando {filteredBookings.length} de {bookings.length} reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">No se encontraron reservas</p>
                <p className="text-sm mt-1">Intenta con otros filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Viajero</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Recogida</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Pendiente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm text-gray-500">{booking.id}</TableCell>
                        <TableCell className="font-medium">{booking.travelerName}</TableCell>
                        <TableCell className="text-sm">{booking.experience}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Hotel className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[140px]">{booking.hotel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(booking.date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {booking.pickupTime}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{booking.guestCount}</TableCell>
                        <TableCell className="font-medium">${booking.salePrice}</TableCell>
                        <TableCell className="text-green-600 font-medium">${booking.amountPaid}</TableCell>
                        <TableCell className={booking.amountPending > 0 ? "text-amber-600 font-medium" : "text-green-600"}>
                          ${booking.amountPending}
                        </TableCell>
                        <TableCell>{statusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailBooking(booking)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
            <DialogDescription>{detailBooking?.id}</DialogDescription>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Viajero</p>
                  <p className="font-medium">{detailBooking.travelerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Personas</p>
                  <p className="font-medium">{detailBooking.guestCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Experiencia</p>
                  <p className="font-medium">{detailBooking.experience}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hotel</p>
                  <p className="font-medium">{detailBooking.hotel}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {new Date(detailBooking.date).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Recogida</p>
                  <p className="font-medium">{detailBooking.pickupTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Precio Venta</p>
                  <p className="font-medium text-green-700">${detailBooking.salePrice}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pagado / Pendiente</p>
                  <p className="font-medium">
                    <span className="text-green-700">${detailBooking.amountPaid}</span>
                    {detailBooking.amountPending > 0 && (
                      <span className="text-amber-600"> / ${detailBooking.amountPending}</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Estado</p>
                <div className="mt-1">{statusBadge(detailBooking.status)}</div>
              </div>
              {detailBooking.notes && (
                <div>
                  <p className="text-gray-500 text-sm">Notas</p>
                  <p className="text-sm mt-1 bg-gray-50 rounded-md p-3">{detailBooking.notes}</p>
                </div>
              )}
              <div className="text-xs text-gray-400">
                Creada: {detailBooking.createdAt}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SellersLayout>
  )
}
