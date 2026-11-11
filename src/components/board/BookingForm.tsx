"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { BOOK, SERVICE_OPTIONS } from "./content";

interface Props {
  /** Дата, обрана вище на сторінці (підставляємо у поле). */
  date?: string;
  /** Формат, обраний вище на сторінці (підставляємо у селект). */
  service?: string;
  /** Опції селекта: головна передає свої, сторінка /book — стандартні. */
  options?: readonly string[];
}

/** Демонстраційна форма з mac2.html: успіх показуємо на клієнті, без запиту
 *  до API. Після підключення бази тут з'явиться POST /api/orders (етап даних). */
export default function BookingForm({
  date,
  service,
  options = SERVICE_OPTIONS,
}: Props) {
  const [sent, setSent] = useState(false);
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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <output className="m2-form__success" aria-live="polite">
        <h3>{BOOK.successTitle}</h3>
        <p>{BOOK.successText}</p>
        <p style={{ marginTop: 16 }}>
          <button
            className="m2-btn m2-btn--ghost m2-btn--sm"
            type="button"
            onClick={() => setSent(false)}
          >
            Заповнити ще одну
          </button>
        </p>
      </output>
    );
  }

  return (
    <form onSubmit={onSubmit}>
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
            placeholder="+380__ ___ __ __"
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
      <button className="m2-btn m2-btn--green" type="submit">
        Забронювати дату
      </button>
      <p className="m2-form__note">{BOOK.note}</p>
    </form>
  );
}
