import { type NextRequest, NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/adminRequest";
import { getUnreadStats } from "@/lib/chatThreads";

/* Легкий ендпоінт для бейджа непрочитаних у AdminSidebar. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!adminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await getUnreadStats(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("admin/chat/stats: не вдалося порахувати непрочитані", error);
    return NextResponse.json({ threads: 0, messages: 0 });
  }
}
