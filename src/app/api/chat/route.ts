import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";

// Fetch JSON from an internal API endpoint
async function fetchData(baseUrl: string, path: string): Promise<unknown> {
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Logging ─────────────────────────────────────────────────────────────────

async function logChat(data: {
  sessionId: string;
  deviceId: string;
  deviceInfo: unknown;
  userMessage: string;
  assistantMessage: string;
  ip: string;
}) {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    await db.collection("chat_logs").updateOne(
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
              {
                role: "user",
                content: data.userMessage,
                timestamp: new Date(),
              },
              {
                role: "assistant",
                content: data.assistantMessage,
                timestamp: new Date(),
              },
            ],
          },
        },
      } as unknown as UpdateFilter<Record<string, unknown>>,
      { upsert: true },
    );
  } catch (err) {
    console.error("Chat log error:", err);
  }
}

// ── Formatters ──────────────────────────────────────────────────────────────

interface PriceLike {
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

interface CategoryLike {
  icon?: string;
  label: string;
  key: string;
}

interface NewsLike {
  date?: string;
  title: string;
  content: string;
}

interface OfferLike {
  title: string;
  description: string;
}

interface ContactLike {
  phone?: string;
  email?: string;
  serviceArea?: string;
  address?: string;
  workingHours?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    telegram?: string;
  };
}

interface HomeLike {
  title?: string;
  description?: string;
  features?: string[];
  featureCards?: { title: string; description: string }[];
}

function fmtPrices(data: unknown): string {
  if (!Array.isArray(data) || !data.length)
    return "Інформація про ціни тимчасово недоступна.";
  return data
    .map(
      (p: PriceLike) =>
        `• ${p.name} — ${p.price} грн${p.duration ? ` (${p.duration})` : ""}${p.description ? `. ${p.description}` : ""}`,
    )
    .join("\n");
}

function fmtCategories(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return "";
  return data
    .map((c: CategoryLike) => `${c.icon || ""} ${c.label} (${c.key})`)
    .join(", ");
}

function fmtNews(data: unknown): string {
  if (!Array.isArray(data) || !data.length) return "Наразі новин немає.";
  return data
    .slice(0, 8)
    .map(
      (n: NewsLike) =>
        `[${n.date?.slice(0, 10) ?? ""}] ${n.title}\n   ${n.content}`,
    )
    .join("\n\n");
}

function fmtOffers(data: unknown): string {
  if (!Array.isArray(data) || !data.length)
    return "Наразі спеціальних пропозицій немає.";
  return data.map((o: OfferLike) => `${o.title}: ${o.description}`).join("\n");
}

function fmtContacts(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const c = data as ContactLike;
  const parts = [];
  if (c.serviceArea) parts.push(`Зона виїзду: ${c.serviceArea}`);
  if (c.phone) parts.push(`Телефон: ${c.phone}`);
  if (c.email) parts.push(`Email: ${c.email}`);
  if (c.workingHours) parts.push(`Коли на зв'язку: ${c.workingHours}`);
  if (c.socialMedia) {
    const sm = c.socialMedia;
    if (sm.instagram) parts.push(`Instagram: ${sm.instagram}`);
    if (sm.facebook) parts.push(`Facebook: ${sm.facebook}`);
    if (sm.telegram) parts.push(`Telegram: ${sm.telegram}`);
  }
  return parts.join("\n");
}

function fmtHome(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const h = data as HomeLike;
  const parts = [];
  if (h.title) parts.push(`Назва: ${h.title}`);
  if (h.description) parts.push(`Опис: ${h.description}`);
  if (Array.isArray(h.features) && h.features.length) {
    parts.push(`\nНаші переваги:\n${h.features.join("\n")}`);
  }
  if (Array.isArray(h.featureCards) && h.featureCards.length) {
    parts.push(
      `\nДетальніше:\n${h.featureCards.map((f: { title: string; description: string }) => `• ${f.title}: ${f.description}`).join("\n")}`,
    );
  }
  return parts.join("\n");
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { messages, deviceId, deviceInfo, sessionId } = await req.json();
  const baseUrl = new URL(req.url).origin;

  // Get client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Fetch ALL site data in parallel
  const [prices, categories, news, offers, contacts, home] = await Promise.all([
    fetchData(baseUrl, "/api/data/prices"),
    fetchData(baseUrl, "/api/data/price-categories"),
    fetchData(baseUrl, "/api/data/news"),
    fetchData(baseUrl, "/api/data/offers"),
    fetchData(baseUrl, "/api/data/contacts"),
    fetchData(baseUrl, "/api/data/home"),
  ]);

  const systemPrompt = `Ти — розумний ШІ-помічник виїзних свят "Жирафик".
  Ти знаєш ВСЮ інформацію про сайт і допомагаєш відвідувачам знайти потрібну
  інформацію про послуги на виїзд, ціни, пакети, новини, спецпропозиції та контакти.
  Відповідай виключно українською мовою. Будь дружній, конкретний, не занадто довгий.
  Якщо запитання не стосується нашого виїзду — ввічливо поясни, що ти помічник саме цього сервісу.

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
  НОВИНИ ТА ПОДІЇ
  ══════════════════════════
  ${fmtNews(news)}

  ══════════════════════════
  СПЕЦІАЛЬНІ ПРОПОЗИЦІЇ / АКЦІЇ
  ══════════════════════════
  ${fmtOffers(offers)}

  Правила відповіді:
  1. Відповідай на основі ТІЛЬКИ наданих вище даних. Не вигадуй ціни, новини, контакти, кількість свят чи відстані.
  2. Якщо питають про ціну — дай точну інформацію з розділу «АКТУАЛЬНІ ЦІНИ». Якщо ціни там немає, скажи, що їх назве команда після заявки.
  3. Ми — виїзна команда, а не стаціонарний центр з адресою. Приїжджаємо за адресою клієнта: додому, до школи, у садок, кафе чи на майданчик. Працюємо по місту й області до 50 км без доплати, далі — 15 грн/км.
  4. Дату, час і наявність вільних слотів підтверджує команда зв'язком із клієнтом після заявки. Табло на сайті — демонстраційне, не обіцяй миттєвого бронювання.
  5. Якщо не маєш відповіді — порадь залишити заявку на сайті або написати команді в чат.
  6. Пиши без емодзі, без вигуків й без слів «магія», «чарівний», «найкращий». Тон: конкретний і спокійний.`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
  });

  type ChatMessage = { role: string; content: string };

  const allButLast: ChatMessage[] = messages.slice(0, -1);
  const firstUserIdx = allButLast.findIndex(
    (m: ChatMessage) => m.role === "user",
  );
  const validHistory =
    firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx);

  const history = validHistory.map((m: ChatMessage) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
          }
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
        const errMsg =
          "Вибачте, виникла помилка. Спробуйте ще раз або зателефонуйте нам!";
        fullResponse = errMsg;
        controller.enqueue(encoder.encode(`0:${JSON.stringify(errMsg)}\n`));
      } finally {
        controller.close();
        // Log the conversation asynchronously (don't block response)
        if (sessionId && deviceId) {
          logChat({
            sessionId,
            deviceId,
            deviceInfo: deviceInfo || {},
            userMessage: lastMessage.content,
            assistantMessage: fullResponse,
            ip,
          }).catch(console.error);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
