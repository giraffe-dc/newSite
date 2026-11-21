import { type NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getFunnel } from "@/lib/mobileAnalytics";

/** Воронка мобільного додатка — лише для адміна сайту (Етап 4, Фаза A). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyAdmin(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawDays = Number(req.nextUrl.searchParams.get("days") ?? 7);
  const days = Number.isFinite(rawDays) ? rawDays : 7;
  try {
    const funnel = await getFunnel(days);
    return NextResponse.json(funnel, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("admin/analytics/funnel: помилка", error);
    return NextResponse.json({ error: "Failed to load funnel" }, { status: 500 });
  }
}
