import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { recordServerEvent } from "@/lib/mobileAnalytics";
import { notifyOrderStatus } from "@/lib/pushNotifications";

/* Зміна статусу та видалення заявок — лише для адміна (етап 4, п. 3).
   Статуси (ADM-02): нова → в роботі → підтверджена → виконано / скасована.

   Підтвердження перевіряє зайнятість ресурсу: інша підтверджена заявка
   на ту саму дату з перетином часу блокується (409) — подвійне
   бронювання одного ресурсу неможливе. Кожна зміна статусу потрапляє
   в журнал аудиту (`audit_log`). */

const STATUSES = [
  "new",
  "in_progress",
  "confirmed",
  "done",
  "cancelled",
] as const;
type Status = (typeof STATUSES)[number];

/** Статуси, що «тримають» слот у календарі: підтверджена заявка
 *  гарантує ресурс; «в роботі» — ще не обіцянка слоту клієнту. */
const BUSY_STATUSES: Status[] = ["confirmed"];

/** Оцінка тривалості події у хвилинах: у заявці немає поля тривалості,
 *  тому слот рахуємо від часу початку з консервативним запасом.
 *  Порівняння — лише для заявок з відомим часом початку. */
const DEFAULT_EVENT_MIN = 180;

function isAuthorized(request: NextRequest): { actor: string } | null {
  const token = request.cookies.get("admin_token")?.value;
  const payload = token ? verifyAdmin(token) : null;
  if (!payload) return null;
  return { actor: String(payload.username ?? "admin") };
}

/** Хвилини від півночі для "HH:MM"; null для порожнього/невалідного. */
function minutesOfDay(time?: string): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

interface Slot {
  date: string;
  start: number | null; // хвилини від півночі, null = весь день зайнятий
}

function slotOf(order: { date?: string; time?: string }): Slot | null {
  if (!order.date) return null;
  return { date: order.date, start: minutesOfDay(order.time) };
}

/** Перетин двох слотів: невідомий час = увесь день. */
function overlaps(a: Slot, b: Slot): boolean {
  if (a.date !== b.date) return false;
  if (a.start === null || b.start === null) return true;
  const aEnd = a.start + DEFAULT_EVENT_MIN;
  const bEnd = b.start + DEFAULT_EVENT_MIN;
  return a.start < bEnd && b.start < aEnd;
}

export async function PATCH(request: NextRequest) {
  const auth = isAuthorized(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    status?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }
  if (!STATUSES.includes(status as Status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const next = status as Status;

  const db = await getDb();
  const orders = db.collection("orders");
  const current = await orders.findOne({ _id: new ObjectId(id) });
  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const previous = (current.status as Status | undefined) ?? "new";
  const nextSlot = slotOf(current as { date?: string; time?: string });

  /* Зайнятість ресурсу: підтвердження (або повторне входження в «тримаючі»
     статуси) не може накластися на іншу активну заявку того самого дня. */
  if (nextSlot && BUSY_STATUSES.includes(next)) {
    const active = await orders
      .find({
        _id: { $ne: new ObjectId(id) },
        status: { $in: BUSY_STATUSES },
        date: nextSlot.date,
      })
      .project<{ _id: ObjectId; date?: string; time?: string; customerName?: string }>(
        {
          date: 1,
          time: 1,
          customerName: 1,
        },
      )
      .toArray();

    const clash = active.find((other) => {
      const otherSlot = slotOf(other);
      return otherSlot !== null && overlaps(nextSlot, otherSlot);
    });
    if (clash) {
      return NextResponse.json(
        {
          error: `Цей день уже зайнятий: заявка «${clash.customerName ?? "без імені"}»${clash.time ? ` о ${clash.time}` : ""} має підтверджений статус. Скасуйте або перенесіть її, щоб підтвердити цю.`,
          conflict: true,
        },
        { status: 409 },
      );
    }
  }

  await orders.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: next,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  if (previous !== next) {
    await recordAudit({
      actor: auth.actor,
      action: "update",
      entity: "order",
      entityId: id,
      summary: `Заявка «${String(current.customerName ?? id)}»: статус ${previous} → ${next}`,
      changes: { status: { from: previous, to: next } },
    });

    // Push клієнту — best-effort: помилка Expo не ламає адмінку.
    void notifyOrderStatus(
      {
        phone: current.phone,
        customerName: current.customerName,
        date: current.date,
      },
      next,
    );

    // Воронка Етапу 4: фак підтвердження (без телефону й імені).
    if (next === "confirmed") {
      void recordServerEvent("order_confirmed", { orderId: id }).catch((error) => {
        console.error("admin/orders: analytics event", error);
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = isAuthorized(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const db = await getDb();
  const orders = db.collection("orders");
  const current = await orders.findOne({ _id: new ObjectId(id) });
  const result = await orders.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await recordAudit({
    actor: auth.actor,
    action: "delete",
    entity: "order",
    entityId: id,
    summary: `Видалено заявку «${String(current?.customerName ?? id)}»`,
  });

  return NextResponse.json({ success: true });
}
