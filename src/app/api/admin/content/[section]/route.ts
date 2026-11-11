import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  isSectionKey,
  matchesShape,
  SECTION_DEFAULTS,
  type SectionData,
  saveSection,
} from "@/lib/siteContent";

type Params = { params: Promise<{ section: string }> };

/** Збереження однієї секції + скидання кешу всього сайту. */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { section } = await params;
    if (!isSectionKey(section)) {
      return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    }

    let data: unknown;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Захист від зламаної структури: форма має повторювати дефолт секції.
    if (!matchesShape(data, SECTION_DEFAULTS[section])) {
      return NextResponse.json(
        { error: "Invalid section data" },
        { status: 400 },
      );
    }

    await saveSection(section, data as SectionData<typeof section>);

    // Правка одразу видна на публіці (усі сторінки кешуються як layout).
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 },
    );
  }
}
