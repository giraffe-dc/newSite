"use client";

import { SECTION_DEFAULTS, type SectionKey } from "@/lib/sectionDefaults";
import { SERVICE_OPTIONS } from "@/components/board/content";
import styles from "@/styles/admin/AdminContent.module.css";

/* Форма секції будується зі структури дефолтів (SECTION_DEFAULTS), значення
   беруться з поточних даних. Один універсальний редактор покриває всі 13
   секцій: поля, вкладені об'єкти, списки з додаванням/перестановкою.
   (Відгуки вийшли зі складу в етапі 6 — окрема колекція reviews і
   розділ модерації /admin/reviews.) */

const LABELS: Record<string, string> = {
  // контакти
  phone: "Телефон (для показу)",
  tel: "Телефон для набору (tel:)",
  email: "Електронна пошта",
  hours: "Години роботи",
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
  cases: "Випадки свят",
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
  // пакети
  packages: "Пакети",
  sub: "Підзаголовок",
  period: "Період",
  items: "Склад пакета",
  included: "Входить у пакет",
  hit: "Рекомендований (ХІТ)",
  packageAddons: "Додатки до будь-якого пакета",
  // калькулятор
  serviceOptions: "Опції селекта «Формат»",
  calcNote: "Примітка під сумою",
  // контейнери секцій
  contacts: "Контакти",
  hero: "Зміст першого екрана",
  board: "Зміст табло",
  timeline: "Кроки сценарію",
};

/* Назви ключів, що означають різне в різних секціях (однакові ключі
   в табло та цифрах довіри). */
const LABEL_OVERRIDES: Partial<Record<SectionKey, Record<string, string>>> = {
  board: { label: "Назва рядка", value: "Текст рядка" },
  cases: { title: "Назва випадку", text: "Опис" },
  promises: { value: "Число", label: "Підпис під числом" },
  services: { title: "Назва послуги", format: "Формат" },
  packages: { title: "Назва пакета", format: "Формат" },
};

/* Ключі, які не редагуються вручну: homeServiceOptions перераховується із
   списку випадків при збереженні. */
const HIDDEN: Partial<Record<SectionKey, readonly string[]>> = {
  cases: ["homeServiceOptions"],
};

/* Поля-«токени» лишаються у новому елементі списку: це не вільний текст,
   а маркери (емодзі), які важко відновити. */
const TOKEN_KEYS = new Set(["emoji", "ico"]);

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Об'єднання ключів усіх елементів-дефолтів: опційні поля (highlight,
 *  on, hit) показуються в кожній картці, навіть якщо в першому дефолті їх немає. */
function mergeShapes(items: unknown[]): Obj {
  const out: Obj = {};
  for (const item of items) {
    if (isObj(item)) Object.assign(out, item);
  }
  return out;
}

/** Шаблон нового елемента: структура з дефолту, вільний текст зачищено,
 *  унікальний id. Порожні масиви не робимо — сервер їх відхиляє. */
function makeTemplate(node: unknown, key?: string): unknown {
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

function Fields({
  value,
  shape,
  labels,
  hidden = [],
  onChange,
  section,
}: {
  value: Obj;
  shape: Obj;
  labels: Record<string, string>;
  hidden?: readonly string[];
  onChange: (next: Obj) => void;
  section: SectionKey;
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
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ))}
    </div>
  );
}

function Field({
  name,
  value,
  shapeValue,
  labels,
  section,
  onChange,
}: {
  name: string;
  value: unknown;
  shapeValue: unknown;
  labels: Record<string, string>;
  section: SectionKey;
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

  if (Array.isArray(shapeValue)) {
    return (
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <ArrayField
          value={value}
          shapeArray={shapeValue}
          labels={labels}
          section={section}
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
            checked={value === true}
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
            value={typeof value === "number" ? value : 0}
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
}: {
  value: unknown;
  shapeArray: unknown[];
  labels: Record<string, string>;
  onChange: (next: unknown[]) => void;
  section: SectionKey;
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
  onChange,
}: {
  section: SectionKey;
  data: Obj;
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
          onChange={(next) => onChange({ ...data, [soleObjectKey]: next })}
        />
      ) : (
        <Fields
          value={data}
          shape={shape}
          labels={labels}
          hidden={hidden}
          section={section}
          onChange={onChange}
        />
      )}

      {section === "cases" && (
        <p className={styles.note}>
          Опції селекта «Формат» на головній перераховуються зі списку випадків
          автоматично при збереженні.
        </p>
      )}
    </div>
  );
}
