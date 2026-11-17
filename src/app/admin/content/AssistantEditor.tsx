"use client";

import { useMemo, useState } from "react";
import styles from "@/styles/admin/AdminContent.module.css";
import type { CatalogOptions } from "./SectionForm";

/* Редактор секції «Підбір програми» (/assistant): зліва — список вікових
   груп (фільтрів) і псевдо-позиція «Загальне», справа — налаштування
   обраної групи. Вибір послуг/пакетів — випадаючий список з додаванням
   у список відмічених (замість ручного введення id). */

type Obj = Record<string, unknown>;

const GENERAL_ID = "__general__";

function itemTitle(item: Obj): string {
  const raw = item.label;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "Без назви";
}

function makeGroupTemplate(): Obj {
  return {
    id: `new-${Math.random().toString(36).slice(2, 9)}`,
    label: "",
    refs: [],
    askManager: false,
  };
}

export default function AssistantEditor({
  data,
  catalog,
  onChange,
}: {
  data: Obj;
  catalog: CatalogOptions;
  onChange: (next: Obj) => void;
}) {
  const ageGroups = (
    Array.isArray(data.ageGroups) ? data.ageGroups : []
  ) as Obj[];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(GENERAL_ID);

  const generalSelected = selectedId === GENERAL_ID;
  const selectedGroup = generalSelected
    ? null
    : (ageGroups.find((g) => String(g.id ?? "") === selectedId) ??
      ageGroups[0] ??
      null);
  const activeIndex = selectedGroup ? ageGroups.indexOf(selectedGroup) : -1;

  const replaceGroups = (next: Obj[]) => onChange({ ...data, ageGroups: next });

  const addGroup = () => {
    const template = makeGroupTemplate();
    replaceGroups([...ageGroups, template]);
    setSelectedId(String(template.id));
    setQuery("");
  };

  const duplicateGroup = () => {
    if (!selectedGroup) return;
    const copy = structuredClone(selectedGroup);
    copy.id = `new-${Math.random().toString(36).slice(2, 9)}`;
    replaceGroups([...ageGroups, copy]);
    setSelectedId(String(copy.id));
    setQuery("");
  };

  const removeGroup = () => {
    if (!selectedGroup || ageGroups.length <= 1) return;
    const name = itemTitle(selectedGroup) || "ця група";
    if (!window.confirm(`Видалити «${name}»?`)) return;
    replaceGroups(ageGroups.filter((_, i) => i !== activeIndex));
    setSelectedId(GENERAL_ID);
  };

  const moveGroup = (delta: number) => {
    if (!selectedGroup) return;
    const to = activeIndex + delta;
    if (to < 0 || to >= ageGroups.length) return;
    const next = [...ageGroups];
    const [moved] = next.splice(activeIndex, 1);
    next.splice(to, 0, moved);
    replaceGroups(next);
  };

  const updateGroup = (patch: Obj) => {
    if (!selectedGroup || activeIndex < 0) return;
    replaceGroups(
      ageGroups.map((g, i) => (i === activeIndex ? { ...g, ...patch } : g)),
    );
  };

  const addRef = (value: string) => {
    if (!selectedGroup || !value) return;
    const refs = Array.isArray(selectedGroup.refs)
      ? (selectedGroup.refs as string[])
      : [];
    if (refs.includes(value)) return;
    updateGroup({ refs: [...refs, value] });
  };

  const removeRef = (value: string) => {
    if (!selectedGroup) return;
    const refs = Array.isArray(selectedGroup.refs)
      ? (selectedGroup.refs as string[])
      : [];
    updateGroup({ refs: refs.filter((v) => v !== value) });
  };

  const refLabel = (value: string) => {
    const opt = [...catalog.services, ...catalog.packages].find(
      (o) => o.value === value,
    );
    return opt ? opt.label : value;
  };

  const refType = (value: string) =>
    value.startsWith("service:") ? "Послуга" : "Пакет";

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ageGroups.map((g, i) => ({ g, i }));
    return ageGroups
      .map((g, i) => ({ g, i }))
      .filter(({ g }) => itemTitle(g).toLowerCase().includes(q));
  }, [ageGroups, query]);

  const durations = Array.isArray(data.durations)
    ? (data.durations as Obj[])
    : [];

  const updateDurations = (next: Obj[]) =>
    onChange({ ...data, durations: next });

  const addDuration = () =>
    updateDurations([...durations, { min: 0, label: "" }]);

  const removeDuration = (index: number) => {
    if (durations.length <= 1) return;
    updateDurations(durations.filter((_, i) => i !== index));
  };

  const moveDuration = (from: number, to: number) => {
    if (to < 0 || to >= durations.length) return;
    const next = [...durations];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateDurations(next);
  };

  const updateDuration = (index: number, patch: Obj) =>
    updateDurations(
      durations.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );

  return (
    <div className={styles.collection}>
      <aside className={styles.collectionList}>
        <input
          className={styles.input}
          type="search"
          placeholder="Пошук груп…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Пошук вікових груп"
        />
        <button type="button" className={styles.addButton} onClick={addGroup}>
          ➕ Додати вікову групу
        </button>

        <ul className={styles.itemList}>
          <li>
            <button
              type="button"
              className={`${styles.itemBtn} ${generalSelected ? styles.itemBtnActive : ""}`}
              aria-current={generalSelected ? "true" : undefined}
              onClick={() => setSelectedId(GENERAL_ID)}
            >
              <span className={styles.itemMain}>
                <span className={styles.itemTitle}>
                  ⚙ Загальні налаштування
                </span>
                <span className={styles.itemMeta}>ліміт групи, тривалості</span>
              </span>
            </button>
          </li>
          {filteredGroups.length === 0 && ageGroups.length > 0 && query && (
            <p className={styles.itemEmpty}>Нічого не знайдено.</p>
          )}
          {ageGroups.length === 0 && (
            <p className={styles.itemEmpty}>Груп ще немає — додайте першу.</p>
          )}
          {filteredGroups.map(({ g, i }) => {
            const id = String(g.id ?? i);
            const title = itemTitle(g);
            const isActive = selectedGroup === g;
            const draft = g.askManager === true;
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`${styles.itemBtn} ${isActive ? styles.itemBtnActive : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setSelectedId(id)}
                >
                  <span className={styles.itemMain}>
                    <span className={styles.itemTitle}>{title}</span>
                    <span className={styles.itemMeta}>
                      {Array.isArray(g.refs) ? (g.refs as string[]).length : 0}{" "}
                      відмічено
                    </span>
                  </span>
                  {draft && <span className={styles.badgeDraft}>менеджер</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={styles.collectionCard}>
        {generalSelected ? (
          <>
            <div className={styles.cardToolbar}>
              <div className={styles.cardToolbarMain}>
                <b>Загальні налаштування</b>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Дітей на одного аніматора
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={
                      typeof data.kidsPerAnimator === "number"
                        ? data.kidsPerAnimator
                        : 10
                    }
                    onChange={(e) =>
                      onChange({
                        ...data,
                        kidsPerAnimator:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <fieldset className={styles.fieldset} style={{ marginTop: 12 }}>
              <legend className={styles.legend}>Варіанти тривалості</legend>
              <div className={styles.list}>
                {durations.map((d, index) => (
                  <div className={styles.card} key={`${d.min}-${d.label}`}>
                    <div className={styles.cardHead}>
                      <b className={styles.cardIndex}>{index + 1}</b>
                      <div className={styles.cardBtns}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Вище"
                          disabled={index === 0}
                          onClick={() => moveDuration(index, index - 1)}
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Нижче"
                          disabled={index === durations.length - 1}
                          onClick={() => moveDuration(index, index + 1)}
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Видалити"
                          disabled={durations.length <= 1}
                          onClick={() => removeDuration(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className={styles.grid}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Тривалість, хв
                          <input
                            className={styles.input}
                            type="number"
                            min={0}
                            value={typeof d.min === "number" ? d.min : 0}
                            onChange={(e) =>
                              updateDuration(index, {
                                min:
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>
                          Підпис кнопки
                          <input
                            className={styles.input}
                            type="text"
                            value={typeof d.label === "string" ? d.label : ""}
                            onChange={(e) =>
                              updateDuration(index, { label: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={addDuration}
                >
                  ➕ Додати тривалість
                </button>
              </div>
            </fieldset>
          </>
        ) : !selectedGroup ? (
          <p className={styles.itemEmpty}>
            Оберіть групу зі списку або створіть нову.
          </p>
        ) : (
          <div>
            <div className={styles.cardToolbar}>
              <div className={styles.cardToolbarMain}>
                <b>{itemTitle(selectedGroup) || "Нова група"}</b>
                <code className={styles.cardId}>
                  {String(selectedGroup.id ?? "")}
                </code>
              </div>
              <div className={styles.cardBtns}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Вище"
                  disabled={activeIndex <= 0}
                  onClick={() => moveGroup(-1)}
                >
                  ⬆️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Нижче"
                  disabled={activeIndex >= ageGroups.length - 1}
                  onClick={() => moveGroup(1)}
                >
                  ⬇️
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Дублювати"
                  onClick={duplicateGroup}
                >
                  📋
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Видалити"
                  disabled={ageGroups.length <= 1}
                  onClick={removeGroup}
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Ключ групи (для фільтра)
                  <input
                    className={styles.input}
                    type="text"
                    value={
                      typeof selectedGroup.id === "string"
                        ? selectedGroup.id
                        : ""
                    }
                    onChange={(e) => updateGroup({ id: e.target.value })}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Назва групи
                  <input
                    className={styles.input}
                    type="text"
                    value={
                      typeof selectedGroup.label === "string"
                        ? selectedGroup.label
                        : ""
                    }
                    onChange={(e) => updateGroup({ label: e.target.value })}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={selectedGroup.askManager === true}
                    onChange={(e) =>
                      updateGroup({ askManager: e.target.checked })
                    }
                  />
                  <span>Без даних — пропонувати менеджера</span>
                </label>
              </div>
            </div>

            <fieldset className={styles.fieldset} style={{ marginTop: 12 }}>
              <legend className={styles.legend}>
                Відмічені послуги й пакети (вибір з каталогу)
              </legend>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Додати з каталогу
                  <select
                    className={styles.input}
                    value=""
                    onChange={(e) => addRef(e.target.value)}
                  >
                    <option value="">— оберіть послугу або пакет —</option>
                    <optgroup label="Послуги">
                      {catalog.services
                        .filter(
                          (o) =>
                            !Array.isArray(selectedGroup.refs) ||
                            !(selectedGroup.refs as string[]).includes(o.value),
                        )
                        .map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Пакети">
                      {catalog.packages
                        .filter(
                          (o) =>
                            !Array.isArray(selectedGroup.refs) ||
                            !(selectedGroup.refs as string[]).includes(o.value),
                        )
                        .map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
              </div>

              <div className={styles.list} style={{ marginTop: 8 }}>
                {Array.isArray(selectedGroup.refs) &&
                (selectedGroup.refs as string[]).length > 0 ? (
                  (selectedGroup.refs as string[]).map((ref) => (
                    <div className={styles.listRow} key={ref}>
                      <span
                        className={styles.input}
                        style={{ background: "#f1f5f9" }}
                      >
                        {refType(ref)}: {refLabel(ref)}
                      </span>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Видалити"
                        onClick={() => removeRef(ref)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={styles.itemEmpty}>
                    Нічого не відмічено — фільтр показуватиме всі послуги й
                    пакети.
                  </p>
                )}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}
