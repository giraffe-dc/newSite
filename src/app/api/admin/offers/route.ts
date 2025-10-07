import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const offers = await db
      .collection('offers')
      .find({})
      .sort({ priority: -1, startDate: -1, _id: -1 })
      .toArray()
    return NextResponse.json(offers)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const doc = {
      title: body.title,
      description: body.description,
      active: body.active ?? true,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      priority: Number(body.priority ?? 0),
      recommended: !!body.recommended,
      icon: body.icon || '🎁'
    }
    const result = await db.collection('offers').insertOne(doc as any)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id, ...rest } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const update: any = { ...rest }
    if (typeof update.priority !== 'undefined') {
      update.priority = Number(update.priority)
    }
    await db.collection('offers').updateOne({ _id: new ObjectId(id) }, { $set: update })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    await db.collection('offers').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }
}


