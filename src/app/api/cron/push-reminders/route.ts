import { apiKeyFromRequest, isValidApiKey } from "@/lib/apiKey";
import { getDb } from "@/lib/mongodb";
import { sendPushToPhone } from "@/lib/pushNotifications";

/**
 * Щоденні нагадування (Етап 3, п. 3), Vercel Cron: GET /api/cron/push-reminders.
 *
 * - за день до свята (confirmed, date = завтра): «завтра свято»;
 * - після свята (done, date = учора): запит відгуку.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` (стандарт Vercel Cron).
 * Якщо CRON_SECRET не задано — fallback на вже наявний MOBILE_RELEASE_KEY
 * (щоб не створювати зайвий env-ключ). Fail-closed: без ключа запит
 * відхиляється. Запускати щодня о 07:00 UTC (10:00 Київ).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function kyivDate(offsetDays: number): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function authorized(req: Request): boolean {
  const provided = apiKeyFromRequest(req);
  const cron = process.env.CRON_SECRET;
  if (cron && isValidApiKey(provided, cron)) return true;
  return isValidApiKey(provided, process.env.MOBILE_RELEASE_KEY);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const orders = db.collection("orders");
    const tomorrow = kyivDate(1);
    const yesterday = kyivDate(-1);

    const [upcoming, finished] = await Promise.all([
      orders
        .find(
          { status: "confirmed", date: tomorrow },
          { projection: { phone: 1, _id: 1, date: 1, serviceName: 1 } },
        )
        .toArray(),
      orders
        .find(
          { status: "done", date: yesterday },
          { projection: { phone: 1, _id: 1, date: 1 } },
        )
        .toArray(),
    ]);

    let sent = 0;
    for (const order of upcoming) {
      if (typeof order.phone !== "string") continue;
      const result = await sendPushToPhone(order.phone, {
        title: "Свято завтра 🦒",
        body: `Команда «Жирафик» приїде завтра${order.time ? ` о ${order.time}` : ""}. Чекаємо вас!`,
        data: { type: "reminder", orderId: String(order._id) },
      });
      sent += result.sent;
    }
    for (const order of finished) {
      if (typeof order.phone !== "string") continue;
      const result = await sendPushToPhone(order.phone, {
        title: "Як пройшло свято?",
        body: "Залиште відгук — це допомагає нам ставати кращими.",
        data: { type: "review-request", orderId: String(order._id) },
      });
      sent += result.sent;
    }

    return Response.json({
      ok: true,
      checked: { upcoming: upcoming.length, finished: finished.length },
      sent,
    });
  } catch (error) {
    console.error("cron/push-reminders: помилка", error);
    return Response.json({ error: "Reminder failed" }, { status: 500 });
  }
}
