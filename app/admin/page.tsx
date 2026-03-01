"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Smartphone,
  Calendar,
  Mail,
  Phone,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle,
  Globe,
  ExternalLink,
} from "lucide-react"
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Tours data
const tours = [
  { name: "Elite Couple Experience", price: 160, discount: null },
  { name: "Elite Family Experience", price: 200, discount: null },
  { name: "Apex Predator", price: 130, discount: null },
  { name: "Predator Family Experience", price: 145, discount: null },
  { name: "Flintstone Era", price: 100, discount: 85 },
  { name: "The Flintstone Family", price: 125, discount: 100 },
  { name: "ATV QUAD EXPERIENCE", price: 110, discount: 90 },
  { name: "THE COMBINED", price: 110, discount: 90 },
]

// Sample metrics data
const metricsData = [
  { label: "Ventas Totales", value: "$12,845", change: "+23.5%", trend: "up", icon: DollarSign },
  { label: "Nuevos Clientes", value: "89", change: "+12.3%", trend: "up", icon: Users },
  { label: "Tráfico Web", value: "2,847", change: "+8.7%", trend: "up", icon: Eye },
  { label: "Dispositivos Activos", value: "34", change: "-5.2%", trend: "down", icon: Smartphone },
]

// Sales data for charts (daily, weekly, monthly)
const salesDataDaily = [
  { name: "Lun", ventas: 420, visitas: 890 },
  { name: "Mar", ventas: 680, visitas: 1240 },
  { name: "Mié", ventas: 890, visitas: 1580 },
  { name: "Jue", ventas: 540, visitas: 920 },
  { name: "Vie", ventas: 1200, visitas: 2100 },
  { name: "Sáb", ventas: 1850, visitas: 3200 },
  { name: "Dom", ventas: 1640, visitas: 2890 },
]

const salesDataWeekly = [
  { name: "Sem 1", ventas: 3200, visitas: 8400 },
  { name: "Sem 2", ventas: 4100, visitas: 9800 },
  { name: "Sem 3", ventas: 3800, visitas: 8900 },
  { name: "Sem 4", ventas: 5200, visitas: 11200 },
]

const salesDataMonthly = [
  { name: "Ago", ventas: 12400, visitas: 28900 },
  { name: "Sep", ventas: 15800, visitas: 32400 },
  { name: "Oct", ventas: 18200, visitas: 38900 },
  { name: "Nov", ventas: 16500, visitas: 35200 },
  { name: "Dic", ventas: 21300, visitas: 42100 },
  { name: "Ene", ventas: 19800, visitas: 39800 },
]

// Top selling products
const topProducts = [
  { name: "Elite Family Experience", sold: 45, revenue: 9000, percentage: 28 },
  { name: "THE COMBINED", sold: 38, revenue: 3420, percentage: 22 },
  { name: "Flintstone Era", sold: 32, revenue: 2720, percentage: 18 },
  { name: "Apex Predator", sold: 28, revenue: 3640, percentage: 16 },
  { name: "ATV QUAD EXPERIENCE", sold: 24, revenue: 2160, percentage: 14 },
]

const COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2']

// New users data
const newUsers = [
  { name: "Carlos Méndez", email: "carlos.mendez@email.com", phone: "+1 (809) 555-0123", date: "Hace 5 min", tours: 2 },
  { name: "María García", email: "maria.garcia@email.com", phone: "+1 (809) 555-0456", date: "Hace 15 min", tours: 1 },
  { name: "Juan Pérez", email: "juan.perez@email.com", phone: "+1 (809) 555-0789", date: "Hace 32 min", tours: 3 },
  { name: "Ana Rodríguez", email: "ana.rodriguez@email.com", phone: "+1 (809) 555-0147", date: "Hace 1 hora", tours: 1 },
  { name: "Luis Fernández", email: "luis.fernandez@email.com", phone: "+1 (809) 555-0258", date: "Hace 2 horas", tours: 2 },
  { name: "Sofia Martínez", email: "sofia.martinez@email.com", phone: "+1 (809) 555-0369", date: "Hace 3 horas", tours: 1 },
]

// Canales de venta
const salesChannels = [
  { name: "Macao Off Road", url: "macaooffroad.com", sales: 145, revenue: 18920, color: "#dc2626" },
  { name: "Caribe Buggy", url: "caribebuggy.com", sales: 98, revenue: 12740, color: "#ef4444" },
  { name: "Saona Island", url: "saonaislandpuntacana.com", sales: 76, revenue: 9880, color: "#f87171" },
  { name: "Viator", url: "viator.com", sales: 124, revenue: 16120, color: "#fca5a5" },
  { name: "GetYourGuide", url: "getyourguide.com", sales: 89, revenue: 11580, color: "#fee2e2" },
]

// Recent sales
const recentSales = [
  { id: "ORD-1234", customer: "Carlos Méndez", tour: "Elite Family Experience", amount: "$200", status: "completed", time: "Hace 5 min", channel: "Macao Off Road" },
  { id: "ORD-1233", customer: "María García", tour: "Flintstone Era", amount: "$85", status: "completed", time: "Hace 15 min", channel: "Viator" },
  { id: "ORD-1232", customer: "Juan Pérez", tour: "THE COMBINED", amount: "$90", status: "pending", time: "Hace 30 min", channel: "GetYourGuide" },
  { id: "ORD-1231", customer: "Ana Rodríguez", tour: "Apex Predator", amount: "$130", status: "completed", time: "Hace 1 hora", channel: "Caribe Buggy" },
  { id: "ORD-1230", customer: "Luis Fernández", tour: "Elite Couple Experience", amount: "$160", status: "completed", time: "Hace 2 horas", channel: "Saona Island" },
  { id: "ORD-1229", customer: "Emma Wilson", tour: "Apex Predator", amount: "$130", status: "completed", time: "Hace 3 horas", channel: "Viator" },
  { id: "ORD-1228", customer: "Robert Johnson", tour: "ATV QUAD EXPERIENCE", amount: "$90", status: "completed", time: "Hace 4 horas", channel: "GetYourGuide" },
]

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const getSalesData = () => {
    switch (selectedPeriod) {
      case "daily":
        return salesDataDaily
      case "weekly":
        return salesDataWeekly
      case "monthly":
        return salesDataMonthly
      default:
        return salesDataDaily
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-title text-gray-900">MACAO Dashboard</h1>
            <p className="text-gray-600 mt-1">Panel de control de ventas y gestión de experiencias</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "daily" | "weekly" | "monthly")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Diario</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensual</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="bg-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsData.map((metric, index) => (
          <Card key={index} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-red-600" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="col-span-2 space-y-8">
          {/* Sales Chart */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Análisis de Ventas y Tráfico</CardTitle>
                  <CardDescription>Tendencias de ventas y visitantes del sitio web</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSalesData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitas"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales Table */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Ventas Recientes</CardTitle>
                  <CardDescription>Últimas transacciones y reservas de tours</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">ID Orden</TableHead>
                    <TableHead className="font-medium text-gray-700">Cliente</TableHead>
                    <TableHead className="font-medium text-gray-700">Tour</TableHead>
                    <TableHead className="font-medium text-gray-700">Canal</TableHead>
                    <TableHead className="font-medium text-gray-700">Monto</TableHead>
                    <TableHead className="font-medium text-gray-700">Estado</TableHead>
                    <TableHead className="font-medium text-gray-700">Hora</TableHead>
                    <TableHead className="font-medium text-gray-700 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                      <TableCell className="font-medium">{sale.customer}</TableCell>
                      <TableCell className="text-gray-600">{sale.tour}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <Globe className="w-3 h-3 mr-1" />
                          {sale.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">{sale.amount}</TableCell>
                      <TableCell>
                        {sale.status === "completed" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completado
                          </Badge>
                        )}
                        {sale.status === "pending" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">{sale.time}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Confirmación</DropdownMenuItem>
                            <DropdownMenuItem>Imprimir</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* New Users Table */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Nuevos Clientes</CardTitle>
                  <CardDescription>Usuarios registrados recientemente</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Lista
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">Cliente</TableHead>
                    <TableHead className="font-medium text-gray-700">Email</TableHead>
                    <TableHead className="font-medium text-gray-700">Teléfono</TableHead>
                    <TableHead className="font-medium text-gray-700">Tours</TableHead>
                    <TableHead className="font-medium text-gray-700">Registro</TableHead>
                    <TableHead className="font-medium text-gray-700 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newUsers.map((user, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-red-100">
                            <AvatarFallback className="text-red-600">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {user.tours} {user.tours === 1 ? "tour" : "tours"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.date}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Email</DropdownMenuItem>
                            <DropdownMenuItem>Llamar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Products */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Tours Más Vendidos</CardTitle>
              <CardDescription>Experiencias más populares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <span className="text-sm font-semibold text-red-600">{product.sold} vendidos</span>
                    </div>
                    <Progress value={product.percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{product.percentage}% del total</span>
                      <span>${product.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Distribution Chart */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Distribución de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-gray-600">{product.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tours Catalog */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Catálogo de Tours</CardTitle>
              <CardDescription>Todos nuestros tours disponibles</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {tours.map((tour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{tour.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {tour.discount ? (
                          <div className="flex items-center gap-2">
                            <span className="line-through">${tour.price}</span>
                            <span className="text-green-600 font-semibold">${tour.discount}</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              {Math.round(((tour.price - tour.discount) / tour.price) * 100)}% OFF
                            </Badge>
                          </div>
                        ) : (
                          <span className="font-semibold text-red-600">${tour.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Stats */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Estadísticas en Vivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Visitantes Hoy</div>
                      <div className="text-xl font-semibold text-gray-900">2,847</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Dispositivos Activos</div>
                      <div className="text-xl font-semibold text-gray-900">34</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ventas Hoy</div>
                      <div className="text-xl font-semibold text-gray-900">$1,840</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Channels */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Canales de Venta</CardTitle>
              <CardDescription>Reservas por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesChannels.map((channel, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" style={{ color: channel.color }} />
                        <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">{channel.sales}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(channel.sales / 532) * 100}%`,
                          backgroundColor: channel.color,
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{channel.url}</span>
                      <span>${channel.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sales Channels Performance Section */}
      <div className="mt-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Rendimiento por Canal</CardTitle>
                <CardDescription>Comparativa de ventas por plataforma</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChannels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="sales" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Photography Sales Section */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-title text-gray-900">Fotografia — Ventas en Tienda</h2>
            <p className="text-gray-500 text-sm">Resumen de facturación presencial y ventas de fotos en línea</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { label: "Ventas Hoy (Fotos)", value: "$1,240", change: "+18.2%", trend: "up" },
            { label: "Facturas Generadas", value: "32", change: "+9.1%", trend: "up" },
            { label: "Ventas Online (Fotos)", value: "$680", change: "+25.4%", trend: "up" },
            { label: "Devoluciones", value: "2", change: "-3.1%", trend: "down" },
          ].map((m, i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                <span className={`text-xs font-medium ${m.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                  {m.change}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Sales by Turno */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ventas por Turno</CardTitle>
              <CardDescription>Distribución de ventas de fotografía por turno</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { turno: "Primer Turno (06:00 – 14:00)", amount: 4800, sales: 12, pct: 35 },
                  { turno: "Segundo Turno (14:00 – 22:00)", amount: 8200, sales: 22, pct: 55 },
                  { turno: "Tercer Turno (22:00 – 06:00)", amount: 1400, sales: 4, pct: 10 },
                ].map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t.turno}</span>
                      <span className="text-sm font-semibold text-gray-900">${t.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={t.pct} className="flex-1" />
                      <span className="text-xs text-gray-500 w-16 text-right">{t.sales} ventas</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Photo Invoices */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Facturas Recientes (Fotografía)</CardTitle>
              <CardDescription>Últimas facturas generadas en caja</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Factura</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Turno</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { num: "FAC-0032", client: "María García", turno: "1er Turno", total: "$70.00" },
                    { num: "FAC-0031", client: "Carlos Méndez", turno: "2do Turno", total: "$50.00" },
                    { num: "FAC-0030", client: "Ana Rodríguez", turno: "2do Turno", total: "$30.00" },
                    { num: "FAC-0029", client: "Juan Pérez", turno: "1er Turno", total: "$70.00" },
                    { num: "FAC-0028", client: "Luis Fernández", turno: "3er Turno", total: "$50.00" },
                  ].map((inv, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{inv.num}</TableCell>
                      <TableCell className="text-xs">{inv.client}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px]">{inv.turno}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">{inv.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
