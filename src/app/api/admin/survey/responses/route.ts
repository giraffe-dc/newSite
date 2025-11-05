import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // simple cookie-based admin token check (matches /api/auth route)
    const token = request.headers.get('cookie')
      ?.split(';')
      .find((c) => c.trim().startsWith('admin_token='))
      ?.split('=')[1]

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('newsId')

    const client = await clientPromise
    const db = client.db('zhyrafyk')

    let query = {}
    if (newsId) {
      query = { newsId }
    }

    // Get responses with news details
    const responses = await db.collection('survey_responses')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Get related news items
    const newsIds = [...new Set(responses.map(r => r.newsId))]
    const news = await db.collection('news')
      .find({ 
        _id: { 
          $in: newsIds.map(id => {
            try {
              return new ObjectId(id)
            } catch {
              return id
            }
          })
        } 
      })
      .project({ _id: 1, title: 1, survey: 1 })
      .toArray()

    // Map responses with news data
    const enrichedResponses = responses.map(response => {
      const newsItem = news.find(n => n._id.toString() === response.newsId)
      return {
        ...response,
        newsTitle: newsItem?.title || 'Новина не знайдена',
        surveyQuestion: newsItem?.survey?.question || '',
        surveyFields: newsItem?.survey?.fields || []
      }
    })

    return NextResponse.json(enrichedResponses)
  } catch (error) {
    console.error('Error fetching survey responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    )
  }
}