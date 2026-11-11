import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const packages = await db
      .collection("packages")
      .find({ active: { $ne: false } })
      .sort({ priority: -1, _id: -1 })
      .toArray();

    if (packages.length === 0) {
      return NextResponse.json([
        {
          name: "Базове свято",
          description:
            "Аніматор + оформлення для камерного святкування в колі рідних.",
          price: "2500 грн",
          duration: "2 години",
          includes: ["Аніматор (1 година)", "Оформлення балонами", "Ігри та конкурси"],
          recommended: false,
          active: true,
          priority: 3,
          icon: "🎈",
        },
        {
          name: "Преміум свято",
          description:
            "Повноцінне святкування з аніматором, ростовою лялкою та оформленням.",
          price: "5000 грн",
          duration: "3 години",
          includes: [
            "Аніматор (2 години)",
            "Росовля лялька (1 година)",
            "Оформлення свят",
            "Фотосесія",
          ],
          recommended: true,
          active: true,
          priority: 10,
          icon: "👑",
        },
        {
          name: "VR-вечірка",
          description:
            "Ігрова вечірка з VR-ареною та Playstation для підлітків та дорослих.",
          price: "4000 грн",
          duration: "3 години",
          includes: [
            "VR-арена (2 години)",
            "Playstation-зона (1 година)",
            "Консультація інструктора",
          ],
          recommended: false,
          active: true,
          priority: 8,
          icon: "🎮",
        },
        {
          name: "Випускний у саду/школі",
          description:
            "Яскраве святкування випуску з аніматорами, ростовими ляльками та декором.",
          price: "6000 грн",
          duration: "4 години",
          includes: [
            "Два аніматори",
            "Росовля лялька",
            "Оформлення залу",
            "Дискотека та ігри",
          ],
          recommended: false,
          active: true,
          priority: 7,
          icon: "🎓",
        },
      ]);
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}
