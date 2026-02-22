"use client"

import { useState } from "react"
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Filter, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Calendar,
  Clock,
  Edit,
  Trash2,
  Copy,
  Settings,
  Bell,
  Mail,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/admin/dashboard-layout"

interface Workflow {
  id: number
  name: string
  description: string
  status: "active" | "paused" | "error"
  lastRun: string
  nextRun: string
  runs: number
  successRate: number
  avgDuration: string
  trigger: string
  actions: string[]
  notifications: boolean
}

const defaultWorkflows: Workflow[] = [
  {
    id: 1,
    name: "Confirmación de Reserva Automática",
    description: "Envía email automático cuando se realiza una nueva reserva de tour",
    status: "active",
    lastRun: "Hace 5 minutos",
    nextRun: "Continuo",
    runs: 347,
    successRate: 99.4,
    avgDuration: "8s",
    trigger: "Nueva reserva",
    actions: ["Enviar email", "Crear ticket", "Notificar WhatsApp"],
    notifications: true,
  },
  {
    id: 2,
    name: "Recordatorio de Tour 24h Antes",
    description: "Envía recordatorio a clientes 24 horas antes del tour",
    status: "active",
    lastRun: "Hace 1 hora",
    nextRun: "En 23 horas",
    runs: 892,
    successRate: 98.7,
    avgDuration: "12s",
    trigger: "24h antes del tour",
    actions: ["Email", "SMS", "WhatsApp"],
    notifications: true,
  },
  {
    id: 3,
    name: "Seguimiento Post-Tour",
    description: "Solicita reseñas y feedback después de completar el tour",
    status: "active",
    lastRun: "Hace 3 horas",
    nextRun: "En 21 horas",
    runs: 456,
    successRate: 95.2,
    avgDuration: "15s",
    trigger: "2h después del tour",
    actions: ["Email de agradecimiento", "Solicitar review", "Cupón descuento"],
    notifications: false,
  },
  {
    id: 4,
    name: "Actualización de Inventario",
    description: "Actualiza disponibilidad de tours según reservas",
    status: "active",
    lastRun: "Hace 2 minutos",
    nextRun: "Continuo",
    runs: 1247,
    successRate: 99.9,
    avgDuration: "3s",
    trigger: "Nueva reserva/cancelación",
    actions: ["Actualizar base de datos", "Sincronizar calendario"],
    notifications: false,
  },
  {
    id: 5,
    name: "Reporte Diario de Ventas",
    description: "Genera y envía reporte de ventas del día al equipo",
    status: "paused",
    lastRun: "Hace 1 día",
    nextRun: "Pausado",
    runs: 234,
    successRate: 100,
    avgDuration: "25s",
    trigger: "Diario a las 8:00 PM",
    actions: ["Generar PDF", "Enviar por email"],
    notifications: true,
  },
]

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [workflows, setWorkflows] = useState<Workflow[]>(defaultWorkflows)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger: "manual",
    actions: "",
    notifications: false,
  })

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleStatus = (id: number) => {
    setWorkflows(workflows.map(w => 
      w.id === id 
        ? { ...w, status: w.status === "active" ? "paused" : "active" as "active" | "paused" }
        : w
    ))
  }

  const handleDeleteWorkflow = (id: number) => {
    setWorkflows(workflows.filter(w => w.id !== id))
  }

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const newId = Math.max(...workflows.map(w => w.id)) + 1
    const duplicated = {
      ...workflow,
      id: newId,
      name: `${workflow.name} (Copia)`,
      status: "paused" as const,
    }
    setWorkflows([...workflows, duplicated])
  }

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.description) return
    
    const workflow: Workflow = {
      id: Math.max(...workflows.map(w => w.id)) + 1,
      name: newWorkflow.name,
      description: newWorkflow.description,
      status: "paused",
      lastRun: "Nunca",
      nextRun: "Pausado",
      runs: 0,
      successRate: 0,
      avgDuration: "0s",
      trigger: newWorkflow.trigger,
      actions: newWorkflow.actions.split(",").map(a => a.trim()),
      notifications: newWorkflow.notifications,
    }
    
    setWorkflows([...workflows, workflow])
    setNewWorkflow({ name: "", description: "", trigger: "manual", actions: "", notifications: false })
    setIsCreateDialogOpen(false)
  }

  const activeCount = workflows.filter(w => w.status === "active").length
  const pausedCount = workflows.filter(w => w.status === "paused").length
  const errorCount = workflows.filter(w => w.status === "error").length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Automatizaciones</h1>
            <p className="text-gray-600 mt-1">Gestiona y personaliza tus workflows automáticos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Workflow</DialogTitle>
                  <DialogDescription>
                    Configura un nuevo workflow automatizado para tu negocio
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Workflow</Label>
                    <Input
                      id="name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                      placeholder="Ej: Confirmación de reserva"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newWorkflow.description}
                      onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                      placeholder="Describe qué hace este workflow..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trigger">Disparador</Label>
                    <Select value={newWorkflow.trigger} onValueChange={(value) => setNewWorkflow({...newWorkflow, trigger: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona cuándo se ejecuta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="nueva-reserva">Nueva reserva</SelectItem>
                        <SelectItem value="24h-antes">24h antes del tour</SelectItem>
                        <SelectItem value="post-tour">Después del tour</SelectItem>
                        <SelectItem value="diario">Diario</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="actions">Acciones (separadas por coma)</Label>
                    <Input
                      id="actions"
                      value={newWorkflow.actions}
                      onChange={(e) => setNewWorkflow({...newWorkflow, actions: e.target.value})}
                      placeholder="Ej: Enviar email, Crear ticket, Notificar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Notificaciones</Label>
                    <Switch
                      id="notifications"
                      checked={newWorkflow.notifications}
                      onCheckedChange={(checked) => setNewWorkflow({...newWorkflow, notifications: checked})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateWorkflow} className="bg-orange-600 hover:bg-orange-700">
                    Crear Workflow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{activeCount} Activos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{pausedCount} Pausados</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{errorCount} Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="grid gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{workflow.name}</h3>
                      <Badge
                        variant="secondary"
                        className={
                          workflow.status === "active"
                            ? "bg-green-100 text-green-700"
                            : workflow.status === "paused"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {workflow.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {workflow.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                        {workflow.status === "error" && <XCircle className="w-3 h-3 mr-1" />}
                        {workflow.status === "active" ? "Activo" : workflow.status === "paused" ? "Pausado" : "Error"}
                      </Badge>
                      {workflow.notifications && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          <Bell className="w-3 h-3 mr-1" />
                          Notificaciones
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500 block mb-1">Última Ejecución</span>
                        <div className="font-medium text-gray-900">{workflow.lastRun}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Próxima Ejecución</span>
                        <div className="font-medium text-gray-900">{workflow.nextRun}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Ejecuciones</span>
                        <div className="font-medium text-gray-900">{workflow.runs}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Tasa de Éxito</span>
                        <div className="font-medium text-green-600">{workflow.successRate}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Duración Promedio</span>
                        <div className="font-medium text-gray-900">{workflow.avgDuration}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Disparador:</span> {workflow.trigger}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Acciones:</span> {workflow.actions.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 bg-white"
                      onClick={() => handleToggleStatus(workflow.id)}
                    >
                      {workflow.status === "active" ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Activar
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Configurar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          Ver Historial
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron workflows</h3>
              <p className="text-gray-600 mb-4">Intenta con otros términos de búsqueda</p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Automatiza tu Negocio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Los workflows te permiten automatizar tareas repetitivas y mejorar la experiencia de tus clientes. 
              Crea workflows personalizados para:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-orange-600 mt-1" />
                <span>Enviar confirmaciones y recordatorios automáticos</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-orange-600 mt-1" />
                <span>Solicitar feedback y reseñas después de cada tour</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-orange-600 mt-1" />
                <span>Actualizar disponibilidad en tiempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="w-4 h-4 text-orange-600 mt-1" />
                <span>Recibir notificaciones de eventos importantes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
