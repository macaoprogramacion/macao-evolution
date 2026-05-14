"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import {
  Camera,
  DollarSign,
  FileText,
  RotateCcw,
  ShoppingCart,
  Globe,
  Store,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Search,
  Calendar,
  Filter,
  Download,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderOpen,
  CreditCard,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { getPhotoSalesEvents } from "@/lib/photography-db"
import * as XLSX from "xlsx"

// ─── Types ──────────────────────────────────────────────────────────
interface Invoice {
  id: number | string
  invoiceNumber: string
  clientName: string
  clientPhone?: string
  turno: string
  photographer?: string
  items: { name: string; price: number; quantity: number }[]
  subtotal: number
  tax: number
  total: number
  currency: string
  status: string
  date: string
  timestamp: string
}

interface Return {
  id: number | string
  invoiceNumber: string
  clientName: string
  amount: number
  reason: string
  status: string
  date?: string
  timestamp?: string
}

interface PhotoSale {
  id: number | string
  phone: string
  client_name?: string
  plan: string
  amount: number
  currency?: string
  timestamp: string
  source?: string
}

interface Portfolio {
  id: string
  client_name?: string
  clientName?: string
  phone?: string
  status: string
  invoice_code?: string
  invoiceCode?: string
  source?: string
  turno?: string
  photographer_name?: string
  photographerName?: string
  created_at?: string
  createdAt?: string
}

interface DailyClosure {
  id: string
  closure_date: string
  closed_at?: string
  closed_by?: string
  total_invoices?: number
  by_currency?: Record<string, { total: number; subtotal: number; tax: number; count: number }>
}

type ReturnDecision = "aprobada" | "rechazada"
type CurrencyTotals = Record<string, { total: number; count: number }>

// ─── Helpers ────────────────────────────────────────────────────────
function fmtMoney(amount: number, currency = "USD") {
  const symbols: Record<string, string> = { USD: "US$", EUR: "€", DOP: "RD$" }
  return `${symbols[currency] || "$"} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
}

function normalizeCurrencyCode(currency?: string | null) {
  return String(currency || "USD").toUpperCase() || "USD"
}

function accumulateCurrencyTotals<T>(
  items: T[],
  getAmount: (item: T) => number,
  getCurrency: (item: T) => string | undefined,
) {
  return items.reduce<CurrencyTotals>((acc, item) => {
    const currency = normalizeCurrencyCode(getCurrency(item))
    const amount = Number(getAmount(item) || 0)
    if (!acc[currency]) acc[currency] = { total: 0, count: 0 }
    acc[currency].total += amount
    acc[currency].count += 1
    return acc
  }, {})
}

function formatCurrencyTotals(totals: CurrencyTotals, emptyCurrency = "USD") {
  const order = ["USD", "EUR", "DOP"]
  const entries = Object.entries(totals)
    .filter(([, data]) => Number(data?.total || 0) !== 0)
    .sort(([a], [b]) => {
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

  if (entries.length === 0) return fmtMoney(0, emptyCurrency)
  return entries.map(([currency, data]) => fmtMoney(data.total, currency)).join(" · ")
}

function buildAverageCurrencyTotals(totals: CurrencyTotals) {
  return Object.entries(totals).reduce<CurrencyTotals>((acc, [currency, data]) => {
    if (!data.count) return acc
    acc[currency] = { total: data.total / data.count, count: data.count }
    return acc
  }, {})
}

function mergeCurrencyTotals(base: CurrencyTotals, extra: CurrencyTotals) {
  const merged: CurrencyTotals = { ...base }
  Object.entries(extra).forEach(([currency, data]) => {
    if (!merged[currency]) merged[currency] = { total: 0, count: 0 }
    merged[currency].total += Number(data?.total || 0)
    merged[currency].count += Number(data?.count || 0)
  })
  return merged
}

function parseSafeDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function dayKeyFromInput(value?: string | null) {
  const date = parseSafeDate(value)
  return date ? toDayKey(date) : null
}

function dayKeyFromInvoice(invoice: Invoice) {
  return dayKeyFromInput(invoice.timestamp) || dayKeyFromInput(invoice.date)
}

function fmtDayKey(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  if (Number.isNaN(date.getTime())) return dayKey
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })
}

function fmtDate(ts?: string | null) {
  const date = parseSafeDate(ts)
  if (!date) return "—"
  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtTime(ts?: string | null) {
  const date = parseSafeDate(ts)
  if (!date) return "—"
  return date.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })
}

function normalizeReturn(raw: any): Return {
  const timestamp = raw.timestamp || raw.created_at || ""
  const invoiceNumber = raw.invoiceNumber || raw.invoice || raw.invoice_number || ""
  return {
    id: raw.id ?? `${invoiceNumber || "ret"}-${timestamp || "no-ts"}`,
    invoiceNumber,
    clientName: raw.clientName || raw.client || raw.client_name || "Cliente General",
    amount: Number.parseFloat(raw.amount) || 0,
    reason: raw.reason || "",
    status: raw.status || "pendiente",
    date: raw.date || fmtDate(timestamp),
    timestamp,
  }
}

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>
    case "pendiente":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
    case "aprobada":
    case "procesada":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprobada</Badge>
    case "rechazada":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const portfolioStatusBadge = (status: string) => {
  switch (status) {
    case "Vendido":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Vendido</Badge>
    case "Pendiente":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
    case "Descargado":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Descargado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function PhotographyPage() {
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [photoSales, setPhotoSales] = useState<PhotoSale[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [supabasePortfolios, setSupabasePortfolios] = useState<Portfolio[]>([])
  const [supabaseInvoices, setSupabaseInvoices] = useState<Invoice[]>([])
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([])
  const [supabaseReturns, setSupabaseReturns] = useState<Return[]>([])
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [searchInvoice, setSearchInvoice] = useState("")
  const [searchReturn, setSearchReturn] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "analytics" || tab === "closures" || tab === "overview" || tab === "invoices" || tab === "returns" || tab === "portfolios") {
      setActiveTab(tab)
    }
  }, [searchParams])

  // ─── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    function loadLocalBillingInvoices() {
      if (typeof window === "undefined") return
      try {
        const raw = localStorage.getItem("macao_billing_invoices")
        const parsed = raw ? JSON.parse(raw) : []
        if (!Array.isArray(parsed)) return

        const mapped: Invoice[] = parsed.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName || "Cliente General",
          clientPhone: inv.clientPhone,
          turno: inv.turno,
          photographer: inv.photographer,
          items: Array.isArray(inv.items) ? inv.items : [],
          subtotal: Number.parseFloat(inv.subtotal) || 0,
          tax: Number.parseFloat(inv.tax) || 0,
          total: Number.parseFloat(inv.total) || 0,
          currency: inv.currency || "USD",
          status: inv.status || "active",
          date: inv.date || fmtDate(inv.timestamp),
          timestamp: inv.timestamp || "",
        }))

        setLocalInvoices(mapped)
      } catch {
        setLocalInvoices([])
      }
    }

    // Supabase data
    async function fetchSupabase() {
      try {
        const { data: sbInvoices } = await supabase
          .from("photo_invoices")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500)

        if (sbInvoices) {
          setSupabaseInvoices(
            sbInvoices.map((inv: any) => ({
              id: inv.id,
              invoiceNumber: inv.invoice_number,
              clientName: inv.client_name,
              clientPhone: inv.client_phone,
              turno: inv.turno,
              photographer: inv.photographer,
              items: inv.items || [],
              subtotal: parseFloat(inv.subtotal) || 0,
              tax: parseFloat(inv.tax) || 0,
              total: parseFloat(inv.total) || 0,
              currency: inv.currency || "USD",
              status: inv.status || "active",
              date: fmtDate(inv.created_at),
              timestamp: inv.created_at || "",
            }))
          )
        }

        const { data: sbReturns } = await supabase
          .from("photo_returns")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200)

        if (sbReturns) {
          setSupabaseReturns(
            sbReturns.map((r: any) => normalizeReturn(r))
          )
        }

        const { data: sbClosures } = await supabase
          .from("photo_daily_closures")
          .select("*")
          .order("closure_date", { ascending: false })
          .limit(120)

        if (sbClosures) {
          setDailyClosures(sbClosures.map((c: any) => ({
            id: c.id,
            closure_date: c.closure_date,
            closed_at: c.closed_at,
            closed_by: c.closed_by,
            total_invoices: c.total_invoices,
            by_currency: c.by_currency || {},
          })))
        }

        const events = await getPhotoSalesEvents()
        const mappedEvents: PhotoSale[] = (events || []).map((ev: any) => ({
          id: ev.id,
          phone: ev.phone || "",
          client_name: ev.client_name || "",
          plan: ev.plan_name || ev.event_type,
          amount: Number.parseFloat(ev.amount) || 0,
          currency: ev.currency || "USD",
          timestamp: ev.created_at || "",
          source: ev.source || ev.event_type,
        }))
        setPhotoSales(mappedEvents)
      } catch (err) {
        console.error("[Admin Photography] Supabase fetch error:", err)
      }
    }

    async function fetchPortfoliosFromApi() {
      try {
        const res = await fetch("/api/portfolios?all=true", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const rows = Array.isArray(data?.portfolios) ? data.portfolios : []
        setSupabasePortfolios(rows)
      } catch (err) {
        console.error("[Admin Photography] Portfolios API fetch error:", err)
      }
    }

    loadLocalBillingInvoices()
    fetchSupabase()
    fetchPortfoliosFromApi()

    const portfoliosInterval = setInterval(fetchPortfoliosFromApi, 12000)
    const invoicesInterval = setInterval(() => {
      loadLocalBillingInvoices()
      fetchSupabase()
    }, 12000)

    return () => {
      clearInterval(portfoliosInterval)
      clearInterval(invoicesInterval)
    }
  }, [])

  async function handleReturnDecision(item: Return, decision: ReturnDecision) {
    const invoiceNumber = item.invoiceNumber?.trim()
    if (!invoiceNumber) {
      alert("No se puede procesar: esta devolución no tiene número de factura")
      return
    }

    try {
      setProcessingReturnId(String(item.id))

      const { error: retError } = await supabase
        .from("photo_returns")
        .update({ status: decision, updated_at: new Date().toISOString() })
        .eq("invoice_number", invoiceNumber)
      if (retError) throw retError

      if (decision === "aprobada") {
        const { error: invoiceError } = await supabase
          .from("photo_invoices")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancel_reason: item.reason || "Devolución aprobada",
          })
          .eq("invoice_number", invoiceNumber)
        if (invoiceError) throw invoiceError
      } else {
        const { error: invoiceError } = await supabase
          .from("photo_invoices")
          .update({
            status: "active",
            cancelled_at: null,
            cancel_reason: null,
          })
          .eq("invoice_number", invoiceNumber)
        if (invoiceError) throw invoiceError
      }

      setSupabaseReturns((prev) =>
        prev.map((r) =>
          r.id === item.id || r.invoiceNumber === invoiceNumber
            ? { ...r, status: decision }
            : r
        )
      )
      setReturns((prev) =>
        prev.map((r) =>
          r.id === item.id || r.invoiceNumber === invoiceNumber
            ? { ...r, status: decision }
            : r
        )
      )

      const nextInvoiceStatus = decision === "aprobada" ? "cancelled" : "active"
      setSupabaseInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceNumber === invoiceNumber ? { ...inv, status: nextInvoiceStatus } : inv
        )
      )
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceNumber === invoiceNumber ? { ...inv, status: nextInvoiceStatus } : inv
        )
      )
    } catch (err) {
      console.error("[Admin Photography] Return decision error:", err)
      alert("Error al procesar la decisión. Intenta nuevamente.")
    } finally {
      setProcessingReturnId(null)
    }
  }

  // ─── Merge data: prefer Supabase, fallback to localStorage ────
  const allInvoices = useMemo(() => {
    const merged = new Map<string, Invoice>()

    for (const inv of localInvoices) {
      if (inv?.invoiceNumber) merged.set(inv.invoiceNumber, inv)
    }

    for (const inv of supabaseInvoices) {
      if (inv?.invoiceNumber) merged.set(inv.invoiceNumber, inv)
    }

    return Array.from(merged.values()).sort((a, b) => {
      const aTs = parseSafeDate(a.timestamp)?.getTime() ?? 0
      const bTs = parseSafeDate(b.timestamp)?.getTime() ?? 0
      return bTs - aTs
    })
  }, [supabaseInvoices, localInvoices])

  const allReturns = useMemo(() => {
    return supabaseReturns
  }, [supabaseReturns])

  const allPortfolios = useMemo(() => {
    if (supabasePortfolios.length > 0) return supabasePortfolios
    return portfolios
  }, [portfolios, supabasePortfolios])

  const closureAnalyticsByDay = useMemo(() => {
    const byDay: Record<string, { byCurrency: CurrencyTotals; invoices: number }> = {}

    dailyClosures.forEach((closure) => {
      const dayKey = String(closure.closure_date || "").slice(0, 10)
      if (!dayKey) return

      const closureCurrency: CurrencyTotals = {}
      Object.entries(closure.by_currency || {}).forEach(([rawCurrency, data]) => {
        const currency = normalizeCurrencyCode(rawCurrency)
        if (!closureCurrency[currency]) closureCurrency[currency] = { total: 0, count: 0 }
        closureCurrency[currency].total += Number(data?.total || 0)
        closureCurrency[currency].count += Number(data?.count || 0)
      })

      const inferredInvoices = Object.values(closureCurrency).reduce((sum, cur) => sum + (cur.count || 0), 0)
      const closureInvoices = Number(closure.total_invoices || inferredInvoices || 0)

      if (!byDay[dayKey]) byDay[dayKey] = { byCurrency: {}, invoices: 0 }
      byDay[dayKey].byCurrency = mergeCurrencyTotals(byDay[dayKey].byCurrency, closureCurrency)
      byDay[dayKey].invoices += closureInvoices
    })

    return byDay
  }, [dailyClosures])

  // ─── Computed stats ───────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = toDayKey(now)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Invoices + closures (avoid duplicating days that already have cierre)
    const closedDays = new Set(Object.keys(closureAnalyticsByDay))
    const activeInvoices = allInvoices.filter((i) => {
      if (i.status === "cancelled") return false
      const dayKey = dayKeyFromInvoice(i)
      if (!dayKey) return true
      return !closedDays.has(dayKey)
    })
    const todayInvoices = activeInvoices.filter((i) => dayKeyFromInvoice(i) === todayKey)
    const weekInvoices = activeInvoices.filter((i) => {
      const date = parseSafeDate(i.timestamp)
      return !!date && date >= weekAgo
    })
    const monthInvoices = activeInvoices.filter((i) => {
      const date = parseSafeDate(i.timestamp)
      return !!date && date >= monthAgo
    })
    const invoiceSalesTodayByCurrency = accumulateCurrencyTotals(todayInvoices, (i) => i.total, (i) => i.currency)
    const invoiceSalesWeekByCurrency = accumulateCurrencyTotals(weekInvoices, (i) => i.total, (i) => i.currency)
    const invoiceSalesMonthByCurrency = accumulateCurrencyTotals(monthInvoices, (i) => i.total, (i) => i.currency)

    const closureEntries = Object.entries(closureAnalyticsByDay)
    const closureToday = closureEntries.filter(([dayKey]) => dayKey === todayKey)
    const closureWeek = closureEntries.filter(([dayKey]) => {
      const date = parseSafeDate(`${dayKey}T12:00:00`)
      return !!date && date >= weekAgo
    })
    const closureMonth = closureEntries.filter(([dayKey]) => {
      const date = parseSafeDate(`${dayKey}T12:00:00`)
      return !!date && date >= monthAgo
    })

    const closureTodayByCurrency = closureToday.reduce<CurrencyTotals>(
      (acc, [, value]) => mergeCurrencyTotals(acc, value.byCurrency),
      {},
    )
    const closureWeekByCurrency = closureWeek.reduce<CurrencyTotals>(
      (acc, [, value]) => mergeCurrencyTotals(acc, value.byCurrency),
      {},
    )
    const closureMonthByCurrency = closureMonth.reduce<CurrencyTotals>(
      (acc, [, value]) => mergeCurrencyTotals(acc, value.byCurrency),
      {},
    )

    const salesTodayByCurrency = mergeCurrencyTotals(invoiceSalesTodayByCurrency, closureTodayByCurrency)
    const salesWeekByCurrency = mergeCurrencyTotals(invoiceSalesWeekByCurrency, closureWeekByCurrency)
    const salesMonthByCurrency = mergeCurrencyTotals(invoiceSalesMonthByCurrency, closureMonthByCurrency)

    // Returns
    const approvedReturns = allReturns.filter(
      (r) => r.status === "aprobada" || r.status === "procesada"
    )
    const returnsTotal = approvedReturns.reduce((s, r) => s + r.amount, 0)
    const pendingReturns = allReturns.filter((r) => r.status === "pendiente")

    // Photo sales events
    const onlinePurchaseEvents = photoSales.filter((ps) => ps.source === "online" || ps.source === "paypal")
    const todayOnline = onlinePurchaseEvents.filter(
      (ps) => {
        return dayKeyFromInput(ps.timestamp) === todayKey
      }
    )
    const onlineSalesTotalByCurrency = accumulateCurrencyTotals(onlinePurchaseEvents, (ps) => ps.amount, (ps) => ps.currency)
    const onlineSalesTodayByCurrency = accumulateCurrencyTotals(todayOnline, (ps) => ps.amount, (ps) => ps.currency)

    // Portfolios
    const paidAtCashier = allPortfolios.filter(
      (p) => (p.source === "billing" || p.invoice_code || p.invoiceCode) && p.status === "Vendido"
    ).length
    const purchasedOnWeb = allPortfolios.filter(
      (p) => p.source === "web" || p.source === "gallery" || p.source === "online"
    ).length
    const totalPortfolios = allPortfolios.length
    const soldPortfolios = allPortfolios.filter((p) => p.status === "Vendido").length
    const pendingPortfolios = allPortfolios.filter((p) => p.status === "Pendiente").length

    // By currency
    let byCurrency: Record<string, { total: number; count: number }> = {}
    activeInvoices.forEach((inv) => {
      const cur = inv.currency || "USD"
      if (!byCurrency[cur]) byCurrency[cur] = { total: 0, count: 0 }
      byCurrency[cur].total += inv.total
      byCurrency[cur].count++
    })
    byCurrency = Object.values(closureAnalyticsByDay).reduce(
      (acc, closure) => mergeCurrencyTotals(acc, closure.byCurrency),
      byCurrency,
    )

    const closureInvoicesToday = closureToday.reduce((sum, [, value]) => sum + (value.invoices || 0), 0)
    const closureInvoicesAll = closureEntries.reduce((sum, [, value]) => sum + (value.invoices || 0), 0)

    // By turno (today)
    const turnoData = ["Turno 9:00", "Turno 12:00", "Turno 3:00"].map((shift) => {
      const shiftInvoices = todayInvoices.filter((inv) => (inv.turno || "Turno 9:00") === shift)
      return {
        shift,
        sales: shiftInvoices.length,
        byCurrency: accumulateCurrencyTotals(shiftInvoices, (inv) => inv.total, (inv) => inv.currency),
      }
    })

    // Ticket promedio
    const ticketPromedioByCurrency = buildAverageCurrencyTotals(salesTodayByCurrency)

    return {
      salesTodayByCurrency,
      salesWeekByCurrency,
      salesMonthByCurrency,
      invoicesToday: todayInvoices.length + closureInvoicesToday,
      totalInvoices: activeInvoices.length + closureInvoicesAll,
      returnsTotal,
      pendingReturnsCount: pendingReturns.length,
      totalReturnsCount: allReturns.length,
      onlineSalesTotalByCurrency,
      onlineSalesTodayByCurrency,
      onlineSalesCount: onlinePurchaseEvents.length,
      paidAtCashier,
      purchasedOnWeb,
      totalPortfolios,
      soldPortfolios,
      pendingPortfolios,
      byCurrency,
      turnoData,
      ticketPromedioByCurrency,
    }
  }, [allInvoices, allReturns, photoSales, allPortfolios, closureAnalyticsByDay])

  // ─── Filtered invoices ────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let filtered = allInvoices
    if (searchInvoice) {
      const q = searchInvoice.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber?.toLowerCase().includes(q) ||
          i.clientName?.toLowerCase().includes(q) ||
          i.clientPhone?.toLowerCase().includes(q)
      )
    }
    if (dateFilter !== "all") {
      const now = new Date()
      const todayKey = toDayKey(now)
      const cutoff = new Date(now)
      if (dateFilter === "today") {
        filtered = filtered.filter((i) => dayKeyFromInvoice(i) === todayKey)
      } else if (dateFilter === "week") {
        cutoff.setDate(cutoff.getDate() - 7)
        filtered = filtered.filter((i) => {
          const date = parseSafeDate(i.timestamp)
          return !!date && date >= cutoff
        })
      } else if (dateFilter === "month") {
        cutoff.setMonth(cutoff.getMonth() - 1)
        filtered = filtered.filter((i) => {
          const date = parseSafeDate(i.timestamp)
          return !!date && date >= cutoff
        })
      }
    }
    return filtered
  }, [allInvoices, searchInvoice, dateFilter])

  // ─── Filtered returns ─────────────────────────────────────────
  const filteredReturns = useMemo(() => {
    if (!searchReturn) return allReturns
    const q = searchReturn.toLowerCase()
    return allReturns.filter(
      (r) =>
        r.invoiceNumber?.toLowerCase().includes(q) ||
        r.clientName?.toLowerCase().includes(q)
    )
  }, [allReturns, searchReturn])

  const onlinePurchaseSales = useMemo(
    () => photoSales.filter((ps) => ps.source === "online" || ps.source === "paypal"),
    [photoSales],
  )

  // ─── Analytics: daily sales for chart ─────────────────────────
  const dailySales = useMemo(() => {
    const map: Record<string, { date: string; cashier: CurrencyTotals; online: CurrencyTotals; cashierCount: number; onlineCount: number }> = {}
    const daysBack = 14
    const now = new Date()

    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = toDayKey(d)
      const label = d.toLocaleDateString("es-DO", { day: "numeric", month: "short" })
      map[key] = { date: label, cashier: {}, online: {}, cashierCount: 0, onlineCount: 0 }
    }

    const closedDays = new Set(Object.keys(closureAnalyticsByDay))

    allInvoices
      .filter((i) => i.status !== "cancelled")
      .forEach((inv) => {
        const date = parseSafeDate(inv.timestamp)
        if (!date) return
        const key = toDayKey(date)
        if (closedDays.has(key)) return
        if (!map[key]) return
        const currency = normalizeCurrencyCode(inv.currency)
        if (!map[key].cashier[currency]) map[key].cashier[currency] = { total: 0, count: 0 }
        map[key].cashier[currency].total += inv.total
        map[key].cashier[currency].count += 1
        map[key].cashierCount += 1
      })

    Object.entries(closureAnalyticsByDay).forEach(([dayKey, closureData]) => {
      if (!map[dayKey]) return
      Object.entries(closureData.byCurrency).forEach(([currency, totals]) => {
        if (!map[dayKey].cashier[currency]) map[dayKey].cashier[currency] = { total: 0, count: 0 }
        map[dayKey].cashier[currency].total += Number(totals.total || 0)
        map[dayKey].cashier[currency].count += Number(totals.count || 0)
      })
      map[dayKey].cashierCount += Number(closureData.invoices || 0)
    })

    const chartEvents = photoSales.filter((ps) => ps.source === "online" || ps.source === "paypal")
    chartEvents.forEach((ps) => {
      const date = parseSafeDate(ps.timestamp)
      if (!date) return
      const key = toDayKey(date)
      if (!map[key]) return
      const currency = normalizeCurrencyCode(ps.currency)
      if (!map[key].online[currency]) map[key].online[currency] = { total: 0, count: 0 }
      map[key].online[currency].total += ps.amount
      map[key].online[currency].count += 1
      map[key].onlineCount += 1
    })

    return Object.values(map)
  }, [allInvoices, photoSales, closureAnalyticsByDay])

  const pendingClosureDays = useMemo(() => {
    const todayKey = toDayKey(new Date())
    const daysWithSales = new Set<string>()

    allInvoices
      .filter((inv) => inv.status !== "cancelled")
      .forEach((inv) => {
        const dayKey = dayKeyFromInvoice(inv)
        if (!dayKey || dayKey >= todayKey) return
        daysWithSales.add(dayKey)
      })

    const closureDays = new Set(
      dailyClosures
        .map((closure) => String(closure.closure_date || "").slice(0, 10))
        .filter(Boolean),
    )

    return Array.from(daysWithSales)
      .filter((dayKey) => !closureDays.has(dayKey))
      .sort((a, b) => (a < b ? 1 : -1))
  }, [allInvoices, dailyClosures])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fotografía</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Ventas, devoluciones y analíticas del departamento de fotografía
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = allInvoices.map((inv) => ({
              "N° Factura": inv.invoiceNumber,
              "Cliente": inv.clientName,
              "Fotógrafo": inv.photographer,
              "Turno": inv.turno || "",
              "Moneda": inv.currency || "USD",
              "Total": inv.total,
              "Estado": inv.status,
              "Fecha": inv.timestamp ? new Date(inv.timestamp).toLocaleString("es-DO") : "",
            }))
            const ws = XLSX.utils.json_to_sheet(rows)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Facturas")
            const today = new Date().toISOString().slice(0, 10)
            XLSX.writeFile(wb, `fotografia-facturas-${today}.xlsx`)
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
            <TabsTrigger value="returns">Devoluciones</TabsTrigger>
            <TabsTrigger value="portfolios">Portafolios</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            <TabsTrigger value="closures">Cierres Diarios</TabsTrigger>
          </TabsList>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {pendingClosureDays.length > 0 && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hay cierres diarios pendientes</AlertTitle>
                <AlertDescription>
                  Se detectaron {pendingClosureDays.length} día(s) con facturas y sin cierre enviado a administración. Último pendiente: {fmtDayKey(pendingClosureDays[0])}.
                </AlertDescription>
              </Alert>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Hoy</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesTodayByCurrency)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.invoicesToday} facturas</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Online</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.onlineSalesTodayByCurrency)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.onlineSalesCount} compras total</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Devoluciones</p>
                      <p className="text-2xl font-bold text-red-600">{fmtMoney(stats.returnsTotal)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.pendingReturnsCount} pendientes</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Portafolios</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPortfolios}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.soldPortfolios} vendidos</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolios: Caja vs Web */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">Pagados en Caja</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.paidAtCashier}</p>
                      <p className="text-xs text-green-600/70 dark:text-green-500/70">portafolios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Comprados en Web</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.purchasedOnWeb}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-500/70">portafolios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-400">Pendientes</p>
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.pendingPortfolios}</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-500/70">sin vender</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales by Turno + Recent Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Ventas por Turno (Hoy)</CardTitle>
                  <CardDescription>Distribución de ventas de fotografía por turno</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.turnoData.map((t, i) => {
                      const maxSales = Math.max(...stats.turnoData.map((td) => td.sales), 1)
                      const pct = (t.sales / maxSales) * 100
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.shift}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(t.byCurrency)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={pct} className="flex-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">{t.sales} ventas</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Resumen Financiero</CardTitle>
                  <CardDescription>Acumulados por período · Hoy: {new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Hoy</span>
                          <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesTodayByCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Última Semana</span>
                          <p className="text-[10px] text-gray-400">{new Date(Date.now() - 7*86400000).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })} – hoy</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesWeekByCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Último Mes</span>
                          <p className="text-[10px] text-gray-400">{new Date(new Date().setMonth(new Date().getMonth()-1)).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })} – hoy</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesMonthByCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Ticket Promedio</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.ticketPromedioByCurrency)}</span>
                    </div>
                    {Object.entries(stats.byCurrency).map(([cur, data]) => (
                      <div key={cur} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Histórico total en {cur}</span>
                          <Badge variant="secondary" className="text-[10px]">{data.count}</Badge>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{fmtMoney(data.total, cur)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════════ INVOICES TAB ═══════════ */}
          <TabsContent value="invoices" className="space-y-4 mt-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por factura, cliente, teléfono..."
                  className="pl-10"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Factura</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Turno</TableHead>
                        <TableHead className="text-xs">Fotógrafo</TableHead>
                        <TableHead className="text-xs">Moneda</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No hay facturas
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.slice(0, 50).map((inv) => (
                          <TableRow
                            key={inv.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => setDetailInvoice(inv)}
                          >
                            <TableCell className="text-xs font-mono font-medium">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{inv.clientName}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px]">{inv.turno}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">{inv.photographer || "—"}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[10px]">{inv.currency}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">{fmtMoney(inv.total, inv.currency)}</TableCell>
                            <TableCell className="text-xs">{statusBadge(inv.status)}</TableCell>
                            <TableCell className="text-xs text-gray-500">{inv.date}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filteredInvoices.length > 50 && (
                  <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
                    Mostrando 50 de {filteredInvoices.length} facturas
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ RETURNS TAB ═══════════ */}
          <TabsContent value="returns" className="space-y-4 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Devoluciones</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalReturnsCount}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monto Devuelto</p>
                  <p className="text-2xl font-bold text-red-600">{fmtMoney(stats.returnsTotal)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingReturnsCount}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tasa Devolución</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalInvoices > 0
                      ? `${((stats.totalReturnsCount / stats.totalInvoices) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por factura o cliente..."
                className="pl-10"
                value={searchReturn}
                onChange={(e) => setSearchReturn(e.target.value)}
              />
            </div>

            {/* Table */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Factura</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                        <TableHead className="text-xs">Motivo</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                            <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No hay devoluciones
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReturns.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-xs font-mono font-medium">{r.invoiceNumber || "—"}</TableCell>
                            <TableCell className="text-xs">{r.clientName}</TableCell>
                            <TableCell className="text-xs text-right font-semibold text-red-600">{fmtMoney(r.amount)}</TableCell>
                            <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{r.reason || "—"}</TableCell>
                            <TableCell className="text-xs">{statusBadge(r.status)}</TableCell>
                            <TableCell className="text-xs text-gray-500">{r.date || "—"}</TableCell>
                            <TableCell className="text-right">
                              {r.status === "pendiente" ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50"
                                    disabled={processingReturnId === String(r.id)}
                                    onClick={() => handleReturnDecision(r, "aprobada")}
                                  >
                                    {processingReturnId === String(r.id) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                    disabled={processingReturnId === String(r.id)}
                                    onClick={() => handleReturnDecision(r, "rechazada")}
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Procesada</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ PORTFOLIOS TAB ═══════════ */}
          <TabsContent value="portfolios" className="space-y-4 mt-6">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPortfolios}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">En Caja</p>
                      <p className="text-xl font-bold text-green-600">{stats.paidAtCashier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">En Web</p>
                      <p className="text-xl font-bold text-blue-600">{stats.purchasedOnWeb}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vendidos</p>
                      <p className="text-xl font-bold text-green-600">{stats.soldPortfolios}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio List */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Listado de Portafolios</CardTitle>
                <CardDescription>Portafolios creados por el equipo de fotografía</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Teléfono</TableHead>
                        <TableHead className="text-xs">Fotógrafo</TableHead>
                        <TableHead className="text-xs">Turno</TableHead>
                        <TableHead className="text-xs">Factura</TableHead>
                        <TableHead className="text-xs">Origen</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPortfolios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No hay portafolios
                          </TableCell>
                        </TableRow>
                      ) : (
                        allPortfolios.slice(0, 50).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs font-medium">{p.client_name || p.clientName || "—"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{p.phone || "—"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{p.photographer_name || p.photographerName || "—"}</TableCell>
                            <TableCell className="text-xs">
                              {p.turno ? <Badge variant="secondary" className="text-[10px]">{p.turno}</Badge> : "—"}
                            </TableCell>
                            <TableCell className="text-xs font-mono">{p.invoice_code || p.invoiceCode || "—"}</TableCell>
                            <TableCell className="text-xs">
                              {(p.source === "billing" || p.invoice_code || p.invoiceCode) ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">
                                  <Store className="w-3 h-3 mr-1" />
                                  Caja
                                </Badge>
                              ) : p.source === "web" || p.source === "gallery" || p.source === "online" ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Web
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">N/A</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{portfolioStatusBadge(p.status)}</TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {p.created_at || p.createdAt
                                ? fmtDate(p.created_at || p.createdAt || "")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ ANALYTICS TAB ═══════════ */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            {pendingClosureDays.length > 0 && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cierre pendiente por enviar</AlertTitle>
                <AlertDescription>
                  Hay días con ventas sin cierre administrativo. Fechas pendientes: {pendingClosureDays.slice(0, 3).map(fmtDayKey).join(", ")}{pendingClosureDays.length > 3 ? ` y ${pendingClosureDays.length - 3} más` : ""}.
                </AlertDescription>
              </Alert>
            )}

            {/* Period Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Hoy</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesTodayByCurrency)}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Semanal</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesWeekByCurrency)}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Mensual</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrencyTotals(stats.salesMonthByCurrency)}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Sales (simple bar representation) */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Ventas Diarias — Últimos 14 días</CardTitle>
                <CardDescription>Comparación Caja vs Web</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailySales.map((day, i) => {
                    const maxVal = Math.max(...dailySales.map((d) => d.cashierCount + d.onlineCount), 1)
                    const cashierPct = (day.cashierCount / maxVal) * 100
                    const onlinePct = (day.onlineCount / maxVal) * 100
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right shrink-0">{day.date}</span>
                        <div className="flex-1 flex gap-0.5 h-5">
                          {cashierPct > 0 && (
                            <div
                              className="bg-red-500 rounded-l-sm h-full"
                              style={{ width: `${cashierPct}%` }}
                              title={`Caja: ${formatCurrencyTotals(day.cashier)}`}
                            />
                          )}
                          {onlinePct > 0 && (
                            <div
                              className="bg-blue-500 rounded-r-sm h-full"
                              style={{ width: `${onlinePct}%` }}
                              title={`Web: ${formatCurrencyTotals(day.online)}`}
                            />
                          )}
                          {cashierPct === 0 && onlinePct === 0 && (
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-sm h-full w-full" />
                          )}
                        </div>
                        <div className="w-56 shrink-0 text-right">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Caja: {formatCurrencyTotals(day.cashier)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Web: {formatCurrencyTotals(day.online)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Caja (POS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Web (Online)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Sales Detail */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Compras Online</CardTitle>
                <CardDescription>Paquetes de fotos comprados a través de la web</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Teléfono</TableHead>
                        <TableHead className="text-xs">Plan</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onlinePurchaseSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No hay compras online registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        onlinePurchaseSales.slice(0, 30).map((ps) => (
                          <TableRow key={ps.id}>
                            <TableCell className="text-xs">{ps.client_name || "—"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{ps.phone}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px]">{ps.plan}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">{fmtMoney(ps.amount, ps.currency || "USD")}</TableCell>
                            <TableCell className="text-xs text-gray-500">{fmtDate(ps.timestamp)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ CLOSURES TAB ═══════════ */}
          <TabsContent value="closures" className="space-y-4 mt-6">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Cierres Diarios Enviados</CardTitle>
                <CardDescription>Historial de cierres enviados por los fotógrafos al administrador</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableHead className="text-xs font-semibold">Fecha Cierre</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Facturas</TableHead>
                        <TableHead className="text-xs font-semibold">Monedas</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total Ventas</TableHead>
                        <TableHead className="text-xs font-semibold">Cerrado por</TableHead>
                        <TableHead className="text-xs font-semibold">Enviado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyClosures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No hay cierres registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        dailyClosures.map((closure) => {
                          const byCur = closure.by_currency || {}
                          const currencyCodes = Object.keys(byCur)
                          const totalAllCurrencies = Object.entries(byCur)
                            .map(([_, data]) => data.total || 0)
                            .reduce((a, b) => a + b, 0)

                          return (
                            <TableRow key={closure.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                              <TableCell className="text-sm font-medium">{fmtDate(closure.closure_date)}</TableCell>
                              <TableCell className="text-sm text-center font-semibold text-blue-600 dark:text-blue-400">
                                {closure.total_invoices || 0}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {currencyCodes.length === 0 ? (
                                    <span className="text-gray-400">—</span>
                                  ) : (
                                    currencyCodes.map((cur) => (
                                      <Badge key={cur} variant="outline" className="text-xs">
                                        {cur}: {byCur[cur]?.count || 0}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                {currencyCodes.length === 0 ? (
                                  "US$ 0.00"
                                ) : (
                                  <div className="space-y-0.5">
                                    {currencyCodes.map((cur) => (
                                      <div key={cur} className="text-xs">
                                        {fmtMoney(byCur[cur]?.total || 0, cur)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                {closure.closed_by || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {closure.closed_at ? fmtDate(closure.closed_at) : "—"}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            {dailyClosures.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Cierres</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dailyClosures.length}</p>
                      </div>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Facturas</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {dailyClosures.reduce((sum, c) => sum + (c.total_invoices || 0), 0)}
                        </p>
                      </div>
                      <FileText className="w-5 h-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Período Cubierto</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {fmtDate(dailyClosures[dailyClosures.length - 1]?.closure_date || "")} — {fmtDate(dailyClosures[0]?.closure_date || "")}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* ─── Invoice Detail Dialog ─────────────────────────────────── */}
      <Dialog open={!!detailInvoice} onOpenChange={() => setDetailInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>
          {detailInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Factura</p>
                  <p className="font-mono font-medium">{detailInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Estado</p>
                  <div className="mt-1">{statusBadge(detailInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="font-medium">{detailInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p>{detailInvoice.clientPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Turno</p>
                  <p>{detailInvoice.turno}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Fotógrafo</p>
                  <p>{detailInvoice.photographer || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Fecha</p>
                  <p>{detailInvoice.date}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Hora</p>
                  <p>{fmtTime(detailInvoice.timestamp)}</p>
                </div>
              </div>

              {/* Items */}
              {detailInvoice.items && detailInvoice.items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Artículos</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {detailInvoice.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{fmtMoney(item.price * item.quantity, detailInvoice.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span>{fmtMoney(detailInvoice.subtotal, detailInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">ITBIS (18%)</span>
                  <span>{fmtMoney(detailInvoice.tax, detailInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-lg pt-1">
                  <span>Total</span>
                  <span className="text-red-600">{fmtMoney(detailInvoice.total, detailInvoice.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
