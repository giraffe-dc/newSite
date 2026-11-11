"use client";

import { useEffect, useState } from "react";
import { BOARD } from "./content";

/** Табло маршруту: єдиний рух на сторінці — переворот рядка з адресою.
 *  Поважає prefers-reduced-motion: тоді адреса лишається статичною. */
export default function Board() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % BOARD.destinations.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="m2-board" aria-label="Табло найближчих виїздів">
      <div className="m2-board__top">
        <span>{BOARD.topLeft}</span>
        <span>{BOARD.topRight}</span>
      </div>
      <dl>
        {BOARD.rows.map((row, i) => {
          const rotating = i === 1;
          return (
            <div className="m2-board__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd className={row.highlight ? "m2-hl" : undefined}>
                {rotating ? (
                  <span className="m2-flip" key={index}>
                    {BOARD.destinations[index]}
                  </span>
                ) : (
                  <span
                    className="m2-flip"
                    style={{ animationDelay: `${0.1 + i * 0.15}s` }}
                  >
                    {row.value}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="m2-board__foot">{BOARD.foot}</div>
    </section>
  );
}
