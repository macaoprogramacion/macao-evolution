"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSellerPortalSession } from "@/lib/sellers-session"
import { getDashboardSession } from "@/lib/dashboard-session"
import { setSellerPortalSession } from "@/lib/sellers-session"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const resolveSession = async () => {
      const session = await getSellerPortalSession()
      if (session) {
        router.replace("/sellers/dashboard")
        return
      }

      const dashboardSession = await getDashboardSession()
      if (dashboardSession?.role === "representante" && dashboardSession?.id && dashboardSession?.name) {
        const initials = dashboardSession.name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        await setSellerPortalSession({
          id: `REP-${String(dashboardSession.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
          name: dashboardSession.name,
          phone: dashboardSession.phone || "",
          email: dashboardSession.email || "",
          company: "Independiente",
          type: "local_seller",
          commissionPercent: 15,
          initials,
        })

        router.replace("/sellers/dashboard")
      }
    }

    void resolveSession()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-xl border bg-card p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Portal de Representantes</h1>
        <p className="text-sm text-muted-foreground">
          Tu sesion no esta activa. Inicia sesion desde el acceso principal para entrar al dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => router.refresh()} variant="outline">Reintentar</Button>
          <Link href="/">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">Ir al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
