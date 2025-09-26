// src/app/admin/prices/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/admin/AdminPrices.module.css'

interface PriceItem {
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration: string;
  category: string;
}

const newPriceInitialState: PriceItem = {
  name: '',
  price: '',
  description: '',
  duration: '',
  category: 'games',
}

const AdminPricesPage = () => {
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrice, setNewPrice] = useState<PriceItem>(newPriceInitialState)
  const router = useRouter()

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data/prices')
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      } else {
        setMessage('Помилка завантаження цін')
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
      setMessage("Помилка з'єднання з сервером")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (index: number, field: keyof PriceItem, value: string) => {
    const updatedPrices = [...prices]
    updatedPrices[index] = { ...updatedPrices[index], [field]: value }
    setPrices(updatedPrices)
  }

  const handleNewPriceChange = (field: keyof PriceItem, value: string) => {
    setNewPrice(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdate = async (item: PriceItem) => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/prices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item._id, ...item }),
        credentials: 'include'
      })

      if (response.ok) {
        setMessage('Ціну успішно оновлено!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setMessage(`Помилка оновлення: ${errorData.error}`)
      }
    } catch (error) {
      setMessage("Помилка з'єднання з сервером")
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrice),
        credentials: 'include'
      })

      if (response.ok) {
        setMessage('Нову ціну успішно створено!')
        setNewPrice(newPriceInitialState)
        setShowAddForm(false)
        fetchPrices() // Оновити список
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setMessage(`Помилка створення: ${errorData.error}`)
      }
    } catch (error) {
      setMessage("Помилка з'єднання з сервером")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>💰</div>
        <p>Завантаження прайс-листа...</p>
      </div>
    )
  }

  return (
    <div className={styles.adminPricesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>💰</span>
          Керування цінами
        </h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className={styles.toggleFormButton}>
          {showAddForm ? '❌ Закрити форму' : '➕ Додати прайс'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('успішно') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className={styles.addFormSection}>
          <h2 className={styles.formTitle}>Додавання нового прайсу</h2>
          <form onSubmit={handleCreate} className={styles.priceForm}>
            <div className={styles.inputGroup}>
              <label>Назва</label>
              <input type="text" value={newPrice.name} onChange={(e) => handleNewPriceChange('name', e.target.value)} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Ціна (грн)</label>
              <input type="text" value={newPrice.price} onChange={(e) => handleNewPriceChange('price', e.target.value)} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Тривалість</label>
              <input type="text" value={newPrice.duration} onChange={(e) => handleNewPriceChange('duration', e.target.value)} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Категорія</label>
              <select value={newPrice.category} onChange={(e) => handleNewPriceChange('category', e.target.value)} className={styles.input}>
                <option value="games">Ігрові зони</option>
                <option value="family">Сімейні пакети</option>
                <option value="birthday">Дні народження</option>
                <option value="services">Додаткові послуги</option>
              </select>
            </div>
            <div className={styles.inputGroupFullWidth}>
              <label>Опис</label>
              <textarea value={newPrice.description} onChange={(e) => handleNewPriceChange('description', e.target.value)} className={styles.textarea} rows={3} required />
            </div>
            <div className={styles.formActionsNew}>
              <button type="submit" disabled={saving} className={styles.saveButtonNew}>
                {saving ? 'Створення...' : '💾 Створити прайс'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.pricesGrid}>
        {prices.map((item, index) => (
          <div key={item._id || index} className={styles.priceCard}>
            <div className={styles.cardBody}>
              <div className={styles.inputGroup}>
                <label>Назва</label>
                <input type="text" value={item.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label>Ціна (грн)</label>
                <input type="text" value={item.price} onChange={(e) => handleInputChange(index, 'price', e.target.value)} className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label>Тривалість</label>
                <input type="text" value={item.duration} onChange={(e) => handleInputChange(index, 'duration', e.target.value)} className={styles.input} />
              </div>
               <div className={styles.inputGroup}>
                <label>Категорія</label>
                <select value={item.category} onChange={(e) => handleInputChange(index, 'category', e.target.value)} className={styles.input}>
                  <option value="games">Ігрові зони</option>
                  <option value="family">Сімейні пакети</option>
                  <option value="birthday">Дні народження</option>
                  <option value="services">Додаткові послуги</option>
                </select>
              </div>
              <div className={styles.inputGroupFullWidth}>
                <label>Опис</label>
                <textarea value={item.description} onChange={(e) => handleInputChange(index, 'description', e.target.value)} className={styles.textarea} rows={3} />
              </div>
            </div>
            <div className={styles.cardActions}>
              <button onClick={() => handleUpdate(item)} disabled={saving} className={styles.saveButton}>
                {saving ? 'Збереження...' : '💾 Оновити'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.formActions}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ⬅️ Назад до панелі
        </button>
      </div>
    </div>
  )
}

export default AdminPricesPage
