import Link from "next/link";
import { BOOK_HREF, PACKAGE_ADDONS, PACKAGES } from "./content";

export default function PackagesGrid() {
  return (
    <>
      <div className="m2-packages">
        {PACKAGES.map((pkg) => (
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
              href={BOOK_HREF}
            >
              Обрати «{pkg.name}»
            </Link>
          </article>
        ))}
      </div>
      <p className="m2-addons">
        <b>Плюс до будь-якого пакета:</b>{" "}
        {PACKAGE_ADDONS.split(": ").slice(1).join(": ")}
      </p>
    </>
  );
}
