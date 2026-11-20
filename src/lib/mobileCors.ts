import type { NextRequest } from "next/server";

/**
 * CORS для ендпойнтів кабінету клієнта (`/api/mobile/auth/*`,
 * `/api/mobile/orders`).
 *
 * На відміну від `/api/mobile/version` (допускає `*`), ці маршрути
 * працюють з `credentials: "include"` — cookie `client_token` для PWA
 * (`giraffe-mobile.vercel.app`). Специфікація CORS забороняє поєднувати
 * `Access-Control-Allow-Origin: *` з `Allow-Credentials: true`, тому
 * віддаємо конкретний origin, але лише з дозволеного списку:
 *
 * - той самий хост сайту (однорідні запити — CORS не потрібен, але
 *   хедер не завадить);
 * - `https://giraffe-mobile.vercel.app` — PWA додатка;
 * - `http://localhost:*` / `http://127.0.0.1:*` — локальна розробка.
 *
 * React Native (APK) CORS не застосовує взагалі — йому байдуже.
 * Fail-closed: невідомий оточення отримує без CORS-хедерів.
 */

const EXTRA_ALLOWED_ORIGINS = new Set([
  "https://giraffe-mobile.vercel.app",
  "https://giraffe-mobile-git-main.vercel.app",
  "https://giraffe-teplyk.vercel.app",
]);

function isAllowedOrigin(origin: string, host: string | null): boolean {
  if (EXTRA_ALLOWED_ORIGINS.has(origin)) return true;
  if (host && origin === `https://${host}`) return true;
  // Локальна розробка (next dev на різних портах).
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

/** CORS-хедери для конкретного запиту (порожній об'єкт — origin не дозволений). */
export function corsHeaders(req: NextRequest | Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && isAllowedOrigin(origin, host)) {
    base["Access-Control-Allow-Origin"] = origin;
    base["Access-Control-Allow-Credentials"] = "true";
    base.Vary = "Origin";
  }
  return base;
}

export function preflightResponse(req: NextRequest | Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
