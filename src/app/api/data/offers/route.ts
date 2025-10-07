import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const nowIso = new Date().toISOString()
    const offers = await db
      .collection('offers')
      .find({
        $and: [
          { $or: [{ active: { $exists: false } }, { active: true }] },
          { $or: [{ startDate: null }, { startDate: { $lte: nowIso } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: nowIso } }] }
        ]
      })
      .sort({ priority: -1, startDate: -1, _id: -1 })
      .toArray()
    return NextResponse.json(offers)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}


