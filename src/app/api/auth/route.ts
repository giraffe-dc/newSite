import { type NextRequest, NextResponse } from "next/server";
import { generateToken, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Без змінних середовища вхід заборонено (fallback-паролів немає).
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminUsername || !adminPasswordHash) {
      console.error(
        "Auth is not configured: set ADMIN_USERNAME and ADMIN_PASSWORD_HASH",
      );
      return NextResponse.json(
        { error: "Authentication is not configured" },
        { status: 500 },
      );
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, adminPasswordHash);
    // console.log('Invalid credentials', isValid)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate token
    const token = generateToken({ username, role: "admin" });

    // Set cookie
    const response = NextResponse.json({ success: true, token });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  return response;
}
