import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { diffFields, recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

function adminOf(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return token ? verifyAdmin(token) : null;
}

function actorName(admin: { username?: unknown }) {
  return typeof admin.username === "string" ? admin.username : "admin";
}

export async function GET(request: NextRequest) {
  try {
    if (!adminOf(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const offers = await db
      .collection("offers")
      .find({})
      .sort({ priority: -1, startDate: -1, _id: -1 })
      .toArray();
    return NextResponse.json(offers);
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = adminOf(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const doc = {
      title: body.title,
      description: body.description,
      active: body.active ?? true,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      priority: Number(body.priority ?? 0),
      recommended: !!body.recommended,
      icon: body.icon || "🎁",
    };
    const result = await db.collection("offers").insertOne(doc);

    await recordAudit({
      actor: actorName(admin),
      action: "create",
      entity: "offer",
      entityId: String(result.insertedId),
      summary: `Спецпропозиція «${doc.title ?? ""}» створена`,
      changes: diffFields(null, doc as unknown as Record<string, unknown>),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = adminOf(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, ...rest } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const update: Record<string, unknown> = { ...rest };
    if (typeof update.priority !== "undefined") {
      update.priority = Number(update.priority);
    }

    const before = await db
      .collection("offers")
      .findOne({ _id: new ObjectId(id) }, { projection: { _id: 0 } });

    await db
      .collection("offers")
      .updateOne({ _id: new ObjectId(id) }, { $set: update });

    await recordAudit({
      actor: actorName(admin),
      action: "update",
      entity: "offer",
      entityId: String(id),
      summary: `Спецпропозиція «${update.title ?? before?.title ?? ""}» оновлена`,
      changes: diffFields(
        before as Record<string, unknown> | null,
        update,
      ),
    });

    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = adminOf(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const before = await db
      .collection("offers")
      .findOne({ _id: new ObjectId(id) }, { projection: { title: 1 } });

    await db.collection("offers").deleteOne({ _id: new ObjectId(id) });

    await recordAudit({
      actor: actorName(admin),
      action: "delete",
      entity: "offer",
      entityId: String(id),
      summary: `Спецпропозиція «${before?.title ?? id}» видалена`,
    });

    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 },
    );
  }
}
