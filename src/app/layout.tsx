import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { StatisticsCollector } from '@/components/StatisticsCollector'
import './globals.css'

export const metadata = {
  title: 'Жирафик - Сімейний розважальний центр',
  description: 'Найкращий сімейний розважальний центр для дітей та дорослих. Святкування днів народження, ігрові зони, розваги для всієї родини.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body>
        <StatisticsCollector />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}