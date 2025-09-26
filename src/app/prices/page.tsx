'use client'
import React, { useState, useEffect } from 'react'
import PriceCard from '@/components/PriceCard'
import styles from '@/styles/Prices.module.css'
import { Button } from '@/components/ui/button';

interface PriceItem {
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
}

interface CategoryItem {
  _id?: string;
  key: string;
  label: string;
  icon: string;
}

const PricesPage = () => {
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pricesRes, categoriesRes] = await Promise.all([
        fetch('/api/data/prices'),
        fetch('/api/data/price-categories')
      ]);

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories([{ key: 'all', label: 'Всі послуги', icon: '🎪' }, ...categoriesData]);
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrices = selectedCategory === 'all' 
    ? prices 
    : prices.filter(price => price.category === selectedCategory)

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>💰</div>
        <p>Завантаження цін...</p>
      </div>
    )
  }

  return (
    <div className={styles.pricesPage}>
      <div className="container">
        {/* Header */}
        <section className={styles.header}>
          <h1 className={styles.title}>Наші ціни</h1>
          <p className={styles.subtitle}>
            Доступні ціни на всі розваги для вашої родини
          </p>
          <div className={styles.headerDecoration}>
            <span className={styles.decorIcon}>💰</span>
            <span className={styles.decorIcon}>🎈</span>
            <span className={styles.decorIcon}>🎪</span>
          </div>
        </section>

        {/* Category Filter */}
        <section className={styles.filterSection}>
          <div className={styles.categoryFilter}>
            {categories.map(category => (
              <button
                key={category.key}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.key ? styles.active : ''
                }`}
                onClick={() => setSelectedCategory(category.key)}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Prices Grid */}
        <section className={styles.pricesSection}>
          <div className={styles.pricesGrid}>
            {filteredPrices.map((price, index) => (
              <PriceCard
                key={price._id || index}
                name={price.name}
                price={price.price}
                description={price.description}
                duration={price.duration}
                category={price.category}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Готові забронювати?</h2>
            <p className={styles.ctaText}>
              Зателефонуйте нам або завітайте особисто для бронювання свята
            </p>
            <div className={styles.ctaButtons}>
              <a href="tel:+380931234567" className="btn-primary">
                📞 Зателефонувати
              </a>
              <a href="/news-contacts" className="btn-secondary">
                📍 Контакти
              </a>
            </div>
          </div>
        </section> */}
      </div>
      
      {/* Акції та знижки */}
      <section className={styles.offersSection}>
        <div className={styles.containerInner}>
          <div className={styles.offersWrapper}>
            <h2 className={styles.offersTitle}>Спеціальні пропозиції</h2>
            <div className={styles.offersGrid}>
              <div className={styles.offerItem}>
                <h3 className={styles.offerTitle}>Знижка 10%</h3>
                <p className={styles.offerDescription}>На перше відвідування</p>
              </div>
              <div className={styles.offerItem}>
                <h3 className={styles.offerTitle}>День сім'ї</h3>
                <p className={styles.offerDescription}>Неділя - знижка 15% для родин</p>
              </div>
              <div className={styles.offerItem}>
                <h3 className={styles.offerTitle}>Абонемент</h3>
                <p className={styles.offerDescription}>10 відвідувань - економія 20%</p>
              </div>
            </div>
            <Button
              variant="hero"
              size="xl"
              className={styles.discountButton}
            >
              Забронювати зі знижкою
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricesPage