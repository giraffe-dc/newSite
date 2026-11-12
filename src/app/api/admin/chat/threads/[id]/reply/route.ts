import { type NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminRequest";
import { appendOperatorMessage, normalizeText } from "@/lib/chatThreads";

/* Відповідь адміністратора з /admin/chat.
   Пише в ту саму стрічку chat_threads, куди етап 3 писатиме Telegram-webhook,
   тож адмін може продовжити діалог з будь-якого каналу. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Context) {
  const admin = adminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as {
    text?: unknown;
  } | null;
  const text = normalizeText(body?.text, 2000);

  if (!text) {
    return NextResponse.json(
      { error: "Відповідь не може бути порожньою" },
      { status: 400 },
    );
  }

  try {
    const message = await appendOperatorMessage({
      threadId: id,
      text,
      channel: "admin",
      author: admin.username,
    });
    if (!message) {
      return NextResponse.json(
        { error: "Діалог не знайдено" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("admin/chat/threads/[id]/reply: помилка запису", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
}
