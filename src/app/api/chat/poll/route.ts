import { type NextRequest, NextResponse } from "next/server";
import {
  isValidThreadId,
  legacyThreadId,
  pollOperatorMessages,
} from "@/lib/chatThreads";

/* Доставка відповідей оператора клієнту.

   Раніше шукали по sessionId (який змінювався на F5) і не мали жодної
   авторизації. Тепер достатньо threadId — високоентропійного UUID із
   localStorage, який сам є capability. Старі клієнти з deviceId теж
   обслуговуються через legacy_<deviceId>.

   Відповідь містить стабільні id: віджет дедуплікує навіть якщо сервер
   повторить видачу (наприклад, після ретраю). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const rawThreadId = params.get("threadId");
  const rawDeviceId = params.get("deviceId") ?? "";

  const threadId = isValidThreadId(rawThreadId)
    ? rawThreadId
    : legacyThreadId(rawDeviceId);
  if (!isValidThreadId(threadId)) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const pending = await pollOperatorMessages(threadId);
    return NextResponse.json(
      {
        messages: pending.map((m) => ({
          id: m.id,
          role: "operator",
          content: m.content,
          adminName: m.author || "Команда Жирафик",
          channel: m.channel,
          createdAt: m.createdAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("chat/poll: не вдалося прочитати відповіді", error);
    return NextResponse.json({ messages: [] });
  }
}
