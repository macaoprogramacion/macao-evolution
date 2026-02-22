"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  User,
  Users,
  Calendar,
  Clock,
  Hotel,
  DollarSign,
  FileText,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { SellersLayout } from "@/components/sellers/sellers-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getRepById,
  experiences,
  hotels,
  pickupTimes,
  type Representative,
} from "@/lib/sellers-data"

export default function NewBookingPage() {
  const router = useRouter()
  const [rep, setRep] = useState<Representative | null>(null)

  // Form state
  const [travelerName, setTravelerName] = useState("")
  const [guestCount, setGuestCount] = useState(2)
  const [experience, setExperience] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [hotel, setHotel] = useState("")
  const [date, setDate] = useState("")
  const [salePrice, setSalePrice] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [notes, setNotes] = useState("")

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
  }, [router])

  // Auto-set base price when experience is selected
  useEffect(() => {
    if (experience) {
      const exp = experiences.find((e) => e.name === experience)
      if (exp) {
        setSalePrice(exp.basePrice)
      }
    }
  }, [experience])

  const selectedExperience = experiences.find((e) => e.name === experience)
  const amountPending = Math.max(0, salePrice - amountPaid)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!travelerName.trim()) {
      toast.error("Ingresa el nombre del viajero")
      return
    }
    if (!experience) {
      toast.error("Selecciona una experiencia")
      return
    }
    if (!pickupTime) {
      toast.error("Selecciona la hora de recogida")
      return
    }
    if (!hotel) {
      toast.error("Selecciona el hotel")
      return
    }
    if (!date) {
      toast.error("Selecciona la fecha")
      return
    }
    if (salePrice <= 0) {
      toast.error("El precio de venta debe ser mayor a 0")
      return
    }

    // In production, this would POST to an API
    toast.success("Reserva creada exitosamente", {
      description: `${travelerName} - ${experience}`,
    })

    router.push("/sellers/dashboard")
  }

  if (!rep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <SellersLayout repName={rep.name} repInitials={rep.initials}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Reserva</h1>
            <p className="text-sm text-gray-500">Registra una nueva reserva para un cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-orange-600" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="travelerName">Nombre del Viajero *</Label>
                  <Input
                    id="travelerName"
                    placeholder="Ej: John Smith"
                    value={travelerName}
                    onChange={(e) => setTravelerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestCount">Cantidad de Personas *</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Schedule */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Experiencia y Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Experiencia *</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona experiencia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {experiences.map((exp) => (
                      <SelectItem key={exp.name} value={exp.name}>
                        <span className="flex items-center gap-2">
                          {exp.name}
                          <span className="text-xs text-gray-400">({exp.category} — ${exp.basePrice})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedExperience && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {selectedExperience.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Precio base: ${selectedExperience.basePrice}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora de Recogida *</Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona horario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotel */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hotel className="w-4 h-4 text-orange-600" />
                Hotel de Recogida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Hotel *</Label>
                <Select value={hotel} onValueChange={setHotel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hotel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Venta (USD) *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Monto Pagado (USD)</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    min={0}
                    max={salePrice}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Payment summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio de venta</span>
                  <span className="font-medium">${salePrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagado</span>
                  <span className="font-medium text-green-600">${amountPaid}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Pendiente</span>
                  <span className={`font-bold ${amountPending > 0 ? "text-amber-600" : "text-green-600"}`}>
                    ${amountPending}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Tu comisión ({rep.commissionPercent}%)</span>
                  <span className="font-medium text-orange-600">
                    ${Math.round(salePrice * rep.commissionPercent / 100)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Idioma del viajero, peticiones especiales, detalles del grupo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <Link href="/dashboard">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
              <Save className="w-4 h-4 mr-2" />
              Crear Reserva
            </Button>
          </div>
        </form>
      </div>
    </SellersLayout>
  )
}
