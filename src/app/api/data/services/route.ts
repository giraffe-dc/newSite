import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const services = await db
      .collection("services")
      .find({ active: { $ne: false } })
      .sort({ priority: -1, _id: -1 })
      .toArray();

    if (services.length === 0) {
      return NextResponse.json([
        {
          name: "Аніматор на виїзд",
          shortDescription: "Веселий ведучий для дитячого свята",
          description:
            "Професійний аніматор приїжджає до вас із костюмами, іграми та конкурсами. Ідеально для днів народжень та випускних.",
          category: "animation",
          priceFrom: "1500 грн",
          duration: "1-2 години",
          icon: "🎭",
          image: "",
          active: true,
          priority: 10,
        },
        {
          name: "Росовля лялька «Жирафа»",
          shortDescription: "Величезна лялька-жирафа для фото та ігор",
          description:
            "Ростова лялька жирафа — найпопулярніший гость на будь-якому святкуванні. Фотосесія, ігри та танці з дитьми.",
          category: "life-size-doll",
          priceFrom: "2000 грн",
          duration: "1 година",
          icon: "🦒",
          image: "",
          active: true,
          priority: 9,
        },
        {
          name: "VR-арена на виїзд",
          shortDescription: "Віртуальна реальність для гостей святкування",
          description:
            "Мобільний VR-комплект з шлемами та іграми для дітей і дорослих. Яскраві враження без виходу з дому.",
          category: "vr",
          priceFrom: "2500 грн",
          duration: "2 години",
          icon: "🎮",
          image: "",
          active: true,
          priority: 8,
        },
        {
          name: "Playstation-зона",
          shortDescription: "Ігрова консоль Playstation на ваше свято",
          description:
            "Привозимо Playstation зТелевізором і найпопулярнішими іграми. Ідеально для підлітків та дорослих гостей.",
          category: "playstation",
          priceFrom: "1800 грн",
          duration: "2 години",
          icon: "🕹️",
          image: "",
          active: true,
          priority: 7,
        },
        {
          name: "Творчий майстер-клас",
          shortDescription: "Мастер-клас із δημιουργства для дітей",
          description:
            "Рисування, лепка, створення сувенірів та інших творчих проєктів під наглядом майстра.",
          category: "master-class",
          priceFrom: "1200 грн",
          duration: "1 година",
          icon: "🎨",
          image: "",
          active: true,
          priority: 6,
        },
        {
          name: "Оформлення свят",
          shortDescription: "Балони, декор та оформлення простору",
          description:
            "Декоративне оформлення місця проведення святкування: балони, гірлянди, сті fade, фотозона.",
          category: "decor",
          priceFrom: "1000 грн",
          duration: "залежно від об'єму",
          icon: "🎈",
          image: "",
          active: true,
          priority: 5,
        },
      ]);
    }

    return NextResponse.json(services);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}
