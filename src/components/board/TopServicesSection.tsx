import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, SERVICES } from "./content";

const DEMO_IMAGES: Record<string, string> = {
  animators: "/brand/demo/animators.svg",
  puppets: "/brand/demo/puppets.svg",
  shows: "/brand/demo/shows.svg",
  gaming: "/brand/demo/gaming.svg",
  extras: "/brand/demo/extras.svg",
  seasonal: "/brand/demo/seasonal.svg",
};

/** Топ-послуги на головній — популярні послуги з фото.
 *  Демо-зображення (SVG) — замінити на реальні фото з заходів. */
export default function TopServicesSection({
  services = SERVICES,
}: {
  services?: SectionData<"services">["services"];
}) {
  // Беремо по одній послузі з кожної категорії (або перші 6)
  const top = services.slice(0, 6);
  if (!top.length) return null;

  return (
    <section className="m2-sec m2-sec--tint" id="top-services" aria-labelledby="top-services-title">
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
            const img = service.images?.[0] || DEMO_IMAGES[service.category || ""] || "/brand/demo/animators.svg";
            const variant = service.variants?.[0];
            const priceLabel = variant ? `${variant.price} грн` : service.price || "";
            return (
              <Link
                key={service.id}
                href={`${BOOK_HREF}?format=${encodeURIComponent(service.format)}&service=${encodeURIComponent(service.title)}`}
                className="m2-top-service"
              >
                <div className="m2-top-service__img">
                  {/* biome-ignore lint/performance/noImgElement: демо-зображення, замінити на next/image з реальними фото */}
                  <img src={img} alt={service.title} loading="lazy" />
                </div>
                <div className="m2-top-service__body">
                  <h3>{service.emoji} {service.title}</h3>
                  <p>{service.desc?.slice(0, 80)}</p>
                  <span className="m2-top-service__price">{priceLabel}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="m2-inline" style={{ marginTop: 24, justifyContent: "center" }}>
          <Link className="m2-btn m2-btn--ghost m2-btn--sm" href="/services">
            Усі послуги →
          </Link>
        </p>
      </div>
    </section>
  );
}