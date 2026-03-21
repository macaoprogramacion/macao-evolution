"use client"

import { useMemo } from "react"
import {
  Handshake,
  TrendingUp,
  DollarSign,
  Users,
  Hotel,
  Sparkles,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { DashboardLayout } from "@/components/admin/dashboard-layout"

// ─── Mock analytics data ─────────────────────────────────────────
const representatives = [
  {
    id: "REP-001",
    name: "Carlos Méndez",
    company: "Excursiones Punta Cana",
    type: "Tour Operador",
    initials: "CM",
    color: "bg-gray-200 text-gray-900",
    totalBookings: 87,
    totalRevenue: 12480,
    avgTicket: 143,
    conversionRate: 92,
    pendingBalance: 320,
    trend: "up" as const,
    trendPercent: 12,
  },
  {
    id: "REP-002",
    name: "Ana Rodríguez",
    company: "Viajes Dominicanos",
    type: "Agencia",
    initials: "AR",
    color: "bg-green-100 text-green-700",
    totalBookings: 54,
    totalRevenue: 8750,
    avgTicket: 162,
    conversionRate: 88,
    pendingBalance: 0,
    trend: "up" as const,
    trendPercent: 8,
  },
  {
    id: "REP-003",
    name: "Miguel Torres",
    company: "Barceló Concierge",
    type: "Concierge",
    initials: "MT",
    color: "bg-red-100 text-red-700",
    totalBookings: 42,
    totalRevenue: 6320,
    avgTicket: 150,
    conversionRate: 95,
    pendingBalance: 560,
    trend: "up" as const,
    trendPercent: 15,
  },
  {
    id: "REP-004",
    name: "Laura Peña",
    company: "Independiente",
    type: "Vendedor Local",
    initials: "LP",
    color: "bg-red-100 text-red-700",
    totalBookings: 23,
    totalRevenue: 3150,
    avgTicket: 137,
    conversionRate: 78,
    pendingBalance: 180,
    trend: "down" as const,
    trendPercent: 5,
  },
  {
    id: "REP-005",
    name: "Fernando Rosario",
    company: "Dreams Concierge",
    type: "Concierge",
    initials: "FR",
    color: "bg-red-100 text-red-700",
    totalBookings: 15,
    totalRevenue: 2100,
    avgTicket: 140,
    conversionRate: 70,
    pendingBalance: 0,
    trend: "down" as const,
    trendPercent: 20,
  },
]

// Experiences sold by reps
const experiencesByReps = [
  { name: "Elite Couple", bookings: 38, revenue: 6080 },
  { name: "Elite Family", bookings: 27, revenue: 5400 },
  { name: "Apex Predator", bookings: 25, revenue: 3250 },
  { name: "Flintstone Era", bookings: 22, revenue: 1870 },
  { name: "ATV Quad", bookings: 20, revenue: 1800 },
  { name: "Party Boat", bookings: 18, revenue: 2160 },
  { name: "Saona Island", bookings: 16, revenue: 1520 },
  { name: "Predator Family", bookings: 14, revenue: 2030 },
  { name: "Full Ride", bookings: 12, revenue: 900 },
  { name: "The Combined", bookings: 10, revenue: 900 },
  { name: "Flintstone Family", bookings: 9, revenue: 900 },
]

// Hotels where rep bookings come from
const hotelsByReps = [
  { name: "Hard Rock", bookings: 32, revenue: 4800 },
  { name: "Barceló Bávaro", bookings: 28, revenue: 4200 },
  { name: "Dreams Macao", bookings: 18, revenue: 2520 },
  { name: "Iberostar Grand", bookings: 15, revenue: 2250 },
  { name: "Secrets Royal", bookings: 14, revenue: 2100 },
  { name: "Majestic Elegance", bookings: 12, revenue: 1680 },
  { name: "Hyatt Zilara", bookings: 10, revenue: 1500 },
  { name: "Grand Palladium", bookings: 9, revenue: 1260 },
  { name: "Otros", bookings: 23, revenue: 2490 },
]

// Monthly trend
const monthlyTrend = [
  { month: "Sep", bookings: 18, revenue: 2520 },
  { month: "Oct", bookings: 24, revenue: 3480 },
  { month: "Nov", bookings: 31, revenue: 4650 },
  { month: "Dic", bookings: 42, revenue: 6300 },
  { month: "Ene", bookings: 48, revenue: 7200 },
  { month: "Feb", bookings: 58, revenue: 8650 },
]

const COLORS = ["#dc2626", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6b7280"]

export default function RepresentativesAnalyticsPage() {
  const totals = useMemo(() => {
    const totalBookings = representatives.reduce((sum, r) => sum + r.totalBookings, 0)
    const totalRevenue = representatives.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalPending = representatives.reduce((sum, r) => sum + r.pendingBalance, 0)
    const activeReps = representatives.length
    return { totalBookings, totalRevenue, totalPending, activeReps }
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-title text-gray-900">Representantes — Analytics</h1>
          <p className="text-gray-600 mt-1">
            Rendimiento de ventas por representantes. Gestión de reservas en{" "}
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 underline hover:text-red-700"
            >
              Sellers Portal
            </a>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reservas (Reps)</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ingresos por Reps</p>
                  <p className="text-2xl font-bold text-gray-900">${totals.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">${totals.totalPending.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Representantes</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.activeReps}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Tendencia Mensual — Reservas por Reps</CardTitle>
              <CardDescription>Evolución de reservas y ventas de representantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "revenue" ? [`$${value}`, "Ingresos"] : [value, "Reservas"]
                      }
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ fill: "#dc2626", r: 4 }}
                      name="bookings"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      name="revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Experiences Distribution */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Experiencias Más Vendidas por Reps</CardTitle>
              <CardDescription>Distribución de reservas por experiencia (canal reps)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={experiencesByReps.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="bookings"
                      nameKey="name"
                    >
                      {experiencesByReps.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Reservas"]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Reps Ranking & Hotels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Representatives */}
          <Card className="border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-red-500" />
                Ranking de Representantes
              </CardTitle>
              <CardDescription>Ordenado por ingresos generados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Representante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Reservas</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Ticket Prom.</TableHead>
                    <TableHead className="text-right">Conversión</TableHead>
                    <TableHead>Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {representatives.map((rep, index) => (
                    <TableRow key={rep.id}>
                      <TableCell>
                        {index === 0 ? (
                          <span className="text-lg">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-lg">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="text-gray-400 font-mono text-sm">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={`text-xs ${rep.color}`}>
                              {rep.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{rep.name}</p>
                            <p className="text-xs text-gray-500">{rep.company}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {rep.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{rep.totalBookings}</TableCell>
                      <TableCell className="text-right font-medium">${rep.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">${rep.avgTicket}</TableCell>
                      <TableCell className="text-right text-sm">{rep.conversionRate}%</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 text-sm ${rep.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                          {rep.trend === "up" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {rep.trendPercent}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Hotels */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hotel className="w-4 h-4 text-gray-900" />
                Hoteles Top (Reps)
              </CardTitle>
              <CardDescription>Hoteles con más reservas de reps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hotelsByReps.map((hotel, index) => {
                  const maxBookings = hotelsByReps[0].bookings
                  const widthPercent = (hotel.bookings / maxBookings) * 100
                  return (
                    <div key={hotel.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 truncate max-w-[160px]">
                          {index + 1}. {hotel.name}
                        </span>
                        <span className="text-gray-500 whitespace-nowrap ml-2">
                          {hotel.bookings} — ${hotel.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Experiences bar chart */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              Ingresos por Experiencia (Canal Representantes)
            </CardTitle>
            <CardDescription>Comparación de ingresos generados por cada experiencia a través de representantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experiencesByReps} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                  <Tooltip formatter={(value: number) => [`$${value}`, "Ingresos"]} />
                  <Bar dataKey="revenue" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
