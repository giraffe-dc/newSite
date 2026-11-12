import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

/* middleware вже пускає /api/admin/* тільки з коректною кукою, але маршрути
   додатково перевіряють підпис самі — так само, як /api/admin/reviews. */
export function adminFromRequest(
  req: NextRequest,
): { username: string } | null {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || typeof payload === "string") return null;
  const username = typeof payload.username === "string" ? payload.username : "";
  return { username: username || "Адміністратор" };
}
