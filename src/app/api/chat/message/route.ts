import { type NextRequest, NextResponse } from "next/server";
import { checkChatRateLimit, clientIp } from "@/lib/chatRateLimit";
import {
  appendClientMessage,
  isValidThreadId,
  legacyThreadId,
  normalizeText,
} from "@/lib/chatThreads";

/* Публічний запис повідомлення в режимі «Зв'язок із командою».

   Етап 1: замість sessionId із useRef використовуємо довговічний threadId
   (crypto.randomUUID() у localStorage), тож F5 не обриває діалог.
   Старі клієнти, що шлють {sessionId, deviceId, message}, теж працюють:
   для них ключем стає стабільний legacy_<deviceId>.

   Етап 3: тут же буде вихідне Telegram-сповіщення з карткою діалогу. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  threadId?: unknown;
  text?: unknown;
  message?: unknown;
  deviceId?: unknown;
  sessionId?: unknown;
  deviceInfo?: unknown;
  clientName?: unknown;
  clientPhone?: unknown;
  website?: unknown;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json(
      { error: "Некоректне тіло запиту" },
      { status: 400 },
    );
  }

  // Honeypot: людина його не бачить, бот заповнює. Вдаємо успіх без запису.
  if (normalizeText(body.website, 200)) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const ip = clientIp(req);
  if (!checkChatRateLimit(`msg:${ip}`)) {
    return NextResponse.json(
      { error: "Занадто багато повідомлень. Зачекайте хвилину." },
      { status: 429 },
    );
  }

  const rawDeviceId =
    typeof body.deviceId === "string" ? body.deviceId.slice(0, 80) : "";
  const rawThreadId = body.threadId;
  const threadId = isValidThreadId(rawThreadId)
    ? rawThreadId
    : legacyThreadId(rawDeviceId);
  if (!isValidThreadId(threadId)) {
    return NextResponse.json(
      { error: "Некоректний ідентифікатор діалогу" },
      { status: 400 },
    );
  }
  const deviceId = rawDeviceId || threadId;

  const text = normalizeText(body.text ?? body.message, 2000);
  if (!text) {
    return NextResponse.json(
      { error: "Повідомлення не може бути порожнім" },
      { status: 400 },
    );
  }

  const clientName = normalizeText(body.clientName, 60);
  const clientPhone = normalizeText(body.clientPhone, 30);
  const deviceInfo =
    body.deviceInfo && typeof body.deviceInfo === "object"
      ? (body.deviceInfo as Record<string, unknown>)
      : undefined;

  try {
    const { message, isNew } = await appendClientMessage({
      threadId,
      deviceId,
      text,
      ip,
      deviceInfo,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
    });

    return NextResponse.json(
      { success: true, threadId, messageId: message.id, isNew },
      { status: 201 },
    );
  } catch (error) {
    console.error("chat/message: не вдалося зберегти повідомлення", error);
    return NextResponse.json(
      { error: "Не вдалося відправити повідомлення. Спробуйте пізніше." },
      { status: 503 },
    );
  }
}
