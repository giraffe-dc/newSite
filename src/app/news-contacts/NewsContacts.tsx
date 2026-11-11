"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SectionData } from "@/lib/siteContent";

interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  date: string;
  type?: "news" | "event";
  survey?: unknown;
}

interface PublicContacts {
  phone?: string;
  email?: string;
  workingHours?: string;
  whatsapp?: string;
  telegram?: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

/** Вкладений клієнтський вміст /news-contacts: новини — з API,
 *  контакти — з site_content (пропс із server-page) з фолбеком API. */
export default function NewsContacts({
  fallback,
}: {
  fallback: SectionData<"contacts">["contacts"];
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [contacts, setContacts] = useState<PublicContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"news" | "contacts">("news");

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/data/news")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("/api/data/contacts")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(([newsData, contactsData]) => {
      if (!alive) return;
      setNews(Array.isArray(newsData) ? newsData : []);
      setContacts(contactsData && !contactsData.error ? contactsData : null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Новини та контакти</h1>
          <p className="m2-inner__lede">
            Записи про виїзди й зміни програм, а також зв'язок із командою. Чат
            і опитування на сайті лишаються працювати.
          </p>
        </div>

        <div className="m2-inline" style={{ marginBottom: 36 }}>
          <button
            className={`m2-btn m2-btn--sm${tab === "news" ? "" : " m2-btn--ghost"}`}
            type="button"
            aria-pressed={tab === "news"}
            onClick={() => setTab("news")}
          >
            Новини
          </button>
          <button
            className={`m2-btn m2-btn--sm${tab === "contacts" ? "" : " m2-btn--ghost"}`}
            type="button"
            aria-pressed={tab === "contacts"}
            onClick={() => setTab("contacts")}
          >
            Контакти
          </button>
        </div>

        {tab === "news" &&
          (loading ? (
            <p className="m2-inner__lede">Завантажуємо записи…</p>
          ) : news.length ? (
            <div className="m2-faq">
              {news.map((item, index) => (
                <details
                  className="m2-qa"
                  key={item._id ?? index}
                  open={index === 0}
                >
                  <summary>
                    {item.title}
                    <span style={{ fontSize: 13, fontWeight: 400 }}>
                      {formatDate(item.date)}
                    </span>
                  </summary>
                  <p>
                    {item.content}
                    {item._id && (
                      <>
                        <br />
                        <Link className="m2-back" href={`/news/${item._id}`}>
                          Читати повністю
                        </Link>
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          ) : (
            <div className="m2-notecard">
              <b>Поки порожньо.</b> Новин і звітів про виїзди ще немає — після
              підключення адмінки записи з'являться тут автоматично.
            </div>
          ))}

        {tab === "contacts" && (
          <div className="m2-notecard">
            <p>
              <b>Телефон:</b>{" "}
              <a href={`tel:${fallback.tel}`}>
                {contacts?.phone || fallback.phone}
              </a>
            </p>
            <p>
              <b>Пошта:</b>{" "}
              <a href={`mailto:${contacts?.email || fallback.email}`}>
                {contacts?.email || fallback.email}
              </a>
            </p>
            <p>
              <b>Коли на зв'язку:</b> {contacts?.workingHours || fallback.hours}
            </p>
            <p>
              <b>Куди виїжджаємо:</b> по всьому місту та області до 50 км без
              доплати, далі — 15 грн/км. Свято може пройти вдома, у школі,
              садку, ТРЦ, кафе або на вуличному майданчику.
            </p>
            <p>
              Чат на сайті — для питань про дату, адресу й програму; опитування
              — для вражень після свята.
            </p>
            <div className="m2-inline" style={{ marginTop: 12 }}>
              <Link className="m2-btn" href="/#book">
                Забронювати дату
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
