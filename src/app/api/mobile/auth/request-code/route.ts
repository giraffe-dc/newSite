import { NextRequest, NextResponse } from "next/server";
import { sendChatBotMessage } from "@/lib/chatTelegram";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import {
  chatBotUsername,
  consumeOtp,
  createOtp,
  ensureClientAuthIndexes,
  getBinding,
  maskPhone,
  normalizePhone,
} from "@/lib/clientAuth";
import { corsHeaders, preflightResponse } from "@/lib/mobileCors";

/**
 * Кабінет клієнта, крок 1: `POST /api/mobile/auth/request-code`.
 *
 * Тіло: `{ phone }` → створює одноразовий код (10 хв) і вибирає канал:
 * - номер уже прив'язаний до Telegram — код у приватний чат бота чату;
 * - перший вхід — повертає deep link `t.me/<бот>?start=otp_<id>`, який
 *   додаток відкриває; webhook бота створює прив'язку (див. clientAuth).
 *
 * Код НІКОЛИ не повертається у відповіді — інакше перевірка безсенсовна.
 * Ліміти: 3 запити на номер і 10 на IP за 10 хвилин.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_WINDOW_MS = 10 * 60_000;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 10;

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
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

  const phone = normalizePhone((body as { phone?: unknown })?.phone);
  if (!phone) {
    return json(
      req,
      { error: "Invalid phone", hint: "Потрібен український номер: +380XXXXXXXXX" },
      400,
    );
  }

  if (
    !rateLimit(`otp:phone:${phone}`, MAX_PER_PHONE, OTP_WINDOW_MS) ||
    !rateLimit(`otp:ip:${ip}`, MAX_PER_IP, OTP_WINDOW_MS)
  ) {
    return json(
      req,
      { error: "Too many requests", hint: "Спробуй пізніше — не частіше 3 разів за 10 хвилин." },
      429,
    );
  }

  try {
    await ensureClientAuthIndexes();
    const { id, code } = await createOtp(phone);
    const binding = await getBinding(phone);

    if (binding) {
      const sent = await sendChatBotMessage(
        binding.chatId,
        [
          "🔐 Код для входу в кабінет «Жирафик»:",
          `*${code}*`,
          "",
          "Діє 10 хвилин. Якщо це не ти — не повідомляй код нікому.",
        ].join("\n"),
      );
      if (sent == null) {
        // Telegram не працює — код не дійде, гасимо його, щоб не завис.
        await consumeOtp(id);
        return json(
          req,
          { error: "Telegram unavailable", hint: "Не вдалося надіслати код у Telegram." },
          502,
        );
      }
      return json(
        req,
        {
          ok: true,
          delivery: "telegram",
          mask: maskPhone(phone),
          expiresInSec: 600,
        },
        200,
      );
    }

    const username = await chatBotUsername();
    if (!username) {
      await consumeOtp(id);
      return json(
        req,
        { error: "Telegram not configured", hint: "Немає бота для прив'язки." },
        503,
      );
    }
    return json(
      req,
      {
        ok: true,
        delivery: "link",
        mask: maskPhone(phone),
        link: `https://t.me/${username}?start=otp_${id}`,
        expiresInSec: 600,
      },
      200,
    );
  } catch (error) {
    console.error("mobile/auth/request-code: помилка", error);
    return json(req, { error: "Failed to create code" }, 500);
  }
}
