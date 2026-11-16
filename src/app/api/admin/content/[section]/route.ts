import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { diffFields, recordAudit } from "@/lib/auditLog";
import { verifyAdmin } from "@/lib/auth";
import {
  getSection,
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
    const admin = token ? verifyAdmin(token) : null;
    if (!admin) {
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

    // Аудит (ADM-01): diff старого і нового стану секції перед записом.
    const before = (await getSection(section)) as Record<string, unknown>;

    await saveSection(section, data as SectionData<typeof section>);

    const actor = typeof admin.username === "string" ? admin.username : "admin";
    await recordAudit({
      actor,
      action: "update",
      entity: `section:${section}`,
      entityId: section,
      summary: `Секція «${section}» оновлена`,
      changes: diffFields(before, data as Record<string, unknown>),
    });

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
