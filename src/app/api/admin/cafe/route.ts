import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const cafeItems = await db.collection('cafe_items').find({}).toArray()
    return NextResponse.json(cafeItems)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cafe items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cafeItem = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('cafe_items').insertOne(cafeItem)

    return NextResponse.json(result.insertedId, { status: 201 })
  } catch (error) {
    console.error('Cafe item creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create cafe item' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { _id, ...cafeItem } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db
      .collection('cafe_items')
      .replaceOne({ _id: new ObjectId(_id) }, cafeItem)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cafe item update error:', error)
    return NextResponse.json(
      { error: 'Failed to update cafe item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { _id } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db.collection('cafe_items').deleteOne({ _id: new ObjectId(_id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cafe item deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete cafe item' },
      { status: 500 }
    )
  }
}
