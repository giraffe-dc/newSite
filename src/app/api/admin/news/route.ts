import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { diffFields, recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

/** Токен + роль admin → payload, інакше null (перевірка в кожному методі). */
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
    const news = await db
      .collection("news")
      .find({})
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(news);
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
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

    const newsData = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const result = await db.collection("news").insertOne({
      ...newsData,
      status: newsData.status || "published",
      date: new Date(newsData.date).toISOString(),
    });

    await recordAudit({
      actor: actorName(admin),
      action: "create",
      entity: "news",
      entityId: String(result.insertedId),
      summary: `Новина «${newsData.title ?? ""}» створена (${newsData.status || "published"})`,
      changes: diffFields(null, newsData as Record<string, unknown>),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("News creation error:", error);
    return NextResponse.json(
      { error: "Failed to create news" },
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

    const { id, ...newsData } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Явно видаляємо _id, щоб уникнути помилки
    delete (newsData as { _id?: unknown })._id;

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const before = await db
      .collection("news")
      .findOne({ _id: new ObjectId(id) }, { projection: { _id: 0 } });

    const result = await db
      .collection("news")
      .updateOne({ _id: new ObjectId(id) }, { $set: newsData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "News item not found" },
        { status: 404 },
      );
    }

    await recordAudit({
      actor: actorName(admin),
      action: "update",
      entity: "news",
      entityId: String(id),
      summary: `Новина «${newsData.title ?? before?.title ?? ""}» оновлена`,
      changes: diffFields(
        before as Record<string, unknown> | null,
        newsData as Record<string, unknown>,
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News update error:", error);
    return NextResponse.json(
      { error: "Failed to update news" },
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
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const before = await db
      .collection("news")
      .findOne({ _id: new ObjectId(id) }, { projection: { title: 1 } });

    const result = await db
      .collection("news")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "News item not found" },
        { status: 404 },
      );
    }

    await recordAudit({
      actor: actorName(admin),
      action: "delete",
      entity: "news",
      entityId: String(id),
      summary: `Новина «${before?.title ?? id}» видалена`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 },
    );
  }
}
