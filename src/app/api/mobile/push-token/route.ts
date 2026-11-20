import { type NextRequest, NextResponse } from "next/server";
import { verifyClient } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { corsHeaders, preflightResponse } from "@/lib/mobileCors";
import {
  isValidPushToken,
  removePushToken,
  savePushToken,
} from "@/lib/pushNotifications";

/**
 * Реєстрація Expo push-токена після OTP-входу (Етап 3, п. 3).
 * Потрібен Bearer `role:"user"` — інакше будь-хто міг би зареєструвати
 * чужий токен і заспамити клієнта. Ліміт: 20 реєстрацій на IP за годину.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(req: NextRequest, body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
}

function clientOf(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  const payload = token ? verifyClient(token) : null;
  return payload?.phone ?? null;
}

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

export async function POST(req: NextRequest) {
  const phone = clientOf(req);
  if (!phone) return json(req, { error: "Unauthorized" }, 401);

  if (!rateLimit(`push:ip:${clientIp(req)}`, 20, 60 * 60_000)) {
    return json(req, { error: "Too many requests" }, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON" }, 400);
  }
  const input = (body ?? {}) as { token?: unknown; deviceId?: unknown };
  if (!isValidPushToken(input.token)) {
    return json(req, { error: "Invalid push token" }, 400);
  }

  try {
    await savePushToken({
      token: input.token,
      phone,
      deviceId:
        typeof input.deviceId === "string" ? input.deviceId.slice(0, 80) : undefined,
    });
    return json(req, { success: true }, 201);
  } catch (error) {
    console.error("mobile/push-token: помилка", error);
    return json(req, { error: "Failed to save token" }, 500);
  }
}

/** Видалення токена при виході з кабінету (щоб не слати на старий пристрій). */
export async function DELETE(req: NextRequest) {
  const phone = clientOf(req);
  if (!phone) return json(req, { error: "Unauthorized" }, 401);
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!isValidPushToken(token)) {
    return json(req, { error: "Invalid push token" }, 400);
  }
  try {
    await removePushToken(token, phone);
    return json(req, { success: true }, 200);
  } catch (error) {
    console.error("mobile/push-token: видалення", error);
    return json(req, { error: "Failed to remove token" }, 500);
  }
}
