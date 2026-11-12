// src/app/admin/services/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminServices.module.css";

interface ServiceItem {
  _id?: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  priceFrom: string;
  duration?: string;
  icon?: string;
  image?: string;
  active?: boolean;
  priority?: number;
}

const categoryOptions = [
  { value: "animation", label: "Аніматори" },
  { value: "life-size-doll", label: "Ростові ляльки" },
  { value: "vr", label: "VR" },
  { value: "playstation", label: "Playstation" },
  { value: "master-class", label: "Майстер-класи" },
  { value: "decor", label: "Оформлення" },
];

const newServiceInitialState: ServiceItem = {
  name: "",
  shortDescription: "",
  description: "",
  category: "animation",
  priceFrom: "",
  duration: "",
  icon: "",
  image: "",
  active: true,
  priority: 0,
};

const AdminServicesPage = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState<ServiceItem>(
    newServiceInitialState,
  );
  const router = useRouter();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/services");
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setMessage("Помилка завантаження послуг");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const _handleInputChange = (
    index: number,
    field: keyof ServiceItem,
    value: string,
  ) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleNewServiceChange = (field: keyof ServiceItem, value: string) => {
    setNewService((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleActive = async (item: ServiceItem) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
        credentials: "include",
      });
      if (res.ok) {
        setServices(
          services.map((s) =>
            s._id === item._id ? { ...s, active: !item.active } : s,
          ),
        );
        setMessage("Статус оновлено");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (_e) {
      setMessage("Помилка оновлення статусу");
    } finally {
      setSaving(false);
    }
  };

  const _handleUpdateService = async (item: ServiceItem) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      if (res.ok) {
        setMessage("Послугу оновлено");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка оновлення послуги");
      }
    } catch (_e) {
      setMessage("Помилка з'єднання");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
        credentials: "include",
      });
      if (res.ok) {
        setMessage("Послугу створено");
        setShowAddForm(false);
        setNewService(newServiceInitialState);
        await fetchServices();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка створення послуги");
      }
    } catch (_e) {
      setMessage("Помилка з'єднання");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Видалити цю послугу?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setServices(services.filter((s) => s._id !== id));
        setMessage("Послугу видалено");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка видалення послуги");
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
        <div className={styles.loadingSpinner}>🎭</div>
        <p>Завантаження послуг...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminServicesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🎭</span> Керування послугами
        </h1>
        <p className={styles.pageSubtitle}>
          Додавайте, редагуйте та видаляйте послуги на виїзд
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
          {showAddForm ? "❌ Сховати форму" : "➕ Додати послугу"}
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
          <h2>Нова послуга</h2>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-name">Назва послуги</label>
              <input
                id="svc-name"
                type="text"
                value={newService.name}
                onChange={(e) => handleNewServiceChange("name", e.target.value)}
                placeholder="Наприклад, Аніматор на виїзд"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-category">Категорія</label>
              <select
                id="svc-category"
                value={newService.category}
                onChange={(e) =>
                  handleNewServiceChange("category", e.target.value)
                }
              >
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-short">Короткий опис</label>
              <input
                id="svc-short"
                type="text"
                value={newService.shortDescription}
                onChange={(e) =>
                  handleNewServiceChange("shortDescription", e.target.value)
                }
                placeholder="Веселий ведучий для дитячого свята"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-price">Ціна від</label>
              <input
                id="svc-price"
                type="text"
                value={newService.priceFrom}
                onChange={(e) =>
                  handleNewServiceChange("priceFrom", e.target.value)
                }
                placeholder="1500 грн"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-duration">Тривалість</label>
              <input
                id="svc-duration"
                type="text"
                value={newService.duration}
                onChange={(e) =>
                  handleNewServiceChange("duration", e.target.value)
                }
                placeholder="1-2 години"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="svc-icon">Іконка (емодзі)</label>
              <input
                id="svc-icon"
                type="text"
                value={newService.icon}
                onChange={(e) => handleNewServiceChange("icon", e.target.value)}
                placeholder="🎭"
                maxLength={2}
              />
            </div>
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label htmlFor="svc-desc">Повний опис</label>
              <textarea
                id="svc-desc"
                value={newService.description}
                onChange={(e) =>
                  handleNewServiceChange("description", e.target.value)
                }
                rows={3}
                placeholder="Детальний опис послуги"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCreateService}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "Створення..." : "💾 Створити послугу"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.servicesList}>
        {services.map((item, index) => (
          <div key={item._id || index} className={styles.serviceCard}>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <span className={styles.serviceIcon}>{item.icon || "🎪"}</span>
                <div className={styles.serviceInfo}>
                  <h3>{item.name}</h3>
                  <span className={styles.categoryBadge}>
                    {categoryOptions.find((c) => c.value === item.category)
                      ?.label || item.category}
                  </span>
                </div>
                <div className={styles.statusBadge}>
                  {item.active ? "Активна" : "Неактивна"}
                </div>
              </div>
              <p className={styles.cardDescription}>{item.shortDescription}</p>
              <div className={styles.cardMeta}>
                <span className={styles.metaItem}>💰 {item.priceFrom}</span>
                {item.duration && (
                  <span className={styles.metaItem}>⏱ {item.duration}</span>
                )}
              </div>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  disabled={saving}
                  className={styles.toggleButton}
                >
                  {item.active ? "Сховати" : "Показати"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(item._id || "")}
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

export default AdminServicesPage;
