"use client";

import { useCallback, useEffect, useState } from "react";
/* Type-only: спільний тип статусів без підтягування серверного шару БД
   у клієнтський бандл. */
import type { ReviewStatus } from "@/lib/reviews";
import styles from "@/styles/admin/AdminReviews.module.css";

interface Review {
  _id: string;
  name: string;
  text: string;
  rating: number;
  context?: string;
  status: ReviewStatus;
  source: "site" | "seed";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

type Filter = "all" | ReviewStatus;

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "На перевірці",
  published: "Опублікований",
  hidden: "Прихований",
  deleted: "Видалений",
};

const FILTER_LABELS: Record<Filter, string> = {
  all: "Усі",
  pending: "На перевірці",
  published: "Опубліковані",
  hidden: "Приховані",
  deleted: "Видалені",
};

const BADGE_CLASS: Record<ReviewStatus, string> = {
  pending: styles.badgePending,
  published: styles.badgePublished,
  hidden: styles.badgeHidden,
  deleted: styles.badgeDeleted,
};

function stars(rating: number): string {
  const n = Math.min(5, Math.max(1, Math.round(rating || 5)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setReviews((await res.json()) as Review[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const counts: Record<Filter, number> = {
    all: reviews.length,
    pending: 0,
    published: 0,
    hidden: 0,
    deleted: 0,
  };
  for (const review of reviews) counts[review.status] += 1;

  const visible =
    filter === "all"
      ? reviews
      : reviews.filter((review) => review.status === filter);

  async function changeStatus(review: Review, status: ReviewStatus) {
    const previous = review;
    const now = new Date().toISOString();
    setBusyId(review._id);
    /* Оптимістичне оновлення: бейдж і дата видалення міняються одразу. */
    setReviews((prev) =>
      prev.map((item) =>
        item._id === review._id
          ? {
              ...item,
              status,
              updatedAt: now,
              deletedAt: status === "deleted" ? now : undefined,
            }
          : item,
      ),
    );
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: review._id, status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Помилка ${res.status}`);
      }
      flash(
        "ok",
        status === "published"
          ? "Відгук схвалено та опубліковано"
          : status === "hidden"
            ? "Відгук приховано"
            : status === "deleted"
              ? "Відгук видалено (запис лишився в базі, доступний у фільтрі «Видалені»)"
              : "Відгук повернуто на перевірку",
      );
    } catch (error) {
      setReviews((prev) =>
        prev.map((item) => (item._id === review._id ? previous : item)),
      );
      flash(
        "err",
        error instanceof Error ? error.message : "Не вдалося змінити статус",
      );
    } finally {
      setBusyId(null);
    }
  }

  /* М'яке видалення: запис лишається в БД (статус `deleted`), з сайту
     зникає; «Відновити» повертає його в чергу на перевірку. */
  function removeReview(review: Review) {
    if (
      !window.confirm(
        `Видалити відгук «${review.name}»? Запис не видаляється з бази: він лишиться у фільтрі «Видалені», а відновлення поверне його на перевірку.`,
      )
    ) {
      return;
    }
    void changeStatus(review, "deleted");
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Завантаження відгуків...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <p className={`${styles.message} ${styles.errorBox}`}>
          Не вдалося завантажити відгуки. Перевірте з&apos;єднання та права
          доступу.
        </p>
        <button
          type="button"
          className={styles.chip}
          onClick={() => void load()}
        >
          Повторити спробу
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span>💌</span> Відгуки
        </h1>
        <p className={styles.pageSubtitle}>
          Заявки з форми на /reviews з&apos;являються тут зі статусом «на
          перевірці». Схваліть відгук — і він одразу потрапить на сайт.
          Видалення м&apos;яке: запис лишається в базі у фільтрі «Видалені», а
          відновлення повертає його на перевірку.
        </p>
      </div>

      {message && (
        <output
          aria-live="polite"
          className={`${styles.message} ${message.kind === "ok" ? styles.successBox : styles.errorBox}`}
        >
          {message.text}
        </output>
      )}

      <fieldset className={styles.filters} aria-label="Фільтр за статусом">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${filter === key ? styles.chipActive : ""}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
            <span className={styles.chipCount}>{counts[key]}</span>
          </button>
        ))}
      </fieldset>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          {reviews.length === 0
            ? "Відгуків поки немає."
            : "Немає відгуків із цим статусом."}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((review) => {
            const busy = busyId === review._id;
            return (
              <li
                key={review._id}
                className={`${styles.card} ${review.status === "deleted" ? styles.cardDeleted : ""}`}
              >
                <div className={styles.cardHead}>
                  <span className={styles.cardName}>{review.name}</span>
                  <span
                    className={styles.stars}
                    role="img"
                    aria-label={`Оцінка: ${review.rating} з 5`}
                  >
                    {stars(review.rating)}
                  </span>
                  <span
                    className={`${styles.badge} ${BADGE_CLASS[review.status]}`}
                  >
                    {STATUS_LABELS[review.status]}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeSource}`}>
                    {review.source === "seed" ? "початковий" : "з форми"}
                  </span>
                  <span className={styles.cardMeta}>
                    {new Date(review.createdAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>

                <p className={styles.text}>{review.text}</p>
                {review.context && (
                  <p className={styles.context}>Свято: {review.context}</p>
                )}
                {review.status === "deleted" && (
                  <p className={styles.deletedNote}>
                    {`Видалено ${new Date(
                      review.deletedAt ?? review.updatedAt ?? review.createdAt,
                    ).toLocaleDateString(
                      "uk-UA",
                    )}. З бази не видалено — відновлення поверне відгук на перевірку.`}
                  </p>
                )}

                <div className={`${styles.actions} ${busy ? styles.busy : ""}`}>
                  {review.status === "deleted" ? (
                    <button
                      type="button"
                      className={styles.approveBtn}
                      disabled={busy}
                      onClick={() => void changeStatus(review, "pending")}
                    >
                      ♻ Відновити (на перевірку)
                    </button>
                  ) : (
                    <>
                      {review.status !== "published" && (
                        <button
                          type="button"
                          className={styles.approveBtn}
                          disabled={busy}
                          onClick={() => void changeStatus(review, "published")}
                        >
                          ✔ Схвалити й опублікувати
                        </button>
                      )}
                      {review.status === "published" && (
                        <button
                          type="button"
                          className={styles.hideBtn}
                          disabled={busy}
                          onClick={() => void changeStatus(review, "hidden")}
                        >
                          Приховати
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        disabled={busy}
                        onClick={() => removeReview(review)}
                      >
                        🗑 Видалити
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
