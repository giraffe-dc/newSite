/* Міграція послуг: старі записи (окремі за тривалістю) → нова модель
   з variants: [{ id, label, durationMin, price }].

   Запуск: node scripts/migrate-services-variants.mjs
   За замовчуванням використовує MONGODB_URI з .env.local (локальна БД).
   Для проду: MONGODB_URI="..." node scripts/migrate-services-variants.mjs

   Скрипт робить backup у backup/services-pre-migration.json перед змінами.
*/
import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

// Load .env.local if exists
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
} catch {}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

const client = new MongoClient(uri);

function parsePrice(str) {
  if (!str) return 0;
  const m = String(str).match(/(\d[\d\s]*)/);
  return m ? parseInt(m[1].replace(/\s/g, ""), 10) : 0;
}

function parseDuration(unit) {
  if (!unit) return 0;
  const m = String(unit).match(/(\d+)\s*(год|хв|шт|min)/i);
  if (!m) return 0;
  const num = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u.startsWith("год")) return num * 60;
  if (u.startsWith("хв") || u.startsWith("min")) return num;
  if (u.startsWith("шт")) return 0; // unit item, not time
  return num;
}

function durationLabel(unit) {
  if (!unit) return "";
  const m = String(unit).match(/(\d+)\s*(год|хв|шт)/i);
  if (!m) return String(unit).trim();
  return `${m[1]} ${m[2]}`;
}

async function main() {
  await client.connect();
  const db = client.db("zhyrafyk");
  const coll = db.collection("site_content");

  const doc = await coll.findOne({ section: "services" });
  if (!doc || !doc.data || !Array.isArray(doc.data.services)) {
    console.error("No services found");
    process.exit(1);
  }

  const oldServices = doc.data.services;
  console.log(`Found ${oldServices.length} old service records`);

  // Backup
  mkdirSync("backup", { recursive: true });
  writeFileSync("backup/services-pre-migration.json", JSON.stringify(oldServices, null, 2));
  console.log("Backup saved to backup/services-pre-migration.json");

  // Group by normalized title
  const groups = new Map();
  for (const s of oldServices) {
    const key = String(s.title || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const newServices = [];
  for (const [key, items] of groups) {
    const base = items[0];
    const variants = items.map((s, idx) => ({
      id: `${base.id || key.replace(/\s/g, "-")}-${idx + 1}`,
      label: durationLabel(s.unit),
      durationMin: parseDuration(s.unit),
      price: parsePrice(s.price),
    }));

    // Dedupe variants by durationMin+price
    const seen = new Set();
    const uniqueVariants = variants.filter((v) => {
      const k = `${v.durationMin}-${v.price}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    newServices.push({
      id: base.id || key.replace(/\s/g, "-"),
      emoji: base.emoji || "",
      title: String(base.title || "").trim(),
      desc: String(base.desc || "").trim().replace(/\s+/g, " "),
      category: base.category || "",
      audiences: base.audiences || [],
      images: base.images || [],
      published: base.published !== false,
      variants: uniqueVariants,
      requirements: base.requirements || [],
      calcLabel: base.calcLabel || base.title,
      format: base.format || base.title,
    });
  }

  console.log(`Migrated to ${newServices.length} services with variants:`);
  for (const s of newServices) {
    console.log(`  ${s.title}: ${s.variants.map((v) => `${v.label}=${v.price}`).join(", ")}`);
  }

  // Update DB
  await coll.updateOne(
    { section: "services" },
    { $set: { data: { services: newServices }, updatedAt: new Date() } },
  );
  console.log("Migration complete. Updated site_content.services");

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
