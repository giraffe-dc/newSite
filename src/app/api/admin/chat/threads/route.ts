import { type NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminRequest";
import {
  getUnreadStats,
  listThreads,
  type ThreadStatus,
} from "@/lib/chatThreads";

/* Список діалогів для /admin/chat. Авторизація — кука admin_token. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ThreadStatus[] = ["open", "closed", "archived"];

export async function GET(req: NextRequest) {
  if (!adminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("status") ?? "all";
  const status = STATUSES.includes(raw as ThreadStatus)
    ? (raw as ThreadStatus)
    : "all";

  try {
    const [threads, unread] = await Promise.all([
      listThreads({ status }),
      getUnreadStats(),
    ]);
    return NextResponse.json(
      { threads, unread },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("admin/chat/threads: не вдалося прочитати список", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
}
