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

    const {_id, ...homeData} = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db.collection('home').replaceOne({}, homeData, { upsert: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Home update error:', error)
    return NextResponse.json(
      { error: 'Failed to update home data' },
      { status: 500 }
    )
  }
}