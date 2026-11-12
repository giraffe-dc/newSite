// src/app/admin/packages/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminPackages.module.css";

interface ServicePackage {
  _id?: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  includes: string[];
  recommended?: boolean;
  icon?: string;
  active?: boolean;
  priority?: number;
}

const newPackageInitialState: ServicePackage = {
  name: "",
  description: "",
  price: "",
  duration: "",
  includes: [],
  recommended: false,
  icon: "",
  active: true,
  priority: 0,
};

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState<ServicePackage>(
    newPackageInitialState,
  );
  const [newInclude, setNewInclude] = useState("");
  const router = useRouter();

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/packages");
      if (res.ok) {
        const data = await res.json();
        setPackages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setMessage("Помилка завантаження пакетів");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const _handleInputChange = (
    index: number,
    field: keyof ServicePackage,
    value: string,
  ) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const handleNewPackageChange = (
    field: keyof ServicePackage,
    value: string | boolean,
  ) => {
    setNewPackage((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddInclude = () => {
    if (newInclude.trim()) {
      setNewPackage((prev) => ({
        ...prev,
        includes: [...prev.includes, newInclude.trim()],
      }));
      setNewInclude("");
    }
  };

  const handleRemoveInclude = (index: number) => {
    setNewPackage((prev) => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index),
    }));
  };

  const handleToggleRecommended = async (item: ServicePackage) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/packages/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommended: !item.recommended }),
        credentials: "include",
      });
      if (res.ok) {
        setPackages(
          packages.map((p) =>
            p._id === item._id ? { ...p, recommended: !item.recommended } : p,
          ),
        );
        setMessage("Статус оновлено");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (_e) {
      setMessage("Помилка оновлення");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePackage = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPackage),
        credentials: "include",
      });
      if (res.ok) {
        setMessage("Пакет створено");
        setShowAddForm(false);
        setNewPackage(newPackageInitialState);
        setNewInclude("");
        await fetchPackages();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка створення пакету");
      }
    } catch (_e) {
      setMessage("Помилка з'єднання");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Видалити цей пакет?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPackages(packages.filter((p) => p._id !== id));
        setMessage("Пакет видалено");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка видалення пакету");
      }
    } catch (_e) {
      setMessage("Помилка з'єднання");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>🎁</div>
        <p>Завантаження пакетів...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminPackagesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🎁</span> Керування пакетами свят
        </h1>
        <p className={styles.pageSubtitle}>
          Додавайте, редагуйте та видаляйте пакетні пропозиції
        </p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles.success}`}>
          <span className={styles.messageIcon}>✅</span>
          {message}
        </div>
      )}

      <div className={styles.actionsBar}>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          {showAddForm ? "❌ Сховати форму" : "➕ Додати пакет"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className={styles.backButton}
        >
          ⬅️ Назад до панелі
        </button>
      </div>

      {showAddForm && (
        <div className={styles.addForm}>
          <h2>Новий пакет свят</h2>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="pkg-name">Назва пакету</label>
              <input
                id="pkg-name"
                type="text"
                value={newPackage.name}
                onChange={(e) => handleNewPackageChange("name", e.target.value)}
                placeholder="Наприклад, Базове свято"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="pkg-price">Ціна</label>
              <input
                id="pkg-price"
                type="text"
                value={newPackage.price}
                onChange={(e) =>
                  handleNewPackageChange("price", e.target.value)
                }
                placeholder="2500 грн"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="pkg-duration">Тривалість</label>
              <input
                id="pkg-duration"
                type="text"
                value={newPackage.duration}
                onChange={(e) =>
                  handleNewPackageChange("duration", e.target.value)
                }
                placeholder="2 години"
              />
            </div>
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label htmlFor="pkg-description">Опис</label>
              <textarea
                id="pkg-description"
                value={newPackage.description}
                onChange={(e) =>
                  handleNewPackageChange("description", e.target.value)
                }
                rows={3}
                placeholder="Опис того, що входить до пакету"
              />
            </div>
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label htmlFor="pkg-include-input">Чого входить</label>
              <div className={styles.includesList}>
                {newPackage.includes.map((inc, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: прості рядки без id, редагування на місці за індексом
                  <div key={idx} className={styles.includeItem}>
                    <span>{inc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclude(idx)}
                      className={styles.removeInclude}
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <div className={styles.includeInput}>
                  <input
                    id="pkg-include-input"
                    type="text"
                    value={newInclude}
                    onChange={(e) => setNewInclude(e.target.value)}
                    placeholder="Додати пункт..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddInclude()}
                  />
                  <button
                    type="button"
                    onClick={handleAddInclude}
                    className={styles.addInclude}
                  >
                    ➕
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="pkg-icon">Іконка (емодзі)</label>
              <input
                id="pkg-icon"
                type="text"
                value={newPackage.icon}
                onChange={(e) => handleNewPackageChange("icon", e.target.value)}
                placeholder="🎈"
                maxLength={2}
              />
            </div>
            <div className={`${styles.fieldGroup} ${styles.checkboxGroup}`}>
              <input
                type="checkbox"
                checked={newPackage.recommended}
                onChange={(e) =>
                  handleNewPackageChange("recommended", e.target.checked)
                }
              />
              <span>Рекомендований пакет</span>
            </div>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCreatePackage}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "Створення..." : "💾 Створити пакет"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.packagesList}>
        {packages.map((item, index) => (
          <div key={item._id || index} className={styles.packageCard}>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <span className={styles.packageIcon}>{item.icon || "🎁"}</span>
                <div className={styles.packageInfo}>
                  <h3>{item.name}</h3>
                  {item.recommended && (
                    <span className={styles.recommendedBadge}>
                      ⭐ Рекомендовано
                    </span>
                  )}
                </div>
                <div className={styles.statusBadge}>
                  {item.active ? "Активний" : "Неактивний"}
                </div>
              </div>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardMeta}>
                <span className={styles.metaItem}>💰 {item.price}</span>
                {item.duration && (
                  <span className={styles.metaItem}>⏱ {item.duration}</span>
                )}
              </div>
              <div className={styles.includesPreview}>
                <strong>Увійшло:</strong>
                <ul>
                  {item.includes.map((inc, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: статичний список простих рядків без id
                    <li key={idx}>✓ {inc}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => handleToggleRecommended(item)}
                  disabled={saving}
                  className={styles.toggleButton}
                >
                  {item.recommended ? "Прибрати рекомендацію" : "Рекомендувати"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(item._id || "")}
                  disabled={saving}
                  className={styles.deleteButton}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className={styles.backButton}
        >
          ⬅️ Назад до панелі
        </button>
      </div>
    </div>
  );
};

export default AdminPackagesPage;
