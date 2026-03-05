"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin/AdminContacts.module.css";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
}

const AdminContactsPage = () => {
  const [contacts, setContacts] = useState<ContactInfo>({
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      telegram: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/data/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setMessage("Помилка завантаження контактів");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contacts),
        credentials: "include",
      });

      if (response.ok) {
        setMessage("Контакти успішно оновлено!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка збереження контактів");
      }
    } catch (error) {
      setMessage("Помилка підключення до сервера");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof Omit<ContactInfo, "socialMedia">,
    value: string,
  ) => {
    setContacts((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialMediaChange = (
    platform: keyof ContactInfo["socialMedia"],
    value: string,
  ) => {
    setContacts((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>📞</div>
        <p>Завантаження контактів...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContactsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>📞</span>
          Керування контактами
        </h1>
        <p className={styles.pageSubtitle}>
          Оновлюйте контактну інформацію та соціальні мережі
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

      <form onSubmit={handleSubmit} className={styles.contactsForm}>
        <div className={styles.formGrid}>
          {/* Basic Contact Info */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📋</span>
              Основна інформація
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>📞</span>
                Телефон
              </label>
              <input
                type="tel"
                value={contacts.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={styles.input}
                placeholder="+38 (093) 123-45-67"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>✉️</span>
                Email
              </label>
              <input
                type="email"
                value={contacts.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={styles.input}
                placeholder="info@zhyrafyk.com.ua"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>📍</span>
                Адреса
              </label>
              <textarea
                value={contacts.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={styles.textarea}
                placeholder="вул. Дитяча, 15, м. Вінниця, Вінницька область, 21000"
                rows={3}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>🕒</span>
                Режим роботи
              </label>
              <input
                type="text"
                value={contacts.workingHours}
                onChange={(e) =>
                  handleInputChange("workingHours", e.target.value)
                }
                className={styles.input}
                placeholder="Пн-Нд: 10:00 - 21:00"
                required
              />
            </div>
          </div>

          {/* Social Media */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🌐</span>
              Соціальні мережі
            </h2>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>📘</span>
                Facebook
              </label>
              <input
                type="url"
                value={contacts.socialMedia.facebook || ""}
                onChange={(e) =>
                  handleSocialMediaChange("facebook", e.target.value)
                }
                className={styles.input}
                placeholder="https://facebook.com/zhyrafyk"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>📷</span>
                Instagram
              </label>
              <input
                type="url"
                value={contacts.socialMedia.instagram || ""}
                onChange={(e) =>
                  handleSocialMediaChange("instagram", e.target.value)
                }
                className={styles.input}
                placeholder="https://instagram.com/zhyrafyk_family"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>✈️</span>
                Telegram
              </label>
              <input
                type="url"
                value={contacts.socialMedia.telegram || ""}
                onChange={(e) =>
                  handleSocialMediaChange("telegram", e.target.value)
                }
                className={styles.input}
                placeholder="https://t.me/zhyrafyk_bot"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>👁️</span>
            Попередній перегляд
          </h2>

          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3 className={styles.previewTitle}>
                <span>📞</span> Контактна інформація
              </h3>
              <div className={styles.previewContent}>
                <p>
                  <strong>📞 Телефон:</strong> {contacts.phone || "Не вказано"}
                </p>
                <p>
                  <strong>✉️ Email:</strong> {contacts.email || "Не вказано"}
                </p>
                <p>
                  <strong>📍 Адреса:</strong> {contacts.address || "Не вказано"}
                </p>
                <p>
                  <strong>🕒 Режим роботи:</strong>{" "}
                  {contacts.workingHours || "Не вказано"}
                </p>
              </div>
            </div>

            <div className={styles.previewCard}>
              <h3 className={styles.previewTitle}>
                <span>🌐</span> Соціальні мережі
              </h3>
              <div className={styles.previewContent}>
                {contacts.socialMedia.facebook && (
                  <p>
                    <strong>📘 Facebook:</strong> Підключено
                  </p>
                )}
                {contacts.socialMedia.instagram && (
                  <p>
                    <strong>📷 Instagram:</strong> Підключено
                  </p>
                )}
                {contacts.socialMedia.telegram && (
                  <p>
                    <strong>✈️ Telegram:</strong> Підключено
                  </p>
                )}
                {!contacts.socialMedia.facebook &&
                  !contacts.socialMedia.instagram &&
                  !contacts.socialMedia.telegram && (
                    <p className={styles.noSocial}>
                      Соціальні мережі не налаштовані
                    </p>
                  )}
              </div>
            </div>
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
              <>💾 Зберегти контакти</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminContactsPage;
