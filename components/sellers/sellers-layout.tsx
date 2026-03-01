"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Plus, ClipboardList, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navigation = [
  { name: "Dashboard", href: "/sellers/dashboard", icon: LayoutDashboard },
  { name: "Nueva Reserva", href: "/sellers/dashboard/new-booking", icon: Plus },
  { name: "Mis Reservas", href: "/sellers/dashboard/bookings", icon: ClipboardList },
]

interface SellersLayoutProps {
  children: React.ReactNode
  repName?: string
  repInitials?: string
}

export function SellersLayout({ children, repName = "Representante", repInitials = "RP" }: SellersLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    localStorage.removeItem("sellers-rep-id")
    router.push("/sellers")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/sellers/dashboard" className="flex items-center gap-2">
            <Image
              src="/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png"
              alt="MACAO Logo"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
            <span className="font-title text-gray-900 hidden sm:inline">Sellers</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 ml-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-red-50 text-red-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-red-100 text-red-700">{repInitials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{repName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Salir</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  )
}
