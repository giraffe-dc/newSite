import type { UpdateFilter } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import {
  appendOperatorMessage,
  getOrCreateLegacyThread,
  normalizeText,
} from "@/lib/chatThreads";
import clientPromise from "@/lib/mongodb";

/* Легасі-ендпоінт для зовнішніх інтеграцій (API-ключ у тілі, sessionId).
   Не видаляємо його, а перетворюємо на міст у нову модель chat_threads:
   - відповідь як і раніше потрапляє в chat_logs (зовнішній аудит);
   - і дублюється в chat_threads, звідки її бачать /admin/chat і віджет клієнта.

   Основний шлях тепер — POST /api/admin/chat/threads/[id]/reply під JWT-кукою. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.NOTIFICATIONS_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      key?: unknown;
      sessionId?: unknown;
      message?: unknown;
      adminName?: unknown;
    } | null;

    if (!body?.key || !API_KEY || body.key !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : "";
    const message = normalizeText(body.message, 2000);
    const adminName = normalizeText(body.adminName, 60) || "Адміністратор";

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "sessionId and message are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const logs = client.db("zhyrafyk").collection("chat_logs");
    const exists = await logs.findOne(
      { sessionId },
      { projection: { _id: 1 } },
    );
    if (!exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const operatorMsg = {
      role: "operator",
      content: message,
      adminName,
      timestamp: new Date(),
      delivered: false,
    };
    await logs.updateOne({ sessionId }, {
      $push: { messages: operatorMsg },
      $set: { updatedAt: new Date() },
    } as unknown as UpdateFilter<Record<string, unknown>>);

    // Міст у нову модель. Помилка тут не повинна ламати легасі-клієнта.
    try {
      const threadId = await getOrCreateLegacyThread(sessionId);
      if (threadId) {
        await appendOperatorMessage({
          threadId,
          text: message,
          channel: "admin",
          author: adminName,
        });
      }
    } catch (bridgeError) {
      console.error(
        "chat-logs/reply: не вдалося записати в chat_threads",
        bridgeError,
      );
    }

    return NextResponse.json({ success: true, message: "Reply sent" });
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 },
    );
  }
}
