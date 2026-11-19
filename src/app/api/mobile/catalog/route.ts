import { NextResponse } from "next/server";
import { getSections } from "@/lib/siteContent";
import { getPublishedReviews } from "@/lib/reviews";

/**
 * Публічний каталог для мобільного додатка «Жирафик».
 * Read-only: віддає ті самі секції `site_content`, що й публічні сторінки,
 * плюс опубліковані відгуки. Без токенів і без будь-яких записів у БД.
 */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export async function GET() {
  try {
    const [sections, reviews] = await Promise.all([
      getSections(),
      getPublishedReviews(30),
    ]);

    return NextResponse.json(
      {
        source: "site_content",
        updatedAt: new Date().toISOString(),
        sections,
        reviews,
      },
      { headers: CORS },
    );
  } catch (error) {
    console.error("mobile/catalog: не вдалося зібрати каталог", error);
    return NextResponse.json(
      { error: "Failed to load catalog" },
      { status: 500, headers: CORS },
    );
  }
}

/** Preflight для Expo Web / браузерних клієнтів. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
