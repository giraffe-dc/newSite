import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, PACKAGES } from "./content";

/** Попередній перегляд готових комплексів на головній.
 *  Показує 3 основні комплекси зі складом і економією. */
export default function PackagesPreview({
  packages = PACKAGES,
}: {
  packages?: SectionData<"packages">["packages"];
}) {
  // Беремо 3 основні комплекси (mini, standard, new-lo91nas або перші 3)
  const featured = packages.slice(0, 3);

  if (!featured.length) return null;

  return (
    <section className="m2-sec" id="packages-preview" aria-labelledby="packages-preview-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Готові комплекси</span>
          <h2 id="packages-preview-title">«Разом вигідніше»</h2>
          <p>
            Готові набори послуг зі знижкою. Оберіть комплекс — або зберіть
            власний із окремих послуг.
          </p>
        </div>
        <div className="m2-packages">
          {featured.map((pkg) => (
            <article
              className={`m2-pkg${pkg.hit ? " m2-pkg--hit" : ""}`}
              key={pkg.id}
            >
              {pkg.hit && <span className="m2-pkg__tag">ХІТ ЗАМОВЛЕНЬ</span>}
              <h3>{pkg.name}</h3>
              <div className="m2-pkg__sub">{pkg.sub}</div>
              <div className="m2-pkg__price">
                {pkg.price} <small>{pkg.period}</small>
              </div>
              <ul>
                {pkg.items.map((item, idx) => (
                  <li key={`${pkg.id}-${idx}`}>{item.text}</li>
                ))}
              </ul>
              <Link
                className={`m2-btn${pkg.hit ? "" : " m2-btn--green"}`}
                href={`${BOOK_HREF}?format=${encodeURIComponent(pkg.format)}&package=${encodeURIComponent(pkg.id)}&packageName=${encodeURIComponent(pkg.name)}&programId=${encodeURIComponent(pkg.id)}`}
              >
                Обрати «{pkg.name}»
              </Link>
            </article>
          ))}
        </div>
        <p className="m2-inline" style={{ marginTop: 24, justifyContent: "center" }}>
          <Link className="m2-btn m2-btn--ghost m2-btn--sm" href="/packages">
            Усі пакети →
          </Link>
        </p>
      </div>
    </section>
  );
}