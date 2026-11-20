/* Маніфест версії APK мобільного додатка «Жирафик» (див. giraffe-mobile).

   Раніше джерелом був static-файл `public/app/version.json`, який писав скрипт
   збірки — через це кожен реліз вимагав деплою сайту. Тепер актуальна версія
   живе в БД (колекція `mobile_releases`, єдиний документ `_id: "current"`):
   скрипт збірки публікує її через `POST /api/mobile/version` (API-ключ), і
   деплой не потрібен.

   Файл `public/app/version.json` лишається лише як fallback на випадок, коли
   БД ще порожня або недоступна — щоб сторінка /app і ендпоінт не падали. */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/** Маніфест релізу — ті самі поля, що й раніше у version.json. */
export type MobileRelease = {
  versionName: string;
  versionCode: number;
  changelog: string[];
  publishedAt: string;
  sha256?: string;
  apkUrl?: string;
};

export const MOBILE_RELEASES_COLLECTION = "mobile_releases";

/** `_id` єдиного документа з актуальною версією. */
export const CURRENT_RELEASE_ID = "current";

/** Mongo-фільтр за `_id`: драйвер типізує `_id` як ObjectId, а документ
 *  колекції має рядковий id — каст на рівні запиту. */
const currentFilter = { _id: CURRENT_RELEASE_ID as unknown as ObjectId };

/** Пряме посилання на GitHub Releases, якщо в маніфесті немає apkUrl. */
export const APK_FALLBACK =
  "https://github.com/giraffe-dc/newSite/releases/latest";

/** Сувора перевірка форми: відкидає зайві поля й неправильні типи,
 *  щоб у БД не потрапило сміття з зовнішнього POST. */
export function parseRelease(value: unknown): MobileRelease | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const v = value as Record<string, unknown>;

  if (typeof v.versionName !== "string" || !v.versionName.trim()) return null;
  if (v.versionName.length > 50) return null;
  if (!Number.isInteger(v.versionCode) || (v.versionCode as number) < 1) {
    return null;
  }
  if ((v.versionCode as number) > 1_000_000) return null;
  if (!Array.isArray(v.changelog) || v.changelog.length > 50) return null;
  if (!v.changelog.every((c) => typeof c === "string" && c.length <= 500)) {
    return null;
  }
  if (typeof v.publishedAt !== "string" || v.publishedAt.length > 40) {
    return null;
  }
  // Опційні поля: `null` з БД прирівнюємо до відсутності (save пише null).
  const sha256 =
    typeof v.sha256 === "string" && /^[0-9a-fA-F]{64}$/.test(v.sha256)
      ? v.sha256
      : undefined;
  if (v.sha256 != null && !sha256) return null;

  const apkUrl =
    typeof v.apkUrl === "string" &&
    v.apkUrl.length <= 500 &&
    v.apkUrl.startsWith("https://")
      ? v.apkUrl
      : undefined;
  if (v.apkUrl != null && !apkUrl) return null;

  return {
    versionName: v.versionName,
    versionCode: v.versionCode as number,
    changelog: v.changelog as string[],
    publishedAt: v.publishedAt,
    ...(sha256 ? { sha256 } : {}),
    ...(apkUrl ? { apkUrl } : {}),
  };
}

/** Маніфест зі static-файлу (fallback, якщо БД порожня/недоступна). */
export async function readReleaseFile(): Promise<MobileRelease | null> {
  try {
    const file = path.join(process.cwd(), "public", "app", "version.json");
    const raw = await readFile(file, "utf8");
    return parseRelease(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Актуальна версія: БД → fallback на файл. Ніколи не кидає виключення. */
export async function getMobileRelease(): Promise<MobileRelease | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection(MOBILE_RELEASES_COLLECTION)
      .findOne(currentFilter);
    const release = parseRelease(doc);
    if (release) return release;
  } catch (error) {
    console.error("mobileRelease: БД недоступна, читаємо файл", error);
  }
  return readReleaseFile();
}

/** Опубліковувати нову версію (upsert): викликає POST /api/mobile/version. */
export async function saveMobileRelease(release: MobileRelease): Promise<void> {
  const db = await getDb();
  await db.collection(MOBILE_RELEASES_COLLECTION).updateOne(
    currentFilter,
    // Зберігаємо лише відомі поля — `_id` і `updatedAt` додає сервер.
    {
      $set: {
        versionName: release.versionName,
        versionCode: release.versionCode,
        changelog: release.changelog,
        publishedAt: release.publishedAt,
        sha256: release.sha256 ?? null,
        apkUrl: release.apkUrl ?? null,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}
