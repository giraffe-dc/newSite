import { NextResponse } from "next/server";

export const maxDuration = 60;

// ID файлу Google Drive: 10–64 символи латиниці, цифр, «-» і «_».
// Без цього в `id` можна було б підставити &/# і змінити параметри запиту,
// а заодно пропустити HTML/SVG, який виконувався б на нашому домені.
const FILE_ID_RE = /^[A-Za-z0-9_-]{10,64}$/;
// Розмір відповіді: картинки новин набагато менші, 10 МБ — щедра межа,
// щоб проксі не використовували як безлімітний канал передавання.
const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId || !FILE_ID_RE.test(fileId)) {
      return new NextResponse("File ID is required", { status: 400 });
    }

    // Google Drive direct download URL
    const url = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;

    const response = await fetch(url);

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", {
        status: response.status,
      });
    }

    // Пропускаємо тільки зображення: HTML/SVG від стороннього файлу
    // міг би виконатися на нашому домені (stored XSS через проксі).
    const upstreamType = response.headers.get("Content-Type") || "";
    const contentType = upstreamType.split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Unsupported content type", { status: 415 });
    }

    const contentLength = Number(response.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BYTES) {
      return new NextResponse("File too large", { status: 413 });
    }

    // Forward the content type and body
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error proxying Google Drive image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
