"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

const CREDIT_VENDORS = ["ANDY PERDOMO", "ANDY VALDEZ", "DAVID FELIX (BUEY TOUR)", "ALE HUERTA"]

interface BillingRecord {
  id: string
  vendor_name: string
  amount: number
  customer_amount: number | null
  date: string
  type: string
  status: string
}

interface VendorBalance {
  vendorName: string
  totalOwed: number
  totalInFavor: number
  netBalance: number
  recordCount: number
  lastUpdated: string
}

function formatMoney(amount: number) {
  return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calculateVendorBalance(records: BillingRecord[]): VendorBalance[] {
  const byVendor = new Map<string, { owed: number; inFavor: number; count: number }>()

  for (const vendor of CREDIT_VENDORS) {
    byVendor.set(vendor, { owed: 0, inFavor: 0, count: 0 })
  }

  for (const record of records) {
    if (record.type !== "credito_vendedor" || record.status === "cancelado") continue

    const vendor = record.vendor_name || ""
    if (!CREDIT_VENDORS.includes(vendor)) continue

    const operativeCost = record.amount
    const clientPayment = record.customer_amount || 0
    const current = byVendor.get(vendor) || { owed: 0, inFavor: 0, count: 0 }

    current.count += 1

    if (clientPayment === 0) {
      // No client payment: full operative cost charged as debt
      current.owed += operativeCost
    } else if (clientPayment > operativeCost) {
      // Client paid more than operative cost: difference goes in vendor's favor
      current.inFavor += clientPayment - operativeCost
    } else {
      // Client paid less than operative cost: remainder charged as debt
      current.owed += operativeCost - clientPayment
    }

    byVendor.set(vendor, current)
  }

  const today = new Date().toISOString().split("T")[0]

  return Array.from(byVendor.entries()).map(([vendorName, data]) => ({
    vendorName,
    totalOwed: data.owed,
    totalInFavor: data.inFavor,
    netBalance: data.inFavor - data.owed,
    recordCount: data.count,
    lastUpdated: today,
  }))
}

export function VendorReceivables() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [balances, setBalances] = useState<VendorBalance[]>([])

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("billing_records")
          .select("id, vendor_name, amount, customer_amount, date, type, status")
          .eq("type", "credito_vendedor")
          .order("date", { ascending: false })
          .limit(5000)

        if (error) throw error

        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          vendor_name: row.vendor_name || "",
          amount: Number(row.amount || 0),
          customer_amount: row.customer_amount != null ? Number(row.customer_amount) : null,
          date: row.date || "",
          type: row.type || "",
          status: row.status || "pendiente",
        }))

        setRecords(mapped)
        const computed = calculateVendorBalance(mapped)
        setBalances(computed)
      } catch (error) {
        console.error("Error loading vendor receivables:", error)
        setRecords([])
        setBalances([])
      } finally {
        setLoading(false)
      }
    }

    void loadRecords()

    const interval = window.setInterval(() => void loadRecords(), 15000)
    return () => window.clearInterval(interval)
  }, [])

  const totals = useMemo(() => {
    return {
      totalOwed: balances.reduce((sum, b) => sum + b.totalOwed, 0),
      totalInFavor: balances.reduce((sum, b) => sum + b.totalInFavor, 0),
      netBalance: balances.reduce((sum, b) => sum + b.netBalance, 0),
      totalRecords: records.length,
    }
  }, [balances, records])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando cuentas por cobrar...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Adeudado</p>
            <p className="text-2xl font-bold text-red-600">{formatMoney(totals.totalOwed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total a Favor</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(totals.totalInFavor)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Neto</p>
            <p
              className={`text-2xl font-bold ${totals.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatMoney(totals.netBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transacciones</p>
            <p className="text-2xl font-bold">{totals.totalRecords}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Cobrar - Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">Vendedor</th>
                  <th className="text-right py-3 px-4 font-semibold">Total Adeudado</th>
                  <th className="text-right py-3 px-4 font-semibold">Total a Favor</th>
                  <th className="text-right py-3 px-4 font-semibold">Saldo Neto</th>
                  <th className="text-center py-3 px-4 font-semibold">Transacciones</th>
                  <th className="text-center py-3 px-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {balances.length > 0 ? (
                  balances.map((balance) => (
                    <tr
                      key={balance.vendorName}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="py-3 px-4 font-medium">{balance.vendorName}</td>
                      <td className="py-3 px-4 text-right text-red-600 font-semibold">
                        {formatMoney(balance.totalOwed)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-semibold">
                        {formatMoney(balance.totalInFavor)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          balance.netBalance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatMoney(balance.netBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">{balance.recordCount}</td>
                      <td className="py-3 px-4 text-center">
                        {balance.netBalance > 0 ? (
                          <Badge className="bg-green-100 text-green-800">A Favor</Badge>
                        ) : balance.netBalance < 0 ? (
                          <Badge className="bg-red-100 text-red-800">Adeudado</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Saldo 0</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No hay registros de crédito vendedor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
