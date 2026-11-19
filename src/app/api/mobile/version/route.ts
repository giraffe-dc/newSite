import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Актуальна версія APK для мобільного додатка «Жирафик».
 * Джерело — static-файл `public/app/version.json`, який пише скрипт збірки
 * `giraffe-mobile/scripts/build-apk.ps1`. БД не потрібна.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const file = path.join(process.cwd(), "public", "app", "version.json");
    const raw = await readFile(file, "utf8");
    const release = JSON.parse(raw) as {
      versionName: string;
      versionCode: number;
      changelog: string[];
      publishedAt: string;
      sha256?: string;
    };

    return NextResponse.json(
      {
        ...release,
        apkUrl: "/app/giraffe-mobile.apk",
      },
      {
        headers: {
          ...CORS,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("mobile/version: не вдалося прочитати версію", error);
    return NextResponse.json(
      { error: "Failed to load version" },
      { status: 500, headers: CORS },
    );
  }
}
