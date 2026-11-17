import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";

/** Сезонні пропозиції на головній (замість блоку «Для кого»).
 *  Налаштовуються в адмінці (секція «Сезонні пропозиції»): увімкнення
 *  блоку + список карток. Якщо блок вимкнено або карток немає — не
 *  рендериться. */
export default function SeasonalOffersSection({
  data,
}: {
  data?: SectionData<"seasonalOffers"> | null;
}) {
  if (!data?.enabled) return null;
  const items = data.items ?? [];
  if (items.length === 0) return null;

  return (
    <section
      className="m2-sec m2-sec--tint"
      id="seasonal-offers"
      aria-labelledby="seasonal-offers-title"
    >
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Сезонні пропозиції</span>
          <h2 id="seasonal-offers-title">Зараз вигідно замовити</h2>
          <p>
            Актуальні пропозиції сезону — обирайте, бронюйте, ми привеземо.
          </p>
        </div>
        <div className="m2-top-services">
          {items.map((item) => {
            const card = (
              <div className="m2-top-service">
                <div className="m2-top-service__img">
                  <span
                    aria-hidden="true"
                    style={{ fontSize: 48, lineHeight: 1 }}
                  >
                    {item.emoji || "🎁"}
                  </span>
                </div>
                <div className="m2-top-service__body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  {item.price && (
                    <span className="m2-top-service__price">{item.price}</span>
                  )}
                </div>
              </div>
            );
            return item.link ? (
              <Link key={item.id} href={item.link}>
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}