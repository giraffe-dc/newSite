/* Display-only форматування ціни й тривалості послуг (VAR-01).

   НЕ змінюємо дані: `variants[].price` лишається числом для калькулятора
   (Calculator.tsx) і `items[].price` у бронюванні — там рядок парсять через
   вилучення цифр (BookingForm.tsx), тож «від 1500» або «1500–2500»
   у самих даних зламали б підсумок. Усі підписи генеруються тут, на відображенні.

   Функції приймають `readonly unknown[]`, бо дані приходять і з типізованих
   секцій, і з адмінського стану (Obj із довільними полями). */

const moneyFormatter = new Intl.NumberFormat("uk-UA");

type VariantLike = {
  id?: unknown;
  label?: unknown;
  pricingUnit?: unknown;
  durationMin?: unknown;
  price?: unknown;
};

function asVariant(value: unknown): VariantLike {
  return value !== null && typeof value === "object"
    ? (value as VariantLike)
    : {};
}

function positiveNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} грн`;
}

/** `30 хв`, `1 год`, `1 год 30 хв` — замість старого «1.5 год». */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} год ${rest} хв` : `${hours} год`;
}

/** Варіант рахується за штуки, якщо явно позначений `pricingUnit: "item"`.
 *  Для старих записів без поля — евристика: немає тривалості, а в підписі
 *  є «шт/штук». Так існуючі дані (напр. «1 шт») теж трактуються правильно
 *  без міграції БД. */
export function isItemVariant(value: unknown): boolean {
  const variant = asVariant(value);
  if (variant.pricingUnit === "item") return true;
  if (variant.pricingUnit === "time") return false;
  const minutes = positiveNumber(variant.durationMin);
  const label = typeof variant.label === "string" ? variant.label : "";
  return minutes === null && /шт|штук/i.test(label);
}

/** Коротка назва одиниці для ціни: «шт», якщо всі варіанти за штуки. */
function itemUnit(variants: readonly unknown[]): string {
  const withPrice = variants.filter(
    (v) => positiveNumber(asVariant(v).price) !== null,
  );
  if (withPrice.length === 0 || !withPrice.every(isItemVariant)) return "";
  return "шт";
}

function prices(variants: readonly unknown[]): number[] {
  return variants
    .map((v) => positiveNumber(asVariant(v).price))
    .filter((n): n is number => n !== null);
}

function durations(variants: readonly unknown[]): number[] {
  return variants
    .map((v) => positiveNumber(asVariant(v).durationMin))
    .filter((n): n is number => n !== null);
}

/** Головний рядок ціни: точна сума, або «від <min>» якщо цін кілька.
 *  Для застарілих записів без variants повертаємо рядок із БД як є. */
export function priceHeadline(
  variants: readonly unknown[],
  legacy = "",
): string {
  const values = prices(variants);
  if (values.length === 0) return legacy;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const base = min === max ? formatMoney(min) : `від ${formatMoney(min)}`;
  const unit = itemUnit(variants);
  return unit ? `${base} / ${unit}` : base;
}

/** Підпис тривалості: `1 год`, `1–2 год`, `30 хв – 1 год 30 хв`. */
export function durationHeadline(
  variants: readonly unknown[],
  legacy = "",
): string {
  // Для послуг за штуки одиниця вже є в ціні («350 грн / шт») —
  // окремий підпис тривалості не потрібен.
  if (itemUnit(variants)) return "";
  const values = durations(variants);
  if (values.length === 0) return legacy;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return formatDuration(min);
  if (max < 60) return `${min}–${max} хв`;
  if (min % 60 === 0 && max % 60 === 0) {
    return `${min / 60}–${max / 60} год`;
  }
  return `${formatDuration(min)} – ${formatDuration(max)}`;
}

/** Українська множина для лічильника варіантів в адмінці. */
export function variantCountLabel(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return `${count} варіант`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `${count} варіанти`;
  }
  return `${count} варіантів`;
}

/** Точні пари «тривалість — ціна» для дрібних чіпів під ціною. */
export function variantPairs(
  variants: readonly unknown[],
): { key: string; label: string; price: string }[] {
  return variants.flatMap((value, index) => {
    const variant = asVariant(value);
    const price = positiveNumber(variant.price);
    if (price === null) return [];

    const minutes = positiveNumber(variant.durationMin);
    const custom = typeof variant.label === "string" ? variant.label.trim() : "";
    const fallback = isItemVariant(variant)
      ? "1 шт"
      : minutes === null
        ? ""
        : formatDuration(minutes);
    const label = custom || fallback;

    return [
      {
        key:
          typeof variant.id === "string" && variant.id
            ? variant.id
            : `variant-${index}`,
        label,
        price: formatMoney(price),
      },
    ];
  });
}
