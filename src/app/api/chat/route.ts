import { GoogleGenerativeAI } from '@google/generative-ai'
import clientPromise from '@/lib/mongodb'

// Fetch JSON from an internal API endpoint
async function fetchData(baseUrl: string, path: string): Promise<unknown> {
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 120 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Logging ─────────────────────────────────────────────────────────────────

async function logChat(data: {
  sessionId: string
  deviceId: string
  deviceInfo: any
  userMessage: string
  assistantMessage: string
  ip: string
}) {
  try {
    const client = await clientPromise
    const db = client.db('zhyrafyk')
    await db.collection('chat_logs').updateOne(
      { sessionId: data.sessionId },
      {
        $set: {
          deviceId: data.deviceId,
          deviceInfo: data.deviceInfo,
          ip: data.ip,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
        $push: {
          messages: {
            $each: [
              { role: 'user', content: data.userMessage, timestamp: new Date() },
              { role: 'assistant', content: data.assistantMessage, timestamp: new Date() },
            ],
          },
        } as any,
      },
      { upsert: true },
    )
  } catch (err) {
    console.error('Chat log error:', err)
  }
}

// ── Formatters ──────────────────────────────────────────────────────────────

function fmtPrices(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return 'Інформація про ціни тимчасово недоступна.'
  return data
    .map(
      (p: any) =>
        `• ${p.name} — ${p.price} грн${p.duration ? ` (${p.duration})` : ''}${p.description ? `. ${p.description}` : ''}`,
    )
    .join('\n')
}

function fmtCategories(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return ''
  return data.map((c: any) => `${c.icon || ''} ${c.label} (${c.key})`).join(', ')
}

function fmtNews(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return 'Наразі новин немає.'
  return data
    .slice(0, 8)
    .map((n: any) => `📰 [${n.date?.slice(0, 10) ?? ''}] ${n.title}\n   ${n.content}`)
    .join('\n\n')
}

function fmtOffers(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return 'Наразі спеціальних пропозицій немає.'
  return data.map((o: any) => `🎁 ${o.title}: ${o.description}`).join('\n')
}

function fmtCafe(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return 'Меню кафе тимчасово недоступне.'
  const grouped: Record<string, any[]> = {}
  for (const item of data as any[]) {
    const cat = item.category || 'Інше'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }
  return Object.entries(grouped)
    .map(
      ([cat, items]) =>
        `[${cat}]\n${items.map((i: any) => `  • ${i.name} — ${i.price} грн${i.description ? `. ${i.description}` : ''}`).join('\n')}`,
    )
    .join('\n')
}

function fmtContacts(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const c = data as any
  const parts = []
  if (c.phone) parts.push(`📞 Телефон: ${c.phone}`)
  if (c.email) parts.push(`📧 Email: ${c.email}`)
  if (c.address) parts.push(`📍 Адреса: ${c.address}`)
  if (c.workingHours) parts.push(`🕐 Графік роботи: ${c.workingHours}`)
  if (c.socialMedia) {
    const sm = c.socialMedia
    if (sm.instagram) parts.push(`📷 Instagram: ${sm.instagram}`)
    if (sm.facebook) parts.push(`👍 Facebook: ${sm.facebook}`)
    if (sm.telegram) parts.push(`✈️ Telegram: ${sm.telegram}`)
  }
  return parts.join('\n')
}

function fmtHome(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const h = data as any
  const parts = []
  if (h.title) parts.push(`Назва: ${h.title}`)
  if (h.description) parts.push(`Опис: ${h.description}`)
  if (Array.isArray(h.features) && h.features.length) {
    parts.push(`\nНаші переваги:\n${h.features.join('\n')}`)
  }
  if (Array.isArray(h.featureCards) && h.featureCards.length) {
    parts.push(
      `\nДетальніше:\n${h.featureCards.map((f: any) => `• ${f.title}: ${f.description}`).join('\n')}`,
    )
  }
  return parts.join('\n')
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { messages, deviceId, deviceInfo, sessionId } = await req.json()
  const baseUrl = new URL(req.url).origin

  // Get client IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  // Fetch ALL site data in parallel
  const [prices, categories, news, offers, cafe, contacts, home] = await Promise.all([
    fetchData(baseUrl, '/api/data/prices'),
    fetchData(baseUrl, '/api/data/price-categories'),
    fetchData(baseUrl, '/api/data/news'),
    fetchData(baseUrl, '/api/data/offers'),
    fetchData(baseUrl, '/api/data/cafe'),
    fetchData(baseUrl, '/api/data/contacts'),
    fetchData(baseUrl, '/api/data/home'),
  ])

  const systemPrompt = `Ти — розумний ШІ-помічник сімейного розважального центру "Жирафик".
Ти знаєш ВСЮ інформацію про центр і допомагаєш відвідувачам знайти потрібну інформацію на сайті.
Відповідай виключно українською мовою. Будь дружнім, конкретним, не занадто довгим.
Якщо запитання не стосується центру — ввічливо поясни, що ти помічник саме цього закладу.

══════════════════════════
ПРО НАС
══════════════════════════
${fmtHome(home)}

══════════════════════════
КОНТАКТНА ІНФОРМАЦІЯ
══════════════════════════
${fmtContacts(contacts)}

══════════════════════════
КАТЕГОРІЇ ЦІН
══════════════════════════
${fmtCategories(categories)}

══════════════════════════
АКТУАЛЬНІ ЦІНИ
══════════════════════════
${fmtPrices(prices)}

══════════════════════════
МЕНЮ КАФЕ
══════════════════════════
${fmtCafe(cafe)}

══════════════════════════
НОВИНИ ТА ПОДІЇ
══════════════════════════
${fmtNews(news)}

══════════════════════════
СПЕЦІАЛЬНІ ПРОПОЗИЦІЇ / АКЦІЇ
══════════════════════════
${fmtOffers(offers)}

Правила відповіді:
1. Відповідай на основі ТІЛЬКИ наданих вище даних. Не вигадуй ціни, новини чи контакти.
2. Якщо питають про ціну — давай точну інформацію з розділу «АКТУАЛЬНІ ЦІНИ».
3. Якщо питають про їжу/напої — давай інформацію з «МЕНЮ КАФЕ».
4. Якщо не маєш відповіді — порадь зателефонувати за номером, що вказаний у контактах.
5. Використовуй емодзі де доречно, щоб відповідь була приємнішою.`

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: systemPrompt,
  })

  type ChatMessage = { role: string; content: string }

  const allButLast: ChatMessage[] = messages.slice(0, -1)
  const firstUserIdx = allButLast.findIndex((m: ChatMessage) => m.role === 'user')
  const validHistory = firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx)

  const history = validHistory.map((m: ChatMessage) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const chat = model.startChat({ history })

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content)
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
          }
        }
      } catch (err) {
        console.error('Gemini stream error:', err)
        const errMsg = 'Вибачте, виникла помилка. Спробуйте ще раз або зателефонуйте нам!'
        fullResponse = errMsg
        controller.enqueue(encoder.encode(`0:${JSON.stringify(errMsg)}\n`))
      } finally {
        controller.close()
        // Log the conversation asynchronously (don't block response)
        if (sessionId && deviceId) {
          logChat({
            sessionId,
            deviceId,
            deviceInfo: deviceInfo || {},
            userMessage: lastMessage.content,
            assistantMessage: fullResponse,
            ip,
          }).catch(console.error)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
