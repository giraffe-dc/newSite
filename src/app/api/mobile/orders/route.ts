import { type NextRequest, NextResponse } from "next/server";
import { verifyClient } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { ensureClientAuthIndexes, ordersPhoneFilter } from "@/lib/clientAuth";
import { getDb } from "@/lib/mongodb";
import { corsHeaders, preflightResponse } from "@/lib/mobileCors";

/**
 * Замовлення клієнта для кабінету: `GET /api/mobile/orders`.
 *
 * Auth: `Authorization: Bearer <JWT>` (основний шлях — React Native не
 * шле HttpOnly cookie) або cookie `client_token` (PWA/сайт).
 * Замовлення відбираються за нормалізованим телефоном із payload токена —
 * клієнт не може запросити чужі заявки, `phone` з query не приймається.
 *
 * Без авторизації — 401; понад 60 запитів за хвилину — 429.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_MINUTE = 60;
const LIMIT = 100;

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
}

function tokenFrom(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const cookie = req.headers.get("cookie");
  if (cookie) {
    for (const part of cookie.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === "client_token") {
        const value = rest.join("=").trim();
        if (value) return value;
      }
    }
  }
  return null;
}

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

export async function GET(req: NextRequest) {
  const client = tokenFrom(req);
  const payload = client ? verifyClient(client) : null;
  if (!payload) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  if (
    !rateLimit(`orders:phone:${payload.phone}`, MAX_PER_MINUTE, 60_000) ||
    !rateLimit(`orders:ip:${clientIp(req)}`, MAX_PER_MINUTE * 2, 60_000)
  ) {
    return json(req, { error: "Too many requests" }, 429);
  }

  try {
    await ensureClientAuthIndexes();
    const db = await getDb();
    const raw = await db
      .collection("orders")
      .find(ordersPhoneFilter(payload.phone))
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .toArray();

    const orders = raw.map((doc) => {
      const { _id, ...rest } = doc;
      return {
        ...rest,
        _id: String(_id),
        // Старі заявки без статусу трактуємо як «нова» на клієнті
        // (mobile нормалізує; тут віддаємо як є, але поле завжди є).
        status: typeof rest.status === "string" ? rest.status : "new",
      };
    });

    return json(req, { orders, count: orders.length }, 200);
  } catch (error) {
    console.error("mobile/orders: помилка", error);
    return json(req, { error: "Failed to load orders" }, 500);
  }
}
