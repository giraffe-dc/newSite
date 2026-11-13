"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminOrders.module.css";
import type { OrderStatus } from "@/types";

interface OrderItem {
  serviceName: string;
  quantity?: number;
  price?: string;
}

interface Order {
  _id: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  date?: string;
  time?: string;
  eventAddress?: string;
  eventType?: string;
  childrenCount?: number;
  notes?: string;
  items?: OrderItem[];
  packageName?: string;
  serviceName?: string;
  createdAt?: string;
  status?: string;
}

type Filter = "all" | OrderStatus;

const STATUSES: OrderStatus[] = ["new", "in_progress", "done", "cancelled"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  in_progress: "В роботі",
  done: "Виконано",
  cancelled: "Скасовано",
};

const FILTER_LABELS: Record<Filter, string> = {
  all: "Усі",
  new: "Нові",
  in_progress: "В роботі",
  done: "Виконані",
  cancelled: "Скасовані",
};

const BADGE_CLASS: Record<OrderStatus, string> = {
  new: styles.badgeNew,
  in_progress: styles.badgeProgress,
  done: styles.badgeDone,
  cancelled: styles.badgeCancelled,
};

/** Старі заявки могли мати попередні статуси — показуємо їх як є. */
function normalizeStatus(status?: string): OrderStatus | null {
  return STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : null;
}

function badgeClass(status?: string): string {
  return normalizeStatus(status)
    ? BADGE_CLASS[normalizeStatus(status) as OrderStatus]
    : styles.badgeUnknown;
}

function statusLabel(status?: string): string {
  const known = normalizeStatus(status);
  return known ? STATUS_LABELS[known] : (status ?? "new");
}

function formatDetails(order: Order): string[] {
  const lines: string[] = [];
  if (order.date) {
    lines.push(order.time ? `${order.date} о ${order.time}` : order.date);
  }
  if (order.eventType) lines.push(order.eventType);
  if (order.serviceName) lines.push(`Послуга: ${order.serviceName}`);
  if (order.childrenCount) lines.push(`Дітей: ${order.childrenCount}`);
  if (order.packageName) lines.push(`Пакет: ${order.packageName}`);
  if (order.whatsapp) lines.push(`WhatsApp: ${order.whatsapp}`);
  lines.push(
    `Створено: ${new Date(order.createdAt ?? "").toLocaleString("uk-UA")}`,
  );
  return lines;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setOrders((await res.json()) as Order[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const counts: Record<Filter, number> = {
    all: orders.length,
    new: 0,
    in_progress: 0,
    done: 0,
    cancelled: 0,
  };
  for (const order of orders) {
    const known = normalizeStatus(order.status);
    if (known) counts[known] += 1;
  }

  const visible =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  async function changeStatus(order: Order, status: OrderStatus) {
    const previous = order.status;
    setBusyId(order._id);
    /* Оптимістичне оновлення: бейдж міняється одразу. */
    setOrders((prev) =>
      prev.map((item) => (item._id === order._id ? { ...item, status } : item)),
    );
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: order._id, status }),
      });
      if (res.ok) {
        flash("ok", "Статус оновлено");
      } else {
        throw new Error(String(res.status));
      }
    } catch {
      setOrders((prev) =>
        prev.map((item) =>
          item._id === order._id ? { ...item, status: previous } : item,
        ),
      );
      flash("err", "Не вдалося змінити статус");
    } finally {
      setBusyId(null);
    }
  }

  async function removeOrder(order: Order) {
    if (!window.confirm(`Видалити заявку «${order.customerName}»?`)) return;
    setBusyId(order._id);
    try {
      const res = await fetch(`/api/admin/orders?id=${order._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((item) => item._id !== order._id));
        if (expanded === order._id) setExpanded(null);
        flash("ok", "Заявку видалено");
      } else {
        throw new Error(String(res.status));
      }
    } catch {
      flash("err", "Не вдалося видалити заявку");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Завантаження замовлень...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <p className={`${styles.message} ${styles.errorBox}`}>
          Не вдалося завантажити замовлення. Перевірте з'єднання та права
          доступу.
        </p>
        <button
          type="button"
          className={styles.chip}
          onClick={() => void load()}
        >
          Повторити спробу
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span>🧾</span> Замовлення
        </h1>
        <p className={styles.pageSubtitle}>
          Заявки з форми бронювання: фільтруйте за статусом, міняйте статус і
          розгортайте картку для деталей.
        </p>
      </div>

      {message && (
        <output
          className={`${styles.message} ${message.kind === "ok" ? styles.successBox : styles.errorBox}`}
        >
          {message.text}
        </output>
      )}

      <fieldset className={styles.filters} aria-label="Фільтр за статусом">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${filter === key ? styles.chipActive : ""}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
            <span className={styles.chipCount}>{counts[key]}</span>
          </button>
        ))}
      </fieldset>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          {orders.length === 0
            ? "Поки немає замовлень."
            : "Немає замовлень із цим статусом."}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((order) => {
            const isOpen = expanded === order._id;
            const busy = busyId === order._id;
            return (
              <li key={order._id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardHead}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                >
                  <span className={styles.cardName}>{order.customerName}</span>
                  <a
                    className={styles.cardMeta}
                    href={`tel:${order.phone.replace(/[^+\d]/g, "")}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {order.phone}
                  </a>
                  {order.date && (
                    <span className={styles.cardMeta}>{order.date}</span>
                  )}
                  <span
                    className={`${styles.badge} ${badgeClass(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <span
                    className={`${styles.cardArrow} ${isOpen ? styles.cardArrowOpen : ""}`}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className={styles.details}>
                    {order.eventAddress && (
                      <div>
                        <span className={styles.detailLabel}>Адреса</span>
                        <span className={styles.detailValue}>
                          {order.eventAddress}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className={styles.detailLabel}>Деталі</span>
                      <span className={styles.detailValue}>
                        {formatDetails(order).join("\n")}
                      </span>
                    </div>
                    {order.notes && (
                      <div>
                        <span className={styles.detailLabel}>Коментар</span>
                        <span className={styles.detailValue}>
                          {order.notes}
                        </span>
                      </div>
                    )}
                    {order.items && order.items.length > 0 && (
                      <ul className={styles.items}>
                        {order.items.map((item, index) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: статичний список позицій із сервера, порядок не змінюється
                          <li key={index}>
                            {item.serviceName}
                            {item.quantity ? ` ×${item.quantity}` : ""}
                            {item.price ? ` — ${item.price}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className={`${styles.actions} ${busy ? styles.busy : ""}`}>
                  <label
                    className={styles.statusLabel}
                    htmlFor={`order-status-${order._id}`}
                  >
                    Статус:
                  </label>
                  <select
                    id={`order-status-${order._id}`}
                    className={styles.statusSelect}
                    value={order.status ?? "new"}
                    onChange={(event) =>
                      void changeStatus(
                        order,
                        event.target.value as OrderStatus,
                      )
                    }
                  >
                    {order.status && normalizeStatus(order.status) === null && (
                      <option value={order.status}>
                        {statusLabel(order.status)}
                      </option>
                    )}
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    disabled={busy}
                    onClick={() => void removeOrder(order)}
                  >
                    🗑 Видалити
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
