// src/app/admin/home/page.tsx
"use client";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/admin/AdminHome.module.css";

interface HomeData {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  images: string[];
  workingHours: string;
  address: string;
  phone: string;
  serviceArea: string;
  whatsapp?: string;
  telegram?: string;
}

const AdminHomePage = () => {
  const [homeData, setHomeData] = useState<HomeData>({
    title: "",
    subtitle: "",
    description: "",
    features: [""],
    images: [""],
    workingHours: "",
    address: "",
    phone: "",
    serviceArea: "",
    whatsapp: "",
    telegram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const fetchHomeData = useCallback(async () => {
    try {
      const response = await fetch("/api/data/home");
      if (response.ok) {
        const data = await response.json();
        setHomeData(data);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
      setMessage("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/home", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homeData),
        credentials: "include",
      });

      if (response.ok) {
        setMessage("Дані успішно оновлено!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка збереження даних");
      }
    } catch (_error) {
      setMessage("Помилка підключення до сервера");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof HomeData, value: string) => {
    setHomeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (
    field: "features" | "images",
    index: number,
    value: string,
  ) => {
    setHomeData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: "features" | "images") => {
    setHomeData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (field: "features" | "images", index: number) => {
    setHomeData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>🏠</div>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminHomePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🏠</span>
          Керування головною сторінкою
        </h1>
        <p className={styles.pageSubtitle}>
          Редагуйте контент головної сторінки сайту
        </p>
      </div>

      {message && (
        <div
          className={`${styles.message} ${message.includes("успішно") ? styles.success : styles.error}`}
        >
          <span className={styles.messageIcon}>
            {message.includes("успішно") ? "✅" : "❌"}
          </span>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.adminForm}>
        <div className={styles.formGrid}>
          {/* Basic Info Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span>
              Основна інформація
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-title">
                Заголовок сайту
              </label>
              <input
                id="home-title"
                type="text"
                value={homeData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={styles.input}
                placeholder="Назва магістра свят"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-subtitle">
                Підзаголовок
              </label>
              <input
                id="home-subtitle"
                type="text"
                value={homeData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                className={styles.input}
                placeholder="Привеземо свято до вас"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-description">
                Опис
              </label>
              <textarea
                id="home-description"
                value={homeData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={styles.textarea}
                placeholder="Короткий опис центру"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Contact Info Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📞</span>
              Контактна інформація
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-working-hours">
                Режим роботи
              </label>
              <input
                id="home-working-hours"
                type="text"
                value={homeData.workingHours}
                onChange={(e) =>
                  handleInputChange("workingHours", e.target.value)
                }
                className={styles.input}
                placeholder="Пн-Нд: 10:00 - 21:00"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-address">
                Адреса
              </label>
              <input
                id="home-address"
                type="text"
                value={homeData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={styles.input}
                placeholder="вул. Дитяча, 15, м. Вінниця"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-phone">
                Телефон
              </label>
              <input
                id="home-phone"
                type="tel"
                value={homeData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={styles.input}
                placeholder="+38 (093) 123-45-67"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-service-area">
                Зона обслуговування
              </label>
              <input
                id="home-service-area"
                type="text"
                value={homeData.serviceArea}
                onChange={(e) =>
                  handleInputChange("serviceArea", e.target.value)
                }
                className={styles.input}
                placeholder="Вінниця та область"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-whatsapp">
                WhatsApp
              </label>
              <input
                id="home-whatsapp"
                type="url"
                value={homeData.whatsapp || ""}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                className={styles.input}
                placeholder="https://wa.me/380931234567"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="home-telegram">
                Telegram
              </label>
              <input
                id="home-telegram"
                type="url"
                value={homeData.telegram || ""}
                onChange={(e) => handleInputChange("telegram", e.target.value)}
                className={styles.input}
                placeholder="https://t.me/zhyrafyk_bot"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⭐</span>
              Особливості центру
            </h2>

            {homeData.features.map((feature, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: прості рядки без id, редагування на місці за індексом
              <div key={index} className={styles.arrayInputGroup}>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) =>
                    handleArrayChange("features", index, e.target.value)
                  }
                  className={styles.input}
                  placeholder="🎈 Назва особливості"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("features", index)}
                  className={styles.removeButton}
                  disabled={homeData.features.length === 1}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addArrayItem("features")}
              className={styles.addButton}
            >
              ➕ Додати особливість
            </button>
          </div>

          {/* Images Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🖼️</span>
              Зображення для слайдера
            </h2>

            {homeData.images.map((image, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: прості рядки без id, редагування на місці за індексом
              <div key={index} className={styles.arrayInputGroup}>
                <input
                  type="url"
                  value={image}
                  onChange={(e) =>
                    handleArrayChange("images", index, e.target.value)
                  }
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("images", index)}
                  className={styles.removeButton}
                  disabled={homeData.images.length === 1}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addArrayItem("images")}
              className={styles.addButton}
            >
              ➕ Додати зображення
            </button>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className={styles.cancelButton}
          >
            ⬅️ Назад
          </button>

          <button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? (
              <>
                <span className={styles.spinner}>⏳</span>
                Збереження...
              </>
            ) : (
              "💾 Зберегти зміни"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminHomePage;
