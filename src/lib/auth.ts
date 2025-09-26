import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function verifyPassword(password: string, hashedPassword: string) {
  // console.log('Verifying password', password, hashedPassword)
  return bcrypt.compare(password, hashedPassword)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function generateToken(payload: any) {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, { expiresIn: '1h' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!)
  } catch (error) {
    return null
  }
}