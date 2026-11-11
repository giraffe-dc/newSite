import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const homeData = await db.collection("home").findOne({});
    const homeDataFeatures = await db.collection("features").find({}).toArray();

    if (!homeData) {
      return NextResponse.json({
        title: "Жирафик — свято приїжджає додому",
        subtitle: "Аніматори, ростові ляльки, VR-клас і PlayStation 4",
        description:
          "Виїзні свята «Жирафик»: аніматори, ростові ляльки, VR-клас і PlayStation 4 прямо до квартири, школи чи на майданчик. Працюємо по місту й області до 50 км без доплати.",
        featureCards: [],
        features: [],
        images: [],
        workingHours: "Щодня з 9:00 до 21:00",
        serviceArea: "Місто й область до 50 км без доплати, далі 15 грн/км",
      });
    }
    // console.log(homeDataFeatures);
    // const homeDataAll = { ...homeData, featureCards: homeDataFeatures };
    // console.log(homeDataAll);
    return NextResponse.json({ ...homeData, featureCards: homeDataFeatures });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 },
    );
  }
}
