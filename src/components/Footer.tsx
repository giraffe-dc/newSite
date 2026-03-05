"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/styles/Footer.module.css";
import { Facebook, Instagram, Send } from "lucide-react";

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

const Footer = () => {
  const [contacts, setContacts] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  // console.log(features)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/data/contacts");
        const responseFeatures = await fetch("/api/data/home");

        if (response.ok) {
          const data = await response.json();
          setContacts(data);
          const dataFeatures = await responseFeatures.json();
          setFeatures(dataFeatures.features || []);
        }
      } catch (error) {
        console.error("Failed to fetch contacts for footer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const renderContactInfo = () => {
    if (loading) {
      return (
        <>
          <p className={styles.skeleton}>📍 Завантаження адреси...</p>
          <p className={styles.skeleton}>📞 Завантаження телефону...</p>
          <p className={styles.skeleton}>✉️ Завантаження email...</p>
          <p className={styles.skeleton}>🕒 Завантаження годин роботи...</p>
        </>
      );
    }
    if (contacts) {
      return (
        <>
          <p>📍 {contacts.address}</p>
          <p>📞 {contacts.phone}</p>
          <p>✉️ {contacts.email}</p>
          <p>🕒 {contacts.workingHours}</p>
        </>
      );
    }
    return <p>Не вдалося завантажити контакти.</p>;
  };

  const renderSocialLinks = () => {
    if (loading) {
      return (
        <div className={styles.socialLinks}>
          <span className={`${styles.socialLink} ${styles.skeleton}`}>
            &nbsp;
          </span>
          <span className={`${styles.socialLink} ${styles.skeleton}`}>
            &nbsp;
          </span>
          <span className={`${styles.socialLink} ${styles.skeleton}`}>
            &nbsp;
          </span>
        </div>
      );
    }
    if (contacts?.socialMedia) {
      return (
        <div className={styles.socialLinks}>
          {contacts.socialMedia.facebook && (
            <a
              href={contacts.socialMedia.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <Facebook size={20} />
            </a>
          )}
          {contacts.socialMedia.instagram && (
            <a
              href={contacts.socialMedia.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <Instagram size={20} />
            </a>
          )}
          {contacts.socialMedia.telegram && (
            <a
              href={contacts.socialMedia.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <Send size={20} />
            </a>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <span>🦒</span>
              <span>Жирафик</span>
            </div>
            <p>
              Сімейний розважальний центр для незабутніх моментів з родиною.
              Створюємо радість для дітей та дорослих!
            </p>
            {renderSocialLinks()}
          </div>

          <div className={styles.footerSection}>
            <h3>Навігація</h3>
            <Link href="/">Головна</Link>
            <Link href="/prices">Наші ціни</Link>
            <Link href="/news-contacts">Новини та контакти</Link>
            <Link href="/admin">Адмін панель</Link>
          </div>

          <div className={styles.footerSection}>
            <h3>Контакти</h3>
            {renderContactInfo()}
          </div>

          <div className={styles.footerSection}>
            <h3>Наші послуги</h3>
            {features.map((feature, index) => (
              <p key={index}>{feature}</p>
            ))}
            {/* 
            <p>🎈 Дні народження</p>
            <p>🎪 Ігрові зони</p>
            <p>🍰 Кафе</p>
            <p>🎭 Аніматори</p>
            <p>📸 Фотозона</p> */}
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>
            &copy; 2025 Жирафик. Всі права захищені. Створено з ❤️ для сімей
            України.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
