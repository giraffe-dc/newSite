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
    const ordersCollection = db.collection('orders')

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

    const topReferrers = await statsCollection
        .aggregate([
            { $match: { referrer: { $ne: null } } },
            { $match: { referrer: { $ne: '' } } },
            { $group: { _id: '$referrer', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ])
        .toArray()

    const bookingsTotal = await ordersCollection.countDocuments()
    const bookingsPerDay = await ordersCollection
        .aggregate([
            {
                $group: {
                    _id: { $substr: ['$createdAt', 0, 10] },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])
        .toArray()

    return NextResponse.json({
        totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        pageViewsByPath,
        pageViewsPerDay,
        topReferrers,
        bookingsTotal,
        bookingsPerDay,
    })
  } catch (error) {
    console.error('Statistics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    )
  }
}
