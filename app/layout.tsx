import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

const montserrat = localFont({
  src: [
    { path: '../public/font/montserrat/Montserrat-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/font/montserrat/Montserrat-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/font/montserrat/Montserrat-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/font/montserrat/Montserrat-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/font/montserrat/Montserrat-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../public/font/montserrat/Montserrat-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-montserrat',
  display: 'swap',
});

const trenches = localFont({
  src: '../public/font/trenches/Trenches Demo.otf',
  variable: '--font-trenches',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MACAO | Offroad Experience',
  description: 'Vive la mejor aventura offroad en Punta Cana. Excursiones en buggies por las rutas más emocionantes.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} ${trenches.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
