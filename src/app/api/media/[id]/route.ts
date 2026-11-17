import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { buildDeliveryUrl } from "@/lib/cloudinaryMedia";
import clientPromise from "@/lib/mongodb";

/* Публічна видача зображення з колекції `media` (байти живуть у БД,
   бо файлова система Vercel read-only). Кеш: раз завантажив — фото
   не змінюється (id унікальний), тому public + immutable.

   Валідність id перевіряється (ObjectId), щоб не робити запити з
   довільними рядками. */

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const doc = await db.collection("media").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          data: 1,
          contentType: 1,
          storage: 1,
          publicId: 1,
          version: 1,
          format: 1,
        },
      },
    );

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Новий backend: віддаємо не байти через Function, а короткий redirect
    // на CDN Cloudinary. Рядок `/api/media/<id>` у контенті не змінюємо.
    if (
      doc.storage === "cloudinary" &&
      typeof doc.publicId === "string" &&
      typeof doc.format === "string"
    ) {
      const requested = Number(
        new URL(request.url).searchParams.get("w") ?? "",
      );
      const width =
        Number.isInteger(requested) && requested >= 40 && requested <= 2400
          ? requested
          : undefined;
      const target = buildDeliveryUrl(
        {
          publicId: doc.publicId,
          version: Number(doc.version ?? 1),
          format: doc.format,
        },
        width,
      );
      const response = NextResponse.redirect(target, 302);
      response.headers.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400",
      );
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    }

    if (!doc.data) {
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
