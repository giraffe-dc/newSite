// src/app/admin/prices/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin/AdminPrices.module.css";

interface PriceItem {
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration: string;
  category: string;
  video: string;
}

interface CategoryItem {
  _id?: string;
  key: string;
  label: string;
  icon: string;
  order: number;
}

const newPriceInitialState: PriceItem = {
  name: "",
  price: "",
  description: "",
  duration: "",
  category: "",
  video: "",
};

const newCategoryInitialState: CategoryItem = {
  key: "",
  label: "",
  icon: "",
  order: 0,
};

const AdminPricesPage = () => {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrice, setNewPrice] = useState<PriceItem>(newPriceInitialState);
  const [showCategories, setShowCategories] = useState(false); // Accordion state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryItem>(
    newCategoryInitialState,
  );
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pricesRes, categoriesRes] = await Promise.all([
        fetch("/api/data/prices"),
        fetch("/api/admin/price-categories", {
          credentials: "include",
        }),
      ]);

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !newPrice.category) {
          setNewPrice((prev) => ({
            ...prev,
            category: categoriesData[0].key,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Помилка з'єднання з сервером");
    } finally {
      setLoading(false);
    }
  };

  // Price handlers
  const handleInputChange = (
    index: number,
    field: keyof PriceItem,
    value: string,
  ) => {
    const updatedPrices = [...prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setPrices(updatedPrices);
  };

  const handleNewPriceChange = (field: keyof PriceItem, value: string) => {
    setNewPrice((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePrice = async (item: PriceItem) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, ...item }),
        credentials: "include",
      });
      if (response.ok) {
        setMessage("Ціну успішно оновлено!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка оновлення ціни");
      }
    } catch (error) {
      setMessage("Помилка оновлення ціни");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrice),
        credentials: "include",
      });
      if (response.ok) {
        setMessage("Нову ціну успішно створено!");
        setNewPrice(newPriceInitialState);
        setShowAddForm(false);
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка створення ціни");
      }
    } catch (error) {
      setMessage("Помилка створення ціни");
    } finally {
      setSaving(false);
    }
  };

  // Category handlers
  const handleCategoryChange = (
    index: number,
    field: keyof CategoryItem,
    value: string | number,
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value,
    };
    setCategories(updatedCategories);
  };

  const handleNewCategoryChange = (
    field: keyof CategoryItem,
    value: string | number,
  ) => {
    setNewCategory((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateCategory = async (item: CategoryItem) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/price-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, ...item }),
        credentials: "include",
      });
      if (response.ok) {
        setMessage("Категорію успішно оновлено!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка оновлення категорії");
      }
    } catch (error) {
      setMessage("Помилка оновлення категорії");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/price-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
        credentials: "include",
      });
      if (response.ok) {
        setMessage("Нову категорію успішно створено!");
        setNewCategory(newCategoryInitialState);
        setShowCategoryForm(false);
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка створення категорії");
      }
    } catch (error) {
      setMessage("Помилка створення категорії");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Ви впевнені, що хочете видалити цю категорію? Це також може вплинути на існуючі прайси.",
      )
    )
      return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/price-categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      if (response.ok) {
        setMessage("Категорію успішно видалено!");
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка видалення категорії");
      }
    } catch (error) {
      setMessage("Помилка видалення категорії");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>💰</div>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminPricesPage}>
      {message && (
        <div
          className={`${styles.message} ${
            message.includes("успішно") ? styles.success : styles.error
          }`}
        >
          {message}
        </div>
      )}

      {/* --- CATEGORY MANAGEMENT (ACCORDION) --- */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🏷️</span>Керування категоріями
        </h1>
        <button
          onClick={() => setShowCategories(!showCategories)}
          className={styles.toggleFormButton}
        >
          {showCategories ? "🔽 Згорнути" : "▶️ Розгорнути"}
        </button>
      </div>

      {showCategories && (
        <div className={styles.categoriesSection}>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className={styles.addCategoryButton}
          >
            {showCategoryForm ? "❌ Закрити форму" : "➕ Додати категорію"}
          </button>

          {showCategoryForm && (
            <div className={styles.addFormSection}>
              <form
                onSubmit={handleCreateCategory}
                className={styles.categoryForm}
              >
                <input
                  type="text"
                  placeholder="Key (e.g. games)"
                  value={newCategory.key}
                  onChange={(e) =>
                    handleNewCategoryChange("key", e.target.value)
                  }
                  required
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Label (e.g. Ігрові зони)"
                  value={newCategory.label}
                  onChange={(e) =>
                    handleNewCategoryChange("label", e.target.value)
                  }
                  required
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Icon (e.g. 🎮)"
                  value={newCategory.icon}
                  onChange={(e) =>
                    handleNewCategoryChange("icon", e.target.value)
                  }
                  required
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Order"
                  value={newCategory.order}
                  onChange={(e) =>
                    handleNewCategoryChange(
                      "order",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  required
                  className={styles.input}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveButtonNew}
                >
                  {saving ? "Створення..." : "💾 Створити"}
                </button>
              </form>
            </div>
          )}

          <div className={styles.categoriesGrid}>
            {categories.map((cat, index) => (
              <div key={cat._id} className={styles.categoryCard}>
                <input
                  type="text"
                  value={cat.key}
                  onChange={(e) =>
                    handleCategoryChange(index, "key", e.target.value)
                  }
                  className={styles.input}
                />
                <input
                  type="text"
                  value={cat.label}
                  onChange={(e) =>
                    handleCategoryChange(index, "label", e.target.value)
                  }
                  className={styles.input}
                />
                <input
                  type="text"
                  value={cat.icon}
                  onChange={(e) =>
                    handleCategoryChange(index, "icon", e.target.value)
                  }
                  className={styles.input}
                />
                <input
                  type="number"
                  value={cat.order}
                  onChange={(e) =>
                    handleCategoryChange(
                      index,
                      "order",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className={styles.input}
                />
                <div className={styles.categoryCardActions}>
                  <button
                    onClick={() => handleUpdateCategory(cat)}
                    disabled={saving}
                    className={styles.actionButton}
                  >
                    💾
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat._id!)}
                    disabled={saving}
                    className={styles.actionButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PRICE MANAGEMENT --- */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>💰</span>Керування цінами
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.toggleFormButton}
        >
          {showAddForm ? "❌ Закрити форму" : "➕ Додати прайс"}
        </button>
      </div>

      {showAddForm && (
        <div className={styles.addFormSection}>
          <form onSubmit={handleCreatePrice} className={styles.priceForm}>
            <div className={styles.inputGroup}>
              <label>Назва</label>
              <input
                type="text"
                value={newPrice.name}
                onChange={(e) => handleNewPriceChange("name", e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Ціна (грн)</label>
              <input
                type="text"
                value={newPrice.price}
                onChange={(e) => handleNewPriceChange("price", e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Тривалість</label>
              <input
                type="text"
                value={newPrice.duration}
                onChange={(e) =>
                  handleNewPriceChange("duration", e.target.value)
                }
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Категорія</label>
              <select
                value={newPrice.category}
                onChange={(e) =>
                  handleNewPriceChange("category", e.target.value)
                }
                className={styles.input}
                required
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroupFullWidth}>
              <label>Опис</label>
              <textarea
                value={newPrice.description}
                onChange={(e) =>
                  handleNewPriceChange("description", e.target.value)
                }
                className={styles.textarea}
                rows={3}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Відео</label>
              <input
                type="text"
                value={newPrice.video}
                onChange={(e) => handleNewPriceChange("video", e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formActionsNew}>
              <button
                type="submit"
                disabled={saving}
                className={styles.saveButtonNew}
              >
                {saving ? "Створення..." : "💾 Створити прайс"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.pricesGrid}>
        {prices.map((item, index) => (
          <div key={item._id || index} className={styles.priceCard}>
            <div className={styles.cardBody}>
              <div className={styles.inputGroup}>
                <label>Назва</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleInputChange(index, "name", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Ціна (грн)</label>
                <input
                  type="text"
                  value={item.price}
                  onChange={(e) =>
                    handleInputChange(index, "price", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Тривалість</label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) =>
                    handleInputChange(index, "duration", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Категорія</label>
                <select
                  value={item.category}
                  onChange={(e) =>
                    handleInputChange(index, "category", e.target.value)
                  }
                  className={styles.input}
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroupFullWidth}>
                <label>Опис</label>
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    handleInputChange(index, "description", e.target.value)
                  }
                  className={styles.textarea}
                  rows={3}
                />
              </div>
              <div className={styles.inputGroupFullWidth}>
                <label>Відео</label>
                <input
                  type="text"
                  value={item.video}
                  onChange={(e) =>
                    handleInputChange(index, "video", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => handleUpdatePrice(item)}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? "Збереження..." : "💾 Оновити"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.formActions}>
        <button
          onClick={() => router.push("/admin")}
          className={styles.backButton}
        >
          ⬅️ Назад до панелі
        </button>
      </div>
    </div>
  );
};

export default AdminPricesPage;
