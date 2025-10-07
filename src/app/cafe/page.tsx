'use client'
import React, { useState, useEffect } from 'react'
import styles from '@/styles/Cafe.module.css'
import { CafeItem } from '@/types'

const CafePage = () => {
  const [menuItems, setMenuItems] = useState<CafeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/data/cafe')
        if (response.ok) {
          const data = await response.json()
          setMenuItems(data)
        }
      } catch (error) {
        console.error('Error fetching cafe menu items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>☕</div>
        <p>Завантаження меню...</p>
      </div>
    )
  }

  return (
    <div className={styles.cafePage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Giraffe Cafe</h1>
        <p className={styles.subtitle}>Смачні страви та напої для всієї родини</p>
      </div>

      <div className={styles.menuGrid}>
        {menuItems.map((item) => (
          <div key={item._id} className={styles.menuCard}>
            <img src={item.image || '/images/placeholder.jpg'} alt={item.name} className={styles.cardImage} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{item.name}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardPrice}>{item.price} грн</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CafePage