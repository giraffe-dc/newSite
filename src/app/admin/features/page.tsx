// src/app/admin/features/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin/AdminFeatures.module.css";

interface Feature {
  _id: string;
  title: string;
  description: string;
}

const AdminFeaturesPage = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/admin/features");
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      setMessage("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof Omit<Feature, "_id">,
    value: string,
  ) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const handleAddFeature = () => {
    setFeatures([...features, { _id: "", title: "", description: "" }]);
  };

  const handleRemoveFeature = async (index: number) => {
    const featureToRemove = features[index];
    if (featureToRemove._id) {
      try {
        const response = await fetch("/api/admin/features", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _id: featureToRemove._id }),
          credentials: "include",
        });
        if (!response.ok) {
          setMessage("Помилка видалення");
          return;
        }
      } catch (error) {
        setMessage("Помилка підключення до сервера");
        return;
      }
    }
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
  };

  const handleSave = async (index: number) => {
    setSaving(true);
    setMessage("");
    const feature = features[index];
    const method = feature._id ? "PUT" : "POST";
    const body = feature._id
      ? JSON.stringify(feature)
      : JSON.stringify({
          title: feature.title,
          description: feature.description,
        });

    try {
      const response = await fetch("/api/admin/features", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
        credentials: "include",
      });

      if (response.ok) {
        setMessage("Дані успішно оновлено!");
        if (method === "POST") {
          const newId = await response.json();
          const newFeatures = [...features];
          newFeatures[index]._id = newId;
          setFeatures(newFeatures);
        }
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка збереження даних");
      }
    } catch (error) {
      setMessage("Помилка підключення до сервера");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>✨</div>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminFeaturesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>✨</span>
          Керування особливостями
        </h1>
        <p className={styles.pageSubtitle}>
          Редагуйте, додавайте та видаляйте особливості, що відображаються на
          головній сторінці
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

      <div className={styles.featuresGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Заголовок</label>
              <input
                type="text"
                value={feature.title}
                onChange={(e) =>
                  handleInputChange(index, "title", e.target.value)
                }
                className={styles.input}
                placeholder="Назва особливості"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Опис</label>
              <textarea
                value={feature.description}
                onChange={(e) =>
                  handleInputChange(index, "description", e.target.value)
                }
                className={styles.textarea}
                placeholder="Опис особливості"
                rows={3}
              />
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => handleRemoveFeature(index)}
                className={styles.removeButton}
              >
                ❌ Видалити
              </button>
              <button
                onClick={() => handleSave(index)}
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? "⏳" : "💾"} Зберегти
              </button>
            </div>
          </div>
        ))}
        <button onClick={handleAddFeature} className={styles.addButton}>
          ➕ Додати особливість
        </button>
      </div>
      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className={styles.cancelButton}
        >
          ⬅️ Назад
        </button>
      </div>
    </div>
  );
};

export default AdminFeaturesPage;
