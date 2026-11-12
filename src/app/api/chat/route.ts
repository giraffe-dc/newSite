import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getSections, type Sections } from "@/lib/siteContent";

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
// Статичні розділи (про нас, контакти, послуги, пакети, FAQ) — із `site_content`
// через getSections() (етап 5, п. 1); новини й спецпропозиції — живі колекції
// через /api/data/* (їхні колекції чинні, див. план, розділ 4).

interface NewsLike {
  date?: string;
  title: string;
  content: string;
}

interface OfferLike {
  title: string;
  description: string;
}

function fmtAbout(s: Sections): string {
  const h = s.hero.hero;
  const parts: string[] = [
    `Заголовок: ${h.titleLead}${h.titleAccent}${h.titleTail}`,
  ];
  if (h.lead) parts.push(h.lead);
  if (s.promises.promises.length) {
    parts.push(
      `\nНаші переваги:\n${s.promises.promises
        .map((p) => `• ${p.title} — ${p.text}`)
        .join("\n")}`,
    );
  }
  if (s.promises.trust.length) {
    parts.push(
      `\nФакти про команду: ${s.promises.trust
        .map((t) => `${t.value} ${t.label}`)
        .join(" · ")}`,
    );
  }
  return parts.join("\n");
}

function fmtContacts(s: Sections): string {
  const c = s.contacts.contacts;
  return [
    `Телефон: ${c.phone}`,
    `Email: ${c.email}`,
    `Коли на зв'язку: ${c.hours}`,
  ].join("\n");
}

function fmtServices(s: Sections): string {
  return s.services.services
    .map((x) => `• ${x.title} — ${x.price} ${x.unit}. ${x.desc}`)
    .join("\n");
}

function fmtPackages(s: Sections): string {
  const lines = s.packages.packages.map(
    (p) =>
      `• ${p.name} (${p.sub}) — ${p.price} ${p.period}; у комплекті: ${p.items
        .filter((i) => i.included)
        .map((i) => i.text)
        .join(", ")}`,
  );
  if (s.packages.packageAddons) lines.push(`\n${s.packages.packageAddons}`);
  return lines.join("\n");
}

function fmtFaq(s: Sections): string {
  return s.faq.faq.map((f) => `П: ${f.q}\nВ: ${f.a}`).join("\n\n");
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

// ── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { messages, deviceId, deviceInfo, sessionId } = await req.json();
  const baseUrl = new URL(req.url).origin;

  // Get client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Дані: статичні секції — з site_content (один запит), новини й акції —
  // з живих колекцій через внутрішні API (етап 5, п. 1).
  const [sections, news, offers] = await Promise.all([
    getSections(),
    fetchData(baseUrl, "/api/data/news"),
    fetchData(baseUrl, "/api/data/offers"),
  ]);

  const systemPrompt = `Ти — розумний ШІ-помічник виїзних свят "Жирафик".
  Ти знаєш ВСЮ інформацію про сайт і допомагаєш відвідувачам знайти потрібну
  інформацію про послуги на виїзд, ціни, пакети, новини, спецпропозиції та контакти.
  Відповідай виключно українською мовою. Будь дружній, конкретний, не занадто довгий.
  Якщо запитання не стосується нашого виїзду — ввічливо поясни, що ти помічник саме цього сервісу.

  ══════════════════════════
  ПРО НАС
  ══════════════════════════
  ${fmtAbout(sections)}

  ══════════════════════════
  КОНТАКТНА ІНФОРМАЦІЯ
  ══════════════════════════
  ${fmtContacts(sections)}

  ══════════════════════════
  ПОСЛУГИ ТА ЇХ ЦІНИ
  ══════════════════════════
  ${fmtServices(sections)}

  ══════════════════════════
  ПАКЕТИ СВЯТ
  ══════════════════════════
  ${fmtPackages(sections)}

  ══════════════════════════
  ПОШИРЕНІ ЗАПИТАННЯ (FAQ)
  ══════════════════════════
  ${fmtFaq(sections)}

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
  2. Якщо питають про ціну — дай точну інформацію з розділів «ПОСЛУГИ ТА ЇХ ЦІНИ» та «ПАКЕТИ СВЯТ». Якщо відповіді там немає — скажи, що їх назве команда після заявки.
  3. Ми — виїзна команда, а не стаціонарний центр з адресою. Приїжджаємо за адресою клієнта: додому, до школи, у садок, кафе чи на майданчик. Зона виїзду, відстань і доплати — за домовленістю: точні умови повідомить команда, не називай цифр за себе.
  4. Дату, час і наявність вільних слотів підтверджує команда зв'язком із клієнтом після заявки. Табло на сайті — демонстраційне, не обіцяй миттєвого бронювання.
  5. Типові питання (організація, підготовка, бронювання) закривай розділом «ПОШИРЕНІ ЗАПИТАННЯ (FAQ)» — відповідай звідти, не переказуючи своїми словами.
  6. Якщо не маєш відповіді — порадь залишити заявку на сайті або написати команді в чат.
  7. Пиши без емодзі, без вигуків й без слів «магія», «чарівний», «найкращий». Тон: конкретний і спокійний.`;

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
