import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const portfolio = await db
      .collection("portfolio")
      .find({ active: { $ne: false } })
      .sort({ priority: -1, date: -1 })
      .toArray();

    if (portfolio.length === 0) {
      return NextResponse.json([
        {
          title: "День народження Софійки, 5 років",
          description:
            "Аніматор + ростова лялька Жирафа вдома. Ігри, танці та фотосесія з іменним тортом.",
          category: "birthday",
          image: "",
          location: "м. Вінниця",
          active: true,
          priority: 10,
          date: new Date().toISOString(),
        },
        {
          title: "Випускний у дитсадку «Сонечко»",
          description:
            "Повне оформлення залу: гірлянди з фольгованих куль, фотозона, шоу двох аніматорів та дискотека з бульбашками.",
          category: "graduation",
          image: "",
          location: "смт Теплик",
          active: true,
          priority: 9,
          date: new Date().toISOString(),
        },
        {
          title: "VR-турнір для підлітків",
          description:
            "VR-арена на виїзд: 4 шоломи, командний турнір у мультиплеєр. Народний улюбленець — ритм-ігри та гонки.",
          category: "vr-party",
          image: "",
          location: "м. Вінниця",
          active: true,
          priority: 8,
          date: new Date().toISOString(),
        },
        {
          title: "Свято у молодшій школі",
          description:
            "Майстер-класи з творчості для двох класів: 60 дітей, 3 станції активностей та ростова лялька.",
          category: "garden-school",
          image: "",
          location: "смт Теплик",
          active: true,
          priority: 7,
          date: new Date().toISOString(),
        },
        {
          title: "Корпоратив з дитячою програмою",
          description:
            "Сімейний корпоратив: дитяча зона з Playstation та аніматорами, поки батьки на банкеті.",
          category: "corporate",
          image: "",
          location: "м. Вінниця",
          active: true,
          priority: 6,
          date: new Date().toISOString(),
        },
        {
          title: "Оформлення квартири «під казку»",
          description:
            "ДО/ПІСЛЯ: звичайна вітальня перетворилась на святкову сцену за 40 хвилин — цифра 5, гірлянди, фотозона з драпіруванням.",
          category: "other",
          image: "",
          location: "смт Теплик",
          active: true,
          priority: 5,
          date: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 },
    );
  }
}
