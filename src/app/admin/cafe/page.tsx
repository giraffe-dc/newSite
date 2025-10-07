'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/admin/AdminCafe.module.css'
import { CafeItem } from '@/types'

const AdminCafePage = () => {
  const [cafeItems, setCafeItems] = useState<CafeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCafeItems()
  }, [])

  const fetchCafeItems = async () => {
    try {
      const response = await fetch('/api/admin/cafe')
      if (response.ok) {
        const data = await response.json()
        setCafeItems(data)
      }
    } catch (error) {
      console.error('Error fetching cafe items:', error)
      setMessage('Помилка завантаження даних')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (index: number, field: keyof Omit<CafeItem, '_id'>, value: string | number) => {
    const newCafeItems = [...cafeItems]
    // @ts-ignore
    newCafeItems[index][field] = value
    setCafeItems(newCafeItems)
  }

  const handleAddCafeItem = () => {
    setCafeItems([...cafeItems, { name: '', description: '', price: 0, category: '', image: '' }])
  }

  const handleRemoveCafeItem = async (index: number) => {
    const itemToRemove = cafeItems[index]
    if (itemToRemove._id) {
      try {
        const response = await fetch('/api/admin/cafe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ _id: itemToRemove._id }),
          credentials: 'include',
        })
        if (!response.ok) {
          setMessage('Помилка видалення')
          return
        }
      } catch (error) {
        setMessage('Помилка підключення до сервера')
        return
      }
    }
    const newCafeItems = cafeItems.filter((_, i) => i !== index)
    setCafeItems(newCafeItems)
  }

  const handleSave = async (index: number) => {
    setSaving(true)
    setMessage('')
    const cafeItem = cafeItems[index]
    const method = cafeItem._id ? 'PUT' : 'POST'
    
    const body = {
        ...cafeItem,
        _id: cafeItem._id,
    }
    
    try {
      const response = await fetch('/api/admin/cafe', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (response.ok) {
        setMessage('Дані успішно оновлено!')
        if (method === 'POST') {
            const newId = await response.json()
            const newCafeItems = [...cafeItems]
            newCafeItems[index]._id = newId
            setCafeItems(newCafeItems)
        }
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

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>☕</div>
        <p>Завантаження...</p>
      </div>
    )
  }

  return (
    <div className={styles.adminCafePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>☕</span>
          Керування меню кафе
        </h1>
        <p className={styles.pageSubtitle}>
          Редагуйте, додавайте та видаляйте позиції меню
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

      <div className={styles.cafeGrid}>
        {cafeItems.map((item, index) => (
          <div key={index} className={styles.cafeCard}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Назва</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                className={styles.input}
                placeholder="Назва позиції"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Опис</label>
              <textarea
                value={item.description}
                onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                className={styles.textarea}
                placeholder="Опис позиції"
                rows={3}
              />
            </div>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Ціна</label>
                <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleInputChange(index, 'price', parseInt(e.target.value, 10))}
                    className={styles.input}
                />
            </div>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Категорія</label>
                <input
                    type="text"
                    value={item.category}
                    onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                    className={styles.input}
                    placeholder="Наприклад: Напої, Десерти"
                />
            </div>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Посилання на зображення</label>
                <input
                    type="text"
                    value={item.image}
                    onChange={(e) => handleInputChange(index, 'image', e.target.value)}
                    className={styles.input}
                    placeholder="/images/latte.jpg"
                />
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => handleRemoveCafeItem(index)}
                className={styles.removeButton}
              >
                ❌ Видалити
              </button>
              <button
                onClick={() => handleSave(index)}
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? '⏳' : '💾'} Зберегти
              </button>
            </div>
          </div>
        ))}
         <button
            onClick={handleAddCafeItem}
            className={styles.addButton}
          >
            ➕ Додати позицію
          </button>
      </div>
      <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className={styles.cancelButton}
          >
            ⬅️ Назад
          </button>
        </div>
    </div>
  )
}

export default AdminCafePage
