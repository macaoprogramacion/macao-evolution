"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hotel,
  Eye,
} from "lucide-react"
import { SellersLayout } from "@/components/sellers/sellers-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function DashboardPage() {
  const router = useRouter()
  const [rep, setRep] = useState<Representative | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const repId = localStorage.getItem("sellers-rep-id")
    if (!repId) {
      router.push("/sellers")
      return
    }
    const found = getRepById(repId)
    if (!found) {
      router.push("/sellers")
      return
    }
    setRep(found)
    setBookings(getBookingsByRep(repId))
  }, [router])

  const stats = useMemo(() => {
    const total = bookings.length
    const confirmed = bookings.filter((b) => b.status === "confirmed").length
    const pending = bookings.filter((b) => b.status === "pending").length
    const revenue = bookings.reduce((sum, b) => sum + b.salePrice, 0)
    const collected = bookings.reduce((sum, b) => sum + b.amountPaid, 0)
    const pendingAmount = bookings.reduce((sum, b) => sum + b.amountPending, 0)
    const guests = bookings.reduce((sum, b) => sum + b.guestCount, 0)
    return { total, confirmed, pending, revenue, collected, pendingAmount, guests }
  }, [bookings])

  // Show recent bookings (last 5)
  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  }, [bookings])

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
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">¡Hola, {rep.name.split(" ")[0]}!</h1>
            <p className="text-gray-500 mt-1">
              {rep.company} &middot; Comisión: {rep.commissionPercent}%
            </p>
          </div>
          <Link href="/dashboard/new-booking">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Personas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.guests}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Cobrado</p>
                  <p className="text-xl font-bold text-green-700">${stats.collected.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700">Por Cobrar</p>
                  <p className="text-xl font-bold text-amber-700">${stats.pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-700">Tu Comisión ({rep.commissionPercent}%)</p>
                  <p className="text-xl font-bold text-orange-700">
                    ${Math.round(stats.revenue * rep.commissionPercent / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reservas Recientes</CardTitle>
                <CardDescription>Últimas {recentBookings.length} reservas registradas</CardDescription>
              </div>
              <Link href="/dashboard/bookings">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Sin reservas aún</p>
                <p className="text-sm mt-1">Crea tu primera reserva para empezar</p>
                <Link href="/dashboard/new-booking" className="mt-4 inline-block">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva Reserva
                  </Button>
                </Link>
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
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm text-gray-500">{booking.id}</TableCell>
                        <TableCell className="font-medium">{booking.travelerName}</TableCell>
                        <TableCell className="text-sm">{booking.experience}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Hotel className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{booking.hotel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
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
                        <TableCell>{statusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDetailBooking(booking)}
                          >
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
