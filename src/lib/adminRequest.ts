import type { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/auth";

/* middleware вже пускає /api/admin/* тільки з коректною кукою, але маршрути
   додатково перевіряють підпис самі. Перевірка ролі (ADM-01): токен має
   бути підписаний і мати role=admin. */
export function adminFromRequest(
  req: NextRequest,
): { username: string } | null {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  const payload = verifyAdmin(token);
  if (!payload) return null;
  const username = typeof payload.username === "string" ? payload.username : "";
  return { username: username || "Адміністратор" };
}
