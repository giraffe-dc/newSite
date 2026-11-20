import type { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/mobileCors";
import { getDb } from "@/lib/mongodb";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: corsHeaders(req) });
  try {
    const { searchParams } = new URL(req.url);
    const newsId = searchParams.get("newsId");

    if (!newsId) {
      return reply({ error: "News ID is required" }, 400);
    }

    const db = await getDb();

    // Get the news item with survey results
    const news = await db.collection("news").findOne(
      { _id: newsId as unknown as ObjectId },
      {
        projection: {
          "survey.results": 1,
        },
      },
    );

    if (!news || !news.survey) {
      return reply({ error: "Survey not found" }, 404);
    }

    return reply(
      news.survey.results || {
        totalVotes: 0,
        optionResults: {},
        lastVoteAt: null,
      },
    );
  } catch (error) {
    console.error("Error getting survey results:", error);
    return reply({ error: "Internal server error" }, 500);
  }
}
