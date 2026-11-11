"use client";

import { DATE_BOARD, DATE_SLOTS, DATE_VERDICT } from "./content";
import { seasonLabel, shortDateLabel } from "./dates";

/** Перевірка дати: чипи → вердикт + табло слотів; обрана дата
 *  підставляється у форму бронювання (стан у Home). */
export default function DateChecker({
  date,
  onPick,
}: {
  date: string;
  onPick: (iso: string) => void;
}) {
  const active = DATE_SLOTS.find((slot) => slot.iso === date) ?? DATE_SLOTS[0];
  const verdict = DATE_VERDICT[active.status];

  return (
    <section className="m2-sec" id="dates" aria-labelledby="dates-title">
      <div className="m2-wrap">
        <div className="m2-checker">
          <div>
            <span className="m2-eyebrow m2-eyebrow--ochre">
              Найближчі виїзди
            </span>
            <h2 id="dates-title">Перевірте свою дату зараз</h2>
            <p>
              Оберіть зручний день — покажемо, скільки слотів лишилося. Дата
              підставиться у форму нижче, і ми передзвонимо протягом години.
            </p>
            <fieldset className="m2-chips" aria-label="Оберіть дату">
              {DATE_SLOTS.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  className="m2-chip"
                  aria-pressed={slot.iso === active.iso}
                  onClick={() => onPick(slot.iso)}
                >
                  <b>{slot.label}</b>
                  <i>{slot.hint}</i>
                </button>
              ))}
            </fieldset>
            <div className="m2-verdict" aria-live="polite">
              <b>{verdict.lead}</b>
              {verdict.rest}
              <br />
              <a className="m2-btn m2-btn--sm" href="#book">
                Забронювати цю дату
              </a>
            </div>
          </div>

          <div>
            <section className="m2-board" aria-label="Статус виїздів">
              <div className="m2-board__top">
                <span>ТАБЛО СЛОТІВ</span>
                <span>{seasonLabel(active.iso)}</span>
              </div>
              <dl>
                <div
                  className="m2-board__row m2-board__row--flash"
                  key={active.iso}
                >
                  <dt>Дата</dt>
                  <dd className="m2-hl">{shortDateLabel(active.iso)}</dd>
                </div>
                <div className="m2-board__row">
                  <dt>Вільних слотів</dt>
                  <dd>{DATE_BOARD.slots[active.status]}</dd>
                </div>
                <div className="m2-board__row">
                  <dt>Найраніший приїзд</dt>
                  <dd>{DATE_BOARD.arrival[active.status]}</dd>
                </div>
                <div className="m2-board__row">
                  <dt>Персонажі в роботі</dt>
                  <dd>{DATE_BOARD.characters}</dd>
                </div>
              </dl>
              <div className="m2-board__foot">{DATE_BOARD.foot}</div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
