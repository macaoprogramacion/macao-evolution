"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { insertBillingRecord, getTodayBillingRecords, updateBillingRecord, deleteBillingRecord } from "@/lib/billing-records"
import { sendNotificationToDriver } from "@/lib/driver-notifications"
import type { BillingRecord as DBBillingRecord } from "@/lib/billing-records"
import { supabase } from "@/lib/supabase"

interface BillingRecord {
  id: string
  type: "pago_al_llegar" | "credito_vendedor" | "venta_directa"
  clientName: string
  phone: string
  currency: "USD" | "DOP" | "EUR" | "GBP"
  amount: number
  paymentMethod: "tarjeta" | "paypal" | "efectivo"
  courtesy: boolean
  serviceType: string
  status: "pendiente" | "pagado" | "cancelado"
  date: string
  notes: string
  vendorName?: string
}

const SERVICE_OPTIONS = [
  "Single Buggy",
  "Doble Buggy",
  "Family Buggy",
  "Single Moto",
  "Doble Moto",
  "15 Min Caballos + Doble Buggy",
  "15 Min Caballos + Family Buggy",
  "Sunset Ride",
  "Full Ride",
]

const CURRENCY_SYMBOLS: Record<"USD" | "DOP" | "EUR" | "GBP", string> = {
  USD: "US$",
  DOP: "RD$",
  EUR: "EUR",
  GBP: "GBP",
}

const PAYMENT_METHOD_LABELS: Record<"tarjeta" | "paypal" | "efectivo", string> = {
  tarjeta: "Pago con Tarjeta",
  paypal: "PayPal",
  efectivo: "Efectivo",
}

const TYPE_LABELS: Record<string, string> = {
  pago_al_llegar: "Pago al Llegar",
  credito_vendedor: "Crédito Vendedor",
  venta_directa: "Venta Directa Rancho",
}

const TYPE_COLORS: Record<string, string> = {
  pago_al_llegar: "bg-yellow-100 text-yellow-800",
  credito_vendedor: "bg-blue-100 text-blue-800",
  venta_directa: "bg-green-100 text-green-800",
}

export function BillingCollections() {
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [closureFeedback, setClosureFeedback] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([])
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [isSendingToDriver, setIsSendingToDriver] = useState(false)

  // Form state
  const [type, setType] = useState<"pago_al_llegar" | "credito_vendedor" | "venta_directa">("pago_al_llegar")
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [currency, setCurrency] = useState<"USD" | "DOP" | "EUR" | "GBP">("USD")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"tarjeta" | "paypal" | "efectivo">("efectivo")
  const [courtesy, setCourtesy] = useState(false)
  const [serviceType, setServiceType] = useState("")
  const [notes, setNotes] = useState("")

  // Load records from Supabase on mount
  useEffect(() => {
    const loadRecords = async () => {
      setIsLoading(true)
      try {
        const dbRecords = await getTodayBillingRecords()
        const mapped = dbRecords.map((r: DBBillingRecord) => ({
          id: r.id,
          type: r.type,
          clientName: r.client_name,
          phone: r.phone || "",
          currency: r.currency,
          amount: r.amount,
          paymentMethod: r.payment_method,
          courtesy: r.courtesy,
          serviceType: r.service_type,
          status: r.status,
          date: r.date,
          notes: r.notes || "",
          vendorName: r.vendor_name,
        }))
        setRecords(mapped)
      } catch (err) {
        console.error("Error loading billing records:", err)
      } finally {
        setIsLoading(false)
      }
    }

    void loadRecords()
  }, [])

  // Load available drivers on mount
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from("dashboard_users")
          .select("id, name")
          .eq("role", "chofer")
          .eq("active", true)
          .order("name");
        
        if (error) throw error;
        setDrivers(data || []);
      } catch (err) {
        console.error("Error loading drivers:", err);
      }
    }

    void loadDrivers()
  }, [])

  const supportsMultiCurrency = type === "pago_al_llegar" || type === "venta_directa"

  const formatMoney = (code: "USD" | "DOP" | "EUR" | "GBP", value: number) => {
    const locale = code === "DOP" ? "es-DO" : "en-US"
    return `${CURRENCY_SYMBOLS[code]} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleAddRecord = async () => {
    if (!clientName || !amount || !serviceType || (type === "credito_vendedor" && !vendorName)) {
      alert("Por favor completa los campos requeridos")
      return
    }

    setIsSaving(true)
    try {
      const recordCurrency = supportsMultiCurrency ? currency : "USD"

      await insertBillingRecord({
        type,
        client_name: clientName,
        phone: phone || null,
        currency: recordCurrency,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        courtesy,
        service_type: serviceType,
        status: "pendiente",
        date: new Date().toISOString().slice(0, 10),
        notes,
        vendor_name: type === "credito_vendedor" ? vendorName : null,
      })

      // Reload records from DB
      const updatedRecords = await getTodayBillingRecords()
      const mapped = updatedRecords.map((r: DBBillingRecord) => ({
        id: r.id,
        type: r.type,
        clientName: r.client_name,
        phone: r.phone || "",
        currency: r.currency,
        amount: r.amount,
        paymentMethod: r.payment_method,
        courtesy: r.courtesy,
        serviceType: r.service_type,
        status: r.status,
        date: r.date,
        notes: r.notes || "",
        vendorName: r.vendor_name,
      }))
      setRecords(mapped)
      resetForm()
    } catch (err) {
      console.error("Error saving record:", err)
      const message = err instanceof Error ? err.message : "Error desconocido"
      alert(`No se pudo guardar el registro: ${message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setType("pago_al_llegar")
    setClientName("")
    setPhone("")
    setVendorName("")
    setCurrency("USD")
    setAmount("")
    setPaymentMethod("efectivo")
    setCourtesy(false)
    setServiceType("")
    setNotes("")
  }

  const handleUpdateStatus = async (id: string, newStatus: "pendiente" | "pagado" | "cancelado") => {
    setIsSaving(true)
    try {
      await updateBillingRecord(id, { status: newStatus })
      setRecords(
        records.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r,
        ),
      )
    } catch (err) {
      console.error("Error updating record:", err)
      alert("No se pudo actualizar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      return
    }

    setIsSaving(true)
    try {
      await deleteBillingRecord(id)
      setRecords(records.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Error deleting record:", err)
      alert("No se pudo eliminar el registro")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendToDriver = async () => {
    if (!selectedRecordId || !selectedDriverId) {
      alert("Selecciona un chofer")
      return
    }

    const record = records.find((r) => r.id === selectedRecordId)
    if (!record) return

    setIsSendingToDriver(true)
    try {
      const notificationType =
        record.type === "pago_al_llegar"
          ? "payment_received"
          : record.type === "credito_vendedor"
          ? "credit_issued"
          : "direct_sale"

      await sendNotificationToDriver(
        selectedDriverId,
        selectedRecordId,
        notificationType as any,
        record.clientName,
        record.amount,
        record.currency,
        record.phone,
        record.serviceType,
        record.notes
      )

      setSendDialogOpen(false)
      setSelectedRecordId(null)
      setSelectedDriverId("")
      alert("Notificación enviada al chofer exitosamente")
    } catch (err) {
      console.error("Error sending notification to driver:", err)
      alert("No se pudo enviar la notificación al chofer")
    } finally {
      setIsSendingToDriver(false)
    }
  }

  const handleSendOperationsClosure = () => {
    if (records.length === 0) {
      alert("No hay registros para enviar en el cierre de operaciones")
      return
    }

    const summary = {
      id: `ops-${Date.now()}`,
      sentAt: new Date().toISOString(),
      totalRecords: records.length,
      paid: records.filter((r) => r.status === "pagado").length,
      pending: records.filter((r) => r.status === "pendiente").length,
      cancelled: records.filter((r) => r.status === "cancelado").length,
      totalsByCurrency: {
        USD: records.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
        DOP: records.filter((r) => r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
        EUR: records.filter((r) => r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
        GBP: records.filter((r) => r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
      },
    }

    try {
      const currentRaw = typeof window !== "undefined" ? localStorage.getItem("macao_operation_closures") : "[]"
      const current = currentRaw ? JSON.parse(currentRaw) : []
      const next = Array.isArray(current) ? [summary, ...current].slice(0, 50) : [summary]
      localStorage.setItem("macao_operation_closures", JSON.stringify(next))
      window.dispatchEvent(new CustomEvent("macao-operation-closure-sent", { detail: summary }))
      setClosureFeedback("Cierre de operaciones enviado a contabilidad.")
      window.setTimeout(() => setClosureFeedback(""), 5000)
    } catch {
      alert("No se pudo enviar el cierre de operaciones")
    }
  }

  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === "pendiente").length,
    paid: records.filter((r) => r.status === "pagado").length,
    totalByCurrency: {
      USD: records.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
      DOP: records.filter((r) => r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
      EUR: records.filter((r) => r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
      GBP: records.filter((r) => r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
    },
    pendingByCurrency: {
      USD: records.filter((r) => r.status === "pendiente" && r.currency === "USD").reduce((sum, r) => sum + r.amount, 0),
      DOP: records.filter((r) => r.status === "pendiente" && r.currency === "DOP").reduce((sum, r) => sum + r.amount, 0),
      EUR: records.filter((r) => r.status === "pendiente" && r.currency === "EUR").reduce((sum, r) => sum + r.amount, 0),
      GBP: records.filter((r) => r.status === "pendiente" && r.currency === "GBP").reduce((sum, r) => sum + r.amount, 0),
    },
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pagados</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total por Moneda</p>
            <p className="text-sm font-semibold">{formatMoney("USD", stats.totalByCurrency.USD)}</p>
            <p className="text-sm font-semibold">{formatMoney("DOP", stats.totalByCurrency.DOP)}</p>
            <p className="text-sm font-semibold">{formatMoney("EUR", stats.totalByCurrency.EUR)}</p>
            <p className="text-sm font-semibold">{formatMoney("GBP", stats.totalByCurrency.GBP)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Por Cobrar por Moneda</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("USD", stats.pendingByCurrency.USD)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("DOP", stats.pendingByCurrency.DOP)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("EUR", stats.pendingByCurrency.EUR)}</p>
            <p className="text-sm font-semibold text-red-600">{formatMoney("GBP", stats.pendingByCurrency.GBP)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Cierre de operaciones</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Envía un resumen para notificar al usuario de contabilidad.</p>
          </div>
          <Button onClick={handleSendOperationsClosure}>Enviar cierre a contabilidad</Button>
        </CardContent>
      </Card>

      {closureFeedback ? (
        <div className="text-sm text-green-700 dark:text-green-400">{closureFeedback}</div>
      ) : null}

      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">Registrar Cobro/Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo de Transacción *</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_al_llegar">Pago al Llegar</SelectItem>
                  <SelectItem value="credito_vendedor">Crédito Vendedor</SelectItem>
                  <SelectItem value="venta_directa">Venta Directa Rancho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-1.5">
              <Label>Servicios *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona servicio" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <Label>Nombre Cliente *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 1234-5678"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label>Método de Pago *</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarjeta">Pago con Tarjeta</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Courtesy */}
            <div className="space-y-1.5">
              <Label>Cortesia (Opcional)</Label>
              <Select
                value={courtesy ? "si" : "no"}
                onValueChange={(val) => setCourtesy(val === "si")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Si, cubierta por el rancho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Name (if credito_vendedor) */}
            {type === "credito_vendedor" && (
              <div className="space-y-1.5">
                <Label>Nombre Vendedor *</Label>
                <Input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Nombre del vendedor"
                />
              </div>
            )}

            {/* Currency (only for pago_al_llegar and venta_directa) */}
            {supportsMultiCurrency && (
              <div className="space-y-1.5">
                <Label>Moneda *</Label>
                <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dolar (USD)</SelectItem>
                    <SelectItem value="DOP">Peso Dominicano (DOP)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">Libra Esterlina (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>Monto ({supportsMultiCurrency ? currency : "USD"}) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el cobro..."
              rows={2}
            />
          </div>

          <Button
            onClick={handleAddRecord}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Records List */}
      {records.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base">Registro de Transacciones ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-2 font-semibold">Servicio</th>
                    <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-2 font-semibold">Teléfono</th>
                    <th className="text-left py-3 px-2 font-semibold">Vendedor</th>
                    <th className="text-left py-3 px-2 font-semibold">Pago</th>
                    <th className="text-left py-3 px-2 font-semibold">Cortesia</th>
                    <th className="text-right py-3 px-2 font-semibold">Monto</th>
                    <th className="text-center py-3 px-2 font-semibold">Estado</th>
                    <th className="text-center py-3 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="py-3 px-2">
                        <Badge className={TYPE_COLORS[record.type]}>
                          {TYPE_LABELS[record.type]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{record.serviceType}</td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{record.clientName}</p>
                          {record.notes && <p className="text-xs text-gray-500">{record.notes}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-2">{record.phone || "—"}</td>
                      <td className="py-3 px-2">{record.vendorName || "—"}</td>
                      <td className="py-3 px-2">{PAYMENT_METHOD_LABELS[record.paymentMethod]}</td>
                      <td className="py-3 px-2">
                        {record.courtesy ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Cortesia</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatMoney(record.currency, record.amount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Select
                          value={record.status}
                          onValueChange={(v: any) => handleUpdateStatus(record.id, v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="pagado">Pagado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <Dialog open={sendDialogOpen && selectedRecordId === record.id} onOpenChange={(open) => {
                            setSendDialogOpen(open)
                            if (open) {
                              setSelectedRecordId(record.id)
                              setSelectedDriverId("")
                            }
                          }}>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => {
                                  setSelectedRecordId(record.id)
                                  setSendDialogOpen(true)
                                }}
                                className="text-blue-600 hover:text-blue-700 inline-flex"
                                title="Enviar a chofer"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Enviar a Chofer</DialogTitle>
                                <DialogDescription>
                                  Selecciona un chofer para enviarle la información de este cobro
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Cobro: {record.clientName}</p>
                                  <p className="text-sm text-gray-600">
                                    {formatMoney(record.currency, record.amount)} - {record.serviceType}
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Selecciona Chofer *</Label>
                                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Elige un chofer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {drivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                          {driver.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleSendToDriver}
                                  disabled={isSendingToDriver || !selectedDriverId}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  {isSendingToDriver ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Enviar Notificación
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700 inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
