import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, SERVICES } from "./content";

export default function ServicesGrid({
  services = SERVICES,
}: {
  services?: SectionData<"services">["services"];
}) {
  return (
    <div className="m2-tickets">
      {services.map((service) => (
        <article className="m2-ticket" key={service.id}>
          <div className="m2-ticket__top">
            <span className="m2-ticket__emoji" aria-hidden="true">
              {service.emoji}
            </span>
            <h3>{service.title}</h3>
          </div>
          <p className="m2-ticket__desc">{service.desc}</p>
          <div className="m2-ticket__price">
            <span>
              від <b>{service.price}</b>
              {service.unit}
            </span>
            <Link href={BOOK_HREF}>Вибрати</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
