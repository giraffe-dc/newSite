import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Order } from '@/types'
import { sendTelegramMessage } from '@/lib/utils'

function formatOrderForTelegram(order: Order) {
  const lines: string[] = []
  lines.push('<b>Нове замовлення</b> 🎉')
  lines.push(`Ім'я: <b>${order.customerName}</b>`) // safe enough for Telegram HTML
  lines.push(`Телефон: <b>${order.phone}</b>`) 
  if (order.date) lines.push(`Дата: <b>${order.date}</b>`) 
  if (order.time) lines.push(`Час: <b>${order.time}</b>`) 
  if (order.items?.length) {
    lines.push('Послуги:')
    order.items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.serviceName}${it.quantity ? ` x${it.quantity}` : ''}${it.price ? ` (${it.price})` : ''}`)
    })
  }
  if (order.notes) lines.push(`Коментар: ${order.notes}`)
  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Order

    if (!body?.customerName || !body?.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const nowIso = new Date().toISOString()
    const doc: Order = {
      customerName: body.customerName,
      phone: body.phone,
      date: body.date,
      time: body.time,
      notes: body.notes,
      items: body.items,
      status: 'new',
      createdAt: nowIso
    }

    const result = await db.collection('orders').insertOne(doc as any)

    // send Telegram notification (best-effort)
    const message = formatOrderForTelegram(doc)
    sendTelegramMessage(message).catch(() => {})

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const orders = await db
      .collection('orders')
      .find({}, { projection: { /* no sensitive fields */ } })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

