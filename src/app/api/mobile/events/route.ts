import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { corsHeaders, preflightResponse } from "@/lib/mobileCors";
import { sanitizeEvent, saveMobileEvents } from "@/lib/mobileAnalytics";

/**
 * Прийом подій воронки з додатка (Етап 4, Фаза A).
 *
 * Публічний (дані знеособлені), з CORS для PWA й лімітом 60 подій/хв на IP.
 * Додаток надсилає батч не частіше ніж раз на 30 с і ТІЛЬКИ за згодою
 * на аналітику (прапорець у налаштуваннях приватності).
 * Максимум 20 подій за запит; некоректні події відхиляються, але не ламають
 * увесь батч (частинний успіх — корисна відповідь `saved`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_LIMIT = 20;

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

export async function POST(req: NextRequest) {
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: corsHeaders(req) });

  if (!rateLimit(`analytics:${clientIp(req)}`, 60, 60_000)) {
    return reply({ error: "Too many requests" }, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid JSON" }, 400);
  }

  const raw = (body as { events?: unknown } | null)?.events;
  if (!Array.isArray(raw) || raw.length === 0) {
    return reply({ error: "Invalid events" }, 400);
  }
  if (raw.length > BATCH_LIMIT) {
    return reply({ error: "Batch too large" }, 413);
  }

  try {
    const events = raw
      .map((item) => sanitizeEvent(item))
      .filter((item): item is NonNullable<typeof item> => item !== null);
    if (!events.length) return reply({ error: "No valid events" }, 400);
    const saved = await saveMobileEvents(events);
    return reply({ ok: true, saved, rejected: raw.length - events.length }, 201);
  } catch (error) {
    console.error("mobile/events: помилка збереження", error);
    return reply({ error: "Failed to save events" }, 500);
  }
}
