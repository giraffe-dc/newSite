import { ObjectId, type UpdateFilter } from "mongodb";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
  canChangeReviewStatus,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUSES,
  REVIEW_TRANSITIONS,
  REVIEWS_COLLECTION,
  type ReviewDoc,
  type ReviewStatus,
} from "@/lib/reviews";

/* Модерація відгуків (етап 6, п. 3): список і зміна статусу — лише для адміна.
   Видалення м'яке: статус `deleted` + `deletedAt`, запис лишається в БД.
   Відновлення — тільки в `pending`; решту переходів перевіряє
   canChangeReviewStatus(). Після зміни миємо кеш ISR обох публічних сторінок. */

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token && verifyToken(token));
}

function isValidStatus(value: unknown): value is ReviewStatus {
  return (
    typeof value === "string" &&
    (REVIEW_STATUSES as readonly string[]).includes(value)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection<ReviewDoc>(REVIEWS_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(
      docs.map((doc) => ({ ...doc, _id: String(doc._id) })),
    );
  } catch (error) {
    console.error("reviews: не вдалося прочитати список для адмінки", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
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
  const rawStatus = body?.status;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }
  if (!isValidStatus(rawStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const status = rawStatus;

  try {
    const db = await getDb();
    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION);
    const current = await collection.findOne({ _id: new ObjectId(id) });
    if (!current) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    /* Документ міг бути створений до появи цієї схеми — не довіряємо полю. */
    const from: ReviewStatus | undefined = REVIEW_STATUSES.includes(
      current.status,
    )
      ? current.status
      : undefined;
    if (!from) {
      return NextResponse.json(
        { error: "У відгуку некоректний поточний статус" },
        { status: 409 },
      );
    }
    if (!canChangeReviewStatus(from, status)) {
      const allowed = REVIEW_TRANSITIONS[from]
        .map((item) => REVIEW_STATUS_LABELS[item])
        .join(", ");
      return NextResponse.json(
        {
          error: `Перехід «${REVIEW_STATUS_LABELS[from]}» → «${REVIEW_STATUS_LABELS[status]}» заборонений. Зі статусу «${REVIEW_STATUS_LABELS[from]}» можна: ${allowed}.`,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const update: UpdateFilter<ReviewDoc> = {
      $set: { status, updatedAt: now },
    };
    if (status === "deleted") {
      update.$set = { ...update.$set, deletedAt: now };
    }
    if (from === "deleted") {
      update.$unset = { deletedAt: "" };
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      update,
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, from, status });
  } catch (error) {
    console.error("reviews: не вдалося змінити статус", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний" },
      { status: 503 },
    );
  }
}
