"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PhotographyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Admin Photography] Page error:", error)
  }, [error])

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Error al cargar Fotografía
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          {error.message || "Ocurrió un error inesperado al cargar la página."}
        </p>
        <Button onClick={reset} variant="outline" className="mt-4">
          <RotateCcw className="w-4 h-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    </DashboardLayout>
  )
}
