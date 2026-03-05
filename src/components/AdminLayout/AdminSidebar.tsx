"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/admin/AdminSidebar.module.css";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin", icon: "🏠", label: "Головна", exact: true },
    { href: "/admin/home", icon: "🏠", label: "Контент головної" },
    { href: "/admin/features", icon: "✨", label: "Особливості" },
    { href: "/admin/prices", icon: "💰", label: "Ціни" },
    { href: "/admin/news", icon: "📰", label: "Новини" },
    { href: "/admin/contacts", icon: "📞", label: "Контакти" },
    { href: "/admin/survey", icon: "📊", label: "Опитування" },
    { href: "/admin/orders", icon: "🧾", label: "Замовлення" },
    { href: "/admin/offers", icon: "🏷️", label: "Спецпропозиції" },
    { href: "/admin/cafe", icon: "☕", label: "Кафе" },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🦒</span>
            <span className={styles.logoText}>Жирафик</span>
          </div>
          <button className={styles.closeButton} onClick={onToggle}>
            ×
          </button>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.href} className={styles.menuItem}>
                <Link
                  href={item.href}
                  className={`${styles.menuLink} ${
                    isActive(item.href, item.exact) ? styles.active : ""
                  }`}
                  onClick={() => onToggle()}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>👤</span>
            <span className={styles.userName}>Адмін</span>
          </div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={onToggle} />}
    </>
  );
};

export default AdminSidebar;
