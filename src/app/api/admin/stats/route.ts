// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const statsCollection = db.collection('statistics')

    const totalPageViews = await statsCollection.countDocuments()

    const pageViewsByPath = await statsCollection.aggregate([
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()

    const uniqueVisitors = await statsCollection.distinct('ip')

    const pageViewsPerDay = await statsCollection.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]).toArray()

    return NextResponse.json({
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      pageViewsByPath,
      pageViewsPerDay,
    })
  } catch (error) {
    console.error('Statistics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    )
  }
}
