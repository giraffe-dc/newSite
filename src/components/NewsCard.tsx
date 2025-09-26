'use client'
import React from 'react'
import styles from '@/styles/NewsCard.module.css'

interface NewsCardProps {
  title: string;
  content: string;
  date: string;
  type: 'news' | 'event';
  image?: string;
  index: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  title, 
  content, 
  date, 
  type, 
  image,
  index 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTypeIcon = (type: string) => {
    return type === 'event' ? '🎉' : '📰'
  }

  const getTypeColor = (type: string) => {
    return type === 'event' ? 'var(--primary-orange)' : 'var(--secondary-blue)'
  }

  const getTypeLabel = (type: string) => {
    return type === 'event' ? 'Подія' : 'Новина'
  }

  return (
    <article 
      className={`${styles.newsCard} card fade-in`}
      style={{ 
        animationDelay: `${index * 0.15}s`,
        '--type-color': getTypeColor(type)
      } as React.CSSProperties}
    >
      {image && (
        <div className={styles.imageContainer}>
          <img 
            src={image} 
            alt={title}
            className={styles.newsImage}
          />
          <div className={styles.imageOverlay}>
            <span className={styles.typeIcon}>{getTypeIcon(type)}</span>
          </div>
        </div>
      )}

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.typeBadge}>
            <span className={styles.badgeIcon}>{getTypeIcon(type)}</span>
            <span className={styles.badgeText}>{getTypeLabel(type)}</span>
          </div>
          <div className={styles.dateInfo}>
            <span className={styles.dateIcon}>📅</span>
            <span className={styles.dateText}>{formatDate(date)}</span>
          </div>
        </div>

        <h3 className={styles.newsTitle}>{title}</h3>
        
        <p className={styles.newsContent}>{content}</p>

        <div className={styles.cardFooter}>
          <button className={styles.readMoreButton}>
            Читати далі
            <span className={styles.buttonIcon}>→</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default NewsCard