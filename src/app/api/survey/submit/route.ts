import { type Document, ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { corsHeaders } from "@/lib/mobileCors";
import clientPromise from "@/lib/mongodb";
import { escapeTelegramHtml, sendTelegramMessageSurvey } from "@/lib/utils";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  /** Усі відповіді — з CORS (PWA на іншому домені). */
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: corsHeaders(req),
    });

  // Кожна відповідь шле Telegram-сповіщення — ліміт від флуду.
  if (!rateLimit(`survey:${clientIp(req)}`, 5, 10 * 60_000)) {
    return reply(
      { error: "Занадто багато відповідей. Спробуйте пізніше." },
      429,
    );
  }

  try {
    const body = await req.json();
    const { newsId, answers } = body || {};

    if (!newsId || !answers || typeof answers !== "object") {
      return reply({ error: "Invalid data" }, 400);
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk"); // Use same DB as other routes

    console.log("Received newsId:", newsId, typeof newsId);

    let news: Document | null = null;
    try {
      console.log("Looking up by ObjectId:", newsId);
      const objId = new ObjectId(newsId);
      news = await db.collection("news").findOne({ _id: objId });

      if (!news) {
        console.error("News not found with id:", newsId);
      }
    } catch (e) {
      console.error("DB lookup error:", e);
    }

    console.log(
      "Found news:",
      news ? "yes" : "no",
      "survey:",
      news?.survey ? "yes" : "no",
    );
    // Accept both choice-based (options) and free-form (fields) surveys
    const hasSurvey = !!(
      news?.survey &&
      (Array.isArray(news.survey.fields) || Array.isArray(news.survey.options))
    );

    if (!hasSurvey) {
      return reply({ error: "Survey not found" }, 404);
    }

    // Persist the free-form answers
    const payload = {
      newsId,
      answers,
      createdAt: new Date().toISOString(),
    };

    await db.collection("survey_responses").insertOne(payload);

    // Prepare telegram message: include news title and each label -> answer
    try {
      const lines: string[] = [];
      lines.push("📋 Нова відповідь на опитування");
      lines.push(`Тема: ${escapeTelegramHtml(news?.title) || "—"}`);
      if (news?.survey?.question) {
        lines.push(`Питання: ${escapeTelegramHtml(news.survey.question)}`);
      }

      const fields = news?.survey?.fields || [];
      for (const f of fields) {
        const val = escapeTelegramHtml(answers[f.id] || "");
        lines.push(`${escapeTelegramHtml(f.label)}: ${val}`);
      }

      await sendTelegramMessageSurvey(lines.join("\n"));
    } catch (tgErr) {
      console.error("Telegram notify error:", tgErr);
    }

    return reply({ success: true });
  } catch (err) {
    console.error("Error submitting survey response:", err);
    return reply({ error: "Internal server error" }, 500);
  }
}
