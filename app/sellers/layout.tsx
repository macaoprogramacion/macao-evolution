import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MACAO Sellers Portal - Representantes',
  description: 'Portal de ventas para representantes de MACAO Offroad Experience',
}

export default function SellersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
