"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminSidebar.module.css";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

/** /admin/chat оновлює бейдж одразу ж, без очікування наступного опитування. */
export const CHAT_UNREAD_EVENT = "giraffe:chat-unread";

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();
  const [unreadChat, setUnreadChat] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat/stats", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: number };
      setUnreadChat(Number(data.messages) || 0);
    } catch {
      // тихо: бейдж не критичний, список діалогів покаже помилку сам
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: перераховуємо бейдж і при переході між сторінками адмінки
  useEffect(() => {
    void loadUnread();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadUnread();
    }, 20_000);
    const onStats = (event: Event) => {
      const detail = (event as CustomEvent<{ messages?: number }>).detail;
      if (detail && typeof detail.messages === "number") {
        setUnreadChat(detail.messages);
      }
    };
    window.addEventListener(CHAT_UNREAD_EVENT, onStats);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(CHAT_UNREAD_EVENT, onStats);
    };
  }, [loadUnread, pathname]);

  const menuItems: {
    href: string;
    icon: string;
    label: string;
    exact?: boolean;
    badge?: boolean;
  }[] = [
    { href: "/admin", icon: "🏠", label: "Головна", exact: true },
    { href: "/admin/content", icon: "📝", label: "Контент" },
    { href: "/admin/orders", icon: "🧾", label: "Замовлення" },
    { href: "/admin/chat", icon: "💬", label: "Чат", badge: true },
    { href: "/admin/news", icon: "📰", label: "Новини" },
    { href: "/admin/reviews", icon: "💌", label: "Відгуки" },
    { href: "/admin/contacts", icon: "📞", label: "Контакти" },
    { href: "/admin/survey", icon: "📊", label: "Опитування" },
    { href: "/admin/offers", icon: "🏷️", label: "Спецпропозиції" },
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
          <button
            type="button"
            className={styles.closeButton}
            onClick={onToggle}
          >
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
                  aria-label={
                    item.badge && unreadChat > 0
                      ? `${item.label}, непрочитаних повідомлень: ${unreadChat}`
                      : undefined
                  }
                  onClick={() => onToggle()}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                  {item.badge && unreadChat > 0 && (
                    <span className={styles.unreadBadge} aria-hidden="true">
                      {unreadChat > 99 ? "99+" : unreadChat}
                    </span>
                  )}
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

      {isOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Закрити меню"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default AdminSidebar;
