import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { SECTION_DEFAULTS } from "@/lib/sectionDefaults";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const contacts = await db.collection("contacts").findOne({});

    if (!contacts) {
      // Документа немає → дефолти з content.ts (те саме джерело, що й на
      // сайті через site_content); демо-контакти макета прибрано (етап 5).
      const c = SECTION_DEFAULTS.contacts.contacts;
      return NextResponse.json({
        phone: c.phone,
        email: c.email,
        workingHours: c.hours,
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
