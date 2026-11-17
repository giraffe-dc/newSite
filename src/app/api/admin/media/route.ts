import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import { mediaStorage } from "@/lib/cloudinaryMedia";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_MEDIA_BYTES,
  magicBytesMatch,
} from "@/lib/mediaValidation";
import clientPromise from "@/lib/mongodb";

/* Безпечне завантаження медіа (ADM-01 «safe media upload»).

   Обмеження:
   - лише role=admin (кука admin_token);
   - лише зображення: MIME-тип із дозволеного списку + перевірка
     сигнатур (magic bytes), щоб відкинути HTML/JS під виглядом картинки;
   - розмір ≤ 5 МБ (перевіряється до і після читання потоку);
   - зберігаємо в колекції `media` (байти в БД), віддаємо через
     GET /api/media/[id] з коректним Content-Type.

   Файлову систему не чіпаємо: на Vercel вона read-only. */

const MAX_BYTES = MAX_MEDIA_BYTES;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (mediaStorage() === "cloudinary") {
      return NextResponse.json(
        {
          error:
            "У режимі cloudinary використовуйте /api/admin/media/upload-config та /api/admin/media/confirm",
        },
        { status: 400 },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Очікується multipart/form-data" },
        { status: 400 },
      );
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передано" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Порожній файл" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файл завеликий (максимум 5 МБ)" },
        { status: 413 },
      );
    }

    const declaredType = (file.type || "").toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(declaredType)) {
      return NextResponse.json(
        {
          error:
            "Непідтримуваний тип файлу. Дозволено: JPEG, PNG, GIF, WebP, AVIF",
        },
        { status: 415 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файл завеликий (максимум 5 МБ)" },
        { status: 413 },
      );
    }
    // Сигнатура файлу має відповідати задекларованому MIME-типу.
    if (!magicBytesMatch(declaredType, bytes)) {
      return NextResponse.json(
        { error: "Вміст файлу не відповідає його типу" },
        { status: 415 },
      );
    }

    // Ім'я зберігаємо лише як метадані; воно ніде не використовується
    // для шляхів (розміщення — у БД).
    const safeName = file.name.replace(/[^\w. -]/g, "_").slice(0, 120);

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("media").insertOne({
      filename: safeName,
      contentType: declaredType,
      size: bytes.length,
      storage: "mongo",
      data: Buffer.from(bytes),
      uploadedBy: typeof admin.username === "string" ? admin.username : "admin",
      createdAt: new Date(),
    });

    const id = String(result.insertedId);
    await recordAudit({
      actor: typeof admin.username === "string" ? admin.username : "admin",
      action: "create",
      entity: "media",
      entityId: id,
      summary: `Завантажено зображення «${safeName}» (${Math.round(bytes.length / 1024)} КБ)`,
    });

    return NextResponse.json({
      success: true,
      id,
      url: `/api/media/${id}`,
      contentType: declaredType,
      size: bytes.length,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Не вдалося завантажити файл" },
      { status: 500 },
    );
  }
}

/** Список завантажених медіа (без байтів) — для майбутньої бібліотеки. */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyAdmin(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const items = await db
      .collection("media")
      .find({}, { projection: { data: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(
      items.map((item) => ({
        id: String(item._id),
        filename: item.filename,
        contentType: item.contentType,
        size: item.size,
        uploadedBy: item.uploadedBy,
        createdAt: item.createdAt,
        storage: item.storage === "cloudinary" ? "cloudinary" : "mongo",
        url: `/api/media/${item._id}`,
      })),
    );
  } catch (error) {
    console.error("Media list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}
