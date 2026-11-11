import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const testimonials = await db
      .collection("testimonials")
      .find({ active: { $ne: false } })
      .sort({ date: -1 })
      .toArray();

    if (testimonials.length === 0) {
      return NextResponse.json([
        {
          name: "Оксана, мама Софійки (5 років)",
          text: "Замовляли аніматора та ростову ляльку на день народження доньки додому. Жирафик приїхав вчасно, діти в захваті! Ігри, танці, конкурси — 2 години пролетіли непомітно. Дякуємо за магію!",
          rating: 5,
          event: "День народження",
          location: "м. Вінниця",
          active: true,
          date: new Date().toISOString(),
        },
        {
          name: "Ірина, вихователь дитсадка «Сонечко»",
          text: "Брали повний пакет на випускний у садочку. Оформлення залу — просто казка! Аніматори влаштували справжнє шоу, батьки плакали від емоцій. Обов'язково замовимо ще!",
          rating: 5,
          event: "Випускний",
          location: "смт Теплик",
          active: true,
          date: new Date().toISOString(),
        },
        {
          name: "Андрій, тато Марка (12 років)",
          text: "VR-арена на виїзд — це щось неймовірне! Привезли шоломи, налаштували все за 20 хвилин, хлопці влаштували турнір. Найкращий день народження сина за роки.",
          rating: 5,
          event: "VR-вечірка",
          location: "м. Вінниця",
          active: true,
          date: new Date().toISOString(),
        },
        {
          name: "Марина, мама двійнят",
          text: "Оформлення свят у нас вдома перетворило звичайну квартиру на святкову сцену. Балони, гірлянди, фотозона — фото вийшли чудові. Прибирають за собою — великий плюс!",
          rating: 5,
          event: "День народження",
          location: "смт Теплик",
          active: true,
          date: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}
