import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const priceData = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('prices').insertOne(priceData)

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Price creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create price' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, ...priceData } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    // Явно видаляємо _id, щоб уникнути помилки
    delete (priceData as { _id?: any })._id;

    await db.collection('prices').updateOne(
      { _id: new ObjectId(id) },
      { $set: priceData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Price update error:', error)
    return NextResponse.json(
      { error: 'Failed to update price' },
      { status: 500 }
    )
  }
}