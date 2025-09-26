'use client'
import React from 'react'
import styles from '@/styles/admin/AdminHeader.module.css'

interface AdminHeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuToggle, onLogout }) => {
  return (
    <header className={styles.adminHeader}>
      <div className={styles.headerLeft}>
        <button className={styles.menuToggle} onClick={onMenuToggle}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2 className={styles.pageTitle}>Панель управління</h2>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} title="Сповіщення">
            🔔
          </button>
          <button className={styles.actionButton} title="Повідомлення">
            💬
          </button>
        </div>

        <div className={styles.userMenu}>
          <div className={styles.userProfile}>
            <span className={styles.userAvatar}>👤</span>
            <span className={styles.userName}>Адмін</span>
          </div>
          <button className={styles.logoutButton} onClick={onLogout}>
            <span className={styles.logoutIcon}>🚪</span>
            Вийти
          </button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader