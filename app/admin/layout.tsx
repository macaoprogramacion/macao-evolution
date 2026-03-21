"use client"

// TEMPORARY BYPASS - Remove DashboardAuthGate to recover admin access
// import DashboardAuthGate from '@/components/photographer/DashboardAuthGate'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // TODO: Restore DashboardAuthGate after recovering access
    // <DashboardAuthGate allowedRoles={["both", "admin", "operaciones", "chofer", "contabilidad"]}>
    <>
      {children}
    </>
    // </DashboardAuthGate>
  )
}
