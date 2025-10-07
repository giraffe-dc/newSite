'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import logo from '@/assets/logoG.png'
import styles from '../styles/Header.module.css'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
      <header className={styles.header}>
          <div className="container">
              <div className={styles.headerContent}>
                  <Link href="/" className={styles.logo}>
                      <div
                          className={styles.logoIcon}
                          style={{ backgroundImage: `url(${logo.src})` }}
                      ></div>
                      {/* <span className={styles.logoText}>Жирафик</span> */}
                  </Link>

                  <nav
                      className={`${styles.nav} ${
                          isMenuOpen ? styles.navOpen : ''
                      }`}
                  >
                      <Link
                          href="/"
                          className={styles.navLink}
                          onClick={() => setIsMenuOpen(false)}
                      >
                          Головна
                      </Link>
                      <Link
                          href="/prices"
                          className={styles.navLink}
                          onClick={() => setIsMenuOpen(false)}
                      >
                          Наші ціни
                      </Link>
                      <Link
                          href="/news-contacts"
                          className={styles.navLink}
                          onClick={() => setIsMenuOpen(false)}
                      >
                          Новини та контакти
                      </Link>
                  </nav>

                  <button
                      className={styles.menuToggle}
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                      <span></span>
                      <span></span>
                      <span></span>
                  </button>
              </div>
          </div>
      </header>
  )
}

export default Header