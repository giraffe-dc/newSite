"use client";

import { useMemo, useState } from "react";
import { galleryCategoryLabel } from "@/components/board/galleryContent";
import { SECTION_DEFAULTS } from "@/lib/sectionDefaults";
import styles from "@/styles/admin/AdminContent.module.css";
import {
  type CatalogOptions,
  Field,
  makeTemplate,
  mergeShapes,
  sectionLabels,
} from "./SectionForm";

/* Редактор галереї (GAL-01): список альбомів ліворуч, окрема картка
   праворуч — так само, як CollectionEditor для послуг і пакетів.
   Альбом має власні поля (категорія галереї, пов'язана послуга з каталогу,
   фото, відео, обраний/опублікований), тому це окремий редактор. */

type Obj = Record<string, unknown>;

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "Основне", keys: ["id", "title", "category", "summary"] },
  { title: "Пов'язана послуга", keys: ["serviceRef", "serviceLabel"] },
  { title: "Фото та відео", keys: ["images", "videoUrl"] },
  { title: "Публікація", keys: ["featured", "published"] },
];

export default function GalleryEditor({
  data,
  catalog,
  onChange,
}: {
  data: Obj;
  catalog: CatalogOptions;
  onChange: (next: Obj) => void;
}) {
  const shapeArr = (SECTION_DEFAULTS.gallery as Obj).albums;
  const itemShape = useMemo(
    () => mergeShapes(Array.isArray(shapeArr) ? shapeArr : []),
    [shapeArr],
  );
  const labels = sectionLabels("gallery");

  const items = (Array.isArray(data.albums) ? data.albums : []) as Obj[];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.map((item, index) => ({ item, index }));
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        String(item.title ?? "")
          .toLowerCase()
          .includes(q),
      );
  }, [items, query]);

  const selected = items.find((item) => String(item.id ?? "") === selectedId);
  const active = selected ?? items[0];
  const activeIndex = active ? items.indexOf(active) : -1;

  const replaceList = (next: Obj[]) => onChange({ ...data, albums: next });

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
    template.id = `new-${Date.now().toString(36)}`;
    template.title = "Новий альбом";
    replaceList([...items, template]);
    setSelectedId(String(template.id));
    setQuery("");
  };

  const duplicate = () => {
    if (!active) return;
    const copy = structuredClone(active);
    const newId = `new-${Date.now().toString(36)}`;
    copy.id = newId;
    copy.title = `${String(copy.title ?? "")} (копія)`;
    replaceList([...items, copy]);
    setSelectedId(newId);
    setQuery("");
  };

  const remove = () => {
    if (!active || items.length <= 1) return;
    if (!window.confirm(`Видалити альбом «${String(active.title ?? "")}»?`)) {
      return;
    }
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

  return (
    <div className={styles.collection}>
      <aside className={styles.collectionList}>
        <input
          className={styles.input}
          type="search"
          placeholder="Пошук альбомів…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Пошук альбомів"
        />
        <button type="button" className={styles.addButton} onClick={add}>
          ➕ Додати альбом
        </button>

        {filtered.length === 0 && (
          <p className={styles.itemEmpty}>
            {items.length === 0 ? "Альбомів ще немає." : "Нічого не знайдено."}
          </p>
        )}

        <ul className={styles.itemList}>
          {filtered.map(({ item, index }) => {
            const id = String(item.id || index);
            const isActive = active === item;
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
                      {String(item.title ?? "") || "Без назви"}
                    </span>
                    <span className={styles.itemMeta}>
                      {galleryCategoryLabel(String(item.category ?? ""))} ·{" "}
                      {Array.isArray(item.images) ? item.images.length : 0} фото
                    </span>
                  </span>
                  {item.published === false && (
                    <span className={styles.badgeDraft}>чернетка</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={styles.collectionCard}>
        {!active ? (
          <p className={styles.itemEmpty}>
            Створіть перший альбом кнопкою «Додати».
          </p>
        ) : (
          <>
            <div className={styles.cardToolbar}>
              <div className={styles.cardToolbarMain}>
                <b>{String(active.title ?? "") || "Новий альбом"}</b>
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

            <div className={styles.grid}>
              {GROUPS.map((group) => (
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
                          section="gallery"
                          catalog={catalog}
                          multiline={key === "summary"}
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
