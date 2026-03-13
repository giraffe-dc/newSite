import { NextRequest, NextResponse } from "next/server";
import { StatsService } from "@/lib/services/StatsService";

export async function GET(request: NextRequest) {
  try {
    // Middleware already handles authentication
    const stats = await StatsService.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
