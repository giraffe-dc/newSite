/* Структура секцій `site_content`: перелік, порядок (мапа 2.1 плану
   підключення до БД) і дефолти з content.ts.

   Чистий модуль — без mongodb і серверних залежностей: його імпортують
   і `siteContent.ts` (сервер), і сторінка адмінки `/admin/content`
   (клієнт) для побудови форм редагування. Тим самим структура форми
   завжди збігається зі структурою дефолтів без дублювання. */

import {
  BOARD,
  BOOK,
  CALC_NOTE,
  CASES,
  CONTACTS,
  COVER,
  COVER_NOTE,
  FAQ,
  HERO,
  HOME_SERVICE_OPTIONS,
  PACKAGE_ADDONS,
  PACKAGES,
  PROMISES,
  SERVICE_OPTIONS,
  SERVICES,
  STEPS,
  TIMELINE,
  TRUST,
} from "@/components/board/content";

/** Порядок і перелік секцій — мапа 2.1 плану підключення до БД.
 *  Секція `reviews` вийшла зі складу в етапі 6: відгуки живуть у власній
 *  колекції `reviews` (модерація, публічна форма — див. src/lib/reviews.ts). */
export const SECTION_KEYS = [
  "contacts",
  "hero",
  "board",
  "timeline",
  "cases",
  "promises",
  "steps",
  "cover",
  "book",
  "faq",
  "services",
  "packages",
  "calculator",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Дефолти секцій: `content.ts` → документи колекції `site_content`. */
export const SECTION_DEFAULTS = {
  contacts: { contacts: CONTACTS },
  hero: { hero: HERO },
  board: { board: BOARD },
  timeline: { timeline: TIMELINE },
  cases: { cases: CASES, homeServiceOptions: HOME_SERVICE_OPTIONS },
  promises: { promises: PROMISES, trust: TRUST },
  steps: { steps: STEPS },
  cover: { cover: COVER, coverNote: COVER_NOTE },
  book: { book: BOOK },
  faq: { faq: FAQ },
  services: { services: SERVICES },
  packages: { packages: PACKAGES, packageAddons: PACKAGE_ADDONS },
  calculator: { serviceOptions: SERVICE_OPTIONS, calcNote: CALC_NOTE },
} satisfies Record<SectionKey, object>;
