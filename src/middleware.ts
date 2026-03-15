import { NextResponse, type NextRequest } from "next/server";

// Edge-compatible base64url decode (no Buffer, no Node.js APIs)
function b64urlDecode(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

// Decode a JWT payload and check expiry.
// Signature verification happens in each API route via Node.js jsonwebtoken.
// Middleware only gates page/API access based on token presence + expiry.
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(b64urlDecode(parts[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Дозволяємо доступ до сторінки логіну
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Захищаємо адмін-маршрути
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Exclude /api/admin/chat-logs because it uses a different auth mechanism (API key parameter)
    if (pathname === "/api/admin/chat-logs") {
      return NextResponse.next();
    }

    const token = request.cookies.get("admin_token")?.value;

    if (!token || !decodeJwtPayload(token)) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
