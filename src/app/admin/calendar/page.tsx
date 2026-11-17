"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/styles/admin/AdminCalendar.module.css";

/* Календар зайнятості ресурсів (ADM-02): місячна сітка з заявками.
   Дати заявок зберігаються як рядки YYYY-MM-DD — показуємо їх як є,
   без конверсії часовими поясами; «сьогодні» визначається у
   Europe/Kyiv, щоб північ не «перестрибувала» день. */

interface Order {
  _id: string;
  customerName: string;
  phone?: string;
  date?: string;
  time?: string;
  serviceName?: string;
  packageName?: string;
  eventType?: string;
  status?: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "Нове",
  in_progress: "В роботі",
  confirmed: "Підтверджена",
  done: "Виконано",
  cancelled: "Скасовано",
};

const STATUS_CLASS: Record<string, string> = {
  new: styles.statusNew,
  in_progress: styles.statusProgress,
  confirmed: styles.statusConfirmed,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
};

/** Порядок днів тижня, починаючи з понеділка. */
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

/** «Сьогодні» у часовому поясі клієнта з урахуванням Europe/Kyiv. */
function todayKyiv(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Ключ дня YYYY-MM-DD → Date (лише для обчислення сітки місяця). */
function parseIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export default function AdminCalendarPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const today = parseIso(todayKyiv());
    return today
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Order[];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayKyiv();

  /** Заявки за датою (лише з датою, без скасованих — вони не тримають слот). */
  const byDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      if (!order.date || order.status === "cancelled") continue;
      const list = map.get(order.date) ?? [];
      list.push(order);
      map.set(order.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
    }
    return map;
  }, [orders]);

  /** Сітка місяця: повні тижні, щоб клітинки не «стрибали». */
  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month - 1, 1);
    const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // понеділок = 0
    const cells: (string | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(iso(cursor.year, cursor.month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthOrders = useMemo(() => {
    const prefix = `${cursor.year}-${pad(cursor.month)}-`;
    return orders.filter(
      (order) => order.date?.startsWith(prefix) && order.status !== "cancelled",
    );
  }, [orders, cursor]);

  const confirmedCount = monthOrders.filter(
    (order) => order.status === "confirmed",
  ).length;

  const selectedOrders = selected ? (byDate.get(selected) ?? []) : [];

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
    setSelected(null);
  };

  if (loading) {
    return <div className={styles.loading}>Завантаження календаря…</div>;
  }

  if (loadError) {
    return (
      <div className={styles.error}>
        <strong>Не вдалося завантажити заявки.</strong>
        <button type="button" className={styles.retry} onClick={() => load()}>
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>🗓 Календар зайнятості</h1>
          <p className={styles.subtitle}>
            Заявки за датами. Підтверджена заявка тримає слот — подвійне
            бронювання одного дня неможливе. Часовий пояс: Europe/Kyiv.
          </p>
        </div>
        <button type="button" className={styles.refresh} onClick={() => load()}>
          Оновити
        </button>
      </header>

      <div className={styles.summary}>
        <span>
          У місяці: <b>{monthOrders.length}</b>
        </span>
        <span>
          Підтверджено: <b>{confirmedCount}</b>
        </span>
        <span className={styles.todayTag}>Сьогодні: {today}</span>
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => shiftMonth(-1)}
        >
          ←
        </button>
        <h2 className={styles.monthTitle}>
          {MONTHS[cursor.month - 1]} {cursor.year}
        </h2>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => shiftMonth(1)}
        >
          →
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {grid.map((day, index) => {
          if (day === null) {
            // biome-ignore lint/suspicious/noArrayIndexKey: статична сітка місяця, порядок не змінюється
            return <div key={`empty-${index}`} className={styles.cellEmpty} />;
          }
          const list = byDate.get(day) ?? [];
          const isToday = day === today;
          const hasConfirmed = list.some((o) => o.status === "confirmed");
          return (
            <button
              key={day}
              type="button"
              className={`${styles.cell} ${isToday ? styles.cellToday : ""} ${
                selected === day ? styles.cellSelected : ""
              }`}
              onClick={() => setSelected(selected === day ? null : day)}
            >
              <span className={styles.dayNum}>{Number(day.slice(8))}</span>
              {list.length > 0 && (
                <span className={styles.dots}>
                  {list.slice(0, 4).map((order) => (
                    <i
                      key={order._id}
                      className={`${styles.dot} ${
                        hasConfirmed && order.status === "confirmed"
                          ? styles.dotConfirmed
                          : styles.dotPending
                      }`}
                    />
                  ))}
                </span>
              )}
              {list.length > 0 && (
                <span className={styles.count}>{list.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <section className={styles.dayPanel}>
        <h3 className={styles.dayTitle}>
          {selected
            ? `${selected} — ${selectedOrders.length} заявок`
            : "Оберіть день, щоб побачити заявки"}
        </h3>
        {selected && selectedOrders.length === 0 && (
          <p className={styles.dayEmpty}>У цей день заявок немає.</p>
        )}
        {selectedOrders.length > 0 && (
          <ul className={styles.dayList}>
            {selectedOrders.map((order) => (
              <li key={order._id} className={styles.dayItem}>
                <span className={styles.itemTime}>
                  {order.time || "час не вказано"}
                </span>
                <span className={styles.itemMain}>
                  <b>{order.customerName || "Без імені"}</b>
                  <span className={styles.itemMeta}>
                    {[
                      order.serviceName,
                      order.packageName,
                      order.eventType,
                      order.phone,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span
                  className={`${styles.status} ${
                    STATUS_CLASS[order.status ?? "new"] ?? styles.statusNew
                  }`}
                >
                  {STATUS_LABEL[order.status ?? "new"] ?? order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
