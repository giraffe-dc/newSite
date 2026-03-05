import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const API_KEY = process.env.NOTIFICATIONS_API_KEY

function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * GET /api/admin/chat-logs
 *
 * Query params:
 *   - key       (required) — API key for external access
 *   - limit     (optional) — number of sessions, default 50
 *   - deviceId  (optional) — filter by device
 *   - sessionId (optional) — get a specific session
 *   - from      (optional) — ISO date, filter logs created after
 *   - to        (optional) — ISO date, filter logs created before
 *
 * Example: /api/admin/chat-logs?key=YOUR_KEY&limit=20&from=2025-01-01
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)

    // Auth — simple API key check
    const key = searchParams.get('key')
    if (!key || key !== API_KEY) {
        return unauthorized()
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const deviceId = searchParams.get('deviceId')
    const sessionId = searchParams.get('sessionId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    try {
        const client = await clientPromise
        const db = client.db('zhyrafyk')

        const filter: any = {}
        if (deviceId) filter.deviceId = deviceId
        if (sessionId) filter.sessionId = sessionId
        if (from || to) {
            filter.createdAt = {}
            if (from) filter.createdAt.$gte = new Date(from)
            if (to) filter.createdAt.$lte = new Date(to)
        }

        const logs = await db
            .collection('chat_logs')
            .find(filter)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .toArray()

        return NextResponse.json({
            total: logs.length,
            logs,
        })
    } catch (error) {
        console.error('Chat logs error:', error)
        return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/chat-logs?key=YOUR_KEY&sessionId=xxx
 *
 * Delete a specific session or all logs (if no sessionId)
 */
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)

    const key = searchParams.get('key')
    if (!key || key !== API_KEY) {
        return unauthorized()
    }

    const sessionId = searchParams.get('sessionId')

    try {
        const client = await clientPromise
        const db = client.db('zhyrafyk')

        if (sessionId) {
            await db.collection('chat_logs').deleteOne({ sessionId })
            return NextResponse.json({ deleted: sessionId })
        }

        // Delete all logs
        const result = await db.collection('chat_logs').deleteMany({})
        return NextResponse.json({ deletedCount: result.deletedCount })
    } catch (error) {
        console.error('Delete chat logs error:', error)
        return NextResponse.json({ error: 'Failed to delete chat logs' }, { status: 500 })
    }
}
