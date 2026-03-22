"use client"

import DashboardAuthGate from '@/components/photographer/DashboardAuthGate'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGate allowedRoles={["both", "admin", "operaciones", "chofer", "contabilidad"]}>
      {children}
    </DashboardAuthGate>
  )
}
