import { type NextRequest, NextResponse } from "next/server";
import { createReview, type ReviewInput } from "@/lib/reviews";

/* Публічна заявка-відгук з /reviews: статус `pending` — з'явиться на сайті
   лише після схвалення в /admin/reviews (етап 6, п. 3). */

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ReviewInput | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Некоректне тіло запиту" },
      { status: 400 },
    );
  }

  try {
    const result = await createReview(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("reviews: не вдалося прийняти відгук", error);
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний. Спробуйте пізніше." },
      { status: 503 },
    );
  }
}
