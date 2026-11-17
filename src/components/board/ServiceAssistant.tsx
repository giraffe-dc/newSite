"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatDuration,
  formatMoney,
  isItemVariant,
} from "@/lib/serviceVariants";
import type { SectionData } from "@/lib/siteContent";
import { categoryLabel } from "./categories";
import {
  ASSISTANT_AGE_GROUPS,
  ASSISTANT_DURATIONS,
  ASSISTANT_KIDS_PER_ANIMATOR,
  BOOK_HREF,
} from "./content";

/* Помічник підбору (UX-02): вік, кількість гостей і тривалість → послуги
   (і пакети, якщо вони підходять під віковий фільтр), які реально
   вміщуються у вибраний час, з чесними цінами з variants і поясненням
   рекомендації. Вікові обмеження конкретних послуг у картках немає
   (чесно не вигадуємо) — для спірних випадків завжди є блок зв'язку з
   менеджером. Умови (requirements) не приховуються.

   Параметри добіру редагуються в адмінці (секція «Підбір програми»): ліміт
   групи, вікові групи (назва + галочки послуг/пакетів, які показувати під
   цей фільтр) і варіанти тривалості. Тут — лише фолбеки на випадок
   відсутності документа в БД. */

type Services = SectionData<"services">["services"];
type Contacts = SectionData<"contacts">["contacts"];
type Packages = SectionData<"packages">["packages"];
type AssistantSettings = SectionData<"assistant">;

interface Result {
  service: Services[number];
  variant: {
    label: string;
    pricingUnit?: string;
    durationMin: number;
    price: number;
  } | null;
  reasons: string[];
}

function fitVariant(
  service: Services[number],
  duration: number | null,
): {
  variant: Result["variant"];
  skipped: boolean;
  addon: boolean;
  item: boolean;
} {
  const variants = service.variants ?? [];
  const items = variants.filter(isItemVariant);
  const timed = variants.filter((v) => !isItemVariant(v) && v.durationMin > 0);
  /* Послуги виключно «за шт» (напр. Блиск тату) — повноцінна послуга,
     а не доповнення: показуємо завжди, незалежно від вибраного часу. */
  if (timed.length === 0 && items.length > 0) {
    const cheapest = items.reduce((a, b) => (b.price < a.price ? b : a));
    return { variant: cheapest, skipped: false, addon: false, item: true };
  }
  /* Решта без тривалості (1 доба тощо) — доповнення до замовлення. */
  if (timed.length === 0) {
    const cheapest =
      variants.length > 0
        ? variants.reduce((a, b) => (b.price < a.price ? b : a))
        : null;
    return { variant: cheapest, skipped: false, addon: true, item: false };
  }
  if (duration === null) {
    const cheapest = timed.reduce((a, b) => (b.price < a.price ? b : a));
    return { variant: cheapest, skipped: false, addon: false, item: false };
  }
  const fit = timed.filter((v) => v.durationMin <= duration);
  if (fit.length === 0) {
    return { variant: null, skipped: true, addon: false, item: false };
  }
  /* Найкращий вклад: найдовший варіант, що вміщується. */
  const best = fit.reduce((a, b) => (b.durationMin > a.durationMin ? b : a));
  return { variant: best, skipped: false, addon: false, item: false };
}

export default function ServiceAssistant({
  services,
  contacts,
  packages,
  settings,
}: {
  services: Services;
  contacts: Contacts;
  packages: Packages;
  settings: AssistantSettings;
}) {
  const ageGroups =
    settings.ageGroups && settings.ageGroups.length > 0
      ? settings.ageGroups
      : ASSISTANT_AGE_GROUPS;
  const durations =
    settings.durations && settings.durations.length > 0
      ? settings.durations
      : ASSISTANT_DURATIONS;
  const kidsPerAnimator =
    settings.kidsPerAnimator > 0
      ? settings.kidsPerAnimator
      : ASSISTANT_KIDS_PER_ANIMATOR;

  const [age, setAge] = useState<string | null>(null);
  const [guestsRaw, setGuestsRaw] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  const guests = Number.parseInt(guestsRaw, 10);
  const guestsNum = Number.isFinite(guests) && guests > 0 ? guests : null;
  const ageGroup = ageGroups.find((g) => g.id === age) ?? null;
  const ageFilterActive =
    ageGroup !== null &&
    Array.isArray(ageGroup.refs) &&
    (ageGroup.refs as string[]).length > 0;
  const asked = age !== null || guestsNum !== null || duration !== null;

  const refsForAge = useMemo(() => {
    if (!ageGroup) return [] as string[];
    return (ageGroup.refs ?? []) as string[];
  }, [ageGroup]);

  /* Результати добіру: послуги (з урахуванням часу) і пакети (без
     часового фільтра — тривалість пакета залежить від складу). */
  const { serviceResults, packageResults, skippedByAge, skippedByDuration } =
    useMemo(() => {
      const allowedRefs = ageFilterActive ? new Set(refsForAge) : null;
      const selectedServices = allowedRefs
        ? new Set(
            [...allowedRefs]
              .filter((r) => r.startsWith("service:"))
              .map((r) => r.slice("service:".length)),
          )
        : null;
      const selectedPackages = allowedRefs
        ? new Set(
            [...allowedRefs]
              .filter((r) => r.startsWith("package:"))
              .map((r) => r.slice("package:".length)),
          )
        : null;

      const allowedServices = selectedServices
        ? services.filter((s) => selectedServices.has(s.id))
        : services;
      const allowedPackages = selectedPackages
        ? packages.filter((p) => selectedPackages.has(p.id))
        : packages;

      const ageSkippedServices = services.length - allowedServices.length;
      const ageSkippedPackages = packages.length - allowedPackages.length;

      const outServices: Result[] = [];
      let durSkipped = 0;
      for (const service of allowedServices) {
        const {
          variant,
          skipped: isSkipped,
          addon,
          item,
        } = fitVariant(service, duration);
        if (isSkipped || !variant) {
          if (isSkipped) durSkipped += 1;
          continue;
        }
        const reasons: string[] = [];
        if (item) {
          reasons.push(
            `Ціна за шт: ${formatMoney(variant.price)} / ${variant.label}`,
          );
        } else if (addon) {
          reasons.push(
            `Додаткова послуга — додається до основного замовлення: ${formatMoney(variant.price)} / ${variant.label}`,
          );
        } else if (duration !== null) {
          reasons.push(
            `Вміщується у ваш час: ${formatDuration(variant.durationMin)} — ${formatMoney(variant.price)}`,
          );
        } else {
          reasons.push(
            `Тривалість ${formatDuration(variant.durationMin)} — ${formatMoney(variant.price)}`,
          );
        }
        if (ageFilterActive) {
          reasons.push(
            `Рекомендуємо для віку «${ageGroup?.label}»: підібрано менеджером`,
          );
        }
        if (
          guestsNum !== null &&
          /дитина|дитини|дітей/i.test(variant.label) &&
          !addon &&
          !item
        ) {
          const total = variant.price * guestsNum;
          reasons.push(
            `Для ${guestsNum} дітей: ${formatMoney(variant.price)} × ${guestsNum} = ${formatMoney(total)} (підтвердить менеджер)`,
          );
        }
        outServices.push({ service, variant, reasons });
      }

      return {
        serviceResults: outServices,
        packageResults: allowedPackages,
        skippedByAge: {
          services: ageSkippedServices,
          packages: ageSkippedPackages,
        },
        skippedByDuration: durSkipped,
      };
    }, [
      services,
      packages,
      duration,
      ageGroup,
      ageFilterActive,
      refsForAge,
      guestsNum,
    ]);

  const overCapacity = guestsNum !== null && guestsNum > kidsPerAnimator;

  return (
    <div className="m2-assist">
      <div className="m2-assist__questions">
        <fieldset className="m2-assist__q">
          <legend className="m2-assist__legend">1. Вік дітей</legend>
          <div className="m2-assist__opts">
            {ageGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className="m2-assist__opt"
                aria-pressed={age === group.id}
                onClick={() => setAge(age === group.id ? null : group.id)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="m2-assist__q">
          <legend className="m2-assist__legend">2. Кількість гостей</legend>
          <label className="m2-assist__label" htmlFor="assist-guests">
            Дітей на святі
          </label>
          <input
            id="assist-guests"
            className="m2-assist__input"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            placeholder="напр. 8"
            value={guestsRaw}
            onChange={(event) => setGuestsRaw(event.target.value)}
          />
          <p className="m2-assist__hint">
            Комфортно працює до {kidsPerAnimator} дітей на аніматора — для
            більшої групи додаємо другого.
          </p>
        </fieldset>

        <fieldset className="m2-assist__q">
          <legend className="m2-assist__legend">3. Тривалість</legend>
          <div className="m2-assist__opts">
            {durations.map((item) => (
              <button
                key={item.min}
                type="button"
                className="m2-assist__opt"
                aria-pressed={duration === item.min}
                onClick={() =>
                  setDuration(duration === item.min ? null : item.min)
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="m2-assist__hint">
            Покажемо лише послуги, що вміщуються у вибраний час.
          </p>
        </fieldset>
      </div>

      {ageGroup?.askManager && (
        <output className="m2-assist__notice">
          <b>
            Для вікової групи «{ageGroup.label}» програму узгоджуємо
            індивідуально.
          </b>{" "}
          Вікових обмежень у картках послуг ми не вказуємо, щоб не вигадувати —
          зателефонуйте, підберемо формат і тривалість під вашу дитину.
        </output>
      )}

      {overCapacity && (
        <output className="m2-assist__notice">
          <b>Група понад {kidsPerAnimator} дітей.</b> На одного аніматора
          комфортно до {kidsPerAnimator} дітей — для {guestsNum} гостей можемо
          додати другого аніматора, вартість уточнюється при замовленні.
        </output>
      )}

      <div className="m2-assist__resultsHead">
        <p className="m2-assist__count" aria-live="polite">
          {asked
            ? `Знайдено: послуг — ${serviceResults.length}, пакетів — ${packageResults.length}`
            : "Оберіть вік, кількість гостей і тривалість — покажемо підходящі послуги й пакети."}
        </p>
        {ageFilterActive &&
          (skippedByAge.services > 0 || skippedByAge.packages > 0) && (
            <p className="m2-assist__skipped">
              Ще {skippedByAge.services + skippedByAge.packages} позицій не під
              цей вік — <Link href="/services">весь каталог</Link>.
            </p>
          )}
        {skippedByDuration > 0 && (
          <p className="m2-assist__skipped">
            Ще {skippedByDuration} послуг не вмістилися у вибраний час —{" "}
            <Link href="/services">подивитися весь каталог</Link>.
          </p>
        )}
      </div>

      {asked && serviceResults.length === 0 && packageResults.length === 0 && (
        <output className="m2-assist__notice">
          Під ці параметри нічого не знайшлося. Напишіть менеджеру —
          запропонуємо, що можливо саме у вашому випадку.
        </output>
      )}

      {serviceResults.length > 0 && (
        <>
          <h3 className="m2-assist__groupTitle">Послуги</h3>
          <ul className="m2-assist__list">
            {serviceResults.map(({ service, variant, reasons }) => (
              <li key={service.id} className="m2-assist__card">
                <div className="m2-assist__cardTop">
                  <span aria-hidden="true" className="m2-assist__emoji">
                    {service.emoji}
                  </span>
                  <div>
                    <h4>{service.title}</h4>
                    <span className="m2-assist__cat">
                      {categoryLabel(service.category ?? "")}
                    </span>
                  </div>
                </div>

                <p className="m2-assist__desc">{service.desc}</p>

                <ul className="m2-assist__why">
                  {reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>

                {service.requirements && service.requirements.length > 0 && (
                  <div className="m2-assist__reqs">
                    <b>Умови:</b>
                    <ul>
                      {service.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="m2-assist__price">
                  <b>
                    {variant ? formatMoney(variant.price) : "ціна уточнюється"}
                  </b>
                  <span>
                    {variant
                      ? isItemVariant(variant)
                        ? " / шт"
                        : ` / ${variant.label}`
                      : ""}
                  </span>
                </div>

                <div className="m2-assist__actions">
                  <Link href="/services">У каталозі</Link>
                  <Link
                    href={`${BOOK_HREF}?format=${encodeURIComponent(service.format)}&service=${encodeURIComponent(service.title)}`}
                  >
                    Забронювати
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {packageResults.length > 0 && (
        <>
          <h3 className="m2-assist__groupTitle">Готові пакети</h3>
          <ul className="m2-assist__list">
            {packageResults.map((pkg) => {
              const priceLabel =
                typeof pkg.bundlePrice === "number" && pkg.bundlePrice > 0
                  ? formatMoney(pkg.bundlePrice)
                  : pkg.price || "ціна уточнюється";
              const periodLabel = (pkg.period || "").replace(/^\//, "").trim();
              return (
                <li key={pkg.id} className="m2-assist__card">
                  <div className="m2-assist__cardTop">
                    <span aria-hidden="true" className="m2-assist__emoji">
                      🎁
                    </span>
                    <div>
                      <h4>{pkg.name}</h4>
                      <span className="m2-assist__cat">
                        {pkg.format || "Комплекс"}
                        {ageFilterActive && (
                          <b className="m2-assist__badge">
                            Рекомендуємо за віком
                          </b>
                        )}
                      </span>
                    </div>
                  </div>

                  {pkg.sub && <p className="m2-assist__desc">{pkg.sub}</p>}

                  {pkg.items && pkg.items.length > 0 && (
                    <ul className="m2-assist__items">
                      {pkg.items.map((item, idx) => (
                        <li key={`${pkg.id}-${idx}`}>
                          {item.text || item.variantId}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="m2-assist__price">
                    <b>{priceLabel}</b>
                    {periodLabel && <span>— {periodLabel}</span>}
                  </div>

                  <div className="m2-assist__actions">
                    <Link href="/packages">У каталозі</Link>
                    <Link
                      href={`${BOOK_HREF}?package=${encodeURIComponent(pkg.id)}&packageName=${encodeURIComponent(pkg.name)}`}
                    >
                      Забронювати
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="m2-assist__manager">
        <b>Не знайшли підходяще або вагаєтесь щодо віку?</b>
        <p>
          Менеджер підбере формат під ваш вік, кількість гостей і тривалість — і
          назве остаточну ціну. Відповідаємо {contacts.hours}.
        </p>
        <div className="m2-assist__managerBtns">
          <a className="m2-btn" href={`tel:${contacts.tel}`}>
            {contacts.phone}
          </a>
          <Link className="m2-btn m2-btn--ghost" href="/book">
            Залишити заявку
          </Link>
        </div>
      </div>
    </div>
  );
}
