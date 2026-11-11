import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const contacts = await db.collection("contacts").findOne({});

    if (!contacts) {
      // Демо-контакти макета №2. Після підключення адмінки їх замінять
      // реальними значеннями з колекції contacts.
      return NextResponse.json({
        phone: "+38 (000) 000-00-00",
        email: "hello@girafik.example",
        workingHours: "Щодня з 9:00 до 21:00",
        serviceArea: "Місто й область до 50 км без доплати, далі 15 грн/км",
        whatsapp: "",
        telegram: "",
        socialMedia: {},
      });
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}
