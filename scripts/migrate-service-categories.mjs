/* Присвоєння категорій послугам у локальній БД.
   Запуск: MONGODB_URI="..." node scripts/migrate-service-categories.mjs
*/
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

const client = new MongoClient(uri);

// Мапінг title → category
const CATEGORY_MAP = {
  "весела компанія": "animators",
  "свято на повну": "animators",
  "ростова лялька": "puppets",
  "vr portal": "gaming",
  "ps  portal": "gaming",
  "ps portal": "gaming",
  "game portal max": "gaming",
  "бульбашкове шоу": "shows",
  "неонове шоу": "shows",
  "паперове шоу": "shows",
  "кріо шоу": "shows",
  "блиск тату": "extras",
  "новорічний експрес": "seasonal",
  "новорічний стандарт": "seasonal",
  "новорічний максі-експрес": "seasonal",
  "новорічний гранд": "seasonal",
};

const CATEGORY_LABELS = {
  animators: "Аніматорські програми",
  puppets: "Ростові ляльки",
  shows: "Шоу-програми",
  gaming: "VR & PS4 / GAME PORTAL",
  workshops: "Майстер-класи",
  extras: "Святкові доповнення",
  seasonal: "Сезонні (Новий рік)",
};

async function main() {
  await client.connect();
  const db = client.db("zhyrafyk");
  const coll = db.collection("site_content");
  const doc = await coll.findOne({ section: "services" });
  if (!doc || !doc.data || !Array.isArray(doc.data.services)) {
    console.error("No services found");
    process.exit(1);
  }

  let updated = 0;
  for (const s of doc.data.services) {
    const key = String(s.title || "").trim().toLowerCase().replace(/\s+/g, " ");
    const cat = CATEGORY_MAP[key];
    if (cat) {
      s.category = cat;
      updated++;
      console.log(`  ${s.title} → ${cat} (${CATEGORY_LABELS[cat]})`);
    } else {
      console.log(`  ${s.title} → (no category)`);
    }
  }

  await coll.updateOne(
    { section: "services" },
    { $set: { data: { services: doc.data.services }, updatedAt: new Date() } },
  );
  console.log(`\nUpdated ${updated} services with categories.`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
