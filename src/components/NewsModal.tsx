'use client'
import React from 'react'
import styles from '@/styles/NewsModal.module.css'
import PhotoSlider from './PhotoSlider'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  date: string
  type: 'news' | 'event'
  images: string[]
}

const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  date,
  type,
  images
}) => {
  if (!isOpen) return null

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

  const getTypeLabel = (type: string) => {
    return type === 'event' ? 'Подія' : 'Новина'
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.modalHeader}>
          <div className={styles.typeBadge}>
            <span className={styles.badgeIcon}>{getTypeIcon(type)}</span>
            <span className={styles.badgeText}>{getTypeLabel(type)}</span>
          </div>
          <div className={styles.dateInfo}>
            <span className={styles.dateIcon}>📅</span>
            <span className={styles.dateText}>{formatDate(date)}</span>
          </div>
        </div>

        <h2 className={styles.modalTitle}>{title}</h2>
        
        {images.length > 0 && (
          <div className={styles.sliderContainer}>
            <PhotoSlider photos={images} />
          </div>
        )}

        <div className={styles.modalBody}>
          {content.split('\n').map((paragraph, index) => (
            <p key={index} className={styles.paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewsModal