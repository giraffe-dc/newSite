import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * Публічні зайняті дати для календаря додатка (Етап 3, п. 2).
 *
 * ⚠️ Рішення власника: це **лише попередження**, не блокування.
 * Дата з іншим замовленням залишається доступною для вибору —
 * адміністратор зв'яжеться для уточнення деталей.
 *
 * Повертає ТІЛЬКИ дати (`YYYY-MM-DD`) підтверджених заявок (`confirmed`,
 * ті самі `BUSY_STATUSES`, що й у `/api/admin/orders`). Жодних імен,
 * телефонів, адрес чи status-інформації — публічний ендпоінт без auth.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** «Сьогодні» у Europe/Kyiv — рядок YYYY-MM-DD, як у заявках. */
function todayKyiv(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const db = await getDb();
    // status: confirmed + date >= today: рядки YYYY-MM-DD порівнюються
    // лексикографічно саме так, як треба (ISO-формат).
    const docs = await db
      .collection("orders")
      .find(
        { status: "confirmed", date: { $gte: todayKyiv() } },
        { projection: { date: 1, _id: 0 } },
      )
      .toArray();

    const dates = Array.from(
      new Set(
        docs
          .map((doc) => (typeof doc.date === "string" ? doc.date : ""))
          .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
      ),
    ).sort();

    return NextResponse.json(
      {
        dates,
        count: dates.length,
        note: "Зайняті дати — лише попередження. Заявка на цю дату надсилається звичайно.",
      },
      {
        headers: {
          ...CORS,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("mobile/busy-dates: помилка", error);
    return NextResponse.json(
      { error: "Failed to load busy dates", dates: [] },
      { status: 500, headers: CORS },
    );
  }
}
