"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import {
  GALLERY_CATEGORIES,
  type GalleryAlbum,
  galleryCategoryLabel,
} from "./galleryContent";

/** Альбом із розв'язаним посиланням на послугу (сервер → клієнт). */
export type GalleryViewAlbum = GalleryAlbum & { serviceHref?: string };

type Sort = "recommended" | "az" | "za";

function albumImage(album: GalleryViewAlbum, index = 0): string {
  return album.images?.[index] || "/brand/demo/seasonal.svg";
}

/** Галерея емоцій (/gallery): фільтри, альбоми, модалка альбому,
 *  лайтбокс і відеомоменти. Усе редагується в адмінці (секція «Галерея»). */
export default function Gallery({
  albums,
  contacts,
}: {
  albums: GalleryViewAlbum[];
  contacts: SectionData<"contacts">["contacts"];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [openAlbum, setOpenAlbum] = useState<GalleryViewAlbum | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [videoAlbum, setVideoAlbum] = useState<GalleryViewAlbum | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(() => {
    const used = new Set(albums.map((album) => album.category));
    return GALLERY_CATEGORIES.filter((cat) => used.has(cat.id));
  }, [albums]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("uk");
    const list = albums.filter((album) => {
      const inCategory = category === "all" || album.category === category;
      const haystack = [
        album.title,
        album.summary,
        album.serviceLabel,
        galleryCategoryLabel(album.category),
      ]
        .join(" ")
        .toLocaleLowerCase("uk");
      return inCategory && haystack.includes(q);
    });
    if (sort === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title, "uk"));
    } else if (sort === "za") {
      list.sort((a, b) => b.title.localeCompare(a.title, "uk"));
    } else {
      list.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          a.title.localeCompare(b.title, "uk"),
      );
    }
    return list;
  }, [albums, category, query, sort]);

  const videoAlbums = albums.filter((album) => album.videoUrl);
  const collage = albums.filter((album) => album.featured).slice(0, 3);
  const collageImages = [
    collage[0] ? albumImage(collage[0], 0) : "/brand/demo/animators.svg",
    collage[1] ? albumImage(collage[1], 1) : "/brand/demo/shows.svg",
    collage[2] ? albumImage(collage[2], 2) : "/brand/demo/gaming.svg",
  ];

  const closeAll = useCallback(() => {
    setLightbox(false);
    setOpenAlbum(null);
    setVideoAlbum(null);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    const anyOpen = Boolean(openAlbum || lightbox || videoAlbum);
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openAlbum, lightbox, videoAlbum]);

  /* Фокус переходить на кнопку закриття щойно відкритого діалогу. */
  useEffect(() => {
    if (openAlbum || lightbox || videoAlbum) closeRef.current?.focus();
  }, [openAlbum, lightbox, videoAlbum]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightbox) setLightbox(false);
        else closeAll();
      }
      if (lightbox && event.key === "ArrowRight") {
        setPhotoIndex((index) => (index + 1) % (openAlbum?.images.length || 1));
      }
      if (lightbox && event.key === "ArrowLeft") {
        setPhotoIndex(
          (index) =>
            (index - 1 + (openAlbum?.images.length || 1)) %
            (openAlbum?.images.length || 1),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, openAlbum, closeAll]);

  const showAlbum = (album: GalleryViewAlbum) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setPhotoIndex(0);
    setOpenAlbum(album);
  };

  const requestText = (album: GalleryViewAlbum) =>
    `Добрий день! Цікавить свято від «Жирафик» за прикладом альбому «${album.title}». ${
      album.serviceLabel ? `Послуга: ${album.serviceLabel}. ` : ""
    }Підкажіть, будь ласка, можливі формати та вартість.`;

  const copyRequest = async (album: GalleryViewAlbum) => {
    const text = requestText(album);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  };

  const mailto = (album: GalleryViewAlbum) =>
    `mailto:${contacts.email || "giraffe.teplik@gmail.com"}?subject=${encodeURIComponent(
      "Замовлення свята · Жирафик",
    )}&body=${encodeURIComponent(requestText(album))}`;

  return (
    <>
      {/* Герой */}
      <section className="m2-gal-hero">
        <div className="m2-wrap m2-gal-hero__grid">
          <div className="m2-gal-hero__text">
            <span className="m2-eyebrow m2-eyebrow--ochre">
              Наші свята в кадрі
            </span>
            <h1>
              Галерея <em>емоцій</em>
            </h1>
            <p>
              Кожне свято — особлива історія. Дивіться ідеї для аніматорських
              програм, шоу, VR &amp; PS4 та незабутніх привітань.
            </p>
            <div className="m2-inline" style={{ marginTop: 28 }}>
              <a className="m2-btn" href="#albums">
                Дивитися альбоми ↓
              </a>
              <a className="m2-btn m2-btn--ghost" href="#video">
                ▶ Відеомоменти
              </a>
            </div>
            <div className="m2-gal-hero__facts">
              <span>◉ Тематичні альбоми</span>
              <span>◎ Фото та відео</span>
              <span>✧ Зв'язок із послугами</span>
            </div>
          </div>
          <div className="m2-gal-collage">
            {collageImages.map((src, index) => (
              <div className="m2-gal-collage__pic" key={src}>
                {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
                <img src={src} alt={`Обкладинка альбому ${index + 1}`} />
              </div>
            ))}
            <span className="m2-gal-collage__badge">
              ✨ Натхнення для вашого свята
            </span>
          </div>
        </div>
      </section>

      {/* Альбоми */}
      <section className="m2-sec" id="albums">
        <div className="m2-wrap">
          <div className="m2-sec__head m2-sec__head--row">
            <div>
              <span className="m2-eyebrow">Портфоліо свят</span>
              <h2>Оберіть свою історію</h2>
              <p>
                Знайдіть ідею за форматом свята. Натисніть на альбом, щоб
                переглянути фотографії та дізнатися, яку послугу можна замовити.
              </p>
            </div>
            <Link className="m2-btn m2-btn--sm m2-btn--green" href="/services">
              До каталогу послуг ↗
            </Link>
          </div>

          <div className="m2-gal-toolbar">
            <label className="m2-gal-search">
              <span className="m2-gal-search__icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Пошук: шоу, VR, Миколай…"
                aria-label="Пошук альбомів"
              />
            </label>
            <div className="m2-gal-toolbar__right">
              <label className="m2-gal-sort">
                <select
                  aria-label="Сортування альбомів"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                >
                  <option value="recommended">Рекомендовані</option>
                  <option value="az">За назвою А–Я</option>
                  <option value="za">За назвою Я–А</option>
                </select>
              </label>
              <button
                type="button"
                className="m2-btn m2-btn--sm m2-btn--ghost"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setSort("recommended");
                }}
              >
                Скинути
              </button>
            </div>
          </div>

          <fieldset className="m2-gal-chips">
            <legend className="m2-gal-sr">Категорії галереї</legend>
            <button
              type="button"
              className="m2-gal-chip"
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              ✦ Усі свята
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="m2-gal-chip"
                aria-pressed={category === cat.id}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </fieldset>

          <p className="m2-gal-count" aria-live="polite">
            Знайдено альбомів: {filtered.length}
          </p>

          {filtered.length ? (
            <div className="m2-gal-grid">
              {filtered.map((album) => (
                <article className="m2-gal-card" key={album.id}>
                  <button
                    type="button"
                    className="m2-gal-card__cover"
                    onClick={() => showAlbum(album)}
                    aria-label={`Відкрити альбом: ${album.title}`}
                  >
                    {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
                    <img src={albumImage(album)} alt="" loading="lazy" />
                    <span className="m2-gal-card__pill">
                      {galleryCategoryLabel(album.category)}
                    </span>
                    <span className="m2-gal-card__count">
                      ▣ {album.images.length} кадрів
                    </span>
                  </button>
                  <div className="m2-gal-card__body">
                    <div className="m2-gal-card__meta">
                      <span>{galleryCategoryLabel(album.category)}</span>
                      <span>{album.featured ? "★ Обране" : "Альбом"}</span>
                    </div>
                    <h3>{album.title}</h3>
                    <p>{album.summary}</p>
                    <div className="m2-gal-card__foot">
                      <span className="m2-gal-card__tag">
                        {album.videoUrl ? "▶ Є відео" : "📷 Фото"}
                      </span>
                      <button
                        type="button"
                        className="m2-gal-card__link"
                        onClick={() => showAlbum(album)}
                      >
                        Дивитися альбом →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="m2-notecard">
              Нічого не знайдено. Спробуйте іншу категорію або пошукове слово.
            </p>
          )}
        </div>
      </section>

      {/* Як це працює */}
      <section className="m2-sec m2-sec--tint">
        <div className="m2-wrap">
          <div className="m2-sec__head">
            <span className="m2-eyebrow">Як це працює</span>
            <h2>Від ідеї до вашого свята</h2>
            <p>
              Галерея не просто показує кадри — вона допомагає обрати послугу.
            </p>
          </div>
          <div className="m2-gal-features">
            <div className="m2-gal-feature">
              <span className="m2-gal-feature__icon" aria-hidden="true">
                📷
              </span>
              <h3>Дивіться альбоми</h3>
              <p>
                Фотографії об'єднані за програмами: аніматори, шоу, VR,
                майстер-класи й інші.
              </p>
            </div>
            <div className="m2-gal-feature">
              <span className="m2-gal-feature__icon" aria-hidden="true">
                ✨
              </span>
              <h3>Обирайте формат</h3>
              <p>
                У кожному альбомі — короткий опис програми та перехід до
                відповідної послуги.
              </p>
            </div>
            <div className="m2-gal-feature">
              <span className="m2-gal-feature__icon" aria-hidden="true">
                📅
              </span>
              <h3>Замовляйте свято</h3>
              <p>
                Кнопка під альбомом допоможе сформулювати заявку без повторного
                пошуку.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Відео */}
      <section className="m2-sec m2-gal-video-sec" id="video">
        <div className="m2-wrap">
          <div className="m2-sec__head">
            <span className="m2-eyebrow m2-eyebrow--ochre">
              Рух, музика, настрій
            </span>
            <h2>Відеомоменти</h2>
            <p>
              Короткі ролики з подій. Відео додається в адмінці разом із
              альбомом і запускається тільки після натискання.
            </p>
          </div>
          {videoAlbums.length ? (
            <div className="m2-gal-video-grid">
              {videoAlbums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  className="m2-gal-video"
                  onClick={() => {
                    lastFocus.current =
                      document.activeElement as HTMLElement | null;
                    setVideoAlbum(album);
                  }}
                  aria-label={`Переглянути відео: ${album.title}`}
                >
                  {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
                  <img src={albumImage(album)} alt="" loading="lazy" />
                  <span className="m2-gal-video__play" aria-hidden="true">
                    ▶
                  </span>
                  <span className="m2-gal-video__info">
                    <b>{album.title}</b>
                    <span className="m2-gal-video__hint">
                      Натисніть для перегляду
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="m2-gal-video__empty">
              Відеомоменти з'являться після додавання роликів в адмінці.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="m2-sec">
        <div className="m2-wrap">
          <div className="m2-gal-cta">
            <div>
              <h2>Побачили свято своєї мрії?</h2>
              <p>
                Мобільний магістр свята «Жирафик» приїде до вашого місця
                святкування. Подивіться ідеї — ми допоможемо обрати формат.
              </p>
            </div>
            <a className="m2-btn" href={`tel:${contacts.tel}`}>
              ☎ {contacts.phone || "096 187 85 79"}
            </a>
          </div>
        </div>
      </section>

      {/* Модалка альбому */}
      {openAlbum && (
        <div className="m2-gal-modal">
          <button
            type="button"
            className="m2-gal-modal__backdrop"
            aria-label="Закрити альбом"
            onClick={closeAll}
          />
          <div
            className="m2-gal-modal__box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="m2-gal-album-title"
          >
            <div className="m2-gal-modal__head">
              <div>
                <span className="m2-eyebrow">Альбом галереї</span>
                <h2 id="m2-gal-album-title">{openAlbum.title}</h2>
              </div>
              <button
                type="button"
                className="m2-gal-modal__close"
                ref={closeRef}
                onClick={closeAll}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>
            <div className="m2-gal-modal__body">
              <div>
                {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
                <img
                  className="m2-gal-modal__main"
                  src={albumImage(openAlbum)}
                  alt={`Обкладинка альбому «${openAlbum.title}»`}
                />
                <p className="m2-gal-modal__desc">{openAlbum.summary}</p>
                {openAlbum.serviceLabel && (
                  <span className="m2-gal-modal__service">
                    Послуга: {openAlbum.serviceLabel}
                  </span>
                )}
                <div className="m2-gal-modal__actions">
                  {openAlbum.serviceHref && (
                    <Link
                      className="m2-btn m2-btn--sm"
                      href={openAlbum.serviceHref}
                    >
                      Замовити подібне свято ↗
                    </Link>
                  )}
                  <a
                    className="m2-btn m2-btn--sm m2-btn--ghost"
                    href={mailto(openAlbum)}
                  >
                    Написати на пошту
                  </a>
                  <button
                    type="button"
                    className="m2-btn m2-btn--sm m2-btn--ghost"
                    onClick={() => void copyRequest(openAlbum)}
                  >
                    Скопіювати текст заявки
                  </button>
                </div>
                <p className="m2-gal-modal__note">
                  Ілюстрації в альбомі — демо-заглушки. Реальні фото з'являться
                  після завантаження власником.
                </p>
              </div>
              <div>
                <h3>Фотографії альбому</h3>
                <div className="m2-gal-thumbs">
                  {openAlbum.images.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      className="m2-gal-thumb"
                      onClick={() => {
                        setPhotoIndex(index);
                        setLightbox(true);
                      }}
                      aria-label={`Фото ${index + 1} альбому`}
                    >
                      {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Лайтбокс */}
      {lightbox && openAlbum && (
        <div className="m2-gal-modal m2-gal-modal--light">
          <button
            type="button"
            className="m2-gal-modal__backdrop"
            aria-label="Закрити перегляд фотографії"
            onClick={() => setLightbox(false)}
          />
          <div
            className="m2-gal-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="m2-gal-lightbox-title"
          >
            <div className="m2-gal-modal__head">
              <h2 id="m2-gal-lightbox-title">{openAlbum.title}</h2>
              <button
                type="button"
                className="m2-gal-modal__close"
                ref={closeRef}
                onClick={() => setLightbox(false)}
                aria-label="Закрити перегляд"
              >
                ×
              </button>
            </div>
            {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статики */}
            <img
              className="m2-gal-lightbox__img"
              src={albumImage(openAlbum, photoIndex)}
              alt={`Фото ${photoIndex + 1} з ${openAlbum.images.length} в альбомі «${openAlbum.title}»`}
            />
            <div className="m2-gal-lightbox__bar">
              <button
                type="button"
                className="m2-btn m2-btn--sm m2-btn--ghost"
                onClick={() =>
                  setPhotoIndex(
                    (photoIndex - 1 + openAlbum.images.length) %
                      openAlbum.images.length,
                  )
                }
              >
                ← Попереднє
              </button>
              <span>
                {photoIndex + 1} / {openAlbum.images.length}
              </span>
              <button
                type="button"
                className="m2-btn m2-btn--sm m2-btn--ghost"
                onClick={() =>
                  setPhotoIndex((photoIndex + 1) % openAlbum.images.length)
                }
              >
                Наступне →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Відео */}
      {videoAlbum && (
        <div className="m2-gal-modal">
          <button
            type="button"
            className="m2-gal-modal__backdrop"
            aria-label="Закрити відео"
            onClick={closeAll}
          />
          <div
            className="m2-gal-modal__box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="m2-gal-video-title"
          >
            <div className="m2-gal-modal__head">
              <h2 id="m2-gal-video-title">{videoAlbum.title} · відео</h2>
              <button
                type="button"
                className="m2-gal-modal__close"
                ref={closeRef}
                onClick={closeAll}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>
            <div className="m2-gal-modal__video">
              {/* biome-ignore lint/a11y/useMediaCaption: деморолик без мовлення; субтитри реальних відео надає власник */}
              <video
                controls
                playsInline
                preload="none"
                poster={albumImage(videoAlbum)}
              >
                <source src={videoAlbum.videoUrl} type="video/mp4" />
              </video>
              <p>
                Деморолик для прикладу плеєра. Реальні відео додаються після
                отримання дозволу на публікацію.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
