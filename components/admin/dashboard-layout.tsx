"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Home, Workflow, BarChart3, Package, Users, ClipboardList, ArrowRight, FileText, Handshake, UserCog, Menu, X, Lock } from "lucide-react"
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

const navigation = [
  { name: "Overview", href: "/admin", icon: Home },
  { name: "Operation", href: "/admin/operation", icon: ClipboardList },
  { name: "Representantes", href: "/admin/representatives", icon: Handshake },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Team", href: "/admin/team", icon: Users },
  { name: "Usuarios", href: "/admin/users", icon: UserCog },
  { name: "Workflows", href: "/admin/workflows", icon: Workflow },
  { name: "Templates", href: "/admin/templates", icon: FileText },
]

// Role-based page access control
// admin and both have access to everything
// DO NOT add "/admin" here — it matches all subpaths via startsWith
const rolePageAccess: Record<string, string[]> = {
  operaciones: ["/admin/operation"],
  chofer: ["/admin/operation"],
  contabilidad: ["/admin/analytics", "/admin/products"],
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
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Check if current page is accessible
  const currentPageAllowed = hasAccess(userRole, pathname)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-3 md:px-6 flex items-center justify-between sticky top-0 z-30">
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
              src="/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png"
              alt="MACAO Logo"
              width={160}
              height={48}
              className="h-8 md:h-10 w-auto"
            />
            <span className="font-title text-gray-900 hidden sm:inline">Dashboard</span>
          </Link>
          <div className="text-sm text-gray-500 hidden md:block">
            <span>Dashboard</span> <span className="mx-1">/</span>
            <span className="capitalize">{pathname === "/admin" ? "Overview" : pathname.replace("/admin/", "")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows, logs..."
              className="pl-10 w-48 md:w-64 lg:w-80 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
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
        } lg:translate-x-0 fixed lg:sticky top-16 left-0 z-20 w-60 shrink-0 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] overflow-y-auto transition-transform duration-200 ease-in-out`}>
          <div className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search anything..." className="pl-10 bg-gray-50 border-gray-200 text-sm" />
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
                      isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "text-gray-600 hover:bg-gray-50"
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
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 bg-gray-50 overflow-x-auto">
          {currentPageAllowed ? children : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso restringido</h2>
              <p className="text-gray-500 max-w-sm mb-6">
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
