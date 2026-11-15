import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  // Колекція статистики поповнюється при кожній зміні сторінки:
  // ліміт не дає заповнити базу безкінечними записами.
  if (!rateLimit(`stats:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    const { path, referrer, screen } = await request.json();
    const userAgent = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for");

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    await db.collection("statistics").insertOne({
      path,
      userAgent,
      ip,
      referrer: referrer || null,
      screen: screen || null,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Statistics collection error:", error);
    return NextResponse.json(
      { error: "Failed to collect statistics" },
      { status: 500 },
    );
  }
}
