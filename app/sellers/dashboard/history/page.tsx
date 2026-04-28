"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Eye,
  Receipt,
  ArrowLeft,
} from "lucide-react"
import { SellersLayout } from "@/components/sellers/sellers-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import {
  getBookingsByRep,
  getBookingDatesByRep,
  getBookingsByRepAndDate,
  getDailySummary,
  type Booking,
  type Representative,
  type DailySummary,
} from "@/lib/sellers-data"
import { getSellerPortalSession } from "@/lib/sellers-session"

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-DO", {
    month: "short",
    day: "numeric",
  })
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmadas",
  pending: "Pendientes",
  completed: "Completadas",
  cancelled: "Canceladas",
}

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
}

export default function HistoryPage() {
  const router = useRouter()
  const [rep, setRep] = useState<Representative | null>(null)
  const [allDates, setAllDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)

  useEffect(() => {
    getSellerPortalSession().then((session) => {
      if (!session) { router.push("/sellers"); return }
      setRep(session)
      const dates = getBookingDatesByRep(session.id)
      setAllDates(dates)
    })
  }, [router])

  const selectedBookings = useMemo(() => {
    if (!rep || !selectedDate) return []
    return getBookingsByRepAndDate(rep.id, selectedDate)
  }, [rep, selectedDate])

  const selectedSummary = useMemo((): DailySummary | null => {
    if (!rep || !selectedDate) return null
    return getDailySummary(rep.id, selectedDate)
  }, [rep, selectedDate])

  // Build summaries for all dates (for the list view)
  const dateSummaries = useMemo(() => {
    if (!rep) return []
    return allDates.map((date) => {
      const summary = getDailySummary(rep.id, date)
      return { date, summary }
    }).filter((d) => d.summary !== null)
  }, [rep, allDates])

  if (!rep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    )
  }

  // ─── Detail view for a specific date ──────────────────────────────
  if (selectedDate && selectedSummary) {
    return (
      <SellersLayout repName={rep.name} repInitials={rep.initials}>
        <div className="space-y-6">
          {/* Back + Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-title text-gray-900 capitalize">
                {formatDate(selectedDate)}
              </h1>
              <p className="text-gray-500 text-sm">
                Cierre del día &middot; {selectedSummary.totalBookings} reserva{selectedSummary.totalBookings !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedSummary.totalSales.toLocaleString()}
                    </p>
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
                    <p className="text-sm text-gray-500">Cobrado</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedSummary.totalCollected.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pendiente</p>
                    <p className="text-2xl font-bold text-amber-600">
                      ${selectedSummary.totalPending.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comisión ({selectedSummary.commissionPercent}%)</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${selectedSummary.commission.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown + Experience Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Status */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">Por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(selectedSummary.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
                          {statusLabels[status] || status}
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Experience */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900">Por Experiencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(selectedSummary.byExperience).map(([exp, data]) => (
                    <div key={exp} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900">{exp}</p>
                        <p className="text-xs text-gray-500">{data.count} reserva{data.count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-gray-900 font-semibold">${data.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Facturas / Reservas del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Viajero</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead className="text-center">Pax</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-400">
                          Sin reservas para esta fecha
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedBookings.map((b) => (
                        <TableRow key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailBooking(b)}>
                          <TableCell className="font-mono text-xs text-gray-500">{b.id}</TableCell>
                          <TableCell className="font-medium">{b.travelerName}</TableCell>
                          <TableCell className="text-sm">{b.experience}</TableCell>
                          <TableCell className="text-sm text-gray-600">{b.hotel}</TableCell>
                          <TableCell className="text-center">{b.guestCount}</TableCell>
                          <TableCell className="text-right font-medium">${b.salePrice}</TableCell>
                          <TableCell className="text-right text-green-600">${b.amountPaid}</TableCell>
                          <TableCell className="text-right text-amber-600">
                            {b.amountPending > 0 ? `$${b.amountPending}` : "—"}
                          </TableCell>
                          <TableCell>{statusBadge(b.status)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Cierre Summary Footer */}
          <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cierre del Día</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Reservas</p>
                    <p className="font-bold text-gray-900">{selectedSummary.totalBookings}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Personas</p>
                    <p className="font-bold text-gray-900">{selectedSummary.totalGuests}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Venta Total</p>
                    <p className="font-bold text-green-600">${selectedSummary.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Mi Comisión</p>
                    <p className="font-bold text-red-600">${selectedSummary.commission.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Detail Dialog */}
        <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Reserva</DialogTitle>
            </DialogHeader>
            {detailBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">ID</p>
                    <p className="font-mono">{detailBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Estado</p>
                    <div className="mt-1">{statusBadge(detailBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Viajero</p>
                    <p className="font-medium">{detailBooking.travelerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pasajeros</p>
                    <p>{detailBooking.guestCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experiencia</p>
                    <p>{detailBooking.experience}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hotel</p>
                    <p>{detailBooking.hotel}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha</p>
                    <p>{detailBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Recogida</p>
                    <p>{detailBooking.pickupTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Precio</p>
                    <p className="font-medium">${detailBooking.salePrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pagado</p>
                    <p className="text-green-600 font-medium">${detailBooking.amountPaid}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Pendiente</p>
                    <p className={detailBooking.amountPending > 0 ? "text-amber-600 font-medium" : "text-gray-400"}>
                      {detailBooking.amountPending > 0 ? `$${detailBooking.amountPending}` : "Sin saldo"}
                    </p>
                  </div>
                  {detailBooking.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Notas</p>
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-1">{detailBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SellersLayout>
    )
  }

  // ─── List of dates view ───────────────────────────────────────────
  return (
    <SellersLayout repName={rep.name} repInitials={rep.initials}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-title text-gray-900">Historial</h1>
          <p className="text-gray-500 mt-1">
            Consulta las facturas y cierres de días anteriores
          </p>
        </div>

        {/* Date Cards */}
        {dateSummaries.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay historial disponible</p>
                <p className="text-gray-400 text-sm mt-1">Las reservas aparecerán aquí organizadas por fecha</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {dateSummaries.map(({ date, summary }) => (
              <Card
                key={date}
                className="border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedDate(date)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Date */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-14 h-14 bg-red-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-red-600 text-lg font-bold leading-none">
                          {new Date(date + "T12:00:00").getDate()}
                        </span>
                        <span className="text-red-400 text-[10px] uppercase">
                          {new Date(date + "T12:00:00").toLocaleDateString("es-DO", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 font-medium capitalize truncate">
                          {formatDate(date)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {summary!.totalBookings} reserva{summary!.totalBookings !== 1 ? "s" : ""} &middot; {summary!.totalGuests} persona{summary!.totalGuests !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Ventas</p>
                        <p className="text-gray-900 font-semibold">${summary!.totalSales.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Cobrado</p>
                        <p className="text-green-600 font-semibold">${summary!.totalCollected.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Pendiente</p>
                        <p className={summary!.totalPending > 0 ? "text-amber-600 font-semibold" : "text-gray-400 font-semibold"}>
                          {summary!.totalPending > 0 ? `$${summary!.totalPending.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Comisión</p>
                        <p className="text-red-600 font-semibold">${summary!.commission.toLocaleString()}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SellersLayout>
  )
}
