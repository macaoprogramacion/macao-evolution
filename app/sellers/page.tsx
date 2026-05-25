"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  useEffect(() => {
    router.push("/sellers/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirigiendo al panel de ventas...</p>
    </div>
  )
}
