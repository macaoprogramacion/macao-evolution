import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MOR Dashboard - Tour Experiences Management',
  description: 'Dashboard administrativo para gestión de tours y experiencias',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
