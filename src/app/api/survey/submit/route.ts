import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { sendTelegramMessageSurvey } from '@/lib/utils'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { newsId, answers } = body || {}

        if (!newsId || !answers || typeof answers !== 'object') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('zhyrafyk') // Use same DB as other routes

        console.log('Received newsId:', newsId, typeof newsId)

        let news
        try {
            console.log('Looking up by ObjectId:', newsId)
            const objId = new ObjectId(newsId)
            news = await db.collection('news').findOne({ _id: objId })

            if (!news) {
                console.error('News not found with id:', newsId)
            }
        } catch (e) {
            console.error('DB lookup error:', e)
        }

        console.log(
            'Found news:',
            news ? 'yes' : 'no',
            'survey:',
            news?.survey ? 'yes' : 'no'
        )
        // Accept both choice-based (options) and free-form (fields) surveys
        const hasSurvey = !!(
            news &&
            news.survey &&
            (Array.isArray(news.survey.fields) ||
                Array.isArray(news.survey.options))
        )

        if (!hasSurvey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            )
        }

        // Persist the free-form answers
        const payload = {
            newsId,
            answers,
            createdAt: new Date().toISOString(),
        }

        await db.collection('survey_responses').insertOne(payload)

        // Prepare telegram message: include news title and each label -> answer
        try {
            const lines: string[] = []
            lines.push('📋 Нова відповідь на опитування')
            lines.push(`Тема: ${news?.title || '—'}`)
            if (news?.survey?.question) {
                lines.push(`Питання: ${news.survey.question}`)
            }

            const fields = news?.survey?.fields || []
            for (const f of fields) {
                const val = answers[f.id] || ''
                lines.push(`${f.label}: ${val}`)
            }

            await sendTelegramMessageSurvey(lines.join('\n'))
        } catch (tgErr) {
            console.error('Telegram notify error:', tgErr)
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error submitting survey response:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
