/* Структура секцій `site_content`: перелік, порядок (мапа 2.1 плану
   підключення до БД) і дефолти з content.ts.

   Чистий модуль — без mongodb і серверних залежностей: його імпортують
   і `siteContent.ts` (сервер), і сторінка адмінки `/admin/content`
   (клієнт) для побудови форм редагування. Тим самим структура форми
   завжди збігається зі структурою дефолтів без дублювання. */

import {
  ASSISTANT_AGE_GROUPS,
  ASSISTANT_DURATIONS,
  ASSISTANT_KIDS_PER_ANIMATOR,
  BOOK,
  CALC_NOTE,
  CONTACTS,
  COVER,
  COVER_NOTE,
  FAQ,
  HERO,
  PACKAGE_ADDONS,
  PACKAGES,
  PROMISES,
  ROAD_FREE_KM,
  ROAD_NOTE,
  ROAD_TARIFF,
  SEASONAL_OFFERS_DEFAULT,
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
  "timeline",
  "promises",
  "steps",
  "cover",
  "book",
  "faq",
  "services",
  "packages",
  "calculator",
  "assistant",
  "seasonalOffers",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Дефолти секцій: `content.ts` → документи колекції `site_content`. */
export const SECTION_DEFAULTS = {
  contacts: { contacts: CONTACTS },
  hero: { hero: HERO },
  timeline: { timeline: TIMELINE },
  promises: { promises: PROMISES, trust: TRUST },
  steps: { steps: STEPS },
  cover: { cover: COVER, coverNote: COVER_NOTE },
  book: { book: BOOK },
  faq: { faq: FAQ },
  services: { services: SERVICES },
  packages: { packages: PACKAGES, packageAddons: PACKAGE_ADDONS },
  calculator: {
    serviceOptions: SERVICE_OPTIONS,
    calcNote: CALC_NOTE,
    roadTariff: ROAD_TARIFF,
    roadFreeKm: ROAD_FREE_KM,
    roadNote: ROAD_NOTE,
  },
  /* Помічник підбору (/assistant): параметри добіру замість зашитих
     у компонент значень — адмін змінює ліміт групи, вікові групи з
     рекомендованими категоріями та варіанти тривалості. */
  assistant: {
    kidsPerAnimator: ASSISTANT_KIDS_PER_ANIMATOR,
    ageGroups: ASSISTANT_AGE_GROUPS,
    durations: ASSISTANT_DURATIONS,
  },
  seasonalOffers: SEASONAL_OFFERS_DEFAULT,
} satisfies Record<SectionKey, object>;
