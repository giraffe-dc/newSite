/* Шар даних `site_content`: колекція MongoDB, документ на секцію
   ({ section, data, updatedAt }, унікальний індекс по `section`).
   Дефолти і форми — у content.ts (єдине джерело правди); цей модуль лише
   читає/пише їх у базу.

   Читання ніколи не валить сторінку: БД недоступна, документа немає або
   форма зламана → дефолти з content.ts + console.error (див. план, 6.2). */

import { HOME_SERVICE_EXTRA } from "@/components/board/content";
import { getDb } from "@/lib/mongodb";
import {
  SECTION_DEFAULTS,
  SECTION_KEYS,
  type SectionKey,
} from "@/lib/sectionDefaults";

export const CONTENT_COLLECTION = "site_content";

/* Ключі, порядок і дефолти живуть у чистому модулі sectionDefaults.ts
   (його імпортує й клієнтська адмінка /admin/content). Тут — ре-експорт
   для серверних викликів (API-роути). */
export { SECTION_DEFAULTS, SECTION_KEYS };
export type { SectionKey };

/**
 * Знімає `as const`-літерали з дефолтів: для форм і стану в адмінці потрібні
 * редаговані типи (`string`, а не `"Свято "`).
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly unknown[]
        ? readonly Widen<T[number]>[]
        : T extends object
          ? { -readonly [K in keyof T]: Widen<T[K]> }
          : T;

/** Дані секції — дефолт, але з редагованими типами. */
export type SectionData<K extends SectionKey> = Widen<
  (typeof SECTION_DEFAULTS)[K]
>;

/** Повний набір секцій для передачі в сторінки/компоненти. */
export type Sections = { [K in SectionKey]: SectionData<K> };

export function isSectionKey(key: string): key is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(key);
}

/**
 * Проста runtime-перевірка структури без нових залежностей:
 * значення має повторювати форму дефолту — примітиви за типом, масиви за
 * першим елементом, об'єкти за ключами дефолту. Зайві ключі ігноруються,
 * відсутні обов'язкові — відмова.
 */
export function matchesShape(value: unknown, shape: unknown): boolean {
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) return false;
    if (shape.length === 0) return true;
    // Списки-дефолти ніколи не порожні: порожній масив ламає сторінки,
    // що беруть перший елемент (cases[0] тощо).
    return (
      value.length > 0 && value.every((item) => matchesShape(item, shape[0]))
    );
  }
  if (typeof shape === "object" && shape !== null) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    return Object.entries(shape).every(([key, expected]) => {
      if (expected === undefined) return true; // опційне поле
      // Якщо ключа немає в даних з БД — пропускаємо (дані можуть бути частковими).
      // Важливо: не відхиляємо цілі дані через одне відсутнє поле.
      if (!(key in value)) return true;
      return matchesShape((value as Record<string, unknown>)[key], expected);
    });
  }
  return typeof value === typeof shape;
}

/** Валідні дані з БД, інакше — дефолт (з логом про зламаний документ). */
function resolve<K extends SectionKey>(
  key: K,
  stored: unknown,
): SectionData<K> {
  if (stored !== undefined) {
    if (matchesShape(stored, SECTION_DEFAULTS[key])) {
      return stored as SectionData<K>;
    }
    console.error(
      `site_content: некоректна структура секції "${key}", показуємо дефолти`,
    );
  }
  return SECTION_DEFAULTS[key] as SectionData<K>;
}

/**
 * Перший запуск: унікальний індекс по `section` + порожня колекція →
 * записуємо всі дефолти (викликається з адмін-GET, не з публічних сторінок).
 */
export async function ensureSeeded(): Promise<void> {
  const db = await getDb();
  const collection = db.collection(CONTENT_COLLECTION);
  await collection.createIndex({ section: 1 }, { unique: true });

  if ((await collection.countDocuments()) === 0) {
    const now = new Date();
    try {
      await collection.insertMany(
        SECTION_KEYS.map((section) => ({
          section,
          data: SECTION_DEFAULTS[section],
          updatedAt: now,
        })),
      );
    } catch (error) {
      // Паралельний перший запуск: хтось уже встиг вставити — не помилка.
      if ((error as { code?: number })?.code !== 11000) throw error;
    }
  }
}

/** Усі секції одним запитом; недоступна БД → дефолти. */
export async function getSections(): Promise<Sections> {
  const stored = new Map<string, unknown>();
  try {
    const db = await getDb();
    const docs = await db.collection(CONTENT_COLLECTION).find({}).toArray();
    for (const doc of docs) {
      if (typeof doc.section === "string") stored.set(doc.section, doc.data);
    }
  } catch (error) {
    console.error(
      "site_content: не вдалося прочитати колекцію, використовуємо дефолти",
      error,
    );
  }

  const out = {} as Record<SectionKey, unknown>;
  for (const key of SECTION_KEYS) {
    out[key] = resolve(key, stored.get(key));
  }
  return out as Sections;
}

/** Одна секція; недоступна БД або немає документа → дефолти. */
export async function getSection<K extends SectionKey>(
  key: K,
): Promise<SectionData<K>> {
  try {
    const db = await getDb();
    const doc = await db
      .collection(CONTENT_COLLECTION)
      .findOne({ section: key });
    if (doc) return resolve(key, doc.data);
  } catch (error) {
    console.error(
      `site_content: не вдалося прочитати "${key}", використовуємо дефолти`,
      error,
    );
  }
  return SECTION_DEFAULTS[key] as SectionData<K>;
}

/** Запис секції (upsert); часткове збереження не чіпає інші секції. */
export async function saveSection<K extends SectionKey>(
  key: K,
  data: SectionData<K>,
): Promise<void> {
  /* `homeServiceOptions` — похідне поле (випадки + «ще не визначився»):
     перераховуємо при записі, щоб селект «Формат» не розходився з CASES. */
  const payload =
    key === "cases"
      ? ({
          ...(data as SectionData<"cases">),
          homeServiceOptions: [
            ...(data as SectionData<"cases">).cases.map((c) => c.service),
            HOME_SERVICE_EXTRA,
          ],
        } as object)
      : (data as object);

  const db = await getDb();
  await db
    .collection(CONTENT_COLLECTION)
    .updateOne(
      { section: key },
      { $set: { data: payload, updatedAt: new Date() } },
      { upsert: true },
    );
}
