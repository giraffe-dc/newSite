/* Міграція пакетів: старі items (text + included) → нова модель
   з items: [{ variantId?, qty?, text }].

   Запуск: MONGODB_URI="..." node scripts/migrate-packages-variants.mjs
*/
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

const client = new MongoClient(uri);

// Мапінг тексту → variantId (ручне зіставлення)
const TEXT_TO_VARIANT = {
  "1 аніматор + ведучий": "animators-1",       // 1 год, 1500
  "2 аніматори +ведучий": "animators-3",        // 1 год, 2500 (СВЯТО НА ПОВНУ)
  "2 аніматори + ведучий": "animators-3",
  "паперове шоу": "shows-3",
  "блиск тату": "extras-1",
  "ростова лялька": "puppets-1",
  "2 vr-окулярів із насиченими іграми": "vr-1", // VR PORTAL 1 год
  "телевізор": "ps-1",                           // PS PORTAL 1 год
  "консоль, джойстики . ігри різного жанру": "ps-1",
  "консоль, джойстики. ігри різного жанру": "ps-1",
};

function matchVariant(text) {
  const lower = String(text || "").toLowerCase().trim();
  for (const [key, vid] of Object.entries(TEXT_TO_VARIANT)) {
    if (lower.includes(key.toLowerCase())) return vid;
  }
  // Fallback: check for VR/PS keywords
  if (lower.includes("vr-окуляр") || lower.includes("vr portal")) return "vr-1";
  if (lower.includes("телевізор") || lower.includes("консоль")) return "ps-1";
  if (lower.includes("паперове")) return "shows-3";
  if (lower.includes("блиск")) return "extras-1";
  if (lower.includes("ростов")) return "puppets-1";
  if (lower.includes("аніматор") && lower.includes("2")) return "animators-3";
  if (lower.includes("аніматор")) return "animators-1";
  return null;
}

async function main() {
  await client.connect();
  const db = client.db("zhyrafyk");
  const coll = db.collection("site_content");
  const doc = await coll.findOne({ section: "packages" });
  if (!doc || !doc.data || !Array.isArray(doc.data.packages)) {
    console.error("No packages found");
    process.exit(1);
  }

  const oldPackages = doc.data.packages;
  console.log(`Found ${oldPackages.length} packages`);

  // Backup
  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync("backup", { recursive: true });
  writeFileSync("backup/packages-pre-migration.json", JSON.stringify(oldPackages, null, 2));
  console.log("Backup saved");

  const newPackages = oldPackages.map((p) => {
    const priceNum = parseInt(String(p.price || "").replace(/[^\d]/g, ""), 10) || 0;
    const items = (p.items || []).map((item) => {
      const text = String(item.text || "").trim();
      const variantId = matchVariant(text);
      return {
        variantId: variantId || undefined,
        qty: variantId ? 1 : undefined,
        text,
      };
    });

    return {
      id: p.id,
      name: String(p.name || "").trim(),
      sub: p.sub || "",
      price: p.price || "",
      period: p.period || "",
      bundlePrice: priceNum,
      items,
      hit: p.hit || false,
      format: p.format || "Комбо-програма",
      audiences: p.audiences || [],
      published: p.published !== false,
    };
  });

  console.log("\nMigrated packages:");
  for (const p of newPackages) {
    const linked = p.items.filter((i) => i.variantId).length;
    console.log(`  ${p.name} (${p.id}): ${p.items.length} items, ${linked} linked to variants, bundlePrice=${p.bundlePrice}`);
  }

  await coll.updateOne(
    { section: "packages" },
    { $set: { data: { packages: newPackages, packageAddons: doc.data.packageAddons || "" }, updatedAt: new Date() } },
  );
  console.log("\nMigration complete.");
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
