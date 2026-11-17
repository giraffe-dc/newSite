import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import {
  durationHeadline,
  priceHeadline,
} from "@/lib/serviceVariants";
import { serviceImage } from "./categories";
import { BOOK_HREF, SERVICES } from "./content";

/** Топ-послуги на головній — популярні послуги з фото.
 *  Фото: власне зображення послуги (admin/content) або SVG-заглушка
 *  категорії — реальні фото підставить власник (MED-01). */
export default function TopServicesSection({
  services = SERVICES,
}: {
  services?: SectionData<"services">["services"];
}) {
  // Беремо послуги, відмічені «Показувати на головній» (або перші 6 як фолбек)
  const top = services
    .filter((s) => s.published !== false && s.showOnHome !== false)
    .slice(0, 6);
  if (!top.length) return null;

  return (
    <section
      className="m2-sec m2-sec--tint"
      id="top-services"
      aria-labelledby="top-services-title"
    >
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Популярні послуги</span>
          <h2 id="top-services-title">Що найчастіше замовляють</h2>
          <p>
            Найпопулярніші формати свят. Оберіть — і ми привеземо все необхідне.
          </p>
        </div>
        <div className="m2-top-services">
          {top.map((service) => {
            const img = serviceImage(service);
            const variants =
              service.variants && service.variants.length > 0
                ? service.variants
                : [];
            const priceLabel = priceHeadline(variants, service.price || "");
            const durationLabel = durationHeadline(variants, service.unit || "");
            const ageBadge = service.audiences?.[0]?.trim() || "";
            return (
              <Link
                key={service.id}
                href={`${BOOK_HREF}?format=${encodeURIComponent(service.format)}&service=${encodeURIComponent(service.title)}`}
                className="m2-top-service"
              >
                <div className="m2-top-service__img">
                  {/* biome-ignore lint/performance/noImgElement: динамічні URL із БД/статика, next/image потребує remotePatterns */}
                  <img
                    src={img}
                    alt={service.imageAlt || service.title}
                    loading="lazy"
                  />
                </div>
                <div className="m2-top-service__body">
                  {ageBadge && (
                    <span className="m2-top-service__badge">{ageBadge}</span>
                  )}
                  <h3>{service.title}</h3>
                  <p>{service.desc?.slice(0, 80)}</p>
                  <span className="m2-top-service__price">
                    {priceLabel}
                    {durationLabel && (
                      <span className="m2-top-service__duration">
                        {" "}
                        · {durationLabel}
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <p
          className="m2-inline"
          style={{ marginTop: 24, justifyContent: "center" }}
        >
          <Link className="m2-btn m2-btn--ghost m2-btn--sm" href="/services">
            Усі послуги →
          </Link>
        </p>
      </div>
    </section>
  );
}
