import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { SurveyVoteData } from '@/types'
import { sendTelegramMessage } from '@/lib/utils'

export async function POST(req: Request) {
    try {
        const { newsId, optionIds }: SurveyVoteData = await req.json()

        if (!newsId || !optionIds || optionIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid vote data' },
                { status: 400 }
            )
        }

        const client = await clientPromise
        const db = client.db()

        // Get the news item to verify survey exists and isn't expired
        const news = await db.collection('news').findOne({
            _id: newsId as any,
            'survey.endDate': { $gt: new Date().toISOString() },
        })

        if (!news || !news.survey) {
            return NextResponse.json(
                { error: 'Survey not found or expired' },
                { status: 404 }
            )
        }

        // Verify option IDs are valid
        const validOptionIds = news.survey.options.map((opt: any) => opt.id)
        const invalidOptions = optionIds.filter(
            (id) => !validOptionIds.includes(id)
        )

        if (invalidOptions.length > 0) {
            return NextResponse.json(
                { error: 'Invalid option IDs' },
                { status: 400 }
            )
        }

        // If multiple votes not allowed, ensure only one option
        if (!news.survey.allowMultiple && optionIds.length > 1) {
            return NextResponse.json(
                { error: 'Multiple votes not allowed' },
                { status: 400 }
            )
        }

        // Record the vote
        const voteData: SurveyVoteData = {
            newsId,
            optionIds,
            votedAt: new Date().toISOString(),
        }

        await db.collection('survey_votes').insertOne(voteData)

        // Update vote counts in the news document
        const updateOps = optionIds.map((optionId) => ({
            ['survey.results.optionResults.' + optionId]: 1,
        }))

        await db.collection('news').updateOne(
            { _id: newsId as any },
            {
                $inc: {
                    'survey.results.totalVotes': 1,
                    ...Object.assign({}, ...updateOps),
                },
                $set: {
                    'survey.results.lastVoteAt': new Date().toISOString(),
                },
            }
        )

        // Fetch updated news to include in telegram message
    const updatedNews = await db.collection('news').findOne({ _id: newsId as any })

        try {
            if (updatedNews) {
                const chosenTexts = (news.survey.options || [])
                    .filter((o: any) => optionIds.includes(o.id))
                    .map((o: any) => o.text)
                const msgLines = [
                    `🔔 Новий голос в опитуванні`,
                    `Тема: ${updatedNews.title || '—'}`,
                    `Питання: ${news.survey.question}`,
                    `Вибрано: ${chosenTexts.join(', ')}`,
                    `Всього голосів: ${
                        (updatedNews.survey?.results?.totalVotes as any) || ''
                    }`,
                ]
                await sendTelegramMessage(msgLines.join('\n'))
            }
        } catch (tgErr) {
            console.error('Telegram notify error:', tgErr)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error recording vote:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}