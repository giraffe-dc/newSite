import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { createReview, type ReviewInput } from "@/lib/reviews";

/* Публічна заявка-відгук з /reviews: статус `pending` — з'явиться на сайті
   лише після схвалення в /admin/reviews (етап 6, п. 3). */

/** Дозволяємо надсилати відгуки з мобільного додатка (Expo Web / браузер). */
const MOBILE_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MOBILE_CORS });
}

/** Обгортка відповіді з CORS-заголовками (PWA і додаток на іншому домені). */
function apiJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...MOBILE_CORS, ...(init?.headers ?? {}) },
  });
}

export async function POST(request: NextRequest) {
  // Honeypot уже є (у createReview); ліміт — від наповнення бази сміттям.
  if (!rateLimit(`reviews:${clientIp(request)}`, 5, 10 * 60_000)) {
    return apiJson(
      { error: "Занадто багато відгуків. Спробуйте пізніше." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as ReviewInput | null;
  if (!body || typeof body !== "object") {
    return apiJson({ error: "Некоректне тіло запиту" }, { status: 400 });
  }

  try {
    const result = await createReview(body);
    if (!result.ok) {
      return apiJson({ error: result.error }, { status: 400 });
    }
    return apiJson({ success: true }, { status: 201 });
  } catch (error) {
    console.error("reviews: не вдалося прийняти відгук", error);
    return apiJson(
      { error: "Сервіс тимчасово недоступний. Спробуйте пізніше." },
      { status: 503 },
    );
  }
}
