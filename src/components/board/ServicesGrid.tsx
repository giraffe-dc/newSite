import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import {
  durationHeadline,
  priceHeadline,
  variantPairs,
} from "@/lib/serviceVariants";
import { serviceImage } from "./categories";
import { BOOK_HREF, SERVICES } from "./content";

export default function ServicesGrid({
  services = SERVICES,
}: {
  services?: SectionData<"services">["services"];
}) {
  return (
    <div className="m2-tickets">
      {services.map((service) => {
        const variants =
          service.variants && service.variants.length > 0
            ? service.variants
            : [];
        const priceLabel = priceHeadline(variants, service.price || "");
        const durationLabel = durationHeadline(variants, service.unit || "");
        /* Замість емодзі (фото вже є) — компактний бейдж рекомендованого
           віку з першого рядка «Для кого підходить». */
        const ageBadge = service.audiences?.[0]?.trim() || "";
        // Показуємо точні пари лише коли варіантів більше одного —
        // для одного варіанта достатньо одного рядка ціни/тривалості.
        const allPairs = variantPairs(variants);
        const pairs = allPairs.slice(0, 3);
        const hiddenCount = allPairs.length - pairs.length;

        return (
          <article className="m2-ticket" key={service.id}>
          <div className="m2-ticket__badge-wrap">
            
              <span className={ageBadge ? "m2-ticket__badge" : "m2-ticket__badge_more"}>
                {ageBadge}
              </span>
            
          </div>
            <div className="m2-ticket__top">
             
              <h3>{service.title}</h3>
            </div>
            {/* Фото послуги (MED-01): власне зображення або SVG-заглушка */}
            <div className="m2-ticket__img">
              {/* biome-ignore lint/performance/noImgElement: динамічні URL із БД/статика, next/image потребує remotePatterns */}
              <img
                src={serviceImage(service)}
                alt={service.imageAlt || service.title}
                loading="lazy"
              />
            </div>
            <p className="m2-ticket__desc">{service.desc}</p>
            <div className="m2-ticket__price">
              <span className="m2-ticket__pricing">
                <span className="m2-ticket__priceLine">
                  <b>{priceLabel}</b>
                  {durationLabel  && (
                    <span className="m2-ticket__duration">
                      {" "}
                      · {durationLabel}
                    </span>
                  )}
                </span>
                {pairs.length > 1 && (
                  <span className="m2-ticket__variants">
                    {pairs.map((pair) => (
                      <span className="m2-ticket__variant" key={pair.key}>
                        {pair.label ? `${pair.label} — ` : ""}
                        {pair.price}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="m2-ticket__variant m2-ticket__variant--more">
                        +{hiddenCount}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <Link
                className="m2-btn m2-btn--green m2-btn--wide m2-ticket__cta"
                href={`${BOOK_HREF}?format=${encodeURIComponent(service.format)}&service=${encodeURIComponent(service.title)}`}
              >
                Вибрати
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
