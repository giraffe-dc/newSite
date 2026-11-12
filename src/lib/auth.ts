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
