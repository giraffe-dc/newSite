"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import { BOOK, SERVICE_OPTIONS } from "./content";

interface Props {
  /** Дата, обрана вище на сторінці (підставляємо у поле). */
  date?: string;
  /** Формат, обраний вище на сторінці (підставляємо у селект). */
  service?: string;
  /** Опції селекта: головна передає свої, сторінка /book — стандартні. */
  options?: readonly string[];
  /** Тексти секції «Бронювання» (з БД або дефолти з content.ts). */
  book?: SectionData<"book">["book"];
}

type Status = "idle" | "sending" | "success" | "error";

/** Телефон: допустимі +, цифри, пробіл, дефіс і дужки (від 7 символів) —
 *  та сама regex-логіка, що була у старій формі-модалці (прибрана в етапі 4). */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,}$/;

export default function BookingForm({
  date,
  service,
  options = SERVICE_OPTIONS,
  book = BOOK,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);

  /* Синхронізуємо лише дату й формат — решта введених полів не губиться. */
  useEffect(() => {
    if (date && dateRef.current) dateRef.current.value = date;
  }, [date]);

  useEffect(() => {
    if (!service || !serviceRef.current) return;
    const has = Array.from(serviceRef.current.options).some(
      (option) => option.value === service,
    );
    if (has) serviceRef.current.value = service;
  }, [service]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* Захоплюємо форму до await: currentTarget дорівнює null після очікування. */
    const form = event.currentTarget;
    const data = new FormData(form);

    const phone = String(data.get("phone") ?? "").trim();
    if (!PHONE_PATTERN.test(phone)) {
      setPhoneInvalid(true);
      setError("Введіть коректний номер телефону");
      setStatus("error");
      return;
    }

    setPhoneInvalid(false);
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: String(data.get("name") ?? "").trim(),
          phone,
          date: String(data.get("date") ?? ""),
          eventType: String(data.get("service") ?? ""),
          eventAddress: String(data.get("address") ?? "").trim(),
          notes: String(data.get("comment") ?? "").trim(),
        }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPhoneInvalid(false);
        setError(body?.error ?? "Щось пішло не так. Спробуйте ще раз.");
        setStatus("error");
      }
    } catch {
      setError("Помилка з'єднання. Перевірте інтернет та спробуйте ще раз.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <output className="m2-form__success" aria-live="polite">
        <h3>{book.successTitle}</h3>
        <p>{book.successText}</p>
        <p style={{ marginTop: 16 }}>
          <button
            className="m2-btn m2-btn--ghost m2-btn--sm"
            type="button"
            onClick={() => {
              setError(null);
              setStatus("idle");
            }}
          >
            Заповнити ще одну
          </button>
        </p>
      </output>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <div className="m2-two">
        <div className="m2-field">
          <label htmlFor="book-name">Ваше ім'я</label>
          <input id="book-name" name="name" required placeholder="Олена" />
        </div>
        <div className="m2-field">
          <label htmlFor="book-phone">Телефон</label>
          <input
            id="book-phone"
            name="phone"
            type="tel"
            required
            aria-invalid={phoneInvalid || undefined}
            placeholder="+380__ ___ __ __"
            onChange={() => {
              if (phoneInvalid) {
                setPhoneInvalid(false);
                setError(null);
                setStatus("idle");
              }
            }}
          />
        </div>
      </div>
      <div className="m2-two">
        <div className="m2-field">
          <label htmlFor="book-date">Дата свята</label>
          <input
            ref={dateRef}
            id="book-date"
            name="date"
            type="date"
            required
            defaultValue={date ?? ""}
          />
        </div>
        <div className="m2-field">
          <label htmlFor="book-service">Формат</label>
          <select
            ref={serviceRef}
            id="book-service"
            name="service"
            defaultValue={service ?? ""}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="m2-field">
        <label htmlFor="book-address">Адреса та місце проведення</label>
        <input
          id="book-address"
          name="address"
          placeholder="вул., будинок; квартира / клас / майданчик"
        />
      </div>
      <div className="m2-field">
        <label htmlFor="book-comment">Коментарі: скільки дітей, який вік</label>
        <textarea
          id="book-comment"
          name="comment"
          placeholder="6 дітей, 6–8 років, бажано космонавти"
        />
      </div>
      {status === "error" && error && (
        <p className="m2-form__error" role="alert">
          {error}
        </p>
      )}
      <button
        className="m2-btn m2-btn--green"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Відправлення..." : "Забронювати дату"}
      </button>
      <p className="m2-form__note">{book.note}</p>
    </form>
  );
}
