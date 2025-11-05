import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const newsId = searchParams.get('newsId')

        if (!newsId) {
            return NextResponse.json(
                { error: 'News ID is required' },
                { status: 400 }
            )
        }

        const client = await clientPromise
        const db = client.db()

        // Get the news item with survey results
        const news = await db.collection('news').findOne(
            { _id: newsId as any },
            {
                projection: {
                    'survey.results': 1,
                },
            }
        )

        if (!news || !news.survey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(news.survey.results || {
            totalVotes: 0,
            optionResults: {},
            lastVoteAt: null,
        })
    } catch (error) {
        console.error('Error getting survey results:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}