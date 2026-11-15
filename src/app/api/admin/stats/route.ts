import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { StatsService } from "@/lib/services/StatsService";

const ALLOWED_PERIODS = ["24h", "7d", "30d"];

export async function GET(request: NextRequest) {
  try {
    // Перевіряємо JWT тут, а не лише в middleware (він не валідує підпис).
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const normalizedPeriod = ALLOWED_PERIODS.includes(period) ? period : "30d";

    const stats = await StatsService.getDashboardStats({ period: normalizedPeriod });
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
