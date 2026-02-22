"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Handshake, LogIn, User, Building2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// ─── Representatives (mock) ───────────────────────────────────────
const representatives = [
  {
    id: "REP-001",
    name: "Carlos Méndez",
    company: "Excursiones Punta Cana",
    type: "Tour Operador",
    hotel: "Hard Rock Hotel & Casino",
    phone: "+1 809-555-1001",
    initials: "CM",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "REP-002",
    name: "Ana Rodríguez",
    company: "Viajes Dominicanos",
    type: "Agencia",
    hotel: "",
    phone: "+1 829-555-2002",
    initials: "AR",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "REP-003",
    name: "Miguel Torres",
    company: "Barceló Concierge",
    type: "Concierge de Hotel",
    hotel: "Barceló Bávaro Palace",
    phone: "+1 849-555-3003",
    initials: "MT",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "REP-004",
    name: "Laura Peña",
    company: "Independiente",
    type: "Vendedor Local",
    hotel: "",
    phone: "+1 809-555-4004",
    initials: "LP",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "REP-005",
    name: "Fernando Rosario",
    company: "Dreams Concierge",
    type: "Concierge de Hotel",
    hotel: "Dreams Macao Beach",
    phone: "+1 829-555-5005",
    initials: "FR",
    color: "bg-rose-100 text-rose-700",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = representatives.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  )

  function selectRep(repId: string) {
    // In production this would be a real auth flow
    localStorage.setItem("sellers-rep-id", repId)
    router.push("/sellers/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MACAO Sellers Portal</h1>
          <p className="text-gray-500 mt-2">Portal de ventas para representantes</p>
        </div>

        {/* Select Representative */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="w-5 h-5 text-orange-600" />
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
                  onClick={() => selectRep(rep.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={rep.color}>{rep.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                        {rep.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {rep.type}
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
                  <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
