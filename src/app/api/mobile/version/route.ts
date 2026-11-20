import { NextResponse } from "next/server";
import { apiKeyFromRequest, isValidApiKey } from "@/lib/apiKey";
import {
  APK_FALLBACK,
  getMobileRelease,
  parseRelease,
  saveMobileRelease,
} from "@/lib/mobileRelease";

/**
 * Версія APK мобільного додатка «Жирафик».
 *
 * - `GET /api/mobile/version` — публічна видача актуального маніфеста
 *   (БД `mobile_releases`, fallback — static-файл version.json).
 * - `POST /api/mobile/version` — публікація нової версії скриптом збірки
 *   giraffe-mobile (scripts/publish-version.mjs). Auth: `Authorization:
 *   Bearer <MOBILE_RELEASE_KEY>`. Завдяки цьому реліз додатка не вимагає
 *   деплою сайту.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const release = await getMobileRelease();
    if (!release) {
      throw new Error("маніфест версії не знайдено ні в БД, ні у файлі");
    }

    return NextResponse.json(
      {
        ...release,
        // APK живе у GitHub Releases (ліміт GitHub на файл у репозиторії — 50 МБ,
        // Vercel також не має зберігати бінарі). Сайт віддає лише маніфест.
        apkUrl: release.apkUrl || APK_FALLBACK,
      },
      {
        headers: {
          ...CORS,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("mobile/version: не вдалося віддати версію", error);
    return NextResponse.json(
      { error: "Failed to load version" },
      { status: 500, headers: CORS },
    );
  }
}

/** Публікація нової версії зі скрипта збірки (giraffe-mobile). */
export async function POST(req: Request) {
  if (!isValidApiKey(apiKeyFromRequest(req), process.env.MOBILE_RELEASE_KEY)) {
    // fail-closed: без заданого MOBILE_RELEASE_KEY доступу немає.
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: CORS },
    );
  }

  const release = parseRelease(body);
  if (!release) {
    return NextResponse.json(
      { error: "Invalid release manifest" },
      { status: 400, headers: CORS },
    );
  }

  try {
    await saveMobileRelease(release);
    return NextResponse.json(
      { success: true, versionName: release.versionName },
      { status: 201, headers: CORS },
    );
  } catch (error) {
    console.error("mobile/version: не вдалося зберегти версію", error);
    return NextResponse.json(
      { error: "Failed to save version" },
      { status: 500, headers: CORS },
    );
  }
}
