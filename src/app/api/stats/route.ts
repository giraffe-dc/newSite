import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()
    const userAgent = request.headers.get('user-agent')
    const ip = request.headers.get('x-forwarded-for')

    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db.collection('statistics').insertOne({
      path,
      userAgent,
      ip,
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Statistics collection error:', error)
    return NextResponse.json(
      { error: 'Failed to collect statistics' },
      { status: 500 }
    )
  }
}
