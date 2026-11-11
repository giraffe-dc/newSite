"use client";

import { CASES } from "./content";

/** Підбір випадку: клік по картці → готовий сценарій + ціна, а формат
 *  підставляється у форму бронювання внизу сторінки (стан у Home). */
export default function CasePicker({
  service,
  onPick,
}: {
  service: string;
  onPick: (service: string) => void;
}) {
  const active = CASES.find((c) => c.service === service) ?? CASES[0];

  return (
    <section
      className="m2-sec m2-sec--tint"
      id="cases"
      aria-labelledby="cases-title"
    >
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Підбір за 5 секунд</span>
          <h2 id="cases-title">
            Оберіть свій випадок — покажемо, що привеземо
          </h2>
          <p>
            Не каталог, а готова відповідь на вашу ситуацію: скільки дітей, що
            входить і скільки коштує.
          </p>
        </div>

        <fieldset className="m2-cases" aria-label="Оберіть випадок свята">
          {CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="m2-case"
              aria-pressed={c.id === active.id}
              onClick={() => onPick(c.service)}
            >
              <span className="m2-case__emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <span className="m2-case__title">{c.title}</span>
              <span className="m2-case__when">{c.when}</span>
            </button>
          ))}
        </fieldset>

        <div className="m2-case-detail" aria-live="polite">
          <div>
            <h3>{active.title}</h3>
            <p className="m2-case-detail__text">{active.text}</p>
            <ul className="m2-case-detail__list">
              {active.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="m2-case-aside">
            <span className="m2-case-aside__price">
              {active.price}
              <small>{active.unit}</small>
            </span>
            <p className="m2-case-aside__meta">{active.meta}</p>
            <a className="m2-btn m2-btn--green m2-btn--wide" href="#book">
              Забронювати цей випадок
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
