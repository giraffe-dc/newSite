"use client";

import { useEffect, useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import { BOARD } from "./content";

/** Табло маршруту: єдиний рух на сторінці — переворот рядка з адресою.
 *  Поважає prefers-reduced-motion: тоді адреса лишається статичною. */
export default function Board({
  board = BOARD,
}: {
  board?: SectionData<"board">["board"];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!board.destinations.length) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % board.destinations.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [board.destinations.length]);

  if (!board.rows.length && !board.destinations.length) return null;

  return (
    <section className="m2-board" aria-label="Табло найближчих виїздів">
      <div className="m2-board__top">
        <span>{board.topLeft}</span>
        <span>{board.topRight}</span>
      </div>
      <dl>
        {board.rows.map((row, i) => {
          const rotating = i === 1;
          const { label, value, highlight } = row as {
            label: string;
            value: string;
            highlight?: boolean;
          };
          return (
            <div className="m2-board__row" key={label}>
              <dt>{label}</dt>
              <dd className={highlight ? "m2-hl" : undefined}>
                {rotating && board.destinations.length ? (
                  <span className="m2-flip" key={index}>
                    {board.destinations[index]}
                  </span>
                ) : (
                  <span
                    className="m2-flip"
                    style={{ animationDelay: `${0.1 + i * 0.15}s` }}
                  >
                    {value}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="m2-board__foot">{board.foot}</div>
    </section>
  );
}
