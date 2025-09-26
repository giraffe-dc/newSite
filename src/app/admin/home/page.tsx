// src/app/admin/home/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/admin/AdminHome.module.css'

interface HomeData {
  title: string;
  description: string;
  features: string[];
  images: string[];
  workingHours: string;
  address: string;
  phone: string;
}

const AdminHomePage = () => {
  const [homeData, setHomeData] = useState<HomeData>({
    title: '',
    description: '',
    features: [''],
    images: [''],
    workingHours: '',
    address: '',
    phone: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/data/home')
      if (response.ok) {
        const data = await response.json()
        setHomeData(data)
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
      setMessage('Помилка завантаження даних')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/home', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(homeData),
        credentials: 'include'
      })

      if (response.ok) {
        setMessage('Дані успішно оновлено!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Помилка збереження даних')
      }
    } catch (error) {
      setMessage('Помилка підключення до сервера')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof HomeData, value: string) => {
    setHomeData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'features' | 'images', index: number, value: string) => {
    setHomeData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'features' | 'images') => {
    setHomeData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'features' | 'images', index: number) => {
    setHomeData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>🏠</div>
        <p>Завантаження...</p>
      </div>
    )
  }

  return (
    <div className={styles.adminHomePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🏠</span>
          Керування головною сторінкою
        </h1>
        <p className={styles.pageSubtitle}>
          Редагуйте контент головної сторінки сайту
        </p>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('успішно') ? styles.success : styles.error}`}>
          <span className={styles.messageIcon}>
            {message.includes('успішно') ? '✅' : '❌'}
          </span>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.adminForm}>
        <div className={styles.formGrid}>
          {/* Basic Info Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span>
              Основна інформація
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Заголовок сайту</label>
              <input
                type="text"
                value={homeData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={styles.input}
                placeholder="Назва розважального центру"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Опис</label>
              <textarea
                value={homeData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={styles.textarea}
                placeholder="Короткий опис центру"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Contact Info Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📞</span>
              Контактна інформація
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Режим роботи</label>
              <input
                type="text"
                value={homeData.workingHours}
                onChange={(e) => handleInputChange('workingHours', e.target.value)}
                className={styles.input}
                placeholder="Пн-Нд: 10:00 - 21:00"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Адреса</label>
              <input
                type="text"
                value={homeData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={styles.input}
                placeholder="вул. Дитяча, 15, м. Вінниця"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Телефон</label>
              <input
                type="tel"
                value={homeData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={styles.input}
                placeholder="+38 (093) 123-45-67"
                required
              />
            </div>
          </div>

          {/* Features Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⭐</span>
              Особливості центру
            </h2>

            {homeData.features.map((feature, index) => (
              <div key={index} className={styles.arrayInputGroup}>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayChange('features', index, e.target.value)}
                  className={styles.input}
                  placeholder="🎈 Назва особливості"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('features', index)}
                  className={styles.removeButton}
                  disabled={homeData.features.length === 1}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addArrayItem('features')}
              className={styles.addButton}
            >
              ➕ Додати особливість
            </button>
          </div>

          {/* Images Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🖼️</span>
              Зображення для слайдера
            </h2>

            {homeData.images.map((image, index) => (
              <div key={index} className={styles.arrayInputGroup}>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => handleArrayChange('images', index, e.target.value)}
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('images', index)}
                  className={styles.removeButton}
                  disabled={homeData.images.length === 1}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addArrayItem('images')}
              className={styles.addButton}
            >
              ➕ Додати зображення
            </button>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className={styles.cancelButton}
          >
            ⬅️ Назад
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? (
              <>
                <span className={styles.spinner}>⏳</span>
                Збереження...
              </>
            ) : (
              <>
                💾 Зберегти зміни
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminHomePage