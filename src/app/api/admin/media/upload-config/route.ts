import { type NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { createUploadTicket, mediaStorage } from "@/lib/cloudinaryMedia";

/** Параметри для прямого підписаного завантаження з браузера (CLO-05).
 *  У режимі `mongo` клієнт і далі користується POST /api/admin/media. */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mediaStorage() === "mongo") {
      return NextResponse.json({ storage: "mongo" });
    }

    // api_secret лишається на сервері — віддаємо лише підпис для одного файлу.
    return NextResponse.json(createUploadTicket(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Media upload config error:", error);
    return NextResponse.json(
      { error: "Не вдалося підготувати завантаження" },
      { status: 500 },
    );
  }
}
