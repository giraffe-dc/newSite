"use client";

import { useMemo, useState } from "react";
import { categoryLabel } from "@/components/board/categories";
import { SECTION_DEFAULTS, type SectionKey } from "@/lib/sectionDefaults";
import styles from "@/styles/admin/AdminContent.module.css";
import {
  Field,
  makeTemplate,
  mergeShapes,
  sectionLabels,
  type VariantOption,
} from "./SectionForm";

/* Редактор-колекція для секцій «Послуги» й «Пакети» (ADM-03):
   ліворуч — пошук і список позицій, праворуч — окрема картка з усіма
   налаштуваннями однієї позиції, згрупованими за темами. Замінює
   загальний SectionForm, коли послуг/пакетів багато — не потрібно
   прокручувати одну довгу сторінку. */

type Obj = Record<string, unknown>;
type CollectionKey = Extract<SectionKey, "services" | "packages">;

/** Групи полів картки позиції (порядок відповідає пріоритету). */
const GROUPS: Record<CollectionKey, { title: string; keys: string[] }[]> = {
  services: [
    {
      title: "Основне",
      keys: ["emoji", "title", "desc", "category", "format", "audiences"],
    },
    { title: "Ціни та тривалість", keys: ["variants"] },
    { title: "Фото", keys: ["images", "imageAlt"] },
    { title: "Умови та підписи", keys: ["requirements", "calcLabel"] },
    { title: "Публікація", keys: ["published"] },
  ],
  packages: [
    { title: "Основне", keys: ["name", "sub", "format", "audiences"] },
    { title: "Ціна комплексу", keys: ["price", "period", "bundlePrice"] },
    { title: "Склад пакета", keys: ["items"] },
    { title: "Публікація", keys: ["hit", "published"] },
  ],
};

/** Назва позиції для списку й заголовка картки. */
function itemTitle(section: CollectionKey, item: Obj): string {
  const raw = section === "packages" ? item.name : item.title;
  return typeof raw === "string" ? raw.trim() : "";
}

/** Короткий мета-рядок у списку: категорія/ціна або ціна пакета. */
function itemMeta(section: CollectionKey, item: Obj): string {
  if (section === "packages") {
    const price = typeof item.price === "string" ? item.price.trim() : "";
    return price || "без ціни";
  }
  const cat =
    typeof item.category === "string" && item.category
      ? categoryLabel(item.category)
      : "без категорії";
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const first = variants[0] as { price?: unknown } | undefined;
  const price =
    first && typeof first.price === "number" && first.price > 0
      ? ` · ${first.price} грн`
      : "";
  return `${cat}${price}`;
}

export default function CollectionEditor({
  section,
  data,
  variantOptions = [],
  onChange,
}: {
  section: CollectionKey;
  data: Obj;
  variantOptions?: VariantOption[];
  onChange: (next: Obj) => void;
}) {
  const shapeArr = (SECTION_DEFAULTS[section] as Obj)[section];
  const itemShape = useMemo(
    () => mergeShapes(Array.isArray(shapeArr) ? shapeArr : []),
    [shapeArr],
  );
  const labels = sectionLabels(section);

  const items = (Array.isArray(data[section]) ? data[section] : []) as Obj[];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.map((item, index) => ({ item, index }));
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => itemTitle(section, item).toLowerCase().includes(q));
  }, [items, query, section]);

  const selected = items.find((item) => String(item.id ?? "") === selectedId) as
    | Obj
    | undefined;
  const active = selected ?? items[0];
  const activeIndex = active ? items.indexOf(active) : -1;

  const replaceList = (next: Obj[]) => onChange({ ...data, [section]: next });

  const updateActive = (patch: Obj) => {
    if (activeIndex < 0) return;
    replaceList(
      items.map((item, i) =>
        i === activeIndex ? { ...item, ...patch } : item,
      ),
    );
  };

  const add = () => {
    const template = (
      Array.isArray(shapeArr) ? makeTemplate(shapeArr[0]) : {}
    ) as Obj;
    replaceList([...items, template]);
    setSelectedId(String(template.id ?? ""));
    setQuery("");
  };

  const duplicate = () => {
    if (!active) return;
    const copy = structuredClone(active);
    const newId = `new-${Math.random().toString(36).slice(2, 9)}`;
    copy.id = newId;
    /* Варіанти отримують нові id: старі можуть бути пов'язані з пакетами,
       дубль не має «підміняти» оригінал у складі пакетів. */
    if (Array.isArray(copy.variants)) {
      copy.variants = (copy.variants as Obj[]).map((v, i) => ({
        ...v,
        id: `${newId}-${i + 1}`,
      }));
    }
    replaceList([...items, copy]);
    setSelectedId(newId);
    setQuery("");
  };

  const remove = () => {
    if (!active || items.length <= 1) return;
    const name = itemTitle(section, active) || "ця позиція";
    if (!window.confirm(`Видалити «${name}»?`)) return;
    replaceList(items.filter((_, i) => i !== activeIndex));
    setSelectedId(null);
  };

  const move = (delta: number) => {
    const to = activeIndex + delta;
    if (activeIndex < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(activeIndex, 1);
    next.splice(to, 0, moved);
    replaceList(next);
  };

  /* Групи полів: невідомі ключі shape (якщо з'являться нові) потрапляють
     в «Інше», щоб жодне налаштування не загубилося. */
  const groups = useMemo(() => {
    const list = GROUPS[section].map((g) => ({ ...g, keys: [...g.keys] }));
    const covered = new Set(["id", ...list.flatMap((g) => g.keys)]);
    const extra = Object.keys(itemShape).filter((k) => !covered.has(k));
    if (extra.length) list.push({ title: "Інше", keys: extra });
    return list;
  }, [section, itemShape]);

  const activeTitle = active ? itemTitle(section, active) : "";

  return (
    <div className={styles.collection}>
      <aside className={styles.collectionList}>
        <input
          className={styles.input}
          type="search"
          placeholder={
            section === "packages" ? "Пошук пакетів…" : "Пошук послуг…"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Пошук позицій"
        />
        <button type="button" className={styles.addButton} onClick={add}>
          ➕ Додати {section === "packages" ? "пакет" : "послугу"}
        </button>

        {filtered.length === 0 && (
          <p className={styles.itemEmpty}>
            {items.length === 0 ? "Позицій ще немає." : "Нічого не знайдено."}
          </p>
        )}

        <ul className={styles.itemList}>
          {filtered.map(({ item, index }) => {
            const id = String(item.id || index);
            const title = itemTitle(section, item);
            const isActive = active === item;
            const draft = item.published === false;
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`${styles.itemBtn} ${isActive ? styles.itemBtnActive : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setSelectedId(id)}
                >
                  <span className={styles.itemMain}>
                    <span className={styles.itemTitle}>
                      {section === "services" && (
                        <span aria-hidden="true">
                          {typeof item.emoji === "string"
                            ? item.emoji
                            : "🎭"}{" "}
                        </span>
                      )}
                      {title || "Без назви"}
                    </span>
                    <span className={styles.itemMeta}>
                      {itemMeta(section, item)}
                    </span>
                  </span>
                  {draft && <span className={styles.badgeDraft}>чернетка</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={styles.collectionCard}>
        {!active ? (
          <p className={styles.itemEmpty}>
            Створіть першу позицію кнопкою «Додати».
          </p>
        ) : (
          <>
            <div className={styles.cardToolbar}>
              <div className={styles.cardToolbarMain}>
                <b>{activeTitle || "Нова позиція"}</b>
                <code className={styles.cardId}>{String(active.id ?? "")}</code>
              </div>
              <div className={styles.cardBtns}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Вище"
                  disabled={activeIndex <= 0}
                  onClick={() => move(-1)}
                >
                  ⬆️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Нижче"
                  disabled={activeIndex >= items.length - 1}
                  onClick={() => move(1)}
                >
                  ⬇️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Дублювати"
                  onClick={duplicate}
                >
                  📋
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Видалити"
                  disabled={items.length <= 1}
                  onClick={remove}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Секційне поле поза списком позицій (додатки до пакетів). */}
            {section === "packages" && (
              <div className={styles.grid}>
                <Field
                  name="packageAddons"
                  value={data.packageAddons}
                  shapeValue={(SECTION_DEFAULTS.packages as Obj).packageAddons}
                  labels={labels}
                  section="packages"
                  variantOptions={variantOptions}
                  onChange={(next) =>
                    onChange({ ...data, packageAddons: next })
                  }
                />
              </div>
            )}

            <div className={styles.grid}>
              {groups.map((group) => (
                <fieldset className={styles.fieldset} key={group.title}>
                  <legend className={styles.legend}>{group.title}</legend>
                  <div className={styles.grid}>
                    {group.keys
                      .filter((key) => key in itemShape)
                      .map((key) => (
                        <Field
                          key={key}
                          name={key}
                          value={active[key]}
                          shapeValue={itemShape[key]}
                          labels={labels}
                          section={section}
                          variantOptions={variantOptions}
                          onChange={(next) => updateActive({ [key]: next })}
                        />
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
