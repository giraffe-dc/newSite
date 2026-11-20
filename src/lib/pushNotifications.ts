import { getDb } from "@/lib/mongodb";
import { normalizePhone, national9 } from "@/lib/clientAuth";

/**
 * Push-сповіщення клієнтам (Етап 3, п. 3) через Expo Push API.
 *
 * Токени реєструються ендпойнтом `/api/mobile/push-token` після OTP-входу
 * і зберігаються в `push_tokens`. Сповіщення надсилаються:
 * - при зміні статусу заявки в адмінці (`/api/admin/orders` PATCH);
 * - щоденним cron-ом (`/api/cron/push-reminders`): за день до свята
 *   і запит відгуку після свята.
 *
 * `EXPO_PUSH_TOKEN` (env) — опційний push-токен облікового запису Expo;
 * без нього API працює, але з жорсткішими лімітами. Невалідні токени
 * (DeviceNotRegistered) видаляються з БД автоматично.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH = 100;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
  sound?: "default" | null;
}

export interface PushTokenDoc {
  _id: string; // Expo push token
  phone: string;
  phone9: string;
  deviceId?: string;
  createdAt: string;
  lastSeenAt: string;
}

export function isValidPushToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(ExpoPushToken|ExponentPushToken)\[.+\]$/.test(value) &&
    value.length <= 250
  );
}

/** Реєстрація/оновлення токена після входу в кабінет. */
export async function savePushToken(input: {
  token: string;
  phone: string;
  deviceId?: string;
}): Promise<void> {
  const db = await getDb();
  const phone9 = national9(input.phone);
  await db.collection<PushTokenDoc>("push_tokens").updateOne(
    { _id: input.token },
    {
      $set: {
        phone: input.phone,
        phone9,
        deviceId: input.deviceId,
        lastSeenAt: new Date().toISOString(),
      },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true },
  );
}

export async function removePushToken(token: string, phone: string): Promise<void> {
  const db = await getDb();
  await db.collection("push_tokens").deleteOne({
    _id: token as never,
    phone,
  });
}

async function tokensForPhone(phone: string): Promise<string[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  const db = await getDb();
  const docs = await db
    .collection<PushTokenDoc>("push_tokens")
    .find({ phone9: national9(normalized) })
    .project<{ _id: string }>({ _id: 1 })
    .toArray();
  return docs.map((d) => String(d._id));
}

/** Надіслати одному номеру (усі його пристрої). Помилки — best-effort. */
export async function sendPushToPhone(
  phone: string,
  message: PushMessage,
): Promise<{ sent: number }> {
  const tokens = await tokensForPhone(phone);
  if (!tokens.length) return { sent: 0 };

  const expires = process.env.EXPO_PUSH_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expires) headers.Authorization = `Bearer ${expires}`;

  let sent = 0;
  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            sound: message.sound ?? "default",
            title: message.title,
            body: message.body,
            data: message.data ?? {},
          })),
        ),
      });
      if (!res.ok) {
        console.error("push: Expo API", res.status, await res.text());
        continue;
      }
      const payload = (await res.json()) as {
        data?: Array<{ status?: string; details?: { error?: string } }>;
      };
      const tickets = payload.data ?? [];
      sent += tickets.filter((t) => t.status === "ok").length;

      // Чистимо «мертві» токени, щоб не витрачати запити щодня.
      const dead = batch.filter(
        (_, idx) => tickets[idx]?.details?.error === "DeviceNotRegistered",
      );
      if (dead.length) {
        const db = await getDb();
        await db
          .collection("push_tokens")
          .deleteMany({ _id: { $in: dead as never[] } });
      }
    } catch (error) {
      console.error("push: запит до Expo не вдався", error);
    }
  }
  return { sent };
}

/** Мапінг статусу заявки на текст сповіщення клієнту. */
const STATUS_PUSH: Record<
  string,
  { title: string; body: string } | null
> = {
  new: null, // клієнт щойно створив її — дублювати не треба
  in_progress: {
    title: "Заявка в роботі",
    body: "Команда «Жирафик» почала готувати ваше свято.",
  },
  confirmed: {
    title: "Заявку підтверджено ✅",
    body: "Дата й програма узгоджені. До зустрічі!",
  },
  done: {
    title: "Свято завершилось 🎉",
    body: "Розкажіть, як пройшло — ваш відгук важливий.",
  },
  cancelled: {
    title: "Заявку скасовано",
    body: "Зв'яжіться з командою, щоб обговорити деталі.",
  },
};

/**
 * Викликається після зміни статусу в адмінці — best-effort:
 * помилка push НЕ повинна ламати відповідь адміна.
 */
export async function notifyOrderStatus(
  order: { phone?: unknown; customerName?: unknown; date?: unknown },
  status: string,
): Promise<void> {
  const template = STATUS_PUSH[status];
  if (!template || typeof order.phone !== "string") return;
  try {
    await sendPushToPhone(order.phone, {
      ...template,
      data: { type: "order-status", status, date: String(order.date ?? "") },
    });
  } catch (error) {
    console.error("push: notifyOrderStatus", error);
  }
}
