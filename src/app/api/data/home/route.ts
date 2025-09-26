import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const homeData = await db.collection('home').findOne({})
    const homeDataFeatures = await db.collection('features').find({}).toArray()

    if (!homeData) {
      return NextResponse.json({
        title: "Сімейний розважальний центр Жирафик",
        description: "Найкращий розважальний центр для всієї родини! Ми створюємо незабутні моменти для дітей та дорослих.",
        featureCards: [
          { title: "Безпека", description: "Сертифіковане обладнання та професійний нагляд за дітьми" },
          { title: "Розваги", description: "Ігрові зони, батути, лабіринт та багато іншого" },
          { title: "Кафе", description: "Смачна їжа та напої для дітей та дорослих" }
        ],
        features: [
          "🎈 Святкування днів народження",
          "🎪 Ігрові зони для різних віків",
          "🍰 Кафе з дитячим меню",
          "🎭 Професійні аніматори",
          "📸 Красива фотозона",
          "🎨 Творчі майстер-класи"
        ],
        images: [],
        workingHours: "Щодня: 10:00 - 21:00",
        address: "вул. Дитяча, 15, м. Вінниця",
        phone: "+38 (093) 123-45-67"
      })
    }
// console.log(homeDataFeatures);
    // const homeDataAll = { ...homeData, featureCards: homeDataFeatures };
// console.log(homeDataAll);
    return NextResponse.json({...homeData, featureCards: homeDataFeatures})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 }
    )
  }
}
