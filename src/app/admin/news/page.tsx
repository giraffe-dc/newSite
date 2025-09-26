// src/app/admin/news/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/admin/AdminNews.module.css'

interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  date: string;
  type: 'news' | 'event';
  image?: string;
}

const AdminNewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState<NewsItem>({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    type: 'news',
    image: ''
  })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/data/news')
      if (response.ok) {
        const data = await response.json()
        setNews(data)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setMessage('Помилка завантаження новин')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const url = editingItem ? '/api/admin/news' : '/api/admin/news'
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? JSON.stringify({ ...formData, id: editingItem._id })
        : JSON.stringify(formData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        credentials: 'include'
      })

      if (response.ok) {
        setMessage(editingItem ? 'Новину оновлено!' : 'Новину додано!')
        resetForm()
        fetchNews()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Помилка збереження')
      }
    } catch (error) {
      setMessage('Помилка підключення')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      type: 'news',
      image: ''
    })
    setShowAddForm(false)
    setEditingItem(null)
  }

  const handleEdit = (item: NewsItem) => {
    setFormData(item)
    setEditingItem(item)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити цю новину?')) return

    try {
      const response = await fetch(`/api/admin/news`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
        credentials: 'include'
      })

      if (response.ok) {
        setMessage('Новину видалено!')
        fetchNews()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Помилка видалення')
      }
    } catch (error) {
      setMessage('Помилка підключення')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTypeInfo = (type: 'news' | 'event') => {
    return type === 'event' 
      ? { icon: '🎉', label: 'Подія', color: 'var(--primary-orange)' }
      : { icon: '📰', label: 'Новина', color: 'var(--secondary-blue)' }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>📰</div>
        <p>Завантаження новин...</p>
      </div>
    )
  }

  return (
    <div className={styles.adminNewsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>📰</span>
          Керування новинами
        </h1>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={styles.addButton}
          >
            {showAddForm ? '❌ Скасувати' : '➕ Додати новину'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('!') ? styles.success : styles.error}`}>
          <span className={styles.messageIcon}>
            {message.includes('!') ? '✅' : '❌'}
          </span>
          {message}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>
            {editingItem ? '✏️ Редагування новини' : '➕ Нова новина'}
          </h2>
          
          <form onSubmit={handleSubmit} className={styles.newsForm}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Заголовок</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={styles.input}
                  placeholder="Введіть заголовок новини"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Тип</label>
                <div className={styles.typeSelector}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="type"
                      value="news"
                      checked={formData.type === 'news'}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'news' | 'event'})}
                    />
                    <span className={styles.radioCustom}>📰</span>
                    Новина
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="type"
                      value="event"
                      checked={formData.type === 'event'}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'news' | 'event'})}
                    />
                    <span className={styles.radioCustom}>🎉</span>
                    Подія
                  </label>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Дата</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Зображення (URL)</label>
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Контент</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className={styles.textarea}
                placeholder="Введіть текст новини або опис події"
                rows={6}
                required
              />
            </div>

            {formData.image && (
              <div className={styles.imagePreview}>
                <label className={styles.inputLabel}>Попередній перегляд зображення</label>
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className={styles.previewImage}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={resetForm}
                className={styles.cancelButton}
              >
                ❌ Скасувати
              </button>
              <button
                type="submit"
                className={styles.saveButton}
              >
                {editingItem ? '💾 Зберегти' : '➕ Опублікувати'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* News List */}
      <div className={styles.newsSection}>
        <h2 className={styles.sectionTitle}>
          Опубліковані новини ({news.length})
        </h2>
        
        <div className={styles.newsGrid}>
          {news.map((item, index) => {
            const typeInfo = getTypeInfo(item.type)
            return (
              <article key={item._id || index} className={styles.newsCard}>
                {item.image && (
                  <div className={styles.cardImage}>
                    <img src={item.image} alt={item.title} />
                    <div className={styles.imageOverlay}>
                      <span className={styles.typeIcon}>{typeInfo.icon}</span>
                    </div>
                  </div>
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.typeBadge} style={{'--type-color': typeInfo.color} as React.CSSProperties}>
                      <span className={styles.badgeIcon}>{typeInfo.icon}</span>
                      <span className={styles.badgeText}>{typeInfo.label}</span>
                    </div>
                    <div className={styles.dateInfo}>
                      <span className={styles.dateIcon}>📅</span>
                      <span className={styles.dateText}>{formatDate(item.date)}</span>
                    </div>
                  </div>

                  <h3 className={styles.newsTitle}>{item.title}</h3>
                  
                  <p className={styles.newsContent}>
                    {item.content.length > 150 
                      ? `${item.content.substring(0, 150)}...` 
                      : item.content
                    }
                  </p>

                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleEdit(item)}
                      className={styles.editButton}
                    >
                      ✏️ Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(item._id!)}
                      className={styles.deleteButton}
                    >
                      🗑️ Видалити
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {news.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📰</div>
            <h3>Немає новин</h3>
            <p>Додайте першу новину або подію для відображення на сайті</p>
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        <button
          onClick={() => router.push('/admin')}
          className={styles.backButton}
        >
          ⬅️ Назад до панелі
        </button>
      </div>
    </div>
  )
}

export default AdminNewsPage