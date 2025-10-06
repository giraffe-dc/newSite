// src/components/StatisticsCollector.tsx
'use client'

// import { cookies } from 'next/headers'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function StatisticsCollector() {
  const pathname = usePathname()

  useEffect(() => {
    const isAdmin = document.cookie.includes('admin_token');
    // const isAdmin = document.cookie.split(';').some(cookie => cookie.trim().startsWith('admin_token='));
// console.log('Is admin:', isAdmin);
    if (isAdmin) {
      return;
    }

    const collectStatistics = async () => {
      try {
        const referrer = document.referrer || null
        const screen = { w: window.innerWidth, h: window.innerHeight }
        await fetch('/api/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: pathname, referrer, screen }),
        })
      } catch (error) {
        console.error('Failed to collect statistics:', error)
      }
    }

    collectStatistics()
  }, [pathname])

  return null
}
