"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import {
  BOOK_HREF,
  CALC_NOTE,
  ROAD_FREE_KM,
  ROAD_NOTE,
  ROAD_TARIFF,
  SERVICES,
} from "./content";

/** Орієнтовний кошторис із базових цін. Сума не претендує на
 *  остаточну ціну: пакетні знижки й дорогу рахує команда після заявки. */
export default function Calculator({
  services = SERVICES,
  packages = [],
  calcNote = CALC_NOTE,
  roadTariff = ROAD_TARIFF,
  roadFreeKm = ROAD_FREE_KM,
  roadNote = ROAD_NOTE,
}: {
  services?: SectionData<"services">["services"];
  packages?: SectionData<"packages">["packages"];
  calcNote?: string;
  /** Тариф дороги, грн/км в один бік (налаштовується в адмінці). */
  roadTariff?: number;
  /** Сколько км безкоштовно (0 — платимо від першого км). */
  roadFreeKm?: number;
  /** Текст правила транспорту для клієнта. */
  roadNote?: string;
}) {
  // picked: serviceId -> variantId
  const [picked, setPicked] = useState<Record<string, string>>({});
  // Відстань в один бік, км; порожнє — «уточнюється» (не вигадуємо маршрут)
  const [kmInput, setKmInput] = useState("");
  const router = useRouter();

  function toggle(serviceId: string, variantId: string) {
    setPicked((prev) => {
      const next = { ...prev };
      if (next[serviceId] === variantId) {
        delete next[serviceId];
      } else {
        next[serviceId] = variantId;
      }
      return next;
    });
  }

  const total = Object.entries(picked).reduce((sum, [sid, vid]) => {
    const service = services.find((s) => s.id === sid);
    const variant = service?.variants?.find((v) => v.id === vid);
    return sum + (variant?.price ?? service?.calcValue ?? 0);
  }, 0);

  /* Транспорт: клієнт сам вказує відстань; без неї — «уточнюється».
     Правило: (км − безкоштовна зона) × тариф, не нижче нуля. */
  const km = Number(kmInput);
  const hasKm = kmInput.trim() !== "" && Number.isFinite(km) && km > 0;
  const transportCost = hasKm
    ? Math.max(0, km - roadFreeKm) * roadTariff
    : null;
  const grandTotal = transportCost === null ? null : total + transportCost;

  const goToBooking = () => {
    const items = Object.entries(picked).flatMap(([sid, vid]) => {
      const service = services.find((s) => s.id === sid);
      if (!service) return [];
      const variant = service.variants?.find((v) => v.id === vid);
      return [
        {
          serviceId: service.id,
          serviceName: `${service.title}${variant ? ` (${variant.label})` : ""}`,
          price: variant ? `${variant.price} грн` : service.price,
        },
      ];
    });
    /* Транспорт додаємо лише з відстанню — точну вартість менеджер
       уточнює за адресою (не вигадуємо маршрут). */
    if (transportCost !== null) {
      items.push({
        serviceId: "transport",
        serviceName: `🚗 Транспорт (в один бік, ${km} км)`,
        price: `${transportCost} грн`,
      });
    }
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
        <div className="m2-calc__list">
          {services.map((service) => {
            const variants =
              service.variants && service.variants.length > 0
                ? service.variants
                : [
                    {
                      id: `${service.id}-default`,
                      label: service.unit || "",
                      durationMin: 0,
                      price: service.calcValue || 0,
                    },
                  ];
            return (
              <div key={service.id} className="m2-calc__service">
                <div
                  className={`m2-calc__service-title${service.desc ? " m2-calc__service-title--hint" : ""}`}
                  {...(service.desc
                    ? {
                        tabIndex: 0,
                        "aria-describedby": `calc-desc-${service.id}`,
                      }
                    : {})}
                >
                  {service.emoji} {service.title}
                  {service.desc && (
                    <>
                      <span className="m2-calc__hint-icon" aria-hidden="true">
                        ?
                      </span>
                      <span
                        role="tooltip"
                        id={`calc-desc-${service.id}`}
                        className="m2-calc__tooltip"
                      >
                        {service.desc}
                      </span>
                    </>
                  )}
                </div>
                <div className="m2-calc__variants">
                  {variants.map((variant) => (
                    <label className="m2-calc__item" key={variant.id}>
                      <span>
                        <input
                          type="checkbox"
                          checked={picked[service.id] === variant.id}
                          onChange={() => toggle(service.id, variant.id)}
                        />{" "}
                        {variant.label || service.calcLabel}
                      </span>
                      <span className="m2-calc__price">
                        {variant.price} грн
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {packages.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Готові комплекси</h3>
            <p
              className="m2-inner__lede"
              style={{ marginBottom: 16, fontSize: 13 }}
            >
              Комплекси дешевші за суму окремих послуг. Оберіть комплекс — або
              зберіть власний вище.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {packages.map((pkg) => {
                const quote = (pkg.items || []).reduce((sum, item) => {
                  const service = services.find((s) =>
                    s.variants?.some((v) => v.id === item.variantId),
                  );
                  const variant = service?.variants?.find(
                    (v) => v.id === item.variantId,
                  );
                  return sum + (variant?.price ?? 0) * (item.qty ?? 1);
                }, 0);
                const economy = quote > 0 ? quote - (pkg.bundlePrice ?? 0) : 0;
                return (
                  <div
                    key={pkg.id}
                    style={{
                      padding: 12,
                      border: "1px solid #dce5df",
                      borderRadius: 10,
                      background: "#fff",
                    }}
                  >
                    <strong>{pkg.name}</strong> — {pkg.price} {pkg.period}
                    {economy > 0 && (
                      <span
                        style={{
                          color: "#267765",
                          marginLeft: 8,
                          fontSize: 13,
                        }}
                      >
                        (економія {economy} грн)
                      </span>
                    )}
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {pkg.items.map((i) => i.text).join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 12, fontSize: 13 }}>
              <Link href="/packages" className="m2-back">
                Усі пакети →
              </Link>
            </p>
          </div>
        )}

        {/* Транспорт (CALC-02): клієнт вказує відстань сам; без неї —
            «уточнюється», маршрут не вигадуємо. */}
        <div
          style={{
            marginTop: 32,
            padding: 16,
            border: "1px dashed #dce5df",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>🚗 Транспорт</h3>
          <label
            style={{ display: "block", fontSize: 13, marginBottom: 8 }}
            htmlFor="calc-km"
          >
            Відстань в один бік, км
            <input
              id="calc-km"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={kmInput}
              onChange={(event) => setKmInput(event.target.value)}
              placeholder="напр. 12"
              style={{
                marginLeft: 8,
                padding: "6px 10px",
                border: "1px solid #dce5df",
                borderRadius: 8,
                width: 130,
              }}
            />
          </label>
          <p
            style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}
            aria-live="polite"
          >
            {transportCost !== null
              ? `Транспорт: ${transportCost} грн — ${km} км × ${roadTariff} грн/км${roadFreeKm > 0 ? ` (перші ${roadFreeKm} км безкоштовно)` : ""}`
              : "Вартість дороги: уточнюється. Вкажіть відстань — або залиште поле порожнім, і менеджер розрахує за адресою."}
          </p>
          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{roadNote}</p>
        </div>
      </div>
      <aside className="m2-calc__total" aria-live="polite">
        <span>
          {transportCost !== null ? "Орієнтовна сума разом" : "Орієнтовна сума"}
        </span>
        <b>{(grandTotal ?? total).toLocaleString("uk-UA")} грн</b>
        {/* Розклад суми: послуги + транспорт (прийом CALC-02) */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px dashed rgb(18 52 58 / 30%)",
            fontSize: 13,
            display: "grid",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Послуги</span>
            <span>{total.toLocaleString("uk-UA")} грн</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Транспорт</span>
            <span>
              {transportCost !== null
                ? `${transportCost.toLocaleString("uk-UA")} грн`
                : "уточнюється"}
            </span>
          </div>
          {grandTotal !== null && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                paddingTop: 4,
                borderTop: "1px solid rgb(18 52 58 / 30%)",
              }}
            >
              <span>Разом (орієнтовно)</span>
              <span>{grandTotal.toLocaleString("uk-UA")} грн</span>
            </div>
          )}
        </div>
        <p>{calcNote}</p>
        <button
          type="button"
          className="m2-btn"
          onClick={goToBooking}
          style={{ marginTop: 18 }}
        >
          Забронювати дату
        </button>
      </aside>
    </div>
  );
}
