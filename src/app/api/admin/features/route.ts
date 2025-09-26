import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const features = await db.collection('features').find({}).toArray()
    return NextResponse.json(features)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
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

    const feature = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('features').insertOne(feature)

    return NextResponse.json(result.insertedId, { status: 201 })
  } catch (error) {
    console.error('Feature creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create feature' },
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

    const { _id, ...feature } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db
      .collection('features')
      .replaceOne({ _id: new ObjectId(_id) }, feature)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feature update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feature' },
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

    await db.collection('features').deleteOne({ _id: new ObjectId(_id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feature deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete feature' },
      { status: 500 }
    )
  }
}
