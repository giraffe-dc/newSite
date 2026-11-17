import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";

/** Рекламний банер сезонних пропозицій на головній (замість блоку
 *  «Для кого»). Налаштовується в адмінці (секція «Сезонні пропозиції»):
 *  увімкнення + зображення + заголовок + текст + кнопка. Якщо блок
 *  вимкнено або немає заголовка/тексту — не рендериться. */
export default function SeasonalOffersSection({
  data,
}: {
  data?: SectionData<"seasonalOffers">;
}) {
  if (!data?.enabled) return null;
  if (!data.title && !data.text) return null;

  const img = data.image || "/brand/demo/seasonal.svg";
  const alt = data.imageAlt || data.title || "Сезонна пропозиція Жирафик";

  return (
    <section
      className="m2-sec m2-sec--tint"
      id="seasonal-offers"
      aria-labelledby="seasonal-offers-title"
    >
      <div className="m2-wrap">
        <div className="m2-seasonal-banner">
          <div className="m2-seasonal-banner__img">
            {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД/статика */}
            <img src={img} alt={alt} loading="lazy" />
          </div>
          <div className="m2-seasonal-banner__body">
            <span className="m2-eyebrow">Сезонна пропозиція</span>
            {data.title && (
              <h2 id="seasonal-offers-title">{data.title}</h2>
            )}
            {data.text && <p>{data.text}</p>}
            {data.ctaLabel && data.ctaLink && (
              <Link className="m2-btn" href={data.ctaLink}>
                {data.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}