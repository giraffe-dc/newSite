"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminAnalytics.module.css";

/** Воронка мобільного додатка (Етап 4): перегляд → калькулятор → заявка → підтвердження.
 *  Події знеособлені й надсилаються тільки за згодою на аналітику. */

interface FunnelStep {
  from: string;
  to: string;
  fromCount: number;
  toCount: number;
  conversion: number;
}

interface FunnelData {
  days: number;
  from: string;
  counts: Record<string, number>;
  steps: FunnelStep[];
  total: number;
}

const LABELS: Record<string, string> = {
  catalog_view: "Перегляд каталогу",
  service_view: "Перегляд послуги",
  calc_start: "Початок розрахунку",
  calc_finish: "Розрахунок завершено",
  assistant_start: "Підбір програми",
  assistant_finish: "Програму підібрано",
  booking_open: "Форма бронювання",
  booking_submit: "Заявку надіслано",
  order_confirmed: "Заявку підтверджено",
};

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (period: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/funnel?days=${period}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as FunnelData);
    } catch {
      setError("Не вдалося завантажити воронку");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>📊 Аналітика мобільного додатка</h1>
      <p className={styles.subtitle}>
        Воронка: перегляд → розрахунок → бронювання → підтвердження.
        Події знеособлені й збираються лише за згодою користувача.
      </p>

      <div className={styles.toolbar}>
        {[7, 30].map((period) => (
          <button
            key={period}
            type="button"
            className={`${styles.btn} ${days === period ? styles.btnActive : ""}`}
            onClick={() => setDays(period)}
          >
            Останні {period} днів
          </button>
        ))}
        <button type="button" className={styles.btn} onClick={() => void load(days)}>
          Оновити
        </button>
      </div>

      {error ? <p className={styles.note}>{error}</p> : null}
      {loading && !data ? <p className={styles.note}>Завантаження…</p> : null}

      {data ? (
        <>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Всього подій</div>
              <div className={styles.cardValue}>{data.total}</div>
            </div>
            {["catalog_view", "booking_submit", "order_confirmed"].map((key) => (
              <div key={key} className={styles.card}>
                <div className={styles.cardLabel}>{LABELS[key]}</div>
                <div className={styles.cardValue}>{data.counts[key] ?? 0}</div>
              </div>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Етап</th>
                  <th>Кількість</th>
                  <th>Конверсія</th>
                </tr>
              </thead>
              <tbody>
                {data.steps.map((step) => (
                  <tr key={`${step.from}-${step.to}`}>
                    <td>
                      <strong>{LABELS[step.from] ?? step.from}</strong>
                      <span className={styles.muted}> → {LABELS[step.to] ?? step.to}</span>
                    </td>
                    <td>
                      {step.fromCount} → {step.toCount}
                    </td>
                    <td>
                      <span
                        className={styles.bar}
                        style={{ width: `${Math.min(80, Math.max(2, step.conversion / 2))}px` }}
                      />
                      {step.conversion}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.note}>
            Дані за період з {new Date(data.from).toLocaleDateString("uk-UA")}.
            Воронка наближена: події рахуються за пристроями, а не за унікальними клієнтами.
          </p>
        </>
      ) : null}
    </div>
  );
}
