"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Eye, Calendar, Download, MapPin, Clock } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/admin/dashboard-layout"

// Datos de rendimiento por periodo
const dailyData = [
  { name: "Lun", ventas: 420, visitas: 890, conversiones: 12, ingresos: 1260 },
  { name: "Mar", ventas: 680, visitas: 1240, conversiones: 18, ingresos: 2040 },
  { name: "Mié", ventas: 890, visitas: 1580, conversiones: 22, ingresos: 2670 },
  { name: "Jue", ventas: 540, visitas: 920, conversiones: 14, ingresos: 1620 },
  { name: "Vie", ventas: 1200, visitas: 2100, conversiones: 28, ingresos: 3360 },
  { name: "Sáb", ventas: 1850, visitas: 3200, conversiones: 42, ingresos: 5550 },
  { name: "Dom", ventas: 1640, visitas: 2890, conversiones: 38, ingresos: 4920 },
]

const weeklyData = [
  { name: "Sem 1", ventas: 3200, visitas: 8400, conversiones: 98, ingresos: 9600 },
  { name: "Sem 2", ventas: 4100, visitas: 9800, conversiones: 124, ingresos: 12300 },
  { name: "Sem 3", ventas: 3800, visitas: 8900, conversiones: 115, ingresos: 11400 },
  { name: "Sem 4", ventas: 5200, visitas: 11200, conversiones: 156, ingresos: 15600 },
]

const monthlyData = [
  { name: "Ago", ventas: 12400, visitas: 28900, conversiones: 372, ingresos: 37200 },
  { name: "Sep", ventas: 15800, visitas: 32400, conversiones: 474, ingresos: 47400 },
  { name: "Oct", ventas: 18200, visitas: 38900, conversiones: 546, ingresos: 54600 },
  { name: "Nov", ventas: 16500, visitas: 35200, conversiones: 495, ingresos: 49500 },
  { name: "Dic", ventas: 21300, visitas: 42100, conversiones: 639, ingresos: 63900 },
  { name: "Ene", ventas: 19800, visitas: 39800, conversiones: 594, ingresos: 59400 },
]

// Distribución de tours por categoría
const tourDistribution = [
  { name: "Elite Tours", value: 35, color: "#dc2626" },
  { name: "Predator Tours", value: 28, color: "#ef4444" },
  { name: "Flintstone Tours", value: 22, color: "#f87171" },
  { name: "ATV Tours", value: 15, color: "#fca5a5" },
]

// Análisis de fuentes de tráfico
const trafficSources = [
  { name: "Google", visitors: 1245, percentage: 42, conversiones: 87 },
  { name: "Redes Sociales", visitors: 892, percentage: 30, conversiones: 62 },
  { name: "Directo", visitors: 534, percentage: 18, conversiones: 45 },
  { name: "Referencias", visitors: 298, percentage: 10, conversiones: 21 },
]

// Análisis por horario
const hourlyData = [
  { hour: "6am", ventas: 12, visitas: 45 },
  { hour: "8am", ventas: 34, visitas: 120 },
  { hour: "10am", ventas: 89, visitas: 280 },
  { hour: "12pm", ventas: 156, visitas: 420 },
  { hour: "2pm", ventas: 198, visitas: 520 },
  { hour: "4pm", ventas: 234, visitas: 610 },
  { hour: "6pm", ventas: 287, visitas: 720 },
  { hour: "8pm", ventas: 245, visitas: 580 },
  { hour: "10pm", ventas: 123, visitas: 320 },
]

// KPI Data
const kpiData = [
  {
    title: "Ingresos Totales",
    value: "$87,420",
    change: "+23.5%",
    trend: "up",
    icon: DollarSign,
    description: "Este mes",
  },
  {
    title: "Tasa de Conversión",
    value: "3.2%",
    change: "+0.8%",
    trend: "up",
    icon: ShoppingCart,
    description: "Últimos 30 días",
  },
  {
    title: "Valor Promedio",
    value: "$147",
    change: "+$12",
    trend: "up",
    icon: DollarSign,
    description: "Por pedido",
  },
  {
    title: "Visitantes Únicos",
    value: "12,847",
    change: "+18.2%",
    trend: "up",
    icon: Users,
    description: "Este mes",
  },
]

// Análisis por dispositivo
const deviceData = [
  { name: "Móvil", value: 58, color: "#dc2626" },
  { name: "Desktop", value: 32, color: "#ef4444" },
  { name: "Tablet", value: 10, color: "#f87171" },
]

// Top páginas visitadas
const topPages = [
  { page: "/tours/elite-family", visitas: 3420, conversiones: 89, tasa: "2.6%" },
  { page: "/tours/apex-predator", visitas: 2890, conversiones: 76, tasa: "2.6%" },
  { page: "/tours/flintstone-era", visitas: 2560, conversiones: 82, tasa: "3.2%" },
  { page: "/tours/atv-quad", visitas: 2140, conversiones: 58, tasa: "2.7%" },
  { page: "/tours/combined", visitas: 1980, conversiones: 67, tasa: "3.4%" },
]

const COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily")

  const getDataByRange = () => {
    switch (timeRange) {
      case "daily":
        return dailyData
      case "weekly":
        return weeklyData
      case "monthly":
        return monthlyData
      default:
        return dailyData
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-title text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Analisis detallado de ventas, trafico y conversiones</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "daily" | "weekly" | "monthly")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <kpi.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.change}
                  </div>
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">{kpi.value}</div>
                <div className="text-sm text-gray-600">{kpi.title}</div>
                <div className="text-xs text-gray-500 mt-1">{kpi.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 border-gray-200">
            <CardHeader>
              <CardTitle>Rendimiento de Ventas</CardTitle>
              <CardDescription>Análisis de ventas, visitas y conversiones por período</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ventas">
                <TabsList className="mb-4">
                  <TabsTrigger value="ventas">Ventas</TabsTrigger>
                  <TabsTrigger value="visitas">Visitas</TabsTrigger>
                  <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                  <TabsTrigger value="conversiones">Conversiones</TabsTrigger>
                </TabsList>
                <TabsContent value="ventas" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByRange()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
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
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="visitas" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDataByRange()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitas"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="ingresos" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getDataByRange()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="ingresos" fill="#dc2626" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="conversiones" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getDataByRange()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="conversiones" stroke="#dc2626" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Distribution Chart */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Distribución por Tours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={tourDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tourDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {tourDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceData.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{device.name}</span>
                        <span className="font-semibold text-gray-900">{device.value}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${device.value}%`, backgroundColor: device.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Traffic Sources and Top Pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Fuentes de Tráfico</CardTitle>
              <CardDescription>Origen de visitantes y conversiones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{source.name}</span>
                        <span className="text-sm text-gray-600">{source.visitors} visitas</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {source.conversiones} conv.
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Páginas Más Visitadas</CardTitle>
              <CardDescription>Tours con mejor rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">{page.page}</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {page.tasa}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{page.visitas} visitas</span>
                        <span>•</span>
                        <span>{page.conversiones} conversiones</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Performance */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Rendimiento por Hora</CardTitle>
            <CardDescription>Análisis de actividad durante el día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="ventas" fill="#dc2626" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="visitas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
