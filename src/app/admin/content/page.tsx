"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SECTION_KEYS, type SectionKey } from "@/lib/sectionDefaults";
import styles from "@/styles/admin/AdminContent.module.css";
import SectionForm from "./SectionForm";

/** Дані секцій у «сирому» вигляді: JSON із GET /api/admin/content. */
type SectionMap = Partial<Record<SectionKey, Record<string, unknown>>>;
type Message = { kind: "ok" | "err"; text: string } | null;

const SECTION_META: Record<
  SectionKey,
  { icon: string; label: string; hint: string }
> = {
  contacts: {
    icon: "📞",
    label: "Контакти",
    hint: "Телефон, пошта та години роботи — у шапці, футері й формі бронювання.",
  },
  hero: {
    icon: "🦸",
    label: "Перший екран",
    hint: "Заголовок, підзаголовок, кнопка й мікро-бейджі на головній.",
  },
  board: {
    icon: "🛫",
    label: "Табло маршрутів",
    hint: "Рядки табло й адреси, що чергуються під шапкою головної.",
  },
  timeline: {
    icon: "🕒",
    label: "Сценарій дня",
    hint: "Маршрут свята по хвилинах — секція на головній.",
  },
  cases: {
    icon: "🎯",
    label: "Випадки свят",
    hint: "Картки підбору випадку. Опції селекта «Формат» оновлюються автоматично.",
  },
  promises: {
    icon: "🛡️",
    label: "Гарантії",
    hint: "Три гарантії та цифри довіри на головній.",
  },
  reviews: {
    icon: "💌",
    label: "Відгуки",
    hint: "Листівки відгуків; прапорець під карткою показує відгук на головній.",
  },
  steps: {
    icon: "👣",
    label: "Кроки до свята",
    hint: "Чотири кроки — секція на сторінці «Про команду».",
  },
  cover: {
    icon: "🗺️",
    label: "Куди приїжджаємо",
    hint: "Список локацій і бокова нотатка про гарячі слоти.",
  },
  book: {
    icon: "📅",
    label: "Секція бронювання",
    hint: "Заголовок і тексти форми — головна та сторінка /book.",
  },
  faq: {
    icon: "❓",
    label: "FAQ",
    hint: "Питання й відповіді: головна, /faq і /services.",
  },
  services: {
    icon: "🎭",
    label: "Послуги",
    hint: "Картки послуг, ціни та позиції калькулятора.",
  },
  packages: {
    icon: "🎁",
    label: "Пакети",
    hint: "Пакети «Міні»/«Стандарт»/«VIP», їхній склад і додатки.",
  },
  calculator: {
    icon: "🧮",
    label: "Кошторис",
    hint: "Опції селекта та примітка на сторінці /calculator.",
  },
};

export default function AdminContentPage() {
  const [data, setData] = useState<SectionMap | null>(null);
  const [drafts, setDrafts] = useState<SectionMap>({});
  const [active, setActive] = useState<SectionKey>("contacts");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const messageTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/admin/content", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as SectionMap);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    },
    [],
  );

  const flash = (next: Message) => {
    setMessage(next);
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(null), 4000);
  };

  /* Чернетка секції: правки живуть окремо від збереженого, тому перехід
     між секціями не губить незбережені зміни (помаранчева крапка в меню). */
  const current = drafts[active] ?? data?.[active];
  const dirty = active in drafts;

  const setDraft = (next: Record<string, unknown>) =>
    setDrafts((prev) => ({ ...prev, [active]: next }));

  const revert = () =>
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[active];
      return copy;
    });

  const save = async () => {
    if (!current) return;
    /* Сервер відхиляє порожні обов'язкові списки; для «відгуків на
       головній» даємо зрозуміле повідомлення замість загальної помилки. */
    if (active === "reviews") {
      const indexes = current.homeReviewIndexes;
      if (!Array.isArray(indexes) || indexes.length === 0) {
        flash({
          kind: "err",
          text: "Помилка збереження даних: на головній має лишитися хоча б один відгук",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${active}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(current),
      });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, [active]: current } : prev));
        setDrafts((prev) => {
          const copy = { ...prev };
          delete copy[active];
          return copy;
        });
        flash({ kind: "ok", text: "Дані успішно оновлено!" });
      } else {
        flash({ kind: "err", text: "Помилка збереження даних" });
      }
    } catch {
      flash({ kind: "err", text: "Помилка збереження даних" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>🦒</div>
        <p>Завантаження контенту...</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>⚠️</div>
        <p>
          Не вдалося завантажити контент. Перевірте з'єднання та права доступу.
        </p>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={() => void load()}
        >
          Повторити спробу
        </button>
      </div>
    );
  }

  const meta = SECTION_META[active];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>📝</span> Контент сайту
        </h1>
        <p className={styles.pageSubtitle}>
          Редактор секцій публічного сайту: правки зберігаються в базу та одразу
          з'являються на сторінках.
        </p>
      </div>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Секції контенту">
          <div className={styles.navTitle}>Контент</div>
          <ul className={styles.navList}>
            {SECTION_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={`${styles.navBtn} ${active === key ? styles.navBtnActive : ""}`}
                  aria-current={active === key ? "page" : undefined}
                  onClick={() => setActive(key)}
                >
                  <span className={styles.navIcon}>
                    {SECTION_META[key].icon}
                  </span>
                  <span>{SECTION_META[key].label}</span>
                  {key in drafts && (
                    <span className={styles.dot} title="Є незбережені зміни">
                      <span className={styles.srOnly}>Є незбережені зміни</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.editor}>
          {message && (
            <div
              className={`${styles.message} ${message.kind === "ok" ? styles.success : styles.error}`}
            >
              <span>{message.kind === "ok" ? "✅" : "⚠️"}</span>
              {message.text}
            </div>
          )}

          <div className={styles.editorHead}>
            <h2 className={styles.editorTitle}>
              {meta.icon} {meta.label}
            </h2>
            {dirty && <span className={styles.dirty}>● не збережено</span>}
          </div>
          <p className={styles.hint}>{meta.hint}</p>

          {current && (
            <SectionForm
              key={active}
              section={active}
              data={current}
              onChange={setDraft}
            />
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => void save()}
              disabled={saving || !dirty}
            >
              {saving ? "Збереження..." : "💾 Зберегти"}
            </button>
            <button
              type="button"
              className={styles.revertBtn}
              onClick={revert}
              disabled={!dirty}
            >
              ↩ Скасувати зміни
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
