import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const contacts = await db.collection('contacts').findOne({})

    if (!contacts) {
      return NextResponse.json({
        phone: "+38 (093) 123-45-67",
        email: "info@zhyrafyk.com.ua",
        address: "вул. Дитяча, 15, м. Вінниця, Вінницька область, 21000",
        workingHours: "Пн-Нд: 10:00 - 21:00",
        socialMedia: {
          facebook: "https://facebook.com/zhyrafyk",
          instagram: "https://instagram.com/zhyrafyk_family",
          telegram: "https://t.me/zhyrafyk_bot"
        }
      })
    }

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}