"use client";

import MediaUploadButton from "@/components/admin/MediaUploadButton";
import { SERVICE_CATEGORIES } from "@/components/board/categories";
import { SERVICE_OPTIONS } from "@/components/board/content";
import { SECTION_DEFAULTS, type SectionKey } from "@/lib/sectionDefaults";
import styles from "@/styles/admin/AdminContent.module.css";

/* Форма секції будується зі структури дефолтів (SECTION_DEFAULTS), значення
   беруться з поточних даних. Один універсальний редактор покриває всі 14
   секцій: поля, вкладені об'єкти, списки з додаванням/перестановкою.
   (Відгуки вийшли зі складу в етапі 6 — окрема колекція reviews і
   розділ модерації /admin/reviews.) */

const LABELS: Record<string, string> = {
  // контакти
  phone: "Телефон (для показу)",
  tel: "Телефон для набору (tel:)",
  email: "Електронна пошта",
  hours: "Години роботи",
  whatsapp: "WhatsApp (посилання)",
  telegram: "Telegram (посилання)",
  facebook: "Facebook (посилання)",
  instagram: "Instagram (посилання)",
  tiktok: "TikTok (посилання)",
  // перший екран
  titleLead: "Початок заголовка",
  titleAccent: "Виділена частина",
  titleTail: "Кінець заголовка",
  lead: "Підзаголовок",
  cta: "Текст кнопки",
  micro: "Мікро-бейджі під кнопкою",
  before: "Текст до виділеного",
  bold: "Виділений текст",
  after: "Текст після виділеного",
  // табло
  topLeft: "Назва ліворуч",
  topRight: "Назва праворуч",
  rows: "Рядки табло",
  destinations: "Адреси (чергуються)",
  foot: "Підпис унизу",
  label: "Назва",
  value: "Значення",
  highlight: "Підсвітити рядок",
  // спільне
  title: "Заголовок",
  text: "Текст",
  emoji: "Емодзі",
  id: "Ключ (id)",
  price: "Ціна",
  unit: "Одиниця",
  // сценарій дня
  time: "Час",
  on: "Акцентований крок",
  // випадки свят
  when: "Для кого / коли",
  list: "Що входить",
  meta: "Додатковий рядок",
  service: "Назва формату (для селекта)",
  homeServiceOptions: "Опції селекта (оновлюється автоматично)",
  // гарантії та цифри
  promises: "Гарантії",
  ico: "Іконка (емодзі)",
  trust: "Цифри довіри",
  name: "Назва",
  // кроки й покриття
  steps: "Кроки",
  cover: "Список локацій",
  coverNote: "Бокова нотатка",
  // бронювання
  book: "Тексти секції бронювання",
  side: "Текст праворуч від форми",
  successTitle: "Повідомлення про успіх — заголовок",
  successText: "Повідомлення про успіх — текст",
  note: "Примітка під формою",
  // faq
  faq: "Питання й відповіді",
  q: "Питання",
  a: "Відповідь",
  // послуги
  services: "Послуги",
  desc: "Опис",
  calcValue: "Ціна для калькулятора",
  calcLabel: "Підпис у калькуляторі",
  category: "Категорія каталогу",
  audiences: "Для кого підходить",
  images: "Зображення (URL)",
  imageAlt: "Alt-текст фото (доступність і SEO)",
  requirements: "Технічні вимоги",
  published: "Опубліковано (видно на сайті)",
  showOnHome: "Показувати на головній (топ-послуги)",
  durationMin: "Тривалість, хв",
  variantId: "Послуга (варіант)",
  qty: "Кількість",
  // пакети
  packages: "Пакети",
  sub: "Підзаголовок",
  period: "Період",
  bundlePrice: "Ціна комплексу, грн (число)",
  items: "Склад пакета",
  included: "Входить у пакет",
  hit: "Рекомендований (ХІТ)",
  packageAddons: "Додатки до будь-якого пакета",
  // калькулятор
  serviceOptions: "Опції селекта «Формат»",
  calcNote: "Примітка під сумою",
  roadTariff: "Тариф дороги, грн/км (в один бік)",
  roadFreeKm: "Безкоштовна зона, км (0 — платити від першого км)",
  roadNote: "Правило транспорту (текст для клієнта)",
  // підбір програми (/assistant)
  kidsPerAnimator: "Дітей на одного аніматора",
  ageGroups: "Вікові групи",
  durations: "Варіанти тривалості",
  refs: "Що показувати під цим фільтром (галочки)",
  askManager: "Без даних — пропонувати менеджера (замість добору)",
  min: "Тривалість, хв",
  // контейнери секцій
  contacts: "Контакти",
  hero: "Зміст першого екрана",
  timeline: "Кроки сценарію",
};

/* Назви ключів, що означають різне в різних секціях (однакові ключі
   в табло та цифрах довіри). */
const LABEL_OVERRIDES: Partial<Record<SectionKey, Record<string, string>>> = {
  promises: { value: "Число", label: "Підпис під числом" },
  services: {
    title: "Назва послуги",
    format: "Формат",
    label: "Підпис (напр. «1 год»)",
    price: "Ціна, грн",
  },
  packages: {
    title: "Назва пакета",
    format: "Формат",
    price: "Ціна (текст, напр. «від 3500 грн»)",
  },
  assistant: {
    id: "Ключ групи (для фільтра)",
    label: "Назва групи / підпис кнопки",
    refs: "Відмічені послуги й пакети (вибір з каталогу)",
    min: "Тривалість варіанта, хв",
  },
  seasonalOffers: {
    enabled: "Показувати блок на головній",
    image: "Зображення банера (URL)",
    imageAlt: "Alt-текст зображення",
    title: "Заголовок",
    text: "Текст",
    ctaLabel: "Підпис кнопки",
    ctaLink: "Посилання кнопки",
  },
};

/* Ключі, які не редагуються вручну: homeServiceOptions перераховується із
   списку випадків при збереженні. */
const HIDDEN: Partial<Record<SectionKey, readonly string[]>> = {};

/** Мітки полів секції (спільні + перекриття для конкретної секції). */
export function sectionLabels(section: SectionKey): Record<string, string> {
  return { ...LABELS, ...(LABEL_OVERRIDES[section] ?? {}) };
}

/* Поля-«токени» лишаються у новому елементі списку: це не вільний текст,
   а маркери (емодзі), які важко відновити. */
const TOKEN_KEYS = new Set(["emoji", "ico"]);

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Об'єднання ключів усіх елементів-дефолтів: опційні поля (highlight,
 *  on, hit) показуються в кожній картці, навіть якщо в першому дефолті їх немає. */
export function mergeShapes(items: unknown[]): Obj {
  const out: Obj = {};
  for (const item of items) {
    if (isObj(item)) Object.assign(out, item);
  }
  return out;
}

/** Шаблон нового елемента: структура з дефолту, вільний текст зачищено,
 *  унікальний id. Порожні масиви не робимо — сервер їх відхиляє. */
export function makeTemplate(node: unknown, key?: string): unknown {
  if (Array.isArray(node)) return node.map((child) => makeTemplate(child));
  if (isObj(node)) {
    const out: Obj = {};
    for (const [childKey, child] of Object.entries(node)) {
      out[childKey] = makeTemplate(child, childKey);
    }
    if (typeof out.id === "string") {
      out.id = `new-${Math.random().toString(36).slice(2, 9)}`;
    }
    return out;
  }
  if (typeof node === "string") {
    return key && TOKEN_KEYS.has(key) ? node : "";
  }
  if (typeof node === "number") return 0;
  return node;
}

/** Опції селекта «Послуга (варіант)» у складі пакета: будуються з поточних
 *  послуг (id варіанту + підпис + ціна). */
export type VariantOption = { value: string; label: string };
export type CatalogOptions = {
  services: { value: string; label: string }[];
  packages: { value: string; label: string }[];
};

function Fields({
  value,
  shape,
  labels,
  hidden = [],
  onChange,
  section,
  variantOptions = [],
  catalog,
}: {
  value: Obj;
  shape: Obj;
  labels: Record<string, string>;
  hidden?: readonly string[];
  onChange: (next: Obj) => void;
  section: SectionKey;
  variantOptions?: VariantOption[];
  catalog?: CatalogOptions;
}) {
  return (
    <div className={styles.grid}>
      {Object.keys(shape)
        .filter((key) => !hidden.includes(key))
        .map((key) => (
          <Field
            key={key}
            name={key}
            value={value[key]}
            shapeValue={shape[key]}
            labels={labels}
            section={section}
            variantOptions={variantOptions}
            catalog={catalog}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ))}
    </div>
  );
}

export function Field({
  name,
  value,
  shapeValue,
  labels,
  section,
  variantOptions = [],
  catalog,
  onChange,
}: {
  name: string;
  value: unknown;
  shapeValue: unknown;
  labels: Record<string, string>;
  section: SectionKey;
  variantOptions?: VariantOption[];
  catalog?: CatalogOptions;
  onChange: (next: unknown) => void;
}) {
  const label = labels[name] ?? name;

  /* Поле «Формат» для послуг і пакетів — селект із варіантами калькулятора,
     а не вільний текст, щоб значення співпадало з селектом у формі бронювання. */
  if (name === "format" && (section === "services" || section === "packages")) {
    const text = typeof value === "string" ? value : "";
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {label}
          <select
            className={styles.input}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">—</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  /* Категорія каталогу — селект з фіксованим списком (спільний з публічними
     фільтрами), а не вільний текст: значення має збігатися з фільтрами. */
  if (name === "category" && section === "services") {
    const text = typeof value === "string" ? value : "";
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {label}
          <select
            className={styles.input}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">— без категорії —</option>
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  /* Склад пакета: вибір конкретного варіанту послуги (id → ціна й економія
     рахуються з нього); порожнє значення — текстова позиція без ціни. */
  if (name === "variantId" && section === "packages") {
    const text = typeof value === "string" ? value : "";
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {label}
          <select
            className={styles.input}
            value={
              variantOptions.some((option) => option.value === text) ? text : ""
            }
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">— текстова позиція (без ціни) —</option>
            {variantOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  /* Вибір послуг і пакетів для вікової групи (UX-02, налаштування
     «Підбір програми»): замість ручного введення id — галочки з каталогу. */
  if (
    (name === "services" || name === "packages") &&
    section === "assistant" &&
    catalog
  ) {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const options = name === "services" ? catalog.services : catalog.packages;
    const toggle = (itemValue: string) => {
      if (selected.includes(itemValue)) {
        onChange(selected.filter((v) => v !== itemValue));
      } else {
        onChange([...selected, itemValue]);
      }
    };
    return (
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <div
          className={styles.fieldset}
          style={{ maxHeight: 260, overflowY: "auto", marginTop: 4 }}
        >
          {options.map((option) => (
            <label key={option.value} className={styles.check}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  /* Зображення банера сезонних пропозицій (MED-01): URL + прев'ю +
     завантаження через безпечний ендпоінт. */
  if (name === "image" && section === "seasonalOffers") {
    const url = typeof value === "string" ? value : "";
    return (
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <input
            className={styles.input}
            type="text"
            value={url}
            placeholder="URL зображення"
            onChange={(event) => onChange(event.target.value)}
            style={{ flex: 1 }}
          />
          {url && (
            // biome-ignore lint/performance/noImgElement: динамічний URL із БД, next/image потребує remotePatterns
            <img src={url} alt="Прев'ю" className={styles.thumb} />
          )}
          <MediaUploadButton
            label="📷 Завантажити фото"
            onUploaded={(u) => onChange(u)}
          />
        </div>
      </div>
    );
  }

  /* Зображення послуги (MED-01): список URL + прев'ю + завантаження нового
     файлу через безпечний ендпоінт /api/admin/media (адмін не вводить URL
     вручну — натискає «Завантажити фото» і бачить результат). */
  if (name === "images" && section === "services") {
    const urls = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
    const setUrls = (next: string[]) => onChange(next);
    return (
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <div className={styles.list}>
          {urls.map((url, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: список повністю контрольований — значення завжди зі стану
            <div className={styles.listRow} key={index}>
              <input
                className={styles.input}
                type="text"
                value={url}
                placeholder="URL зображення"
                onChange={(event) =>
                  setUrls(
                    urls.map((item, i) =>
                      i === index ? event.target.value : item,
                    ),
                  )
                }
              />
              {url && (
                // biome-ignore lint/performance/noImgElement: динамічний URL із БД, next/image потребує remotePatterns
                <img
                  src={url}
                  alt={`Прев'ю ${index + 1}`}
                  className={styles.thumb}
                />
              )}
              <button
                type="button"
                className={styles.iconBtn}
                title="Видалити"
                disabled={urls.length <= 1}
                onClick={() => setUrls(urls.filter((_, i) => i !== index))}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <MediaUploadButton
            label="📷 Завантажити фото"
            onUploaded={(url) => setUrls([...urls.filter(Boolean), url])}
          />
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setUrls([...urls, ""])}
          >
            ➕ Додати URL
          </button>
        </div>
      </div>
    );
  }

  if (Array.isArray(shapeValue)) {
    return (
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <ArrayField
          value={value}
          shapeArray={shapeValue}
          labels={labels}
          section={section}
          variantOptions={variantOptions}
          onChange={onChange}
        />
      </div>
    );
  }

  if (isObj(shapeValue)) {
    return (
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{label}</legend>
        <Fields
          value={isObj(value) ? value : {}}
          shape={shapeValue}
          labels={labels}
          section={section}
          variantOptions={variantOptions}
          onChange={(next) => onChange(next)}
        />
      </fieldset>
    );
  }

  if (typeof shapeValue === "boolean") {
    return (
      <div className={styles.field}>
        <label className={styles.check}>
          <input
            type="checkbox"
            /* Відсутнє в даних поле показуємо як значення за замовчуванням
               (published: true), щоб адмін не бачив «знято» там, де поле
               просто ще не зберігали. */
            checked={typeof value === "boolean" ? value : shapeValue === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{label}</span>
        </label>
      </div>
    );
  }

  if (typeof shapeValue === "number") {
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {label}
          <input
            className={styles.input}
            type="number"
            /* Поле відсутнє в даних БД (нові поля) — показуємо дефолт форми,
               щоб адмін бачив реальне значення, а не 0. */
            value={
              typeof value === "number"
                ? value
                : typeof shapeValue === "number"
                  ? shapeValue
                  : 0
            }
            onChange={(event) =>
              onChange(
                event.target.value === "" ? 0 : Number(event.target.value),
              )
            }
          />
        </label>
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  /* Багаторядковість визначається за дефолтом (а не поточним значенням),
     щоб поле не «стрибало» між input і textarea під час друку. */
  const multiline =
    typeof shapeValue === "string" &&
    (shapeValue.length > 60 || shapeValue.includes("\n"));

  if (multiline) {
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {label}
          <textarea
            className={styles.textarea}
            rows={4}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

function ArrayField({
  value,
  shapeArray,
  labels,
  onChange,
  section,
  variantOptions = [],
  catalog,
}: {
  value: unknown;
  shapeArray: unknown[];
  labels: Record<string, string>;
  onChange: (next: unknown[]) => void;
  section: SectionKey;
  variantOptions?: VariantOption[];
  catalog?: CatalogOptions;
}) {
  const items = Array.isArray(value) ? value : [];
  const objectList = isObj(shapeArray[0]);
  /* Сервер відхиляє порожні обов'язкові списки — не даємо видалити останній. */
  const canRemove = items.length > 1;

  const update = (index: number, next: unknown) =>
    onChange(items.map((item, i) => (i === index ? next : item)));

  const remove = (index: number) =>
    onChange(items.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const add = () => onChange([...items, makeTemplate(shapeArray[0])]);

  return (
    <div className={styles.list}>
      {items.map((item, index) =>
        objectList ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: список повністю контрольований — значення завжди зі стану, перестановка не ламає введення
          <div className={styles.card} key={index}>
            <div className={styles.cardHead}>
              <b className={styles.cardIndex}>{index + 1}</b>
              <div className={styles.cardBtns}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Вище"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  ⬆️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Нижче"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  ⬇️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Видалити"
                  disabled={!canRemove}
                  onClick={() => remove(index)}
                >
                  🗑️
                </button>
              </div>
            </div>
            <Fields
              value={isObj(item) ? item : {}}
              shape={mergeShapes(shapeArray)}
              labels={labels}
              section={section}
              variantOptions={variantOptions}
              catalog={catalog}
              onChange={(next) => update(index, next)}
            />
          </div>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: список повністю контрольований — значення завжди зі стану, перестановка не ламає введення
          <div className={styles.listRow} key={index}>
            <input
              className={styles.input}
              type={typeof item === "number" ? "number" : "text"}
              value={
                typeof item === "string"
                  ? item
                  : typeof item === "number"
                    ? item
                    : ""
              }
              onChange={(event) =>
                update(
                  index,
                  typeof item === "number"
                    ? event.target.value === ""
                      ? 0
                      : Number(event.target.value)
                    : event.target.value,
                )
              }
            />
            <button
              type="button"
              className={styles.iconBtn}
              title="Вище"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              ⬆️
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              title="Нижче"
              disabled={index === items.length - 1}
              onClick={() => move(index, index + 1)}
            >
              ⬇️
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              title="Видалити"
              disabled={!canRemove}
              onClick={() => remove(index)}
            >
              🗑️
            </button>
          </div>
        ),
      )}
      <button type="button" className={styles.addButton} onClick={add}>
        ➕ Додати
      </button>
    </div>
  );
}

export default function SectionForm({
  section,
  data,
  variantOptions = [],
  catalog,
  onChange,
}: {
  section: SectionKey;
  data: Obj;
  /** Селект варіантів послуг у складі пакетів (див. VariantOption). */
  variantOptions?: VariantOption[];
  /** Каталог послуг і пакетів — для галочок у налаштуваннях «Підбір програми». */
  catalog?: CatalogOptions;
  onChange: (next: Obj) => void;
}) {
  const shape = SECTION_DEFAULTS[section] as Obj;
  const hidden = HIDDEN[section] ?? [];
  const labels = { ...LABELS, ...(LABEL_OVERRIDES[section] ?? {}) };

  const visibleKeys = Object.keys(shape).filter((key) => !hidden.includes(key));

  /* Єдиний ключ-об'єкт (контакти, герой, табло…) — показуємо його поля
     без зайвої рамки; багатоключові секції рендеряться як є. */
  const soleObjectKey =
    visibleKeys.length === 1 && isObj(shape[visibleKeys[0]])
      ? visibleKeys[0]
      : null;

  return (
    <div className={styles.form}>
      {soleObjectKey ? (
        <Fields
          value={isObj(data[soleObjectKey]) ? (data[soleObjectKey] as Obj) : {}}
          shape={shape[soleObjectKey] as Obj}
          labels={labels}
          section={section}
          variantOptions={variantOptions}
          catalog={catalog}
          onChange={(next) => onChange({ ...data, [soleObjectKey]: next })}
        />
      ) : (
        <Fields
          value={data}
          shape={shape}
          labels={labels}
          hidden={hidden}
          section={section}
          variantOptions={variantOptions}
          catalog={catalog}
          onChange={onChange}
        />
      )}
    </div>
  );
}
