"use client"

import { PortfolioProvider } from '@/context/PortfolioContext'

export default function PhotographerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortfolioProvider>
      {children}
    </PortfolioProvider>
  )
}
