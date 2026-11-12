import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
  REVIEWS_COLLECTION,
  type ReviewDoc,
  type ReviewStatus,
} from "@/lib/reviews";

/* Модерація відгуків (етап 6, п. 3): список і зміна статусу — лише для
   адміна. Видалення м'яке: статус `deleted` (запис лишається в БД для
   історії, відновлення повертає в `pending`); жорсткого DELETE немає.
   Після зміни миємо кеш, щоб /reviews і головна оновилися одразу. */

const STATUSES: ReviewStatus[] = ["pending", "published", "hidden", "deleted"];

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && verifyToken(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const docs = await db
    .collection<ReviewDoc>(REVIEWS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(
    docs.map((doc) => ({ ...doc, _id: String(doc._id) })),
  );
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    status?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id : "";
  const rawStatus = typeof body?.status === "string" ? body.status : "";

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }
  if (!STATUSES.includes(rawStatus as ReviewStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const status = rawStatus as ReviewStatus;

  const db = await getDb();
  const result = await db
    .collection<ReviewDoc>(REVIEWS_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
