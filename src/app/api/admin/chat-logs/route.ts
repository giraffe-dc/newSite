import { NextResponse } from "next/server";
import { apiKeyFromRequest, isValidApiKey } from "@/lib/apiKey";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Ключ: `Authorization: Bearer` / `X-Api-Key` (бажано) або `?key=` (застаріле).
 *  Порівняння — constant-time, без заданого NOTIFICATIONS_API_KEY доступу немає. */
function isAuthorized(req: Request): boolean {
  return isValidApiKey(
    apiKeyFromRequest(req),
    process.env.NOTIFICATIONS_API_KEY,
  );
}

/**
 * GET /api/admin/chat-logs
 *
 * Auth: header `Authorization: Bearer <NOTIFICATIONS_API_KEY>` (бажано)
 *       або query `key=` (застаріле — ключ потрапляє в логи проксі).
 *
 * Query params:
 *   - limit     (optional) — number of sessions, default 50
 *   - deviceId  (optional) — filter by device
 *   - sessionId (optional) — get a specific session
 *   - from      (optional) — ISO date, filter logs created after
 *   - to        (optional) — ISO date, filter logs created before
 *
 * Example: GET /api/admin/chat-logs  +  Authorization: Bearer YOUR_KEY
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const deviceId = searchParams.get("deviceId");
  const sessionId = searchParams.get("sessionId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const filter: {
      deviceId?: string;
      sessionId?: string;
      createdAt?: { $gte?: Date; $lte?: Date };
      archivedAt?: { $exists: boolean };
    } = { archivedAt: { $exists: false } };
    if (deviceId) filter.deviceId = deviceId;
    if (sessionId) filter.sessionId = sessionId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await db
      .collection("chat_logs")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Chat logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat logs" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/chat-logs?sessionId=xxx  (+ Authorization: Bearer <key>)
 *
 * М'яке архівування однієї сесії AI-логу. З бази нічого не видаляємо:
 * масового deleteMany більше немає, sessionId обов'язковий.
 */
export async function DELETE(req: Request) {
  if (!isAuthorized(req)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db
      .collection("chat_logs")
      .updateOne({ sessionId }, { $set: { archivedAt: new Date() } });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ archived: sessionId });
  } catch (error) {
    console.error("Archive chat logs error:", error);
    return NextResponse.json(
      { error: "Failed to archive chat logs" },
      { status: 500 },
    );
  }
}
