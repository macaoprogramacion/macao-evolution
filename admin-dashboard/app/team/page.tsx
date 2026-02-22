"use client"

import { useState } from "react"
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  UserPlus,
  Edit,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"

// Posiciones disponibles
const positions = [
  { value: "atencion-cliente", label: "Atención al Cliente" },
  { value: "ventas", label: "Ventas" },
  { value: "fotografo", label: "Fotógrafo" },
  { value: "cajero-fotografia", label: "Cajero de Fotografía" },
  { value: "operaciones-online", label: "Operaciones Online" },
  { value: "reserva-operaciones", label: "Reserva y Operaciones" },
]

// Colores para badges de posiciones
const positionColors: { [key: string]: string } = {
  "atencion-cliente": "bg-blue-100 text-blue-700",
  "ventas": "bg-green-100 text-green-700",
  "fotografo": "bg-purple-100 text-purple-700",
  "cajero-fotografia": "bg-yellow-100 text-yellow-700",
  "operaciones-online": "bg-orange-100 text-orange-700",
  "reserva-operaciones": "bg-red-100 text-red-700",
}

interface TeamMember {
  id: number
  name: string
  phone: string
  position: string
  positionLabel: string
  email: string
  avatar: string
  status: "active" | "inactive"
  joinDate: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: "Carlos Martínez",
      phone: "+1 809-555-0123",
      position: "ventas",
      positionLabel: "Ventas",
      email: "carlos.martinez@macaooffroad.com",
      avatar: "",
      status: "active",
      joinDate: "2025-01-15",
    },
    {
      id: 2,
      name: "Ana Rodríguez",
      phone: "+1 829-555-0456",
      position: "atencion-cliente",
      positionLabel: "Atención al Cliente",
      email: "ana.rodriguez@macaooffroad.com",
      avatar: "",
      status: "active",
      joinDate: "2025-02-01",
    },
    {
      id: 3,
      name: "Pedro García",
      phone: "+1 849-555-0789",
      position: "fotografo",
      positionLabel: "Fotógrafo",
      email: "pedro.garcia@macaooffroad.com",
      avatar: "",
      status: "active",
      joinDate: "2025-01-20",
    },
    {
      id: 4,
      name: "María López",
      phone: "+1 809-555-1234",
      position: "operaciones-online",
      positionLabel: "Operaciones Online",
      email: "maria.lopez@macaooffroad.com",
      avatar: "",
      status: "active",
      joinDate: "2025-01-10",
    },
    {
      id: 5,
      name: "Luis Fernández",
      phone: "+1 829-555-5678",
      position: "reserva-operaciones",
      positionLabel: "Reserva y Operaciones",
      email: "luis.fernandez@macaooffroad.com",
      avatar: "",
      status: "active",
      joinDate: "2025-02-05",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    position: "",
  })

  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone.includes(searchQuery) ||
    member.positionLabel.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleCreateUser = () => {
    if (!formData.name || !formData.phone || !formData.position) {
      alert("Por favor completa todos los campos")
      return
    }

    const positionLabel = positions.find((p) => p.value === formData.position)?.label || ""
    
    const newMember: TeamMember = {
      id: teamMembers.length + 1,
      name: formData.name,
      phone: formData.phone,
      position: formData.position,
      positionLabel: positionLabel,
      email: `${formData.name.toLowerCase().replace(/\s+/g, ".")}@macaooffroad.com`,
      avatar: "",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    }

    setTeamMembers([...teamMembers, newMember])
    setFormData({ name: "", phone: "", position: "" })
    setIsCreateDialogOpen(false)
  }

  const handleEditUser = () => {
    if (!editingMember || !formData.name || !formData.phone || !formData.position) {
      alert("Por favor completa todos los campos")
      return
    }

    const positionLabel = positions.find((p) => p.value === formData.position)?.label || ""

    setTeamMembers(
      teamMembers.map((member) =>
        member.id === editingMember.id
          ? {
              ...member,
              name: formData.name,
              phone: formData.phone,
              position: formData.position,
              positionLabel: positionLabel,
              email: `${formData.name.toLowerCase().replace(/\s+/g, ".")}@macaooffroad.com`,
            }
          : member
      )
    )

    setFormData({ name: "", phone: "", position: "" })
    setEditingMember(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteUser = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      setTeamMembers(teamMembers.filter((member) => member.id !== id))
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      phone: member.phone,
      position: member.position,
    })
    setIsEditDialogOpen(true)
  }

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === "active").length,
    byPosition: positions.map((pos) => ({
      label: pos.label,
      count: teamMembers.filter((m) => m.position === pos.value).length,
    })),
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipo</h1>
            <p className="text-gray-600 mt-1">Gestión de usuarios y miembros del equipo</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa la información del nuevo miembro del equipo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="Ej: +1 809-555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posición</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una posición" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleCreateUser}>
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Miembros</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {stats.byPosition.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-600">{stat.label}:</span>
                    <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o posición..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Members Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                  Mostrando {filteredMembers.length} de {teamMembers.length} miembros
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {member.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${positionColors[member.position]} hover:${positionColors[member.position]}`}>
                          {member.positionLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.status === "active"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {member.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(member.joinDate).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(member.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron miembros</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Actualiza la información del miembro del equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  placeholder="Ej: Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Número de Teléfono</Label>
                <Input
                  id="edit-phone"
                  placeholder="Ej: +1 809-555-0123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Posición</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una posición" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleEditUser}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
