"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Camera,
  DollarSign,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  XCircle,
  KeyRound,
  UserPlus,
  MoreHorizontal,
  AlertTriangle,
  Settings,
  Car,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getSupabaseUsers,
  addSupabaseUser,
  updateSupabaseUser,
  deleteSupabaseUser,
} from "@/lib/supabase-users"
import type { DashboardUser } from "@/lib/supabase-users"

type UserRole = "billing" | "photographer" | "both" | "admin" | "operaciones" | "chofer" | "contabilidad" | "representante"

const roleLabels: Record<UserRole, string> = {
  billing: "Billing (Cajero)",
  photographer: "Photographer Dashboard",
  both: "Billing + Photographer",
  admin: "Admin",
  operaciones: "Operaciones",
  chofer: "Chofer",
  contabilidad: "Contabilidad",
  representante: "Representante",
}

const roleIcons: Record<UserRole, typeof DollarSign> = {
  billing: DollarSign,
  photographer: Camera,
  both: Shield,
  admin: Shield,
  operaciones: Settings,
  chofer: Car,
  contabilidad: Calculator,
  representante: UserPlus,
}

const roleBadgeColors: Record<UserRole, string> = {
  billing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  photographer: "bg-violet-50 text-violet-700 border-violet-200",
  both: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-red-50 text-red-700 border-red-200",
  operaciones: "bg-blue-50 text-blue-700 border-blue-200",
  chofer: "bg-sky-50 text-sky-700 border-sky-200",
  contabilidad: "bg-orange-50 text-orange-700 border-orange-200",
  representante: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function UsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null)
  const [showPin, setShowPin] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "billing" as UserRole,
    pin: generatePin(),
  })

  useEffect(() => {
    getSupabaseUsers().then(setUsers)
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.includes(search)
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.active).length
    const billing = users.filter((u) => u.role === "billing" || u.role === "both").length
    const photographer = users.filter((u) => u.role === "photographer" || u.role === "both").length
    return { total, active, billing, photographer }
  }, [users])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "billing",
      pin: generatePin(),
    })
    setShowPin(false)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.pin || !formData.email) return
    const updated = await addSupabaseUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      pin: formData.pin,
    })
    setUsers(updated)
    setShowCreateDialog(false)
    resetForm()
  }

  const handleEdit = async () => {
    if (!selectedUser || !formData.name || !formData.email) return
    const updated = await updateSupabaseUser(selectedUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
    })
    setUsers(updated)
    setShowEditDialog(false)
    setSelectedUser(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    const updated = await deleteSupabaseUser(selectedUser.id)
    setUsers(updated)
    setShowDeleteDialog(false)
    setSelectedUser(null)
  }

  const handleToggleActive = async (user: DashboardUser) => {
    const updated = await updateSupabaseUser(user.id, { active: !user.active })
    setUsers(updated)
  }

  const handleResetPin = async () => {
    if (!selectedUser) return
    const newPin = generatePin()
    const updated = await updateSupabaseUser(selectedUser.id, { pin: newPin })
    setUsers(updated)
    setFormData((prev) => ({ ...prev, pin: newPin }))
    setShowPin(true)
  }

  const openEdit = (user: DashboardUser) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      pin: user.pin,
    })
    setShowEditDialog(true)
  }

  const openPinDialog = (user: DashboardUser) => {
    setSelectedUser(user)
    setFormData((prev) => ({ ...prev, pin: user.pin }))
    setShowPin(false)
    setShowPinDialog(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra los usuarios con acceso a Billing y Photographer Dashboard
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Usuarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
                  <p className="text-xs text-gray-500">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.billing}</p>
                  <p className="text-xs text-gray-500">Acceso Billing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.photographer}</p>
                  <p className="text-xs text-gray-500">Acceso Photographer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="billing">Billing (Cajero)</SelectItem>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="both">Billing + Photographer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operaciones">Operaciones</SelectItem>
                  <SelectItem value="chofer">Chofer</SelectItem>
                  <SelectItem value="contabilidad">Contabilidad</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios Registrados</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay usuarios registrados</p>
                <p className="text-sm text-gray-400 mt-1">
                  Crea el primer usuario para dar acceso a los dashboards
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    resetForm()
                    setShowCreateDialog(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Rol / Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role as UserRole]
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.name}</p>
                              <p className="text-xs text-gray-400">ID: {user.id.slice(-6)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-700 dark:text-gray-300">{user.email || "—"}</p>
                            <p className="text-xs text-gray-400">{user.phone || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${roleBadgeColors[user.role as UserRole]} text-xs font-medium`}
                          >
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className="cursor-pointer"
                          >
                            {user.active ? (
                              <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(user.created_at || '').toLocaleDateString("es-DO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPinDialog(user)}>
                                <KeyRound className="w-4 h-4 mr-2" />
                                Ver / Resetear PIN
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                {user.active ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ====== CREATE USER DIALOG ====== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Asigna acceso a Billing y/o Photographer Dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre Completo *</Label>
              <Input
                id="create-name"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Teléfono</Label>
                <Input
                  id="create-phone"
                  placeholder="+1 809 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol / Acceso *</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Billing (Cajero)
                    </div>
                  </SelectItem>
                  <SelectItem value="photographer">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-violet-600" />
                      Photographer Dashboard
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      Billing + Photographer
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="operaciones">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      Operaciones
                    </div>
                  </SelectItem>
                  <SelectItem value="chofer">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-sky-600" />
                      Chofer
                    </div>
                  </SelectItem>
                  <SelectItem value="contabilidad">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-orange-600" />
                      Contabilidad
                    </div>
                  </SelectItem>
                  <SelectItem value="representante">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-fuchsia-600" />
                      Representante
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PIN de Acceso *</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPin ? "text" : "password"}
                    value={formData.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setFormData({ ...formData, pin: val })
                    }}
                    maxLength={6}
                    className="pr-10 font-mono text-lg tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, pin: generatePin() })}
                >
                  Generar
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Código numérico de 4-6 dígitos. El usuario lo usará junto con su correo para ingresar al dashboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.pin || !formData.email}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== EDIT USER DIALOG ====== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol / Acceso *</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing (Cajero)</SelectItem>
                  <SelectItem value="photographer">Photographer Dashboard</SelectItem>
                  <SelectItem value="both">Billing + Photographer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operaciones">Operaciones</SelectItem>
                  <SelectItem value="chofer">Chofer</SelectItem>
                  <SelectItem value="contabilidad">Contabilidad</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || !formData.email}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== PIN DIALOG ====== */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>PIN de Acceso</DialogTitle>
            <DialogDescription>
              PIN actual de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg px-6 py-4 border">
              <KeyRound className="w-5 h-5 text-gray-400" />
              <span className="font-mono text-3xl tracking-[0.3em] text-gray-900 dark:text-gray-100">
                {showPin ? formData.pin : "••••"}
              </span>
              <button
                onClick={() => setShowPin(!showPin)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleResetPin} className="flex-1">
              <KeyRound className="w-4 h-4 mr-2" />
              Generar Nuevo PIN
            </Button>
            <Button onClick={() => setShowPinDialog(false)} className="flex-1">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== DELETE CONFIRMATION ====== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar a <strong>{selectedUser?.name}</strong>? Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
