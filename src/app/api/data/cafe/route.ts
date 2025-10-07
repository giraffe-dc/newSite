import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const cafeItems = await db.collection('cafe_items').find({}).sort({ category: 1 }).toArray()

    if (cafeItems.length === 0) {
      return NextResponse.json([
        {
          name: "Піца Маргарита",
          description: "Класична піца з томатним соусом та моцарелою",
          price: 150,
          category: "Піца",
          image: "/images/pizza.jpg"
        },
        {
          name: "Картопля Фрі",
          description: "Хрустка картопля фрі з соусом",
          price: 50,
          category: "Снеки",
          image: "/images/fries.jpg"
        },
        {
          name: "Лимонад",
          description: "Освіжаючий домашній лимонад",
          price: 30,
          category: "Напої",
          image: "/images/lemonade.jpg"
        }
      ])
    }

    return NextResponse.json(cafeItems)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cafe items' },
      { status: 500 }
    )
  }
}
