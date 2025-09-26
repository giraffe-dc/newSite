'use client'
import React from 'react'
import Link from 'next/link'
import styles from '@/styles/admin/AdminDashboard.module.css'

const AdminDashboard = () => {
  const dashboardCards = [
    {
      title: 'Головна сторінка',
      description: 'Редагування контенту головної сторінки',
      icon: '🏠',
      href: '/admin/home',
      color: 'var(--primary-orange)'
    },
    {
      title: 'Особливості',
      description: 'Керування особливостями на головній сторінці',
      icon: '✨',
      href: '/admin/features',
      color: 'var(--primary-purple)'
    },
    {
      title: 'Ціни',
      description: 'Керування цінами на послуги',
      icon: '💰',
      href: '/admin/prices',
      color: 'var(--primary-green)'
    },
    {
      title: 'Новини',
      description: 'Додавання та редагування новин',
      icon: '📰',
      href: '/admin/news',
      color: 'var(--secondary-blue)'
    },
    {
      title: 'Контакти',
      description: 'Оновлення контактної інформації',
      icon: '📞',
      href: '/admin/contacts',
      color: 'var(--primary-yellow)'
    }
  ]

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          <span className={styles.titleIcon}>🦒</span>
          Панель управління Жирафик
        </h1>
        <p className={styles.dashboardSubtitle}>
          Ласкаво просимо до адміністративної панелі
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Відвідувачів сьогодні</h3>
            <p className={styles.statNumber}>127</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎂</div>
          <div className={styles.statInfo}>
            <h3>Заброньовано свят</h3>
            <p className={styles.statNumber}>15</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📞</div>
          <div className={styles.statInfo}>
            <h3>Дзвінків за тиждень</h3>
            <p className={styles.statNumber}>43</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <h3>Рейтинг</h3>
            <p className={styles.statNumber}>4.9</p>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {dashboardCards.map((card, index) => (
          <Link 
            key={index} 
            href={card.href} 
            className={styles.dashboardCard}
            style={{ '--card-color': card.color } as React.CSSProperties}
          >
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
            </div>
            <div className={styles.cardArrow}>→</div>
          </Link>
        ))}
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Швидкі дії</h2>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>
            ➕ Додати новину
          </button>
          <button className={styles.actionButton}>
            💰 Оновити ціни
          </button>
          <button className={styles.actionButton}>
            📧 Переглянути повідомлення
          </button>
          <button className={styles.actionButton}>
            📊 Експорт звітів
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard