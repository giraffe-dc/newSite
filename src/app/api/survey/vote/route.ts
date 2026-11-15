import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatRateLimit";
import { getDb } from "@/lib/mongodb";
import { escapeTelegramHtml, sendTelegramMessage } from "@/lib/utils";
import type { SurveyVoteData } from "@/types";

interface SurveyOption {
  id: string;
  text: string;
}

export async function POST(req: Request) {
  // Голосування без ліміту = маніпуляція результатами одним запитом-цунамі.
  if (!rateLimit(`vote:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Занадто багато голосів. Зачекайте хвилину." },
      { status: 429 },
    );
  }

  try {
    const { newsId, optionIds }: SurveyVoteData = await req.json();

    // Захист від NoSQL-ін'єкції: newsId має бути рядком з валідним ObjectId
    // (оператор на кшталт {"$gt": ""} не пройде), optionIds — масив рядків.
    if (
      typeof newsId !== "string" ||
      !ObjectId.isValid(newsId) ||
      !Array.isArray(optionIds) ||
      optionIds.length === 0 ||
      !optionIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
    }

    const newsObjectId = new ObjectId(newsId);
    const db = await getDb();

    // Get the news item to verify survey exists and isn't expired
    const news = await db.collection("news").findOne({
      _id: newsObjectId,
      "survey.endDate": { $gt: new Date().toISOString() },
    });

    if (!news || !news.survey) {
      return NextResponse.json(
        { error: "Survey not found or expired" },
        { status: 404 },
      );
    }

    // Verify option IDs are valid
    const validOptionIds = news.survey.options.map(
      (opt: SurveyOption) => opt.id,
    );
    const invalidOptions = optionIds.filter(
      (id) => !validOptionIds.includes(id),
    );

    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: "Invalid option IDs" },
        { status: 400 },
      );
    }

    // If multiple votes not allowed, ensure only one option
    if (!news.survey.allowMultiple && optionIds.length > 1) {
      return NextResponse.json(
        { error: "Multiple votes not allowed" },
        { status: 400 },
      );
    }

    // Record the vote
    const voteData: SurveyVoteData = {
      newsId,
      optionIds,
      votedAt: new Date().toISOString(),
    };

    await db.collection("survey_votes").insertOne(voteData);

    // Update vote counts in the news document
    const updateOps = optionIds.map((optionId) => ({
      [`survey.results.optionResults.${optionId}`]: 1,
    }));

    // Той самий фільтр, що й у перевірці: документ, який рахуємо, мусить бути
    // тим самим, який пройшов перевірку терміну дії опитування.
    await db.collection("news").updateOne(
      {
        _id: newsObjectId,
        "survey.endDate": { $gt: new Date().toISOString() },
      },
      {
        $inc: {
          "survey.results.totalVotes": 1,
          ...Object.assign({}, ...updateOps),
        },
        $set: {
          "survey.results.lastVoteAt": new Date().toISOString(),
        },
      },
    );

    // Fetch updated news to include in telegram message
    const updatedNews = await db
      .collection("news")
      .findOne({ _id: newsObjectId });

    try {
      if (updatedNews) {
        const chosenTexts = (news.survey.options || [])
          .filter((o: SurveyOption) => optionIds.includes(o.id))
          .map((o: SurveyOption) => o.text);
        const msgLines = [
          `🔔 Новий голос в опитуванні`,
          `Тема: ${escapeTelegramHtml(updatedNews.title) || "—"}`,
          `Питання: ${escapeTelegramHtml(news.survey.question)}`,
          `Вибрано: ${escapeTelegramHtml(chosenTexts.join(", "))}`,
          `Всього голосів: ${updatedNews.survey?.results?.totalVotes || ""}`,
        ];
        await sendTelegramMessage(msgLines.join("\n"));
      }
    } catch (tgErr) {
      console.error("Telegram notify error:", tgErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
