'use client'
import React, { useEffect, useState } from 'react'
import styles from '@/styles/admin/AdminDashboard.module.css'

interface Order {
  _id: string
  customerName: string
  phone: string
  date?: string
  time?: string
  notes?: string
  createdAt?: string
  status?: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.adminDashboard}>
      <h1 className={styles.sectionTitle}>Замовлення</h1>
      {loading ? (
        <p>Завантаження...</p>
      ) : orders.length === 0 ? (
        <p>Поки немає замовлень.</p>
      ) : (
        <div className={styles.statsGrid}>
          {orders.map((o) => (
            <div key={o._id} className={styles.statCard}>
              <div className={styles.statInfo}>
                <h3>Ім'я: {o.customerName}</h3>
                <p>Телефон: {o.phone}</p>
                {o.date && <p>Дата: {o.date}</p>}
                {o.time && <p>Час: {o.time}</p>}
                {o.notes && <p>Коментар: {o.notes}</p>}
                <p>Статус: {o.status || 'new'}</p>
                {o.createdAt && <p>Створено: {new Date(o.createdAt).toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

