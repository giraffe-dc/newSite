'use client'
import React, { useState, useEffect } from 'react'
import NewsCard from '@/components/NewsCard'
import styles from '@/styles/NewsContacts.module.css'

interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  date: string;
  type: 'news' | 'event';
  image?: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
}

const NewsContactsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([])
  const [contacts, setContacts] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'news' | 'contacts'>('news')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [newsResponse, contactsResponse] = await Promise.all([
        fetch('/api/data/news'),
        fetch('/api/data/contacts')
      ])

      let newsData: NewsItem[] = []
      let contactsData: ContactInfo

      if (newsResponse.ok) {
        newsData = await newsResponse.json()
      } else {
        // Fallback news data
        newsData = [
          {
            title: "Новий атракціон у Жирафику!",
            content: "Зустрічайте новий захоплюючий атракціон для дітей від 5 років - 'Космічна пригода'. Відправтеся у подорож до зірок!",
            date: "2024-12-15",
            type: "news",
            image: "/giraffe-mascot.png"
          },
          {
            title: "Знижки на дні народження у грудні",
            content: "Святкуйте день народження вашої дитини з 20% знижкою! Акція діє до кінця грудня для всіх пакетів.",
            date: "2024-12-10",
            type: "event"
          },
          {
            title: "Новорічні свята у Жирафику",
            content: "Приєднуйтеся до новорічних святкувань! Дід Мороз, подарунки, ігри та багато іншого чекають на ваших малюків.",
            date: "2024-12-20",
            type: "event",
            image: "https://i.pinimg.com/1200x/57/b9/c4/57b9c47d9bf7e28312561fb444f6ea58.jpg"
          },
          {
            title: "Оновлене дитяче меню",
            content: "Наше кафе представляє оновлене дитяче меню з корисними та смачними стравами, приготованими з любов'ю.",
            date: "2024-12-05",
            type: "news"
          }
        ]
      }

      if (contactsResponse.ok) {
        contactsData = await contactsResponse.json()
      } else {
        // Fallback contacts data
        contactsData = {
          phone: "+38 (093) 123-45-67",
          email: "info@zhyrafyk.com.ua",
          address: "вул. Дитяча, 15, м. Вінниця, Вінницька область, 21000",
          workingHours: "Пн-Нд: 10:00 - 21:00",
          socialMedia: {
            facebook: "https://facebook.com/zhyrafyk",
            instagram: "https://instagram.com/zhyrafyk_family",
            telegram: "https://t.me/zhyrafyk_bot"
          }
        }
      }

      setNews(newsData)
      setContacts(contactsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>📰</div>
        <p>Завантаження...</p>
      </div>
    )
  }

  return (
    <div className={styles.newsContactsPage}>
      <div className="container">
        {/* Header */}
        <section className={styles.header}>
          <h1 className={styles.title}>Новини та Контакти</h1>
          <p className={styles.subtitle}>
            Залишайтеся в курсі наших новин та знайдіть нас
          </p>
        </section>

        {/* Tab Navigation */}
        <section className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'news' ? styles.active : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <span className={styles.tabIcon}>📰</span>
            Новини та Події
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'contacts' ? styles.active : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <span className={styles.tabIcon}>📞</span>
            Контакти
          </button>
        </section>

        {/* News Section */}
        {activeTab === 'news' && (
          <section className={styles.newsSection}>
            <div className={styles.newsGrid}>
              {news.map((item, index) => (
                <NewsCard
                  key={item._id || index}
                  title={item.title}
                  content={item.content}
                  date={item.date}
                  type={item.type}
                  image={item.image}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Contacts Section */}
        {activeTab === 'contacts' && contacts && (
          <section className={styles.contactsSection}>
            <div className={styles.contactsGrid}>
              {/* Contact Info */}
              <div className={`${styles.contactCard} card`}>
                <div className={styles.contactHeader}>
                  <h3 className={styles.contactTitle}>
                    <span className={styles.contactIcon}>📞</span>
                    Зв'яжіться з нами
                  </h3>
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemIcon}>📞</span>
                    <div>
                      <strong>Телефон:</strong>
                      <a href={`tel:${contacts.phone.replace(/\s/g, '')}`}>
                        {contacts.phone}
                      </a>
                    </div>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemIcon}>✉️</span>
                    <div>
                      <strong>Email:</strong>
                      <a href={`mailto:${contacts.email}`}>
                        {contacts.email}
                      </a>
                    </div>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemIcon}>📍</span>
                    <div>
                      <strong>Адреса:</strong>
                      <span>{contacts.address}</span>
                    </div>
                  </div>
                  <div className={styles.contactItem}>
                    <span className={styles.contactItemIcon}>🕒</span>
                    <div>
                      <strong>Режим роботи:</strong>
                      <span>{contacts.workingHours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className={`${styles.contactCard} card`}>
                <div className={styles.contactHeader}>
                  <h3 className={styles.contactTitle}>
                    <span className={styles.contactIcon}>🌐</span>
                    Соціальні мережі
                  </h3>
                </div>
                <div className={styles.socialMedia}>
                  {contacts.socialMedia.facebook && (
                    <a href={contacts.socialMedia.facebook} className={styles.socialLink} target="_blank">
                      <span className={styles.socialIcon}>📘</span>
                      <div>
                        <strong>Facebook</strong>
                        <p>Слідкуйте за новинами</p>
                      </div>
                    </a>
                  )}
                  {contacts.socialMedia.instagram && (
                    <a href={contacts.socialMedia.instagram} className={styles.socialLink} target="_blank">
                      <span className={styles.socialIcon}>📷</span>
                      <div>
                        <strong>Instagram</strong>
                        <p>Фото та відео з наших свят</p>
                      </div>
                    </a>
                  )}
                  {contacts.socialMedia.telegram && (
                    <a href={contacts.socialMedia.telegram} className={styles.socialLink} target="_blank">
                      <span className={styles.socialIcon}>✈️</span>
                      <div>
                        <strong>Telegram</strong>
                        <p>Швидке бронювання</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Map Placeholder */}
              <div className={`${styles.contactCard} ${styles.mapCard} card`}>
                <div className={styles.contactHeader}>
                  <h3 className={styles.contactTitle}>
                    <span className={styles.contactIcon}>🗺️</span>
                    Як нас знайти
                  </h3>
                </div>
                <div className={styles.mapContainer}>
                  <div className={styles.mapPlaceholder}>
                    <div className={styles.mapIcon}>📍</div>
                    <p>Інтерактивна карта</p>
                    <p className={styles.mapAddress}>{contacts.address}</p>
                    <button className={styles.mapButton}>
                      Відкрити в Google Maps
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default NewsContactsPage