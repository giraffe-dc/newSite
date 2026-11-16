"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminAudit.module.css";

interface AuditChange {
  from?: string;
  to?: string;
}

interface AuditEntry {
  _id: string;
  actor: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId?: string;
  summary?: string;
  changes?: Record<string, AuditChange>;
  at: string;
}

const ACTION_LABEL: Record<AuditEntry["action"], string> = {
  create: "Створення",
  update: "Оновлення",
  delete: "Видалення",
};

const ENTITY_LABEL: Record<string, string> = {
  news: "Новини",
  offer: "Спецпропозиції",
  contacts: "Контакти",
  media: "Медіа",
};

function entityLabel(entity: string) {
  if (entity.startsWith("section:")) {
    return `Контент · ${entity.slice("section:".length)}`;
  }
  return ENTITY_LABEL[entity] ?? entity;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Журнал змін адмінки (ADM-01): хто і що змінив. */
export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/audit?limit=200", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Не вдалося завантажити журнал");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className={styles.loading}>Завантаження журналу…</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <strong>{error}</strong>
        <button type="button" className={styles.retry} onClick={() => load()}>
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Журнал змін</h1>
        <p>
          Хто і що змінив у контенті, новинах, акціях і контактах. Останні{" "}
          {entries.length} записів.
        </p>
        <button type="button" className={styles.retry} onClick={() => load()}>
          Оновити
        </button>
      </header>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          Записів ще немає — журнал заповнюється після перших змін в адмінці.
        </div>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => {
            const key = String(entry._id);
            const changes = entry.changes
              ? Object.entries(entry.changes)
              : [];
            const isOpen = expanded === key;
            return (
              <li key={key} className={styles.item}>
                <button
                  type="button"
                  className={styles.itemMain}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <span
                    className={`${styles.action} ${
                      styles[`action_${entry.action}`] ?? ""
                    }`}
                  >
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </span>
                  <span className={styles.summary}>
                    {entry.summary ?? entry.entity}
                  </span>
                  <span className={styles.meta}>
                    <span className={styles.entity}>
                      {entityLabel(entry.entity)}
                    </span>
                    <span className={styles.actor}>👤 {entry.actor}</span>
                    <span className={styles.date}>{formatDate(entry.at)}</span>
                  </span>
                  {changes.length > 0 && (
                    <span className={styles.chevron}>{isOpen ? "−" : "+"}</span>
                  )}
                </button>

                {isOpen && changes.length > 0 && (
                  <div className={styles.changes}>
                    <table className={styles.changesTable}>
                      <thead>
                        <tr>
                          <th>Поле</th>
                          <th>Було</th>
                          <th>Стало</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changes.map(([field, change]) => (
                          <tr key={field}>
                            <td className={styles.field}>{field}</td>
                            <td className={styles.from}>
                              {change.from ?? "—"}
                            </td>
                            <td className={styles.to}>{change.to ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
