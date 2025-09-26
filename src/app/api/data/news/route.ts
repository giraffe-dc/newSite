import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const news = await db.collection('news').find({}).sort({ date: -1 }).toArray()

    if (news.length === 0) {
      return NextResponse.json([
        {
          title: "Новий атракціон у Жирафику!",
          content: "Зустрічайте новий захоплюючий атракціон для дітей від 5 років - 'Космічна пригода'. Відправтеся у подорож до зірок!",
          date: "2024-12-15",
          type: "news",
          image: "https://via.placeholder.com/400x250/ff6b35/ffffff?text=Космічна+пригода"
        },
        {
          title: "Знижки на дні народження у грудні",
          content: "Святкуйте день народження вашої дитини з 20% знижкою! Акція діє до кінця грудня для всіх пакетів.",
          date: "2024-12-10",
          type: "event"
        },
        {
          title: "Новорічні свята у Жирафику",
          content: "Приєднуйтеся до новорічних святкувань! Дід Мороз, подарунки, ігри та багато іншого чекають на ваших малюків.",
          date: "2024-12-20",
          type: "event",
          image: "https://via.placeholder.com/400x250/f7b731/ffffff?text=Новий+Рік"
        }
      ])
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}