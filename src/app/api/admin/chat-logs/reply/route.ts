import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const API_KEY = process.env.NOTIFICATIONS_API_KEY

/**
 * POST /api/admin/chat-logs/reply
 *
 * Body:
 *   - key       (required) — API key
 *   - sessionId (required) — the chat session to reply in
 *   - message   (required) — text of the admin reply
 *   - adminName (optional) — name of the operator, defaults to "Адміністратор"
 *
 * Example:
 * POST /api/admin/chat-logs/reply
 * { "key": "xxx", "sessionId": "ses_xxx", "message": "Вітаю! Чим можу допомогти?" }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { key, sessionId, message, adminName } = body

        if (!key || key !== API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!sessionId || !message) {
            return NextResponse.json(
                { error: 'sessionId and message are required' },
                { status: 400 },
            )
        }

        const client = await clientPromise
        const db = client.db('zhyrafyk')

        const operatorMsg = {
            role: 'operator',
            content: message,
            adminName: adminName || 'Адміністратор',
            timestamp: new Date(),
            delivered: false,
        }

        const result = await db.collection('chat_logs').updateOne(
            { sessionId },
            {
                $push: { messages: operatorMsg } as any,
                $set: { updatedAt: new Date() },
            },
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Reply sent' })
    } catch (error) {
        console.error('Admin reply error:', error)
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }
}
