import { type NextRequest, NextResponse } from "next/server";
import { listAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";

/** Останні записи журналу змін (ADM-01), лише role=admin. */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyAdmin(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 100;
    const entries = await listAudit(
      Number.isFinite(limit) ? limit : 100,
    );

    // ObjectId → рядок для зручності клієнта.
    const serialized = entries.map((entry) => ({
      ...entry,
      _id: (entry as { _id?: unknown })._id,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Audit fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 },
    );
  }
}
