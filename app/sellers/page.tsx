"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LogIn, User, Building2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAllRepresentatives, type Representative } from "@/lib/sellers-data"
import { setSellerPortalSession } from "@/lib/sellers-session"

function getRepLabel(type: Representative["type"]) {
  switch (type) {
    case "tour_operator": return "Tour Operador"
    case "agency": return "Agencia"
    case "hotel_concierge": return "Concierge de Hotel"
    default: return "Vendedor Local"
  }
}

function getRepColor(type: Representative["type"]) {
  switch (type) {
    case "tour_operator": return "bg-blue-100 text-blue-700"
    case "agency": return "bg-emerald-100 text-emerald-700"
    case "hotel_concierge": return "bg-purple-100 text-purple-700"
    default: return "bg-amber-100 text-amber-700"
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const representatives = getAllRepresentatives()

  const filtered = representatives.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  )

  async function selectRep(rep: Representative) {
    await setSellerPortalSession(rep)
    router.push("/sellers/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png"
              alt="MACAO Logo"
              width={260}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-title text-gray-900">Sellers Portal</h1>
          <p className="text-gray-500 mt-2 font-[family-name:var(--font-montserrat)]">Portal de ventas para representantes</p>
        </div>

        {/* Select Representative */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="w-5 h-5 text-red-600" />
              Selecciona tu perfil
            </CardTitle>
            <CardDescription>
              Elige tu cuenta de representante para acceder al portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o empresa..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Rep List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => selectRep(rep)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all text-left group"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={getRepColor(rep.type)}>{rep.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                        {rep.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {getRepLabel(rep.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {rep.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {rep.phone}
                      </span>
                    </div>
                    {rep.hotel && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Hotel base: {rep.hotel}
                      </div>
                    )}
                  </div>
                  <div className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogIn className="w-5 h-5" />
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-2" />
                  <p>No se encontraron representantes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          MACAO Offroad Experience &copy; {new Date().getFullYear()} — Portal de Representantes v1.0
        </p>
      </div>
    </div>
  )
}
