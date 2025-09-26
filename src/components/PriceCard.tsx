'use client'
import React from 'react'
import styles from '../styles/PriceCard.module.css'

interface PriceCardProps {
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
  index: number;
}

const PriceCard: React.FC<PriceCardProps> = ({ 
  name, 
  price, 
  description, 
  duration, 
  category,
  index 
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'games': return '🎮'
      case 'birthday': return '🎂'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'services': return '⭐'
      default: return '🎪'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'games': return 'var(--primary-green)'
      case 'birthday': return 'var(--primary-orange)'
      case 'family': return 'var(--secondary-blue)'
      case 'services': return 'var(--primary-yellow)'
      default: return 'var(--primary-orange)'
    }
  }

  return (
    <div 
      className={`${styles.priceCard} card fade-in`}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        '--category-color': getCategoryColor(category)
      } as React.CSSProperties}
    >
      <div className={styles.cardHeader}>
        <div className={styles.categoryBadge}>
          <span className={styles.categoryIcon}>
            {getCategoryIcon(category)}
          </span>
        </div>
        <div className={styles.priceTag}>
          <span className={styles.currency}>₴</span>
          <span className={styles.amount}>{price}</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.serviceName}>{name}</h3>
        <p className={styles.description}>{description}</p>
        {duration && (
          <div className={styles.duration}>
            <span className={styles.durationIcon}>⏱️</span>
            <span>{duration}</span>
          </div>
        )}
      </div>

      {/* <div className={styles.cardFooter}>
        <button className={styles.bookButton}>
          Забронювати
        </button>
      </div> */}
    </div>
  )
}

export default PriceCard