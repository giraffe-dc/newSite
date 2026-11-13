/* Структура секцій `site_content`: шаблони полів без демо-даних.
   Усі значення порожні ( "", 0, false ) — адмінка бере структуру з цієї
   файли, а фактичні дані — з колекції `site_content` у MongoDB. */

export const CONTACTS = {
  phone: "",
  tel: "",
  email: "",
  hours: "",
} as const;

export const NAV = [
  { href: "/services", label: "Послуги" },
  { href: "/packages", label: "Пакети" },
  { href: "/reviews", label: "Відгуки" },
  { href: "/faq", label: "FAQ" },
  { href: "/cover", label: "Куди їздимо" },
  { href: "/news-contacts", label: "Контакти" },
] as const;

/** Якір секції бронювання на головній — працює з будь-якої сторінки. */
export const BOOK_HREF = "/book";

export const HERO = {
  titleLead: "",
  titleAccent: "",
  titleTail: "",
  lead: "",
  cta: "",
  micro: [{ before: "", bold: "", after: "" }],
} as const;

export interface BoardRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export const BOARD = {
  topLeft: "",
  topRight: "",
  rows: [{ label: "", value: "", highlight: false }],
  destinations: [""],
  foot: "",
} as const;

export interface Service {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  price: string;
  unit: string;
  calcValue: number;
  calcLabel: string;
  format: string;
}

export const SERVICES: Service[] = [
  { id: "", emoji: "", title: "", desc: "", price: "", unit: "", calcValue: 0, calcLabel: "", format: "" },
];

export const STEPS: Array<{ time: string; title: string; text: string }> = [
  { time: "", title: "", text: "" },
];

export interface PackageItem {
  text: string;
  included: boolean;
}

export interface Package {
  id: string;
  name: string;
  sub: string;
  price: string;
  period: string;
  items: PackageItem[];
  hit?: boolean;
  format: string;
}

export const PACKAGES: Package[] = [
  {
    id: "",
    name: "",
    sub: "",
    price: "",
    period: "",
    items: [{ text: "", included: false }],
    hit: false,
    format: "",
  },
];

export const PACKAGE_ADDONS = "";

/** Відгук у форматі показу (картки на головній, /reviews і в сітці).
 *  Джерело — колекція `reviews` (етап 6); REVIEWS нижче — лише fallback,
 *  коли БД недоступна. */
export interface ReviewItem {
  /** Стабільний ключ списків: `_id` документа або `seed-N` для дефолтів. */
  id: string;
  stars: string;
  /** Числова оцінка 1..5 — для доступності картки (aria-label). */
  rating: number;
  quote: string;
  initial: string;
  name: string;
  context: string;
  avatar: string;
}

export const REVIEWS: ReviewItem[] = [
  { id: "", stars: "", rating: 0, quote: "", initial: "", name: "", context: "", avatar: "" },
];

export const FAQ: Array<{ q: string; a: string }> = [{ q: "", a: "" }];

export const COVER: string[] = [""];

export const COVER_NOTE = {
  title: "",
  text: "",
} as const;

export const BOOK = {
  title: "",
  side: "",
  successTitle: "",
  successText: "",
  note: "",
} as const;

export const SERVICE_OPTIONS: string[] = [
  "Аніматори",
  "Ростові ляльки",
  "VR-клас",
  "PlayStation 4",
  "Комбо-програма",
];

export const CALC_NOTE = "";

/* --- Головна, варіант Б (docs/home-rework-demo-b.html) ------------------
   Секції, яких немає на жодній сторінці сайту: сценарій дня, підбір
   випадку, гарантії, перевірка дати. Дані поки статичні — на етапі
   даних підміняються на базу. */

export interface TimelineStep {
  time: string;
  title: string;
  text: string;
  /** Акцентований крок (0:00 — момент свята). */
  on?: boolean;
}

export const TIMELINE: TimelineStep[] = [
  { time: "", title: "", text: "" },
];

export interface HolidayCase {
  id: string;
  emoji: string;
  title: string;
  when: string;
  text: string;
  list: string[];
  price: string;
  unit: string;
  meta: string;
  /** Значення для селекта «Формат» у формі бронювання. */
  service: string;
}

export const CASES: HolidayCase[] = [
  {
    id: "",
    emoji: "",
    title: "",
    when: "",
    text: "",
    list: [""],
    price: "",
    unit: "",
    meta: "",
    service: "",
  },
];

/** Остання опція селекта «Формат» — не залежить від списку випадків. */
export const HOME_SERVICE_EXTRA = "";

/** Опції селекта «Формат» на головній: випадки + «ще не визначився». */
export const HOME_SERVICE_OPTIONS: readonly string[] = [
  ...CASES.map((c) => c.service),
  HOME_SERVICE_EXTRA,
];

export interface PromiseItem {
  ico: string;
  title: string;
  text: string;
}

export const PROMISES: PromiseItem[] = [
  { ico: "", title: "", text: "" },
];

export interface TrustItem {
  value: string;
  label: string;
}

/** Цифри довіри з брифу. На етапі даних заміняться на показники з бази. */
export const TRUST: TrustItem[] = [
  { value: "", label: "" },
];

export type SlotStatus = "free" | "few" | "busy";

export interface DateSlot {
  iso: string;
  status: SlotStatus;
  label: string;
  hint: string;
}

export const DATE_SLOTS: DateSlot[] = [
  { iso: "", status: "free", label: "", hint: "" },
];

export const DATE_VERDICT: Record<SlotStatus, { lead: string; rest: string }> =
  {
    free: { lead: "", rest: "" },
    few: { lead: "", rest: "" },
    busy: { lead: "", rest: "" },
  };

export const DATE_BOARD = {
  characters: "",
  foot: "",
  slots: { free: "", few: "", busy: "" },
  arrival: { free: "", few: "", busy: "" },
};

/** Два відгуки для головної добирає дані-шар (два найновіші опубліковані,
 *  див. src/lib/reviews.ts); ручний вибір homeReviewIndexes прибрано в етапі 6. */
