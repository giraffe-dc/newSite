/* Формати дат для табло слотів і бейджа біля форми.
   Розбір ISO: "2026-11-14" → локальна північ, щоб не зсуватися на часові пояси. */

const MONTHS_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
] as const;

const MONTHS_NOMINATIVE = [
  "СІЧЕНЬ",
  "ЛЮТИЙ",
  "БЕРЕЗЕНЬ",
  "КВІТЕНЬ",
  "ТРАВЕНЬ",
  "ЧЕРВЕНЬ",
  "ЛИПЕНЬ",
  "СЕРПЕНЬ",
  "ВЕРЕСЕНЬ",
  "ЖОВТЕНЬ",
  "ЛИСТОПАД",
  "ГРУДЕНЬ",
] as const;

const WEEKDAYS_SHORT = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"] as const;

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** «сб, 14.11» — значення «Дата» у табло слотів. */
export function shortDateLabel(iso: string): string {
  const date = parse(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${day}.${month}`;
}

/** «14 листопада» — бейдж «Обрана дата» біля форми. */
export function longDateLabel(iso: string): string {
  const date = parse(iso);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

/** «ЛИСТОПАД 2026» — права частина шапки табло слотів. */
export function seasonLabel(iso: string): string {
  const date = parse(iso);
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}
