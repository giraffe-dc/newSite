import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, PACKAGE_ADDONS, PACKAGES } from "./content";

export default function PackagesGrid({
  packages = PACKAGES,
  packageAddons = PACKAGE_ADDONS,
}: {
  packages?: SectionData<"packages">["packages"];
  packageAddons?: string;
}) {
  return (
    <>
      <div className="m2-packages">
        {packages.map((pkg) => (
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
              {pkg.items.map((item) => (
                <li
                  className={item.included ? undefined : "m2-no"}
                  key={item.text}
                >
                  {item.text}
                </li>
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
      <p className="m2-addons">
        <b>Плюс до будь-якого пакета:</b>{" "}
        {packageAddons.split(": ").slice(1).join(": ")}
      </p>
    </>
  );
}
