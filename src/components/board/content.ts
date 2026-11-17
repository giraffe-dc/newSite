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
  // { href: "/", label: "Головна" },
  { href: "/services", label: "Послуги" },
  { href: "/packages", label: "Пакети" },
  { href: "/ideas", label: "Ідеї свят" },
  { href: "/reviews", label: "Галерея та відгуки" },
  { href: "/news-contacts", label: "Новини й контакти" },
  { href: "/calculator", label: "Збери сам" },
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

export interface ServiceVariant {
  id: string;
  label: string;
  durationMin: number;
  price: number;
}

export interface Service {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** Категорія для фільтрів каталогу. */
  category?: string;
  /** Аудиторії, для яких підходить послуга. */
  audiences?: string[];
  /** Зображення (URL). */
  images?: string[];
  /** Alt-текст першого зображення (доступність і SEO; MED-01). */
  imageAlt?: string;
  /** Опубліковано (для чернеток). */
  published?: boolean;
  /** Варіанти тривалості та ціни — єдине джерело правди. */
  variants?: ServiceVariant[];
  /** Технічні вимоги (електрика, площа тощо). */
  requirements?: string[];
  /** Підпис для калькулятора. */
  calcLabel?: string;
  /** Значення для селекта «Формат» у формі бронювання. */
  format: string;
  /* --- Deprecated (залишено для зворотної сумісності) --- */
  price?: string;
  unit?: string;
  calcValue?: number;
}

export const SERVICES: Service[] = [
  {
    id: "",
    emoji: "",
    title: "",
    desc: "",
    category: "",
    audiences: [],
    images: [],
    imageAlt: "",
    published: true,
    variants: [{ id: "", label: "", durationMin: 0, price: 0 }],
    requirements: [],
    calcLabel: "",
    format: "",
  },
];

export const STEPS: Array<{ time: string; title: string; text: string }> = [
  { time: "", title: "", text: "" },
];

export interface PackageItem {
  /** Посилання на ServiceVariant.id (якщо позиція — реальна послуга). */
  variantId?: string;
  /** Кількість одиниць. */
  qty?: number;
  /** Текст для відображення (опис позиції або умова). */
  text: string;
}

export interface Package {
  id: string;
  name: string;
  sub: string;
  price: string;
  period: string;
  /** Числова ціна комплексу (для розрахунку економії). */
  bundlePrice?: number;
  items: PackageItem[];
  hit?: boolean;
  format: string;
  audiences?: string[];
  published?: boolean;
}

export const PACKAGES: Package[] = [
  {
    id: "",
    name: "",
    sub: "",
    price: "",
    period: "",
    bundlePrice: 0,
    items: [{ variantId: "", qty: 1, text: "" }],
    hit: false,
    format: "",
    audiences: [],
    published: true,
  },
];

export const PACKAGE_ADDONS = "";

/** Прибирає чернетки (published === false) — для публічних сторінок.
 *   Поле відсутнє (старі дані) → позиція показується. */
export function publishedOnly<T extends { published?: boolean }>(
  list: readonly T[],
): T[] {
  return list.filter((item) => item.published !== false);
}

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
  {
    id: "",
    stars: "",
    rating: 0,
    quote: "",
    initial: "",
    name: "",
    context: "",
    avatar: "",
  },
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

/* --- Транспорт (CALC-02): тариф погоджено з власником 16.11.2026 ---
   25 грн/км в один бік, без безкоштовної зони (платимо від першого км).
   Значення налаштовуються в адмінці (секція «Кошторис»); ці дефолти —
   для сторінок, коли поле відсутнє в БД. */
export const ROAD_TARIFF = 25;
export const ROAD_FREE_KM = 0;
export const ROAD_NOTE =
  "Транспорт: 25 грн за кілометр в один бік від Теплика. Відстань і вартість уточнюється за адресою — остаточно підтвердить менеджер.";

/* --- Помічник підбору (/assistant, UX-02) --------------------------------
   Параметри добіру редагуються в адмінці (секція «Підбір програми»):
   вікові групи з рекомендованими категоріями, варіанти тривалості та
   місткість групи (BIZ-02: до 10 дітей на аніматора). Ці дефолти —
   фолбек, коли документа в БД ще немає або поле відсутнє. */

export interface AssistantAgeGroup {
  id: string;
  label: string;
  /** id послуг (service:<id>) і пакетів (package:<id>), які рекомендуємо
   *  під цю вікову групу. В адмінці обираються з випадаючого списку
   *  каталогу (секція «Підбір програми»); порожній список = без вікового
   *  фільтра. */
  refs: string[];
  /** Немає даних про вік — замість добору пропонуємо менеджера. */
  askManager?: boolean;
}

export interface AssistantDurationOption {
  min: number;
  label: string;
}

export const ASSISTANT_AGE_GROUPS: AssistantAgeGroup[] = [
  { id: "0-3", label: "Малюки (0–3)", refs: [], askManager: true },
  { id: "4-6", label: "Дошкільнята (4–6)", refs: [] },
  { id: "7-11", label: "Школярики (7–11)", refs: [] },
  { id: "12-17", label: "Підлітки (12–17)", refs: [] },
  { id: "adults", label: "Дорослі", refs: [] },
  { id: "mixed", label: "Різний вік", refs: [] },
];

export const ASSISTANT_DURATIONS: AssistantDurationOption[] = [
  { min: 30, label: "до 30 хв" },
  { min: 60, label: "1 год" },
  { min: 90, label: "1,5 год" },
  { min: 120, label: "2 год" },
];

/** Місткість: до 10 дітей на одного аніматора (BIZ-02). */
export const ASSISTANT_KIDS_PER_ANIMATOR = 10;

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

export const TIMELINE: TimelineStep[] = [{ time: "", title: "", text: "" }];

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

export const PROMISES: PromiseItem[] = [{ ico: "", title: "", text: "" }];

export interface TrustItem {
  value: string;
  label: string;
}

/** Цифри довіри з брифу. На етапі даних заміняться на показники з бази. */
export const TRUST: TrustItem[] = [{ value: "", label: "" }];

/** Два відгуки для головної добирає дані-шар (два найновіші опубліковані,
 *  див. src/lib/reviews.ts); ручний вибір homeReviewIndexes прибрано в етапі 6. */
