import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
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
        const firstVariant = variants[0];
        const priceLabel = firstVariant
          ? `${firstVariant.price} грн`
          : service.price || "";
        const unitLabel = firstVariant
          ? firstVariant.durationMin > 0
            ? ` / ${firstVariant.durationMin >= 60 ? `${firstVariant.durationMin / 60} год` : `${firstVariant.durationMin} хв`}`
            : ""
          : service.unit || "";

        return (
          <article className="m2-ticket" key={service.id}>
            <div className="m2-ticket__top">
              <span className="m2-ticket__emoji" aria-hidden="true">
                {service.emoji}
              </span>
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
              <span>
                <b>{priceLabel}</b>
                {unitLabel}
                {variants.length > 1 && (
                  <small
                    style={{ display: "block", fontSize: 12, color: "#666" }}
                  >
                    {variants.length} варіанти тривалості
                  </small>
                )}
              </span>
              <Link
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
