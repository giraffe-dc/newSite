/* Колекція `reviews` — відгуки сайту (етап 6 плану):
   - публічна форма на /reviews пише заявки зі статусом `pending`;
   - адмін /admin/reviews схвалює їх (`published`) або ховає (`hidden`);
   - 3 статичні відгуки з content.ts стають першими записами (сід), тож
     сторінки наповнені одразу, а «свіжі» на головній — це завжди найновіші.

   Читання ніколи не валить сторінку: БД недоступна → дефолти з content.ts
   (той самий принцип, що й у siteContent.ts, див. план, 6.2). */

import type { ObjectId } from "mongodb";
import { REVIEWS, type ReviewItem } from "@/components/board/content";
import { getDb } from "@/lib/mongodb";

export const REVIEWS_COLLECTION = "reviews";

/** `hidden` — прихований адміном; `deleted` — м'яке видалення: лишається
 *  в БД для історії, з сайту зникає, відновлення повертає в `pending`. */
export type ReviewStatus = "pending" | "published" | "hidden" | "deleted";
export type ReviewSource = "site" | "seed";

/** Документ колекції (`_id` драйвер додає сам). */
export interface ReviewDoc {
  _id?: ObjectId;
  name: string;
  text: string;
  rating: number;
  context?: string;
  status: ReviewStatus;
  source: ReviewSource;
  /** ISO-рядок: лексикографне сортування = сортування за часом. */
  createdAt: string;
}

/** Вхід публічної форми (усі поля — з FormData/JSON, без довіри). */
export interface ReviewInput {
  name?: unknown;
  text?: unknown;
  rating?: unknown;
  context?: unknown;
  /** Honeypot: людина це поле не бачить; заповнене → бот. */
  website?: unknown;
}

/** Історичні дати сіду: старші за будь-яку майбутню заявку з форми. */
const SEED_DATES = [
  "2026-06-14T09:00:00.000Z",
  "2026-08-30T09:00:00.000Z",
  "2026-10-18T09:00:00.000Z",
];

function str(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/** Документ → формат показу (картки). */
function toDisplay(doc: ReviewDoc, id: string, index: number): ReviewItem {
  const rating = Math.min(5, Math.max(1, Math.round(doc.rating || 5)));
  const name = str(doc.name, 50) ? str(doc.name, 50) : "Аноним";
  const text = str(doc.text, 1000);
  return {
    id,
    stars: "★".repeat(rating) + "☆".repeat(5 - rating),
    rating,
    /* Зірки в макеті були в «лапках» — новим заявкам додаємо для єдності. */
    quote: text.startsWith("«") ? text : `«${text}»`,
    initial: name.charAt(0).toUpperCase(),
    name,
    context: str(doc.context, 100),
    avatar: `m2-ava--${(index % 3) + 1}`,
  };
}

/** Перший запуск: порожня колекція → вставляємо 3 статичні відгуки. */
async function ensureSeeded(): Promise<void> {
  const db = await getDb();
  const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION);
  if ((await collection.countDocuments()) !== 0) return;
  await collection.insertMany(
    REVIEWS.map((review, index) => ({
      name: review.name,
      text: review.quote,
      rating: review.rating,
      context: review.context,
      status: "published" as const,
      source: "seed" as const,
      createdAt: SEED_DATES[index] ?? new Date(2026, 5, 1).toISOString(),
    })),
  );
}

/** Опубліковані відгуки, найновіші першими; обмеження — за потребою.
 *  Недоступна БД → дефолти з content.ts (сторінки не падають). */
export async function getPublishedReviews(
  limit?: number,
): Promise<ReviewItem[]> {
  try {
    await ensureSeeded();
    const db = await getDb();
    const docs = await db
      .collection<ReviewDoc>(REVIEWS_COLLECTION)
      .find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(limit ?? 0)
      .toArray();
    return docs.map((doc, index) => toDisplay(doc, String(doc._id), index));
  } catch (error) {
    console.error(
      "reviews: не вдалося прочитати колекцію, використовуємо дефолти",
      error,
    );
    return limit ? REVIEWS.slice(0, limit) : [...REVIEWS];
  }
}

/** Валідація + запис заявки з форми (статус `pending` — на перевірку).
 *  Honeypot заповнено → фіктивний успіх, запису немає. */
export async function createReview(
  input: ReviewInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (str(input.website, 200)) return { ok: true }; // бот

  const name = str(input.name, 50);
  const text = str(input.text, 1000);
  const rating = Math.round(Number(input.rating));
  const context = str(input.context, 100);

  if (name.length < 2) {
    return { ok: false, error: "Вкажіть ім'я (щонайменше 2 символи)" };
  }
  if (text.length < 10) {
    return {
      ok: false,
      error: "Напишіть відгук щонайменше з 10 символів",
    };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Оберіть оцінку від 1 до 5 зірок" };
  }

  const db = await getDb();
  await db.collection<ReviewDoc>(REVIEWS_COLLECTION).insertOne({
    name,
    text,
    rating,
    context: context || undefined,
    status: "pending",
    source: "site",
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
}
