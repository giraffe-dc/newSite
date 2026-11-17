import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/* Публічна видача зображення з колекції `media` (байти живуть у БД,
   бо файлова система Vercel read-only). Кеш: раз завантажив — фото
   не змінюється (id унікальний), тому public + immutable.

   Валідність id перевіряється (ObjectId), щоб не робити запити з
   довільними рядками. */

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const doc = await db
      .collection("media")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { data: 1, contentType: 1 } },
      );

    if (!doc?.data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType =
      typeof doc.contentType === "string" ? doc.contentType : "image/jpeg";
    // Binary → Buffer: value(true) повертає саме байти без padding.
    const raw = doc.data as { value?: (raw?: boolean) => Buffer };
    const buffer =
      typeof raw.value === "function" ? raw.value(true) : (doc.data as Buffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control":
          "public, max-age=31536000, immutable, s-maxage=31536000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Media serve error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
