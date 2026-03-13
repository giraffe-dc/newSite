"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin/AdminCafe.module.css";
import { CafeItem } from "@/types";
import CafeItemModal from "@/components/admin/CafeItemModal";
import { Edit2, Trash2, Plus, ArrowLeft } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const AdminCafePage = () => {
  const [cafeItems, setCafeItems] = useState<CafeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CafeItem | undefined>(
    undefined,
  );
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCafeItems();
  }, []);

  const fetchCafeItems = async () => {
    try {
      const response = await fetch("/api/admin/cafe");
      if (response.ok) {
        const data = await response.json();
        setCafeItems(data);
      }
    } catch (error) {
      console.error("Error fetching cafe items:", error);
      setMessage("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: CafeItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleRemoveCafeItem = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю позицію?")) return;

    try {
      const response = await fetch("/api/admin/cafe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: id }),
        credentials: "include",
      });
      if (response.ok) {
        setCafeItems(cafeItems.filter((item) => item._id !== id));
        setMessage("Позицію видалено");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка видалення");
      }
    } catch (error) {
      setMessage("Помилка підключення до сервера");
    }
  };

  const handleSave = async (item: CafeItem) => {
    const method = item._id ? "PUT" : "POST";

    try {
      const response = await fetch("/api/admin/cafe", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
        credentials: "include",
      });

      if (response.ok) {
        setMessage("Дані успішно збережено!");
        setIsModalOpen(false);
        fetchCafeItems();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Помилка збереження даних");
      }
    } catch (error) {
      setMessage("Помилка підключення до сервера");
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>☕</div>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminCafePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>☕</span>
          Керування меню кафе
        </h1>
        <p className={styles.pageSubtitle}>
          Редагуйте, додавайте та видаляйте позиції меню
        </p>
      </div>

      {message && (
        <div
          className={`${styles.message} ${message.includes("успішно") || message.includes("видалено") ? styles.success : styles.error}`}
        >
          <span className={styles.messageIcon}>
            {message.includes("успішно") || message.includes("видалено")
              ? "✅"
              : "❌"}
          </span>
          {message}
        </div>
      )}

      <div className={styles.actionsBar}>
        <button onClick={handleAddNew} className={styles.addButton}>
          <Plus size={20} /> Додати позицію
        </button>
      </div>

      <div className={styles.cafeGrid}>
        {cafeItems.map((item, index) => (
          <FadeIn key={item._id || index} delay={index * 0.05} direction="up">
            <div className={styles.cafeCard}>
              <div className={styles.cardInfo}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <span className={styles.categoryBadge}>{item.category}</span>
                <p className={styles.itemPrice}>{item.price} грн</p>
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleEdit(item)}
                  className={styles.editButton}
                  title="Редагувати"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleRemoveCafeItem(item._id!)}
                  className={styles.removeButton}
                  title="Видалити"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className={styles.backButton}
        >
          <ArrowLeft size={18} /> Назад до панелі
        </button>
      </div>

      <CafeItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        item={editingItem}
      />
    </div>
  );
};

export default AdminCafePage;
