"use client";
import { motion } from "framer-motion";
import type React from "react";
import { useCallback, useState } from "react";
import styles from "@/styles/BookingModal.module.css";
import { Button } from "./ui/button";
import Toast from "./ui/Toast";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  defaultServiceName?: string;
  defaultPackageName?: string;
}

export default function BookingModal({
  open,
  onClose,
  defaultServiceName,
  defaultPackageName,
}: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventType, setEventType] = useState("");
  const [childrenCount, setChildrenCount] = useState("");
  const [packageName, setPackageName] = useState(defaultPackageName || "");
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

  const eventTypes = [
    "День народження",
    "Випускний",
    "Корпоратив",
    "Свято в садку або школі",
    "Весілля",
    "Інше",
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phonePattern = /^\+?[0-9\s\-()]{7,}$/;
    if (!phone || !phonePattern.test(phone)) {
      setPhoneError("Введіть коректний номер телефону");
      return;
    }
    if (!eventAddress) {
      setPhoneError("Вкажіть адресу проведення святкування");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          whatsapp,
          date,
          time,
          eventAddress,
          eventType,
          childrenCount: childrenCount
            ? parseInt(childrenCount, 10)
            : undefined,
          packageName,
          notes,
        }),
      });
      if (res.ok) {
        showToast(
          "Заявку на виїзд прийнято. Команда зв'яжеться з вами й підтвердить дату, програму й ціну.",
          "success",
        );
        setTimeout(onClose, 5000);
        setCustomerName("");
        setPhone("");
        setWhatsapp("");
        setDate("");
        setTime("");
        setEventAddress("");
        setEventType("");
        setChildrenCount("");
        setPackageName("");
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
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.01 }}
        >
          <h3 className={styles.modalTitle}>Замовити виїзд магістра свят</h3>
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
            <label>
              WhatsApp (по бажанню)
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+38 (093) 123-45-67"
              />
            </label>
            <div className={styles.modalRow}>
              <label>
                Дата події
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
              <label>
                Час
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Адреса проведення (де буде свято)
              <input
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                placeholder="вул. Садова, 10, кв. 5 (дома, ресторан тощо)"
                required
              />
            </label>
            <label>
              Тип свята
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
              >
                <option value="">Оберіть тип</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Кількість дітей
              <input
                type="number"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                placeholder="наприклад, 10"
              />
            </label>
            {defaultPackageName && (
              <label>
                Обраний пакет
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  readOnly
                />
              </label>
            )}
            <label>
              Коментар / додаткові побажання
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Що важливо знати про локацію, гостей і програму?"
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
                {submitting ? "Відправка..." : "Замовити виїзд"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />
    </>
  );
}
