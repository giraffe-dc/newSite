import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ensureSeeded, getSections } from "@/lib/siteContent";

/** Усі секції `site_content` для адмін-редактора (перший запуск — сідинґ дефолтів). */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSeeded();
    const sections = await getSections();
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Content API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}
