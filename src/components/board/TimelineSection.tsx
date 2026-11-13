import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { TIMELINE } from "./content";

/** Сценарій дня — унікальний блок головної: маршрут свята по хвилинах. */
export default function TimelineSection({
  timeline = TIMELINE,
}: {
  timeline?: SectionData<"timeline">["timeline"];
}) {
  if (!timeline.length) return null;

  return (
    <section className="m2-sec" id="rail" aria-labelledby="rail-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Сценарій дня</span>
          <h2 id="rail-title">Як саме проходить свято — по хвилинах</h2>
          <p>
            Ви бачите весь маршрут наперед: що коли відбувається і за що ви
            платите.
          </p>
        </div>
        <ol className="m2-rail">
          {timeline.map((step) => (
            <li
              key={step.title}
              className={
                step.on ? "m2-rail__item m2-rail__item--on" : "m2-rail__item"
              }
            >
              <div className="m2-rail__body">
                <span className="m2-rail__t">{step.time}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="m2-rail__more">
          <Link className="m2-back" href="/about">
            Детальніше про формат роботи →
          </Link>
        </p>
      </div>
    </section>
  );
}
