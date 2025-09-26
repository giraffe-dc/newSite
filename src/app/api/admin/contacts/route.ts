import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contactData = await request.json()
    const { _id, ...dataToUpdate } = contactData // Видаляємо _id, якщо він є

    const client = await clientPromise
    const db = client.db('zhyrafyk')

    // Оскільки у нас один документ з контактами, ми можемо його просто оновлювати.
    // Опція upsert: true створить документ, якщо він не існує.
    const result = await db.collection('contacts').updateOne(
      {},
      { $set: dataToUpdate },
      { upsert: true }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Contacts update error:', error)
    return NextResponse.json(
      { error: 'Failed to update contacts' },
      { status: 500 }
    )
  }
}
