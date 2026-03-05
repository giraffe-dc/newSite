"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/admin/AdminDashboard.module.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface StatsData {
  totalPageViews: number;
  uniqueVisitors: number;
  pageViewsByPath: { _id: string; count: number }[];
  pageViewsPerDay: { _id: string; count: number }[];
  topReferrers?: { _id: string; count: number }[];
  bookingsTotal?: number;
  bookingsPerDay?: { _id: string; count: number }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/stats", { credentials: "include" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);
        if (!statsRes.ok) {
          throw new Error("Failed to fetch statistics");
        }
        const data = await statsRes.json();
        setStats(data);
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setOrdersCount(Array.isArray(orders) ? orders.length : 0);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dashboardCards = [
    {
      title: "Головна сторінка",
      description: "Редагування контенту головної сторінки",
      icon: "🏠",
      href: "/admin/home",
      color: "var(--primary-orange)",
    },
    {
      title: "Особливості",
      description: "Керування особливостями на головній сторінці",
      icon: "✨",
      href: "/admin/features",
      color: "var(--primary-purple)",
    },
    {
      title: "Ціни",
      description: "Керування цінами на послуги",
      icon: "💰",
      href: "/admin/prices",
      color: "var(--primary-green)",
    },
    {
      title: "Новини",
      description: "Додавання та редагування новин",
      icon: "📰",
      href: "/admin/news",
      color: "var(--secondary-blue)",
    },
    {
      title: "Контакти",
      description: "Оновлення контактної інформації",
      icon: "📞",
      href: "/admin/contacts",
      color: "var(--primary-yellow)",
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          <span className={styles.titleIcon}>🦒</span>
          Панель управління Жирафик
        </h1>
        <p className={styles.dashboardSubtitle}>
          Ласкаво просимо до адміністративної панелі
        </p>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>📊</div>
          <p>Завантаження статистики...</p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && stats && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👀</div>
              <div className={styles.statInfo}>
                <h3>Всього переглядів</h3>
                <p className={styles.statNumber}>{stats.totalPageViews}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statInfo}>
                <h3>Унікальних відвідувачів</h3>
                <p className={styles.statNumber}>{stats.uniqueVisitors}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎂</div>
              <div className={styles.statInfo}>
                <h3>Заброньовано свят</h3>
                <p className={styles.statNumber}>
                  {ordersCount || stats.bookingsTotal || 0}
                </p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statInfo}>
                <h3>Рейтинг</h3>
                <p className={styles.statNumber}>4.9</p>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>Перегляди по сторінках</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.pageViewsByPath}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Перегляди" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>Перегляди по днях</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.pageViewsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#82ca9d"
                    name="Перегляди"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>
                Джерела переходів (Top 10)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topReferrers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ffc658" name="Переходи" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartContainer}>
              <h2 className={styles.sectionTitle}>Бронювання по днях</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.bookingsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ff7300"
                    name="Бронювання"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className={styles.dashboardGrid}>
        {dashboardCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className={styles.dashboardCard}
            style={
              {
                "--card-color": card.color,
              } as React.CSSProperties
            }
          >
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
            </div>
            <div className={styles.cardArrow}>→</div>
          </Link>
        ))}
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Швидкі дії</h2>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>➕ Додати новину</button>
          <button className={styles.actionButton}>💰 Оновити ціни</button>
          <button className={styles.actionButton}>
            📧 Переглянути повідомлення
          </button>
          <button className={styles.actionButton}>📊 Експорт звітів</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
