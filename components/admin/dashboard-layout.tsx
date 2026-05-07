"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Home, Workflow, Package, Users, ClipboardList, ArrowRight, FileText, Handshake, UserCog, Menu, X, Lock, Navigation, PanelLeftClose, PanelLeft, Ship, Mountain, Sun, Moon, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

const navigation = [
  { name: "Overview", href: "/admin", icon: Home },
  { name: "Operation", href: "/admin/operation", icon: ClipboardList },
  { name: "Operación Saona", href: "/admin/operation-saona", icon: Ship },
  { name: "Operación Samaná", href: "/admin/operation-samana", icon: Mountain },
  { name: "Mis Recogidas", href: "/admin/chofer", icon: Navigation },
  { name: "Representantes", href: "/admin/representatives", icon: Handshake },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Fotografia", href: "/admin/photography", icon: Camera },
  { name: "Usuarios", href: "/admin/users", icon: UserCog },
]

// Role-based page access control
// admin and both have access to everything
// DO NOT add "/admin" here — it matches all subpaths via startsWith
const rolePageAccess: Record<string, string[]> = {
  operaciones: ["/admin/operation", "/admin/operation-saona", "/admin/operation-samana"],
  chofer: ["/admin/chofer"],
  contabilidad: ["/admin/products"],
}

function hasAccess(role: string, href: string): boolean {
  if (role === "admin" || role === "both") return true
  const allowed = rolePageAccess[role]
  if (!allowed) return false
  return allowed.some((path) => href === path || href.startsWith(path + "/"))
}

function getSessionRole(): { role: string; name: string } | null {
  try {
    const session = JSON.parse(sessionStorage.getItem("macao_auth_session") || "null")
    if (session && session.active) {
      return { role: session.role, name: session.name }
    }
  } catch {}
  return null
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname() || "/admin"
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    const session = getSessionRole()
    if (session) {
      setUserRole(session.role)
      setUserName(session.name)
    } else {
      setUserRole("admin") // fallback if no session (bypass mode)
    }
  }, [])

  // Don't render until we know the role
  if (userRole === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Check if current page is accessible
  const currentPageAllowed = hasAccess(userRole, pathname)

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
            <span className="capitalize">{pathname === "/admin" ? "Overview" : pathname.replace("/admin/", "")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows, logs..."
              className="pl-10 w-48 md:w-64 lg:w-80 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="ghost" size="icon" className="relative shrink-0">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>AE</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userName || "Admin MOR"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
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
              <Input placeholder="Search anything..." className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = item.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname.startsWith(item.href)
                const allowed = hasAccess(userRole, item.href)
                
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
                Tu rol de <span className="font-medium capitalize">{userRole}</span> no tiene permiso para acceder a esta sección.
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
