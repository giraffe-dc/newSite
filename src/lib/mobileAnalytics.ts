import { getDb } from "@/lib/mongodb";

/**
 * Власна аналітика воронки мобільного додатка (Етап 4, Фаза A).
 *
 * Події надсилає додаток через `POST /api/mobile/events` — лише після
 * явної згоди на аналітику (екран приватності). У БД потрапляє мінімум:
 * назва події, час, випадковий `deviceId`, платформа/версія й невеликий
 * набір технічних `props`. Телефон, ім'я, адреса й текст заявки заборонені.
 */

export const MOBILE_EVENTS = [
  "catalog_view",
  "service_view",
  "calc_start",
  "calc_finish",
  "assistant_start",
  "assistant_finish",
  "booking_open",
  "booking_submit",
  "order_confirmed",
] as const;

export type MobileEventName = (typeof MOBILE_EVENTS)[number];

export interface MobileEvent {
  event: MobileEventName;
  ts: string;
  deviceId: string;
  platform?: "ios" | "android" | "web";
  appVersion?: string;
  props?: Record<string, string | number>;
}

/** Поля, які заборонено зберігати навіть у props (захист від PII). */
const FORBIDDEN_PROP_KEYS = [
  "phone",
  "tel",
  "name",
  "email",
  "address",
  "customer",
  "notes",
  "text",
  "message",
];

const EMAIL_RE = /@/;
const PHONE_RE = /(?:\+?38)?0?\d{9,}/;

/** Валідація й санітизація однієї події. `null` — відхилити повністю. */
export function sanitizeEvent(raw: unknown): MobileEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  if (
    typeof input.event !== "string" ||
    !MOBILE_EVENTS.includes(input.event as MobileEventName)
  ) {
    return null;
  }
  if (typeof input.deviceId !== "string") return null;
  const deviceId = input.deviceId.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId)) return null;

  const ts =
    typeof input.ts === "string" && !Number.isNaN(Date.parse(input.ts))
      ? new Date(input.ts).toISOString()
      : new Date().toISOString();

  const platform =
    input.platform === "ios" ||
    input.platform === "android" ||
    input.platform === "web"
      ? input.platform
      : undefined;
  const appVersion =
    typeof input.appVersion === "string"
      ? input.appVersion.slice(0, 20)
      : undefined;

  const props: Record<string, string | number> = {};
  if (input.props && typeof input.props === "object" && !Array.isArray(input.props)) {
    for (const [key, value] of Object.entries(input.props).slice(0, 8)) {
      const safeKey = key.replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
      if (!safeKey || FORBIDDEN_PROP_KEYS.includes(safeKey.toLowerCase())) continue;
      const safeValue =
        typeof value === "number" && Number.isFinite(value)
          ? value
          : typeof value === "string" && value.length <= 100
            ? value
            : null;
      if (safeValue === null) continue;
      if (
        typeof safeValue === "string" &&
        (EMAIL_RE.test(safeValue) || PHONE_RE.test(safeValue))
      ) {
        continue;
      }
      props[safeKey] = safeValue;
    }
  }

  return {
    event: input.event as MobileEventName,
    ts,
    deviceId,
    ...(platform ? { platform } : {}),
    ...(appVersion ? { appVersion } : {}),
    ...(Object.keys(props).length ? { props } : {}),
  };
}

let indexesReady = false;

async function ensureIndexes(): Promise<void> {
  if (indexesReady) return;
  const db = await getDb();
  await Promise.all([
    db.collection("mobile_events").createIndex({ ts: 1 }),
    db.collection("mobile_events").createIndex({ event: 1, ts: -1 }),
  ]);
  indexesReady = true;
}

export async function saveMobileEvents(events: MobileEvent[]): Promise<number> {
  if (!events.length) return 0;
  await ensureIndexes();
  const db = await getDb();
  const result = await db.collection("mobile_events").insertMany(events);
  return result.insertedCount;
}

/** Подія з сервера (наприклад, `order_confirmed` при зміні статусу). */
export async function recordServerEvent(
  event: MobileEventName,
  props: Record<string, string | number> = {},
): Promise<void> {
  await saveMobileEvents([
    {
      event,
      ts: new Date().toISOString(),
      deviceId: "server_event",
      platform: "web",
      ...(Object.keys(props).length ? { props } : {}),
    },
  ]);
}

export interface FunnelStep {
  from: MobileEventName;
  to: MobileEventName;
  fromCount: number;
  toCount: number;
  conversion: number; // 0..100
}

/** Лічильники подій за період і конверсія між сусідніми етапами воронки. */
export async function getFunnel(days = 7): Promise<{
  days: number;
  from: string;
  counts: Record<string, number>;
  steps: FunnelStep[];
  total: number;
}> {
  await ensureIndexes();
  const db = await getDb();
  const since = new Date(Date.now() - Math.min(90, Math.max(1, days)) * 86_400_000);
  // `ts` зберігається як ISO-рядок — порівнюємо рядком, не Date,
  // інакше Mixed-тип у MongoDB не дасть збігів.
  const rows = await db
    .collection("mobile_events")
    .aggregate<{ _id: string; count: number }>([
      { $match: { ts: { $gte: since.toISOString() } } },
      { $group: { _id: "$event", count: { $sum: 1 } } },
    ])
    .toArray();

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row._id] = row.count;

  const chain: MobileEventName[] = [
    "catalog_view",
    "service_view",
    "calc_start",
    "calc_finish",
    "booking_open",
    "booking_submit",
    "order_confirmed",
  ];
  const steps: FunnelStep[] = [];
  for (let i = 0; i < chain.length - 1; i += 1) {
    const fromCount = counts[chain[i]] ?? 0;
    const toCount = counts[chain[i + 1]] ?? 0;
    steps.push({
      from: chain[i],
      to: chain[i + 1],
      fromCount,
      toCount,
      conversion: fromCount > 0 ? Math.round((toCount / fromCount) * 1000) / 10 : 0,
    });
  }

  return {
    days,
    from: since.toISOString(),
    counts,
    steps,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
  };
}
