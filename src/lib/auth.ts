import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function verifyPassword(password: string, hashedPassword: string) {
  // console.log('Verifying password', password, hashedPassword)
  return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // Previously `process.env.NEXTAUTH_SECRET!`; both sign/verify fail without a
    // secret, so throwing here keeps the same observable behaviour.
    throw new Error("NEXTAUTH_SECRET is not defined");
  }
  return secret;
}

export function generateToken(payload: object) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (_error) {
    return null;
  }
}

/**
 * Токен адміністратора: підпис валідний І роль у payload — `admin`.
 * Використовується всіма `/api/admin/*`-маршрутами (прийом ADM-01 «ролі»):
 * токен з іншою роллю (або без неї) відхиляється навіть за наявності
 * підпису. Middleware додатково перевіряє роль на рівні edge, але справжня
 * перевірка — тут, бо middleware не верифікує підпис.
 */
export function verifyAdmin(token: string): jwt.JwtPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (!payload || typeof payload === "string") return null;
    if (payload.role !== "admin") return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

/** Життєвий час токена кабінету клієнта — 30 днів (рішення власника). */
export const CLIENT_TOKEN_TTL = "30d";

/**
 * Токен кабінету клієнта (Етап 3): підпис з `role: "user"` і `phone`.
 * Віддається як `Authorization: Bearer` (основний шлях для React Native,
 * де HttpOnly cookie з fetch не працює) і додатково ставить cookie
 * `client_token` для PWA/сайту.
 */
export function signClientToken(phone: string): string {
  return jwt.sign({ phone, role: "user" }, getJwtSecret(), {
    expiresIn: CLIENT_TOKEN_TTL,
  });
}

/** Перевірка токена кабінету: підпис валідний, роль `user`, є телефон. */
export function verifyClient(token: string): { phone: string } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (!payload || typeof payload === "string") return null;
    if (payload.role !== "user") return null;
    if (typeof payload.phone !== "string" || !payload.phone) return null;
    return { phone: payload.phone };
  } catch (_error) {
    return null;
  }
}
