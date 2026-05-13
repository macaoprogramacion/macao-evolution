"use client"

import { useState, useMemo } from "react"
import { Plus, X, Printer } from "lucide-react"
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
import { hotelDirectory } from "@/lib/hotel-locations"
import { getBuggyPickupSuggestion } from "@/lib/hotel-pickup-schedules"

interface PickupEntry {
  id: string
  hotel: string
  pickupTime: string
  agency: string
  customerName: string
  persons: number
  room: string
  buggyType: string
}

const BUGGY_TYPES = [
  "Single Buggy",
  "Double Buggy",
  "Triple Buggy",
  "Quad Buggy",
  "Moto",
]

export function DriverPickupSheet() {
  const [pickups, setPickups] = useState<PickupEntry[]>([])
  const [hotel, setHotel] = useState("")
  const [time, setTime] = useState("")
  const [agency, setAgency] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [persons, setPersons] = useState("1")
  const [room, setRoom] = useState("")
  const [buggyType, setBuggyType] = useState("")

  const hotelList = Object.keys(hotelDirectory).sort()
  const filteredHotels = useMemo(
    () => hotelList.filter((h) => h.toUpperCase().includes(hotel.toUpperCase())),
    [hotel, hotelList],
  )

  const suggestedTime = useMemo(() => {
    if (!hotel) return ""
    const suggestion = getBuggyPickupSuggestion(hotel)
    return suggestion?.pickupTime || ""
  }, [hotel])

  const handleAddPickup = () => {
    if (!hotel || !time || !agency || !customerName || !persons || !buggyType) {
      alert("Por favor completa todos los campos")
      return
    }

    const newEntry: PickupEntry = {
      id: Date.now().toString(),
      hotel,
      pickupTime: time,
      agency,
      customerName,
      persons: parseInt(persons),
      room,
      buggyType,
    }

    setPickups([...pickups, newEntry])
    setHotel("")
    setTime("")
    setAgency("")
    setCustomerName("")
    setPersons("1")
    setRoom("")
    setBuggyType("")
  }

  const handleRemovePickup = (id: string) => {
    setPickups(pickups.filter((p) => p.id !== id))
  }

  const handlePrint = () => {
    if (pickups.length === 0) {
      alert("Agrega al menos una recogida antes de imprimir")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = generatePrintHTML(pickups)
    printWindow.document.write(html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">Agregar Recogida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel */}
            <div className="space-y-1.5">
              <Label>Hotel *</Label>
              <div className="relative">
                <Input
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  placeholder="Busca el hotel..."
                  className="w-full"
                />
                {hotel && filteredHotels.length > 0 && (
                  <div className="absolute top-full left-0 right-0 border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredHotels.map((h) => (
                      <button
                        key={h}
                        onClick={() => {
                          setHotel(h)
                          setTime(suggestedTime)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                      >
                        {hotelDirectory[h]?.name || h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {suggestedTime && hotel && (
                <p className="text-xs text-blue-600">Sugerido: {suggestedTime}</p>
              )}
            </div>

            {/* Pickup Time */}
            <div className="space-y-1.5">
              <Label>Hora de Recogida *</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="07:30"
              />
            </div>

            {/* Agency */}
            <div className="space-y-1.5">
              <Label>Agencia *</Label>
              <Input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Nombre de la agencia"
              />
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <Label>Nombre del Cliente *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Persons */}
            <div className="space-y-1.5">
              <Label>Cantidad de Personas *</Label>
              <Input
                type="number"
                min="1"
                value={persons}
                onChange={(e) => setPersons(e.target.value)}
                placeholder="1"
              />
            </div>

            {/* Room */}
            <div className="space-y-1.5">
              <Label>Número de Habitación</Label>
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ej: 4231"
              />
            </div>

            {/* Buggy Type */}
            <div className="space-y-1.5">
              <Label>Tipo de Buggy *</Label>
              <Select value={buggyType} onValueChange={setBuggyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {BUGGY_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAddPickup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Recogida
          </Button>
        </CardContent>
      </Card>

      {/* Pickups List */}
      {pickups.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recogidas del Día ({pickups.length})</CardTitle>
            <Button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Hoja A4
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold">Hotel</th>
                    <th className="text-left py-3 px-2 font-semibold">Hora</th>
                    <th className="text-left py-3 px-2 font-semibold">Agencia</th>
                    <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                    <th className="text-center py-3 px-2 font-semibold">Personas</th>
                    <th className="text-left py-3 px-2 font-semibold">Hab.</th>
                    <th className="text-left py-3 px-2 font-semibold">Buggy</th>
                    <th className="text-center py-3 px-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((pickup) => (
                    <tr
                      key={pickup.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium">
                          {hotelDirectory[pickup.hotel]?.name || pickup.hotel}
                        </span>
                      </td>
                      <td className="py-3 px-2">{pickup.pickupTime}</td>
                      <td className="py-3 px-2">{pickup.agency}</td>
                      <td className="py-3 px-2">{pickup.customerName}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline">{pickup.persons}</Badge>
                      </td>
                      <td className="py-3 px-2">{pickup.room || "—"}</td>
                      <td className="py-3 px-2">{pickup.buggyType}</td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleRemovePickup(pickup.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
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

function generatePrintHTML(pickups: PickupEntry[]): string {
  const logoUrl = "/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png"
  const today = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const rows = pickups
    .map(
      (p) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${p.pickupTime}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.hotel}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.room || "—"}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.persons}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.agency}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.customerName}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.buggyType}</td>
    </tr>
  `,
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hoja de Recogida - MACAO</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
    }
    .container {
      max-width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 3px solid #dc2626;
      padding-bottom: 15px;
    }
    .logo {
      max-width: 120px;
      height: auto;
    }
    .header-info {
      text-align: right;
    }
    .header-info h1 {
      font-size: 24px;
      color: #dc2626;
      margin-bottom: 5px;
    }
    .header-info p {
      font-size: 12px;
      color: #666;
    }
    .date {
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #dc2626;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
    }
    td {
      border: 1px solid #ddd;
      padding: 8px;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      text-align: center;
      color: #666;
    }
    @media print {
      .container {
        box-shadow: none;
        max-width: 100%;
        height: auto;
        padding: 20mm;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="MACAO Logo" class="logo" />
      <div class="header-info">
        <h1>HOJA DE RECOGIDA</h1>
        <p>Operaciones de Transporte</p>
      </div>
    </div>
    
    <div class="date">Fecha: ${today}</div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">HORARIO</th>
          <th style="width: 25%;">HOTEL</th>
          <th style="width: 10%;">HAB.</th>
          <th style="width: 8%;">PAX</th>
          <th style="width: 20%;">AGENCIA</th>
          <th style="width: 17%;">CLIENTE</th>
          <th style="width: 20%;">BUGGY</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Impreso por: MACAO • ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
</body>
</html>
  `
}
