import { type NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminRequest";
import {
  getThread,
  markThreadRead,
  setThreadStatus,
  type ThreadStatus,
} from "@/lib/chatThreads";

/* Один діалог: читання (з позначкою «прочитано») і м'яка зміна статусу.
   Жодного DELETE — видалення з бази не робимо, як і для відгуків. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ThreadStatus[] = ["open", "closed", "archived"];

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Context) {
  if (!adminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  try {
    const thread = await getThread(id);
    if (!thread) {
      return NextResponse.json(
        { error: "Діалог не знайдено" },
        { status: 404 },
      );
    }
    await markThreadRead(id);

    return NextResponse.json(
      {
        _id: String(thread._id),
        threadId: thread.threadId,
        deviceId: thread.deviceId,
        clientName: thread.clientName,
        clientPhone: thread.clientPhone,
        status: thread.status,
        unreadForAdmin: 0,
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
        messages: thread.messages ?? [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "admin/chat/threads/[id]: не вдалося прочитати діалог",
      error,
    );
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  if (!adminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as {
    status?: unknown;
  } | null;

  if (!body || !STATUSES.includes(body.status as ThreadStatus)) {
    return NextResponse.json(
      { error: "Очікується status: open, closed або archived" },
      { status: 400 },
    );
  }

  try {
    const updated = await setThreadStatus(id, body.status as ThreadStatus);
    if (!updated) {
      return NextResponse.json(
        { error: "Діалог не знайдено" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) {
    console.error("admin/chat/threads/[id]: не вдалося змінити статус", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
}
