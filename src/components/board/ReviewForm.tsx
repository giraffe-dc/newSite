"use client";

import { type FormEvent, Fragment, useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

/** Публічна форма відгуку на /reviews: оцінка-зірки — нативні radio
 *  (клавіатура й FormData без JS-стану), honeypot — від ботів.
 *  Запис іде зі статусом `pending` і з'являється після схвалення в адмінці. */
export default function ReviewForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* Захоплюємо форму до await: currentTarget дорівнює null після очікування. */
    const form = event.currentTarget;
    const data = new FormData(form);

    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          text: String(data.get("text") ?? ""),
          rating: Number(data.get("rating")),
          context: String(data.get("context") ?? ""),
          website: String(data.get("website") ?? ""),
        }),
      });
      if (res.status === 201) {
        form.reset();
        setStatus("success");
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
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
        <h3>Дякуємо за відгук!</h3>
        <p>Ми перевіримо й опублікуємо на сторінці — зазвичай це швидко.</p>
        <p style={{ marginTop: 16 }}>
          <button
            className="m2-btn m2-btn--ghost m2-btn--sm"
            type="button"
            onClick={() => setStatus("idle")}
          >
            Написати ще один
          </button>
        </p>
      </output>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <div className="m2-two">
        <div className="m2-field">
          <label htmlFor="rv-name">Ваше ім&apos;я</label>
          <input id="rv-name" name="name" required placeholder="Олена" />
        </div>
        <div className="m2-field">
          <label htmlFor="rv-context">Що за свято (необов&apos;язково)</label>
          <input
            id="rv-context"
            name="context"
            placeholder="День народження вдома"
          />
        </div>
      </div>

      <fieldset className="m2-rating">
        <legend>Ваша оцінка</legend>
        <div className="m2-rating__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            // По зірці на значення: порядок DOM зростає, контейнер
            // row-reverse — візуально 5 зліва, і селектор input:checked ~ label
            // підсвічує "правильні" зірки без JavaScript (input і label мають
            // бути одночасними дітьми контейнера — тому Fragment, не span).
            <Fragment key={n}>
              <input
                type="radio"
                id={`rv-star-${n}`}
                name="rating"
                value={n}
                defaultChecked={n === 5}
              />
              <label htmlFor={`rv-star-${n}`}>
                ★<span className="m2-vh">{n} з 5</span>
              </label>
            </Fragment>
          ))}
        </div>
      </fieldset>

      <div className="m2-field">
        <label htmlFor="rv-text">Відгук</label>
        <textarea
          id="rv-text"
          name="text"
          required
          placeholder="Як пройшло свято: що сподобалося, чи все вчасно, чи рекомендуєте..."
        />
      </div>

      {/* Honeypot: люди цього поля не бачать, боти заповнюють. */}
      <div className="m2-hp" aria-hidden="true">
        <label htmlFor="rv-website">Не заповнюйте це поле</label>
        <input
          id="rv-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
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
        {status === "sending" ? "Відправлення..." : "Надіслати відгук"}
      </button>
      <p className="m2-form__note">
        Відгук з&apos;явиться на сторінці після перевірки командою.
      </p>
    </form>
  );
}
