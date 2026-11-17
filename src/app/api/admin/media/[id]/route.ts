import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

type Params = { params: Promise<{ id: string }> };

/** Видалення завантаженого зображення (ADM-01). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const before = await db
      .collection("media")
      .findOne({ _id: new ObjectId(id) }, { projection: { filename: 1 } });

    const result = await db
      .collection("media")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await recordAudit({
      actor: typeof admin.username === "string" ? admin.username : "admin",
      action: "delete",
      entity: "media",
      entityId: id,
      summary: `Зображення «${before?.filename ?? id}» видалено`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
}
