import { NextRequest, NextResponse } from "next/server";
import { signClientToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import {
  consumeOtp,
  ensureClientAuthIndexes,
  failOtpAttempt,
  findActiveOtp,
  normalizePhone,
  otpCodeMatches,
  touchLogin,
} from "@/lib/clientAuth";
import { corsHeaders, preflightResponse } from "@/lib/mobileCors";

/**
 * Кабінет клієнта, крок 2: `POST /api/mobile/auth/verify`.
 *
 * Тіло: `{ phone, code? }`.
 * - `code` — 6 цифр із Telegram (номер уже прив'язаний);
 * - без `code` — лише після прив'язки через deep link `/start otp_*`
 *   (додаток опитує до успіху, поки клієнт підтверджує у бота).
 *
 * Успіх → JWT `role:"user"` на 30 днів: у відповіді (для `Authorization:
 * Bearer` у React Native) і в cookie `client_token` (для PWA).
 * Захист: 5 спроб на код, 10 запитів на номер / 30 на IP за 10 хвилин.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_PHONE = 10;
const MAX_PER_IP = 30;
const MAX_ATTEMPTS_PER_CODE = 5;
const TOKEN_MAX_AGE_S = 30 * 24 * 60 * 60;

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders(req), ...extraHeaders },
  });
}

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON" }, 400);
  }
  const input = (body ?? {}) as { phone?: unknown; code?: unknown };

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return json(req, { error: "Invalid phone" }, 400);
  }
  const code =
    typeof input.code === "string" ? input.code.replace(/\D/g, "") : null;
  if (code && !/^\d{6}$/.test(code)) {
    return json(req, { error: "Invalid code", hint: "Код із 6 цифр." }, 400);
  }

  if (
    !rateLimit(`verify:phone:${phone}`, MAX_PER_PHONE, WINDOW_MS) ||
    !rateLimit(`verify:ip:${ip}`, MAX_PER_IP, WINDOW_MS)
  ) {
    return json(req, { error: "Too many requests" }, 429);
  }

  try {
    await ensureClientAuthIndexes();
    const otp = await findActiveOtp(phone);
    if (!otp) {
      return json(
        req,
        { error: "Code expired", hint: "Запроси новий код." },
        401,
      );
    }

    if (otp.attempts >= MAX_ATTEMPTS_PER_CODE) {
      return json(
        req,
        { error: "Too many attempts", hint: "Запроси новий код." },
        429,
      );
    }

    if (code) {
      if (!otpCodeMatches(otp, code)) {
        const attempts = await failOtpAttempt(otp._id);
        const left = Math.max(0, MAX_ATTEMPTS_PER_CODE - attempts);
        return json(
          req,
          { error: "Wrong code", attemptsLeft: left },
          left === 0 ? 429 : 401,
        );
      }
    } else if (!otp.confirmedAt) {
      // Без коду підтверджуємось лише після deep link у Telegram.
      return json(
        req,
        { error: "Confirmation required", hint: "Підтверди вхід у Telegram." },
        401,
      );
    }

    await consumeOtp(otp._id);
    await touchLogin(phone);

    const token = signClientToken(phone);
    const secure = req.nextUrl.protocol === "https:";
    return json(
      req,
      { ok: true, token, phone, role: "user", expiresInSec: TOKEN_MAX_AGE_S },
      200,
      {
        "Set-Cookie": [
          `client_token=${token}`,
          "Path=/",
          "HttpOnly",
          `Max-Age=${TOKEN_MAX_AGE_S}`,
          // PWA живе на іншому домені → SameSite=None + Secure (https).
          `SameSite=${secure ? "None" : "Lax"}`,
          ...(secure ? ["Secure"] : []),
        ].join("; "),
      },
    );
  } catch (error) {
    console.error("mobile/auth/verify: помилка", error);
    return json(req, { error: "Verification failed" }, 500);
  }
}
