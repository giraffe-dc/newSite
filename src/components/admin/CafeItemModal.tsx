"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { CafeItem } from "@/types";
import styles from "@/styles/admin/AdminCafe.module.css";
import {
  extractGoogleDriveFileId,
  getGoogleDriveImageUrl,
} from "@/lib/googleDrive";

interface CafeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CafeItem) => void;
  item?: CafeItem;
}

// Resolve Google Drive or regular URL to a displayable src
function resolveImageSrc(url?: string): string {
  if (!url) return "";
  const id = extractGoogleDriveFileId(url);
  if (id) return getGoogleDriveImageUrl(id);
  return url;
}

const CafeItemModal = ({
  isOpen,
  onClose,
  onSave,
  item,
}: CafeItemModalProps) => {
  const [formData, setFormData] = useState<Partial<CafeItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "",
        image: "",
      });
    }
  }, [item, isOpen]);

  const handleChange = (
    field: keyof CafeItem,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as CafeItem);
  };

  const previewSrc = resolveImageSrc(formData.image);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item?._id ? "Редагувати позицію" : "Додати позицію"}
    >
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Назва</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Опис</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={styles.textarea}
            rows={3}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Ціна (грн)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleChange("price", parseInt(e.target.value, 10))}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Категорія</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className={styles.input}
            placeholder="Наприклад: Напої, Десерти"
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Зображення (URL або Google Drive)</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => handleChange("image", e.target.value)}
            className={styles.input}
            placeholder="https://drive.google.com/file/d/... або /images/latte.jpg"
          />
          {/* Live image preview */}
          {previewSrc && (
            <div className={styles.imagePreviewWrapper}>
              <img
                src={previewSrc}
                alt="Попередній перегляд"
                className={styles.imagePreview}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.cardActions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Скасувати
          </button>
          <button type="submit" className={styles.saveButton}>
            Зберегти
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CafeItemModal;
