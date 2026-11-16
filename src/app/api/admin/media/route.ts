import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
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

const MAX_BYTES = 5 * 1024 * 1024;

/** Дозволені типи: ключ — MIME, значення — сигнатура (hex-початок файлу). */
const ALLOWED: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif": (b) =>
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  "image/webp": (b) =>
    b.length > 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
  "image/avif": (b) =>
    b.length > 12 &&
    b[4] === 0x66 &&
    b[5] === 0x74 &&
    b[6] === 0x79 &&
    b[7] === 0x70,
  "image/svg+xml": () => false, // SVG заборонено (вбудований скрипт)
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const checkType = ALLOWED[declaredType];
    if (!checkType) {
      return NextResponse.json(
        { error: "Непідтримуваний тип файлу. Дозволено: JPEG, PNG, GIF, WebP, AVIF" },
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
    if (!checkType(bytes)) {
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
      data: Buffer.from(bytes),
      uploadedBy:
        typeof admin.username === "string" ? admin.username : "admin",
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
