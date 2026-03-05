import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

/**
 * POST /api/chat/message
 *
 * Saves a user message to the chat_logs collection for admin to read.
 * Used when client is in "admin" mode (not AI mode).
 *
 * Body:
 *   - sessionId (required)
 *   - deviceId  (required)
 *   - deviceInfo (optional)
 *   - message   (required) — user's text
 */
export async function POST(req: Request) {
    try {
        const { sessionId, deviceId, deviceInfo, message } = await req.json()

        if (!sessionId || !deviceId || !message) {
            return NextResponse.json(
                { error: 'sessionId, deviceId and message are required' },
                { status: 400 },
            )
        }

        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown'

        const client = await clientPromise
        const db = client.db('zhyrafyk')

        await db.collection('chat_logs').updateOne(
            { sessionId },
            {
                $set: {
                    deviceId,
                    deviceInfo: deviceInfo || {},
                    ip,
                    updatedAt: new Date(),
                    mode: 'admin', // flag that this session is in admin mode
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
                $push: {
                    messages: {
                        role: 'user',
                        content: message,
                        timestamp: new Date(),
                    },
                } as any,
            },
            { upsert: true },
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Chat message error:', error)
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }
}
