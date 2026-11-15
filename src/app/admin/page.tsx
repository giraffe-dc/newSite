"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "@/styles/admin/AdminDashboard.module.css";

interface StatsData {
  period: string;
  totalPageViews: number;
  uniqueVisitors: number;
  pageViewsByPath: { _id: string; count: number }[];
  pageViewsPerDay: { _id: string; count: number }[];
  topReferrers?: { _id: string; count: number }[];
  bookingsTotal?: number;
  bookingsPerDay?: { _id: string; count: number }[];
}

interface OrderItem {
  _id?: string;
  customerName: string;
  createdAt?: string;
  phone?: string;
}

interface ReviewItem {
  _id?: string;
  name: string;
  status: string;
  createdAt?: string;
}

interface ChatItem {
  _id?: string;
  threadId: string;
  clientName?: string;
  unreadForAdmin: number;
  updatedAt?: string;
}

type Period = "24h" | "7d" | "30d";

const PERIOD_LABELS: Record<Period, string> = {
  "24h": "24 години",
  "7d": "7 днів",
  "30d": "Місяць",
};

type TooltipEntry = { value: number; payload: { _id: string } };

const LineTooltip = ({
  active,
  payload,
}: {
  active: boolean;
  payload: TooltipEntry[];
}) => {
  if (!active || !payload.length) return null;
  const entry = payload[0];
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        background: "#1c221d",
        color: "#e8eadc",
        fontSize: 12,
      }}
    >
      {String(entry.payload._id)}: {entry.value} переглядів
    </div>
  );
};

const AdminDashboard = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, reviewsRes, chatsRes] = await Promise.all([
        fetch(`/api/admin/stats?period=${period}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/orders", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/reviews", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/admin/chat/threads", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!statsRes.ok) throw new Error("Не вдалося завантажити статистику");

      const data = await statsRes.json();
      setStats(data);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        const threads = Array.isArray(chatsData.threads)
          ? chatsData.threads
          : [];
        setChats(threads);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не вдалося завантажити дані",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <span
          style={{ fontSize: "40px", marginBottom: "12px", display: "block" }}
        >
          📊
        </span>
        <p>Завантаження статистики…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <strong>{error}</strong>
        <p style={{ marginTop: "8px", fontSize: "13px" }}>
          Спробуйте оновити сторінку або перевірте підключення.
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.error}>
        <strong>Дані не завантажені</strong>
        <p style={{ marginTop: "8px", fontSize: "13px" }}>
          Оновіть сторінку, щоб спробувати знову.
        </p>
      </div>
    );
  }

  const bookingsTotal = stats.bookingsTotal ?? orders.length;
  const unreadChats = chats.reduce(
    (sum, c) => sum + (c.unreadForAdmin ?? 0),
    0,
  );
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;

  // Поточна дата у UTC (як і timestamp в БД), у форматі YYYY-MM-DD.
  const todayUtc = new Date().toISOString().slice(0, 10);
  const viewsToday =
    stats.pageViewsPerDay
      ?.filter((d) => d._id === todayUtc)
      .reduce((sum, d) => sum + d.count, 0) ?? 0;

  // Бронювань за вибраний період — рахуємо з замовлень, що вже завантажені з /api/orders.
  // Фільтруємо на клієнті, щоб результат точно відповідав обраному періоду.
  const now = new Date();
  let startDate: Date;
  if (period === "24h") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  const bookingsThisPeriod = orders.filter((o) => {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    if (!d) return false;
    return d >= startDate;
  }).length;

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 4);

  const pendingReviewItems = reviews
    .filter((r) => r.status === "pending")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 4);

  const unreadChatItems = chats
    .filter((c) => (c.unreadForAdmin ?? 0) > 0)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 4);

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <span className={styles.kicker}>
          Жирафик &middot; Панель управління
        </span>
        <h1>Виїзні свят сьогодні</h1>
        <p>
          Основні показники бізнесу: бронювання, відвідавість сайту і контент,
          який потребує уваги.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <strong>{bookingsTotal}</strong> заявок усього
          </div>
          <div className={styles.heroStat}>
            <strong>{stats.uniqueVisitors}</strong> унікальних відвідувачів
          </div>
          <div className={styles.heroStat}>
            <strong>{pendingReviews}</strong> відгуків на перевірці
          </div>
        </div>
        <div className={styles.periodFilters}>
          {Object.entries(PERIOD_LABELS).map(([key, label]) => {
            const p = key as Period;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setPeriod(p)}
                className={`${styles.periodButton} ${
                  period === p ? styles.periodButtonActive : ""
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.label}>
            Бронювань за {PERIOD_LABELS[period].toLowerCase()}
          </span>
          <span className={styles.value}>{bookingsThisPeriod}</span>
          <span className={styles.delta}>за період</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Переглядів сьогодні</span>
          <span className={styles.value}>{viewsToday.toLocaleString()}</span>
          <span className={styles.delta}>унікальних відвідувачів</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Нових контактів</span>
          <span className={styles.value}>{orders.length}</span>
          <span className={styles.delta}>замовлень у базі</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Чатів не прочитано</span>
          <span className={styles.value}>{unreadChats}</span>
          <span className={styles.delta}>
            {unreadChats > 0 ? "потрібна відповідь" : "все в порядку"}
          </span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Звіт за період</h2>
          <span className={styles.note}>
            Бронювання та перегляди сторінок за{" "}
            {PERIOD_LABELS[period].toLowerCase()}
          </span>
        </div>
        <div className={styles.chartsRow}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.pageViewsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eadc" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={LineTooltip} />
                <Legend verticalAlign="top" align="right" />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--gd-vine)"
                  strokeWidth={2}
                  dot={false}
                  name="Перегляди"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.pageViewsByPath.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eadc" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Legend verticalAlign="top" align="right" />
                <Bar
                  dataKey="count"
                  fill="var(--gd-accent)"
                  radius={[4, 4, 0, 0]}
                  name="Перегляди"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className={styles.actions}>
        <div className={styles.sectionHead}>
          <h2>Швидкі дії</h2>
          <span className={styles.note}>
            Переходьте до розділів прямо з дашборду
          </span>
        </div>
        <ul className={styles.actionsList}>
          <li>
            <Link href="/admin/content" className={styles.actionLink}>
              <span className={styles.icon}>📝</span>
              Оновити контент сайту
              <span className={styles.chevron}>&rarr;</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/orders" className={styles.actionLink}>
              <span className={styles.icon}>🧾</span>
              Переглянути замовлення
              <span className={styles.chevron}>&rarr;</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/chat" className={styles.actionLink}>
              <span className={styles.icon}>💬</span>
              Відповісти в чаті
              <span className={styles.chevron}>&rarr;</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/reviews" className={styles.actionLink}>
              <span className={styles.icon}>💌</span>
              Схвалити відгуки
              <span className={styles.chevron}>&rarr;</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.feed}>
        <div className={styles.sectionHead}>
          <h2>Остання активність</h2>
          <span className={styles.note}>
            Замовлення &middot; відгуки &middot; чати
          </span>
        </div>
        {[
          ...recentOrders.map((o) => ({
            icon: "🧾",
            who: `Нове замовлення #${o._id?.slice(-6)}`,
            when: `${o.customerName} &middot; ${new Date(o.createdAt || Date.now()).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
            num: o.phone ?? "без телефону",
          })),
          ...pendingReviewItems.map((r) => ({
            icon: "💌",
            who: `Новий відгук на перевірці`,
            when: `${r.name} &middot; ${new Date(r.createdAt || Date.now()).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
            num: "очікує схвалення",
          })),
          ...unreadChatItems.map((c) => ({
            icon: "💬",
            who: `Повідомлення в чаті`,
            when: `${c.clientName || "Клієнт"} &middot; ${new Date(c.updatedAt || Date.now()).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
            num: "не прочитано",
          })),
        ]
          .sort((a, b) => b.when.localeCompare(a.when))
          .slice(0, 6)
          .map((item) => (
            <div
              key={`${item.who}|${item.when}|${item.num}`}
              className={styles.feedItem}
            >
              <div className={styles.feedIcon}>{item.icon}</div>
              <div className={styles.feedText}>
                <span className={styles.who}>{item.who}</span>
                <span className={styles.when}>{item.when}</span>
              </div>
              <div className={styles.feedNum}>{item.num}</div>
            </div>
          ))}
      </section>

      <p className={styles.footerNote}>
        Жирафик &middot; виїзні свята для дітей &middot; дані оновлюються при
        кожному відкритті сторінки
      </p>
    </div>
  );
};

export default AdminDashboard;
