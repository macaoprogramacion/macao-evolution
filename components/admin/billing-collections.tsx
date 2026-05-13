"use client"

import { useState } from "react"
import { Plus, X, Edit2, Check, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

interface BillingRecord {
  id: string
  type: "pago_al_llegar" | "credito_vendedor" | "venta_directa"
  clientName: string
  phone: string
  amount: number
  status: "pendiente" | "pagado" | "cancelado"
  date: string
  notes: string
  vendorName?: string
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
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [type, setType] = useState<"pago_al_llegar" | "credito_vendedor" | "venta_directa">("pago_al_llegar")
  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const handleAddRecord = () => {
    if (!clientName || !amount || (type === "credito_vendedor" && !vendorName)) {
      alert("Por favor completa los campos requeridos")
      return
    }

    const newRecord: BillingRecord = {
      id: Date.now().toString(),
      type,
      clientName,
      phone,
      amount: parseFloat(amount),
      status: "pendiente",
      date: new Date().toISOString().slice(0, 10),
      notes,
      vendorName: type === "credito_vendedor" ? vendorName : undefined,
    }

    setRecords([newRecord, ...records])
    resetForm()
  }

  const resetForm = () => {
    setType("pago_al_llegar")
    setClientName("")
    setPhone("")
    setVendorName("")
    setAmount("")
    setNotes("")
  }

  const handleUpdateStatus = (id: string, newStatus: "pendiente" | "pagado" | "cancelado") => {
    setRecords(
      records.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r,
      ),
    )
  }

  const handleDelete = (id: string) => {
    setRecords(records.filter((r) => r.id !== id))
  }

  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === "pendiente").length,
    paid: records.filter((r) => r.status === "pagado").length,
    totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    pendingAmount: records.filter((r) => r.status === "pendiente").reduce((sum, r) => sum + r.amount, 0),
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Monto</p>
            <p className="text-2xl font-bold">
              US$ {stats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Por Cobrar</p>
            <p className="text-2xl font-bold text-red-600">
              US$ {stats.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

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

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>Monto (USD) *</Label>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar
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
                    <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-2 font-semibold">Teléfono</th>
                    <th className="text-left py-3 px-2 font-semibold">Vendedor</th>
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
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{record.clientName}</p>
                          {record.notes && <p className="text-xs text-gray-500">{record.notes}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-2">{record.phone || "—"}</td>
                      <td className="py-3 px-2">{record.vendorName || "—"}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        US$ {record.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700 inline-flex"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
