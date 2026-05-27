"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDashboardSession } from "@/lib/dashboard-session"

const ROLE_DEFAULT_ROUTE: Record<string, string> = {
  admin: "/admin/operation",
  both: "/admin/operation",
  operaciones: "/admin/operation",
  chofer: "/admin/chofer",
  contabilidad: "/admin/contabilidad",
}

export default function AdminIndexRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const redirectToDefaultSection = async () => {
      const session = await getDashboardSession()
      if (!mounted) return

      if (!session?.active) {
        router.replace("/")
        return
      }

      const fallback = session.email?.toLowerCase().includes("jonathan")
        ? "/admin/operation"
        : "/admin/photography"

      const destination = ROLE_DEFAULT_ROUTE[session.role] || fallback
      router.replace(destination)
    }

    void redirectToDefaultSection()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-red-600 rounded-full animate-spin" />
    </div>
  )
}
