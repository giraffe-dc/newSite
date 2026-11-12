import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

interface ChatMessage {
  role?: string;
  delivered?: boolean;
  content?: string;
  adminName?: string;
  timestamp?: Date | string;
}

/**
 * GET /api/chat/poll?sessionId=xxx&deviceId=xxx
 *
 * Returns undelivered operator messages for the given session.
 * Marks them as delivered after returning.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const deviceId = searchParams.get("deviceId");

  if (!sessionId || !deviceId) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    // Find the session
    const session = await db
      .collection("chat_logs")
      .findOne({ sessionId, deviceId });

    if (!session || !session.messages) {
      return NextResponse.json({ messages: [] });
    }

    // Find undelivered operator messages
    const undelivered = session.messages
      .filter((m: ChatMessage) => m.role === "operator" && !m.delivered)
      .map((m: ChatMessage) => ({
        role: "operator",
        content: m.content,
        adminName: m.adminName || "Адміністратор",
        timestamp: m.timestamp,
      }));

    if (undelivered.length > 0) {
      // Mark all operator messages as delivered
      await db.collection("chat_logs").updateOne(
        { sessionId },
        {
          $set: {
            "messages.$[elem].delivered": true,
          },
        },
        {
          arrayFilters: [{ "elem.role": "operator", "elem.delivered": false }],
        },
      );
    }

    return NextResponse.json({ messages: undelivered });
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json({ messages: [] });
  }
}
