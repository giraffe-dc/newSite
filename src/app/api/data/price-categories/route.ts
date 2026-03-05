import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const collection = db.collection("price_categories");

    let categories = await collection.find({}).sort({ order: 1 }).toArray();

    if (categories.length === 0) {
      const initialCategories = [
        { key: "games", label: "Ігрові зони", icon: "🎮", order: 1 },
        { key: "birthday", label: "Дні народження", icon: "🎂", order: 2 },
        { key: "family", label: "Сімейні пакети", icon: "👨‍👩‍👧‍👦", order: 3 },
        { key: "services", label: "Додаткові послуги", icon: "⭐", order: 4 },
      ];
      await collection.insertMany(initialCategories);
      categories = await collection.find({}).sort({ order: 1 }).toArray();
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price categories" },
      { status: 500 },
    );
  }
}
