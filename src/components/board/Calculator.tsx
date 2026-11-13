"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, CALC_NOTE, SERVICES } from "./content";

/** Орієнтовний кошторис із базових цін mac2. Сума не претендує на
 *  остаточну ціну: пакетні знижки й дорогу рахує команда після заявки. */
export default function Calculator({
  services = SERVICES,
  calcNote = CALC_NOTE,
}: {
  services?: SectionData<"services">["services"];
  calcNote?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const router = useRouter();

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const total = services
    .filter((service) => picked.includes(service.id))
    .reduce((sum, service) => sum + service.calcValue, 0);

  const goToBooking = () => {
    const items = services
      .filter((service) => picked.includes(service.id))
      .map((service) => ({
        serviceId: service.id,
        serviceName: service.title,
        price: service.price,
      }));
    if (items.length === 0) {
      router.push(BOOK_HREF);
      return;
    }
    router.push(
      `${BOOK_HREF}?${new URLSearchParams({ items: JSON.stringify(items) }).toString()}`,
    );
  };

  return (
    <div className="m2-calc">
      <div>
        <h2>Оберіть, що привезти</h2>
        <p className="m2-inner__lede" style={{ marginBottom: 24 }}>
          Позначте послуги — сума з'явиться праворуч. Це базові ціни за одиницю
          з макета, а не остаточний рахунок.
        </p>
        <div className="m2-calc__list">
          {services.map((service) => (
            <label className="m2-calc__item" key={service.id}>
              <span>
                <input
                  type="checkbox"
                  checked={picked.includes(service.id)}
                  onChange={() => toggle(service.id)}
                />{" "}
                {service.calcLabel}
              </span>
              <span className="m2-calc__price">
                {service.price}
                {service.unit}
              </span>
            </label>
          ))}
        </div>
      </div>
      <aside className="m2-calc__total" aria-live="polite">
        <span>Орієнтовна сума</span>
        <b>{total.toLocaleString("uk-UA")} грн</b>
        <p>{calcNote}</p>
        <button className="m2-btn" onClick={goToBooking} style={{ marginTop: 18 }}>
          Забронювати дату
        </button>
      </aside>
    </div>
  );
}
