"use client";
import React, { useCallback, useState } from "react";
import styles from "@/styles/BookingModal.module.css";
import { Button } from "./ui/button";
import Toast from "./ui/Toast";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  defaultServiceName?: string;
}

export default function BookingModal({
  open,
  onClose,
  defaultServiceName,
}: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState(
    defaultServiceName ? `Послуга: ${defaultServiceName}` : "",
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = useCallback(() => setToastVisible(false), []);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic phone validation: allows +, spaces, digits, () and - with min length
    const phonePattern = /^\+?[0-9\s\-()]{7,}$/;
    if (!phone || !phonePattern.test(phone)) {
      setPhoneError("Введіть коректний номер телефону");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, phone, date, time, notes }),
      });
      if (res.ok) {
        showToast(
          "Заявку прийнято! Ми зв'яжемося з вами найближчим часом 🎉",
          "success",
        );
        setTimeout(onClose, 5000);
        setCustomerName("");
        setPhone("");
        setDate("");
        setTime("");
        setNotes("");
      } else {
        showToast("Щось пішло не так. Спробуйте ще раз.", "error");
      }
    } catch {
      showToast(
        "Помилка з'єднання. Перевірте інтернет та спробуйте ще раз.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>Заявка на бронювання</h3>
          <form onSubmit={onSubmit} className={styles.modalForm}>
            <label>
              Ім'я
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </label>
            <label>
              Телефон
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!phoneError}
                required
              />
              {phoneError && (
                <span className={styles.errorText}>{phoneError}</span>
              )}
            </label>
            <div className={styles.modalRow}>
              <label>
                Дата
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Час
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
            </div>
            <label>
              Коментар
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Додаткові побажання або послуга"
              />
            </label>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Відправка..." : "Підтвердити"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />
    </>
  );
}
