"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Workflow, Package, Users, ClipboardList, ArrowRight, FileText, Handshake, UserCog, Menu, X, Lock, Navigation, PanelLeftClose, PanelLeft, Ship, Mountain, Sun, Moon, Camera, BarChart3, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { clearDashboardSession, getDashboardSession } from "@/lib/dashboard-session"
import { supabase } from "@/lib/supabase"

const navigation = [
  { name: "Operacion Buggy", href: "/admin/operation", icon: ClipboardList },
  { name: "Operación Saona", href: "/admin/operation-saona", icon: Ship },
  { name: "Operación Samaná", href: "/admin/operation-samana", icon: Mountain },
  { name: "Mis Recogidas", href: "/admin/chofer", icon: Navigation },
  { name: "Representantes", href: "/admin/representatives", icon: Handshake },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Fotografia", href: "/admin/photography", icon: Camera },
  { name: "Contabilidad", href: "/admin/contabilidad", icon: Calculator },
  { name: "Analíticas", href: "/admin/analiticas", icon: BarChart3 },
  { name: "Usuarios", href: "/admin/users", icon: UserCog },
]

// Role-based page access control
// admin and both have access to everything
// DO NOT add "/admin" here — it matches all subpaths via startsWith
const rolePageAccess: Record<string, string[]> = {
  operaciones: ["/admin/operation", "/admin/operation-saona", "/admin/operation-samana", "/admin/chofer"],
  chofer: ["/admin/chofer"],
  contabilidad: ["/admin", "/admin/contabilidad", "/admin/representatives", "/admin/photography", "/admin/analiticas", "/admin/users"],
}

function hasAccess(role: string, href: string, email?: string): boolean {
  if (email?.toLowerCase().includes("jonathan")) return true
  if (role === "admin" || role === "both") return true
  const allowed = rolePageAccess[role]
  if (!allowed) return false
  return allowed.some((path) => {
    if (path === "/admin") return href === "/admin"
    return href === path || href.startsWith(path + "/")
  })
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

type ClosureNotification = {
  id: string
  source: "photography" | "operations"
  href: string
  message: string
  createdAt: string
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname() || "/admin"
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [topSearch, setTopSearch] = useState("")
  const [sideSearch, setSideSearch] = useState("")
  const [closureNotifications, setClosureNotifications] = useState<ClosureNotification[]>([])

  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      const session = await getDashboardSession()
      if (!mounted) return

      if (session?.active) {
        setUserRole(session.role)
        setUserName(session.name || "")
        setUserEmail(session.email || "")
      } else {
        setUserRole("")
        setUserName("")
        setUserEmail("")
      }
    }

    void loadSession()

    const onStorageUpdate = () => {
      void loadSession()
    }

    window.addEventListener("macao-dashboard-session-changed", onStorageUpdate)
    return () => {
      mounted = false
      window.removeEventListener("macao-dashboard-session-changed", onStorageUpdate)
    }
  }, [])

  useEffect(() => {
    const isAccounting = userRole === "contabilidad"
    if (!isAccounting) {
      setClosureNotifications([])
      return
    }

    let mounted = true

    const parseOperationClosures = () => {
      if (typeof window === "undefined") return [] as ClosureNotification[]
      try {
        const raw = localStorage.getItem("macao_operation_closures")
        const parsed = raw ? JSON.parse(raw) : []
        if (!Array.isArray(parsed)) return [] as ClosureNotification[]
        return parsed
          .slice(0, 10)
          .map((entry: any) => ({
            id: String(entry.id || `operation-${entry.sentAt || Math.random()}`),
            source: "operations" as const,
            href: "/admin/operation",
            message: `Cierre de operaciones enviado (${Number(entry.totalRecords || 0)} registros).`,
            createdAt: String(entry.sentAt || new Date().toISOString()),
          }))
      } catch {
        return [] as ClosureNotification[]
      }
    }

    const loadClosureNotifications = async () => {
      const operationEntries = parseOperationClosures()

      const { data } = await supabase
        .from("photo_daily_closures")
        .select("closure_date, closed_by, closed_at, total_invoices")
        .order("closed_at", { ascending: false })
        .limit(10)

      const photographyEntries: ClosureNotification[] = (data || []).map((row: any) => ({
        id: `photo-${row.closure_date}-${row.closed_at || ""}`,
        source: "photography",
        href: "/admin/photography?tab=closures",
        message: `Caja de fotografía envió cierre (${Number(row.total_invoices || 0)} facturas).`,
        createdAt: String(row.closed_at || `${row.closure_date}T00:00:00.000Z`),
      }))

      const merged = [...photographyEntries, ...operationEntries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)

      if (mounted) {
        setClosureNotifications(merged)
      }
    }

    void loadClosureNotifications()

    const interval = window.setInterval(() => {
      void loadClosureNotifications()
    }, 45_000)

    const onStorage = (event: StorageEvent) => {
      if (event.key === "macao_operation_closures") {
        void loadClosureNotifications()
      }
    }

    const onOpsClosure = () => {
      void loadClosureNotifications()
    }

    const onPhotoClosure = () => {
      void loadClosureNotifications()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("macao-operation-closure-sent", onOpsClosure)
    window.addEventListener("macao-photo-closure-sent", onPhotoClosure)

    return () => {
      mounted = false
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("macao-operation-closure-sent", onOpsClosure)
      window.removeEventListener("macao-photo-closure-sent", onPhotoClosure)
    }
  }, [userRole])

  const accessibleNavigation = navigation.filter((item) => hasAccess(userRole || "", item.href, userEmail))

  const sidebarNavigation = accessibleNavigation.filter((item) => {
    if (!sideSearch.trim()) return true
    return item.name.toLowerCase().includes(sideSearch.toLowerCase())
  })

  const navigateByQuery = (rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase()
    if (!query) {
      router.push("/admin")
      return
    }

    const exact = accessibleNavigation.find((item) => item.name.toLowerCase() === query)
    if (exact) {
      router.push(exact.href)
      return
    }

    const partial = accessibleNavigation.find((item) => item.name.toLowerCase().includes(query))
    if (partial) {
      router.push(partial.href)
    }
  }

  const handleTopSearch = () => {
    navigateByQuery(topSearch)
  }

  const handleSideSearch = () => {
    navigateByQuery(sideSearch)
  }

  const handleSignOut = async () => {
    await clearDashboardSession()
    setUserRole("")
    setUserName("")
    setUserEmail("")
    router.push("/")
  }

  // Don't render until we know the role
  if (userRole === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Check if current page is accessible
  const currentPageAllowed = hasAccess(userRole || "", pathname, userEmail)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <Image
              src="/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png"
              alt="MACAO Logo"
              width={160}
              height={48}
              className="h-8 md:h-10 w-auto"
            />
            <span className="font-title text-gray-900 dark:text-gray-100 hidden sm:inline">Dashboard</span>
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
            <span>Dashboard</span> <span className="mx-1">/</span>
            <span className="capitalize">{pathname === "/admin" ? "dashboard" : pathname.replace("/admin/", "")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows, logs..."
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTopSearch()
              }}
              className="pl-10 w-48 md:w-64 lg:w-80 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0">
                <Bell className="w-4 h-4" />
                {closureNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {userRole === "contabilidad" ? (
                  closureNotifications.length > 0 ? (
                    closureNotifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        onClick={() => router.push(notification.href)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No hay cierres nuevos.
                    </DropdownMenuItem>
                  )
                ) : (
                  <>
                    {hasAccess(userRole || "", "/admin/operation", userEmail) && (
                      <DropdownMenuItem onClick={() => router.push("/admin/operation")}>
                        Operación Buggy lista para actualizar reservas.
                      </DropdownMenuItem>
                    )}
                    {hasAccess(userRole || "", "/admin/chofer", userEmail) && (
                      <DropdownMenuItem onClick={() => router.push("/admin/chofer")}>
                        Revisa Mis Recogidas y confirma salidas de choferes.
                      </DropdownMenuItem>
                    )}
                    {hasAccess(userRole || "", "/admin/photography", userEmail) && (
                      <DropdownMenuItem onClick={() => router.push("/admin/photography")}>
                        Analíticas de fotografía disponibles para revisión.
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>{(userName || "A").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{userName || "Usuario"}</div>
                <div className="text-xs text-gray-500 mt-1">{userEmail || "Sin correo"}</div>
                <div className="text-xs text-gray-500">Rol: {userRole || "Sin rol"}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => alert(`Perfil\n\nNombre: ${userName || "N/D"}\nCorreo: ${userEmail || "N/D"}\nRol: ${userRole || "N/D"}`)}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Settings\n\nConfiguracion de cuenta disponible en la siguiente iteracion.")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("mailto:info@macaooffroad.com?subject=Soporte%20Dashboard", "_blank")}>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:-translate-x-full lg:w-0 lg:border-0" : "lg:translate-x-0 lg:w-60"} fixed lg:sticky top-16 left-0 z-20 w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-200 ease-in-out`}>
          <div className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search anything..."
                value={sideSearch}
                onChange={(e) => setSideSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSideSearch()
                }}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6"
                onClick={handleSideSearch}
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <nav className="space-y-1">
              {sidebarNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const allowed = hasAccess(userRole || "", item.href, userEmail)
                
                // Hide pages the user cannot access
                if (!allowed) return null

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center w-full justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex mb-2 -mt-2 shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
          {currentPageAllowed ? children : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Acceso restringido</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                Tu rol de <span className="font-medium capitalize">{userRole || "sin rol"}</span> no tiene permiso para acceder a esta sección.
              </p>
              <Button onClick={() => router.push("/admin")} variant="outline">
                Volver al inicio
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
