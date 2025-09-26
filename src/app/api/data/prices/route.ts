import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const prices = await db.collection('prices').find({}).sort({ category: 1 }).toArray()

    if (prices.length === 0) {
      return NextResponse.json([
        {
          name: "Дитяча ігрова зона",
          price: "150",
          description: "Доступ до всіх ігрових атракціонів для дітей до 12 років",
          duration: "2 години",
          category: "games"
        },
        {
          name: "Сімейний пакет",
          price: "400",
          description: "Ігрова зона + кафе для сім'ї до 4 осіб",
          duration: "3 години",
          category: "family"
        },
        {
          name: "День народження (базовий)",
          price: "800",
          description: "Святкування для 8 дітей: декор, аніматор, торт",
          duration: "2 години",
          category: "birthday"
        },
        {
          name: "День народження (преміум)",
          price: "1200",
          description: "Розширене святкування: фотограф, шоу програма, подарунки",
          duration: "3 години",
          category: "birthday"
        },
        {
          name: "Аніматор",
          price: "300",
          description: "Професійний аніматор на ваше свято",
          duration: "1 година",
          category: "services"
        },
        {
          name: "Фотосесія",
          price: "500",
          description: "Професійна фотосесія в нашій фотозоні",
          duration: "1 година",
          category: "services"
        }
      ])
    }

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}