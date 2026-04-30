"use client"

import { useEffect, useMemo, useState } from "react"
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
  ChevronLeft,
  ChevronRight,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { getPhotoSalesEvents } from "@/lib/photography-db"

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

// Canales de venta
const salesChannels = [
  { name: "Macao Off Road", url: "macaooffroad.com", sales: 145, revenue: 18920, color: "#dc2626" },
  { name: "Caribe Buggy", url: "caribebuggy.com", sales: 98, revenue: 12740, color: "#ef4444" },
  { name: "Saona Island", url: "saonaislandpuntacana.com", sales: 76, revenue: 9880, color: "#f87171" },
  { name: "Viator", url: "viator.com", sales: 124, revenue: 16120, color: "#fca5a5" },
  { name: "GetYourGuide", url: "getyourguide.com", sales: 89, revenue: 11580, color: "#fee2e2" },
]

type PageKey = "all" | "macao-offroad" | "saona" | "caribe" | "macao-buggy" | "horseride"

type RecentReservation = {
  id: string
  customer: string
  email: string
  phone: string
  tour: string
  amount: number
  status: string
  createdAt: string | null
  channel: string
  channelUrl: string
  pageKey: Exclude<PageKey, "all">
}

const PAGE_LABELS: Record<Exclude<PageKey, "all">, string> = {
  "macao-offroad": "Macao Offroad Experience",
  saona: "Saona Island",
  caribe: "Caribe Buggy",
  "macao-buggy": "Macao Buggy",
  horseride: "Punta Cana Horseride",
}

function getPageFromReservation(channel: string, channelUrl: string): Exclude<PageKey, "all"> {
  const key = `${channel || ""} ${channelUrl || ""}`.toLowerCase()
  if (key.includes("saona")) return "saona"
  if (key.includes("caribe")) return "caribe"
  if (key.includes("horse") || key.includes("horseride")) return "horseride"
  if (key.includes("macao") && key.includes("buggy")) return "macao-buggy"
  return "macao-offroad"
}

function formatOrderId(rawId: string) {
  if (!rawId) return "—"
  if (rawId.toUpperCase().startsWith("ORD-")) return rawId
  return `RES-${rawId.slice(0, 8).toUpperCase()}`
}

function formatRelativeTime(ts: string | null) {
  if (!ts) return "—"
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return "—"
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMins < 1) return "Justo ahora"
  if (diffMins < 60) return `Hace ${diffMins} min`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  return `Hace ${days} dia${days > 1 ? "s" : ""}`
}

const normalizeCurrencyCode = (currency: unknown) => {
  const cur = String(currency || "USD").toUpperCase()
  return cur === "US" ? "USD" : cur
}

const parseSafeDate = (value: unknown) => {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

const toDayKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const moneyByCurrency = (amountByCurrency: Record<string, number>) => {
  const entries = Object.entries(amountByCurrency)
    .filter(([, amount]) => amount > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) return "US$ 0.00"

  return entries
    .map(([currency, amount]) => {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
        }).format(amount)
      } catch {
        return `${currency} ${Number(amount).toFixed(2)}`
      }
    })
    .join(" · ")
}

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [photoInvoices, setPhotoInvoices] = useState<any[]>([])
  const [photoReturns, setPhotoReturns] = useState<any[]>([])
  const [photoEvents, setPhotoEvents] = useState<any[]>([])
  const [portfolioRows, setPortfolioRows] = useState<any[]>([])
  const [webSlideIndex, setWebSlideIndex] = useState(0)
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([])
  const [recentPageFilter, setRecentPageFilter] = useState<PageKey>("macao-offroad")
  const [newClientPageFilter, setNewClientPageFilter] = useState<PageKey>("macao-offroad")

  useEffect(() => {
    let cancelled = false

    async function loadRecentReservations() {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, customer_name, email, phone, experience, amount, status, created_at, channel, channel_url")
        .order("created_at", { ascending: false })
        .limit(200)

      if (error || !Array.isArray(data) || cancelled) {
        if (!cancelled) setRecentReservations([])
        return
      }

      const mapped: RecentReservation[] = data.map((row: any) => {
        const pageKey = getPageFromReservation(String(row.channel || ""), String(row.channel_url || ""))
        return {
          id: String(row.id || ""),
          customer: String(row.customer_name || "Cliente"),
          email: String(row.email || "").trim(),
          phone: String(row.phone || "").trim(),
          tour: String(row.experience || "Tour"),
          amount: Number(row.amount || 0),
          status: String(row.status || "pending").toLowerCase(),
          createdAt: row.created_at || null,
          channel: String(row.channel || "website"),
          channelUrl: String(row.channel_url || ""),
          pageKey,
        }
      })

      if (!cancelled) setRecentReservations(mapped)
    }

    loadRecentReservations()
    const interval = setInterval(loadRecentReservations, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredRecentReservations = useMemo(() => {
    if (recentPageFilter === "all") return recentReservations
    return recentReservations.filter((row) => row.pageKey === recentPageFilter)
  }, [recentPageFilter, recentReservations])

  const newWebClients = useMemo(() => {
    const scopedRows = newClientPageFilter === "all"
      ? recentReservations
      : recentReservations.filter((row) => row.pageKey === newClientPageFilter)

    const byClient = new Map<string, { name: string; email: string; phone: string; tours: number; latestTs: string | null }>()

    scopedRows.forEach((row) => {
      const key = (row.email || row.phone || row.customer).toLowerCase()
      if (!key) return

      const prev = byClient.get(key)
      if (!prev) {
        byClient.set(key, {
          name: row.customer || "Cliente",
          email: row.email || "—",
          phone: row.phone || "—",
          tours: 1,
          latestTs: row.createdAt,
        })
        return
      }

      const nextLatest = (() => {
        if (!prev.latestTs) return row.createdAt
        if (!row.createdAt) return prev.latestTs
        return new Date(row.createdAt) > new Date(prev.latestTs) ? row.createdAt : prev.latestTs
      })()

      byClient.set(key, {
        ...prev,
        tours: prev.tours + 1,
        latestTs: nextLatest,
      })
    })

    return Array.from(byClient.values())
      .sort((a, b) => {
        const da = a.latestTs ? new Date(a.latestTs).getTime() : 0
        const db = b.latestTs ? new Date(b.latestTs).getTime() : 0
        return db - da
      })
      .slice(0, 50)
  }, [newClientPageFilter, recentReservations])

  useEffect(() => {
    let cancelled = false

    async function loadPhotographyOverviewData() {
      const [{ data: invRows }, { data: retRows }] = await Promise.all([
        supabase
          .from("photo_invoices")
          .select("invoice_number, client_name, turno, total, currency, status, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("photo_returns")
          .select("id, status, amount, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ])

      if (!cancelled) {
        setPhotoInvoices(Array.isArray(invRows) ? invRows : [])
        setPhotoReturns(Array.isArray(retRows) ? retRows : [])
      }

      try {
        const events = await getPhotoSalesEvents()
        if (!cancelled) setPhotoEvents(Array.isArray(events) ? events : [])
      } catch {
        if (!cancelled) setPhotoEvents([])
      }

      try {
        const res = await fetch("/api/portfolios?all=true", { cache: "no-store" })
        const payload = await res.json()
        if (!cancelled) setPortfolioRows(Array.isArray(payload?.portfolios) ? payload.portfolios : [])
      } catch {
        if (!cancelled) setPortfolioRows([])
      }
    }

    loadPhotographyOverviewData()

    const interval = setInterval(loadPhotographyOverviewData, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const photographyStats = useMemo(() => {
    const todayKey = toDayKey(new Date())

    const activeInvoices = photoInvoices.filter((inv) => String(inv.status || "active") !== "cancelled")
    const todayInvoices = activeInvoices.filter((inv) => {
      const parsed = parseSafeDate(inv.created_at)
      return !!parsed && toDayKey(parsed) === todayKey
    })

    const approvedReturns = photoReturns.filter(
      (ret) => ret.status === "aprobada" || ret.status === "procesada"
    )
    const pendingReturns = photoReturns.filter((ret) => ret.status === "pendiente")

    const todaySalesByCurrency: Record<string, number> = {}
    todayInvoices.forEach((inv) => {
      const cur = normalizeCurrencyCode(inv.currency)
      todaySalesByCurrency[cur] = (todaySalesByCurrency[cur] || 0) + Number(inv.total || 0)
    })

    const onlineTodayByCurrency: Record<string, number> = {}
    photoEvents.forEach((event) => {
      const source = String(event.source || "").toLowerCase()
      if (!(source === "online" || source === "paypal")) return
      const parsed = parseSafeDate(event.created_at)
      if (!parsed || toDayKey(parsed) !== todayKey) return
      const cur = normalizeCurrencyCode(event.currency)
      onlineTodayByCurrency[cur] = (onlineTodayByCurrency[cur] || 0) + Number(event.amount || 0)
    })

    const todayByTurno: Record<string, { totalByCurrency: Record<string, number>; sales: number }> = {
      "Turno 9:00": { totalByCurrency: {}, sales: 0 },
      "Turno 12:00": { totalByCurrency: {}, sales: 0 },
      "Turno 3:00": { totalByCurrency: {}, sales: 0 },
    }

    todayInvoices.forEach((inv) => {
      const turno = String(inv.turno || "Turno 9:00")
      if (!todayByTurno[turno]) todayByTurno[turno] = { totalByCurrency: {}, sales: 0 }
      const cur = normalizeCurrencyCode(inv.currency)
      todayByTurno[turno].totalByCurrency[cur] = (todayByTurno[turno].totalByCurrency[cur] || 0) + Number(inv.total || 0)
      todayByTurno[turno].sales += 1
    })

    const maxTurnoSales = Math.max(
      ...Object.values(todayByTurno).map((row) => Number(row.sales || 0)),
      1
    )

    return {
      todaySalesByCurrency,
      onlineTodayByCurrency,
      invoicesToday: todayInvoices.length,
      approvedReturnsCount: approvedReturns.length,
      pendingReturnsCount: pendingReturns.length,
      todayByTurno,
      recentInvoices: activeInvoices.slice(0, 5),
      maxTurnoSales,
    }
  }, [photoEvents, photoInvoices, photoReturns])

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

  const webSlides = useMemo(() => {
    const webKeys = [
      { key: "macao-offroad", name: "Macao Offroad", ready: true },
      { key: "saona", name: "Saona Island" },
      { key: "caribe", name: "Caribe Buggy" },
      { key: "macao", name: "Macao Buggy" },
      { key: "horseride", name: "Punta Cana Horseride" },
    ]

    // Policy for current stage: keep web circles in zero until web sales go live.
    const forceZeroWebSales = true

    return webKeys.map((web) => {
      let tours = 0
      let portfolios = 0

      if (!forceZeroWebSales) {
        const soldFromWeb = portfolioRows.filter((p) => {
          const status = String(p.status || "").toLowerCase()
          if (!(status === "vendido" || status === "descargado")) return false
          const source = String(p.source || "").toLowerCase()
          return source.includes(String(web.key).replace("-", ""))
        }).length
        portfolios = soldFromWeb
      }

      const hasSales = tours + portfolios > 0
      return {
        ...web,
        totalTours: tours,
        soldPortfolios: portfolios,
        hasSales,
        pieData: hasSales
          ? [
              { name: "Tours", value: tours, color: "#dc2626" },
              { name: "Portafolios", value: portfolios, color: "#f87171" },
            ]
          : [
              { name: "Sin ventas", value: 1, color: "#e5e7eb" },
              { name: "Tours", value: 0, color: "#dc2626" },
              { name: "Portafolios", value: 0, color: "#f87171" },
            ],
      }
    })
  }, [portfolioRows])

  const selectedWebSlide = webSlides[webSlideIndex] || webSlides[0]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-title whitespace-nowrap text-gray-900 dark:text-gray-100 dark:text-gray-100">MACAO</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">Panel de control de ventas y gestión de experiencias</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "daily" | "weekly" | "monthly")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Diario</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensual</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="bg-white dark:bg-gray-950 dark:bg-gray-800 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsData.map((metric, index) => (
          <Card key={index} className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
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
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="col-span-2 space-y-8">
          {/* Sales Chart */}
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Análisis de Ventas y Tráfico</CardTitle>
                  <CardDescription>Tendencias de ventas y visitantes del sitio web</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-52 sm:h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSalesData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        color: "var(--foreground)",
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
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Ventas Recientes</CardTitle>
                  <CardDescription>Últimas transacciones y reservas de tours</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={recentPageFilter} onValueChange={(value) => setRecentPageFilter(value as PageKey)}>
                    <SelectTrigger className="w-[230px] h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por pagina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las paginas</SelectItem>
                      <SelectItem value="macao-offroad">Macao Offroad Experience</SelectItem>
                      <SelectItem value="saona">Saona Island</SelectItem>
                      <SelectItem value="caribe">Caribe Buggy</SelectItem>
                      <SelectItem value="macao-buggy">Macao Buggy</SelectItem>
                      <SelectItem value="horseride">Punta Cana Horseride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-900">
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">ID Orden</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Cliente</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Tour</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Canal</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Monto</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Estado</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Hora</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No hay reservas para el filtro seleccionado.
                      </TableCell>
                    </TableRow>
                  ) : filteredRecentReservations.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                      <TableCell className="font-mono text-sm">{formatOrderId(sale.id)}</TableCell>
                      <TableCell className="font-medium">{sale.customer}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{sale.tour}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <Globe className="w-3 h-3 mr-1" />
                          {PAGE_LABELS[sale.pageKey]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(sale.amount || 0)}</TableCell>
                      <TableCell>
                        {sale.status === "completed" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completado
                          </Badge>
                        )}
                        {sale.status !== "completed" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{formatRelativeTime(sale.createdAt)}</TableCell>
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
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Nuevos Clientes</CardTitle>
                  <CardDescription>Usuarios registrados recientemente desde paginas web</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={newClientPageFilter} onValueChange={(value) => setNewClientPageFilter(value as PageKey)}>
                    <SelectTrigger className="w-[230px] h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por pagina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las paginas</SelectItem>
                      <SelectItem value="macao-offroad">Macao Offroad Experience</SelectItem>
                      <SelectItem value="saona">Saona Island</SelectItem>
                      <SelectItem value="caribe">Caribe Buggy</SelectItem>
                      <SelectItem value="macao-buggy">Macao Buggy</SelectItem>
                      <SelectItem value="horseride">Punta Cana Horseride</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Lista
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-900">
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Cliente</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Email</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Teléfono</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Tours</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Registro</TableHead>
                    <TableHead className="font-medium text-gray-700 dark:text-gray-300 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newWebClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No hay clientes web para el filtro seleccionado.
                      </TableCell>
                    </TableRow>
                  ) : newWebClients.map((user, index) => (
                    <TableRow key={`${user.email}-${user.phone}-${index}`} className="hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
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
                          {user.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {user.phone || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {user.tours} {user.tours === 1 ? "tour" : "tours"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{formatRelativeTime(user.latestTs)}</TableCell>
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
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Tours Más Vendidos</CardTitle>
              <CardDescription>Experiencias más populares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{product.name}</span>
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
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">Distribucion de Ventas de Paginas Webs</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWebSlideIndex((prev) => (prev - 1 + webSlides.length) % webSlides.length)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWebSlideIndex((prev) => (prev + 1) % webSlides.length)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {selectedWebSlide?.name || "Macao Offroad"} · {selectedWebSlide?.ready ? "Lista" : "No lista"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-56 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedWebSlide?.pieData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(selectedWebSlide?.pieData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {(selectedWebSlide?.pieData || []).filter((item) => item.name !== "Sin ventas").map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || COLORS[index] }}></div>
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{item.name}: {item.value.toLocaleString()}</span>
                  </div>
                ))}
                <p className={`text-xs font-medium pt-2 ${selectedWebSlide?.hasSales ? "text-green-600" : "text-amber-600"}`}>
                  Estado: {selectedWebSlide?.hasSales ? "Con ventas" : "Sin ventas"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">Incluye ventas de tours y portafolios vendidos por web.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tours Catalog */}
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Catálogo de Tours</CardTitle>
              <CardDescription>Todos nuestros tours disponibles</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {tours.map((tour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 dark:text-gray-100">{tour.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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

          {/* Sales Channels */}
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
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
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{channel.name}</span>
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
        <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
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
            <div className="h-52 sm:h-64 lg:h-80">
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
            <h2 className="text-lg font-semibold text-gray-900">Resumen de Fotografia</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Resumen de facturación presencial y ventas de fotos en línea</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { label: "Ventas Hoy (Fotos)", value: moneyByCurrency(photographyStats.todaySalesByCurrency), change: "Tiempo real", trend: "up" },
            { label: "Facturas Hoy", value: String(photographyStats.invoicesToday), change: "Tiempo real", trend: "up" },
            { label: "Ventas Online (Fotos)", value: moneyByCurrency(photographyStats.onlineTodayByCurrency), change: "Tiempo real", trend: "up" },
            { label: "Devoluciones Aprobadas", value: String(photographyStats.approvedReturnsCount), change: `${photographyStats.pendingReturnsCount} pendientes`, trend: "down" },
          ].map((m, i) => (
            <Card key={i} className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{m.value}</p>
                <span className={`text-xs font-medium ${m.trend === "up" ? "text-green-600" : "text-blue-600"}`}>
                  {m.change}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Sales by Turno */}
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ventas por Turno</CardTitle>
              <CardDescription>Distribución de ventas de fotografía por turno</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: "Turno 9:00", label: "Turno 9:00 AM" },
                  { key: "Turno 12:00", label: "Turno 12:00 PM" },
                  { key: "Turno 3:00", label: "Turno 3:00 PM" },
                ].map((shift) => {
                  const data = photographyStats.todayByTurno[shift.key] || { totalByCurrency: {}, sales: 0 }
                  const pct = Math.round((Number(data.sales || 0) / photographyStats.maxTurnoSales) * 100)
                  return (
                  <div key={shift.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{shift.label}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{moneyByCurrency(data.totalByCurrency)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="flex-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">{data.sales} ventas</span>
                    </div>
                  </div>
                )})}
              </div>
            </CardContent>
          </Card>

          {/* Recent Photo Invoices */}
          <Card className="border-gray-200 dark:border-gray-800 dark:border-gray-800">
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
                  {photographyStats.recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-xs text-center text-gray-500 py-6" colSpan={4}>Sin facturas en Supabase</TableCell>
                    </TableRow>
                  ) : photographyStats.recentInvoices.map((inv) => (
                    <TableRow key={inv.invoice_number}>
                      <TableCell className="text-xs font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="text-xs">{inv.client_name || "Cliente General"}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px]">{inv.turno || "Turno 9:00"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">{moneyByCurrency({ [normalizeCurrencyCode(inv.currency)]: Number(inv.total || 0) })}</TableCell>
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
