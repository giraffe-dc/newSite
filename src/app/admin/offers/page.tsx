"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/admin/AdminOffers.module.css";

interface Offer {
  _id?: string;
  title: string;
  description: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  priority?: number;
  recommended?: boolean;
  icon?: string;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState<number>(0);
  const [recommended, setRecommended] = useState(false);
  const [icon, setIcon] = useState("🎁");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) setOffers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        active,
        startDate: startDate || null,
        endDate: endDate || null,
        priority,
        recommended,
        icon,
      }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      setActive(true);
      setStartDate("");
      setEndDate("");
      setPriority(0);
      setRecommended(false);
      setIcon("🎁");
      load();
    }
  };

  const updateOffer = async (id: string, next: Partial<Offer>) => {
    const res = await fetch("/api/admin/offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, ...next }),
    });
    if (res.ok) load();
  };

  const deleteOffer = async (id: string) => {
    const res = await fetch("/api/admin/offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  };

  return (
    <div className={styles.adminOffersPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🏷️</span>
          Спеціальні пропозиції
        </h1>
        <p className={styles.pageSubtitle}>
          Створюйте, редагуйте та видаляйте спеціальні пропозиції
        </p>
      </div>

      <div className={styles.formWrapper}>
        <form onSubmit={createOffer}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Заголовок</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Опис</label>
              <input
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Активна</label>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Початок дії</label>
              <input
                className={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Кінець дії</label>
              <input
                className={styles.input}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Пріоритет</label>
              <input
                className={styles.input}
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Рекомендована</label>
              <input
                type="checkbox"
                checked={recommended}
                onChange={(e) => setRecommended(e.target.checked)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Іконка (емодзі)</label>
              <input
                className={styles.input}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
          </div>
          <button className={styles.addButton} type="submit">
            ➕ Додати
          </button>
        </form>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>📦</div>
          <p>Завантаження...</p>
        </div>
      ) : (
        <div className={styles.offersGrid}>
          {offers.map((o) => (
            <div key={o._id} className={styles.offerCard}>
              <div className={styles.offerInfo}>
                <h3>
                  {o.icon || "🏷️"} {o.title} {o.recommended ? "⭐" : ""}
                </h3>
                <p>{o.description}</p>
                <p>
                  {o.active === false ? "Неактивна" : "Активна"} | Пріоритет:{" "}
                  {o.priority ?? 0}
                </p>
                {(o.startDate || o.endDate) && (
                  <p>
                    Діє: {(o.startDate || "").toString()} —{" "}
                    {(o.endDate || "").toString()}
                  </p>
                )}
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.saveButton}
                  onClick={() =>
                    updateOffer(o._id!, {
                      title: prompt("Новий заголовок", o.title) || o.title,
                      description:
                        prompt("Новий опис", o.description) || o.description,
                      active: confirm(
                        "Залишити активною? ОК = так, Скасувати = ні",
                      ),
                      priority: Number(
                        prompt("Новий пріоритет", String(o.priority ?? 0)) ||
                          (o.priority ?? 0),
                      ),
                      icon: prompt("Іконка (емодзі)", o.icon || "🎁") || o.icon,
                    })
                  }
                >
                  ✏️ Редагувати
                </button>
                <button
                  className={styles.removeButton}
                  onClick={() => deleteOffer(o._id!)}
                >
                  🗑️ Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
