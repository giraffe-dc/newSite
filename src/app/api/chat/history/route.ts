import { type NextRequest, NextResponse } from "next/server";
import {
  getClientHistory,
  isValidThreadId,
  legacyThreadId,
} from "@/lib/chatThreads";

/* Відновлення діалогу після перезавантаження сторінки.
   Раніше історія жила лише в useState і губилася на F5. */

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
    const history = await getClientHistory(threadId);
    if (!history) {
      return NextResponse.json({ messages: [] });
    }
    return NextResponse.json(
      {
        threadId,
        status: history.status,
        clientName: history.clientName,
        clientPhone: history.clientPhone,
        messages: history.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          author: m.author,
          channel: m.channel,
          createdAt: m.createdAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("chat/history: не вдалося прочитати історію", error);
    return NextResponse.json({ messages: [] });
  }
}
