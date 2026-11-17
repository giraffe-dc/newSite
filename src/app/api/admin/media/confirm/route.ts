import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import {
  destroyAsset,
  mediaStorage,
  validateAsset,
} from "@/lib/cloudinaryMedia";
import clientPromise from "@/lib/mongodb";

/** Підтвердження прямого завантаження в Cloudinary (CLO-05): сервер
 *  перевіряє ассет через Admin API, magic bytes і розмір, після чого
 *  зберігає метадані в `media`. Байти в MongoDB більше не потрапляють. */
export async function POST(request: NextRequest) {
  let publicId: string | undefined;
  let registered = false;
  try {
    const token = request.cookies.get("admin_token")?.value;
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (mediaStorage() !== "cloudinary") {
      return NextResponse.json(
        { error: "Хмарне завантаження не активне" },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      publicId?: unknown;
    } | null;
    const requestedId = body?.publicId;
    if (
      typeof requestedId !== "string" ||
      !/^[\w/-]{1,300}$/.test(requestedId)
    ) {
      return NextResponse.json(
        { error: "Недозволений public_id" },
        { status: 400 },
      );
    }
    publicId = requestedId;

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const media = db.collection("media");

    // Повторний confirm (наприклад, після помилки мережі) має бути ідемпотентним
    // і не перевіряти вже зареєстрований ассет — інакше «застаріле»
    // завантаження могло б бути видалене разом із робочим записом.
    const existing = await media.findOne({ storage: "cloudinary", publicId });
    if (existing) {
      return NextResponse.json({
        success: true,
        id: String(existing._id),
        url: `/api/media/${existing._id}`,
        contentType: existing.contentType,
        size: existing.size,
      });
    }

    const asset = await validateAsset(publicId);
    const actor = typeof admin.username === "string" ? admin.username : "admin";
    const filename = asset.publicId.split("/").pop() || "image";

    const result = await media.insertOne({
      filename,
      contentType: asset.mime,
      size: asset.bytes,
      storage: "cloudinary",
      publicId: asset.publicId,
      version: asset.version,
      format: asset.format,
      width: asset.width,
      height: asset.height,
      uploadedBy: actor,
      createdAt: new Date(),
    });

    registered = true;
    const id = String(result.insertedId);
    await recordAudit({
      actor,
      action: "create",
      entity: "media",
      entityId: id,
      summary: `Завантажено в Cloudinary «${filename}» (${Math.round(asset.bytes / 1024)} КБ)`,
    });

    return NextResponse.json({
      success: true,
      id,
      url: `/api/media/${id}`,
      contentType: asset.mime,
      size: asset.bytes,
    });
  } catch (error) {
    // Якщо перевірка не пройшла після успішного завантаження — прибираємо
    // ассет, бо інакше він лишиться сиротою й витрачатиме кредити Cloudinary.
    if (publicId && !registered) {
      try {
        await destroyAsset(publicId);
      } catch (cleanupError) {
        console.error("Cloudinary orphan cleanup failed:", cleanupError);
      }
    }
    console.error("Media confirm error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося підтвердити завантаження",
      },
      { status: 500 },
    );
  }
}
