/* Виправлення даних секції `packages` після PKG-01 міграції:
   1) variantId, що не посилаються на існуючий ServiceVariant (animators-1 →
      animators 1-1 тощо) — перезаписуємо на валідний id;
   2) `null` у variantId/qty (текстові позиції) — видаляємо ключ, бо
      matchesShape вимагає рядок/число: один `null` відкочував увесь
      документ packages до порожніх дефолтів (сайт не показував пакети).

   Запуск: MONGODB_URI="mongodb://127.0.0.1:27018/?directConnection=true" node scripts/fix-packages-data.mjs
   Підтвердження: --write (без нього — лише друк змін). */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Потрібен MONGODB_URI");
  process.exit(1);
}
const write = process.argv.includes("--write");

/* Старі умовні id → реальні id варіантів (див. dump послуг у БД). */
const REFS = {
  "animators-1": "animators 1-1",
  "animators-3": "animators 3-1",
  "shows-3": "шоу 3-1",
  "extras-1": "new-008nqqs-1",
  "ps-1": "ps 1-1",
};

const client = new MongoClient(uri);
await client.connect();
const db = client.db("zhyrafyk");
const col = db.collection("site_content");

const sDoc = await col.findOne({ section: "services" });
const pDoc = await col.findOne({ section: "packages" });
if (!sDoc || !pDoc) {
  console.error("Не знайдено секції services/packages");
  process.exit(1);
}

const valid = new Set(
  (sDoc.data.services ?? []).flatMap((s) =>
    (s.variants ?? []).map((v) => v.id),
  ),
);

let changed = 0;
const packages = (pDoc.data.packages ?? []).map((pkg) => {
  const items = (pkg.items ?? []).map((item, idx) => {
    const next = { ...item };
    const note = [];
    if (next.variantId == null) {
      delete next.variantId;
      note.push("variantId:null → видалено");
    } else if (!valid.has(next.variantId)) {
      const target = REFS[next.variantId];
      if (target && valid.has(target)) {
        next.variantId = target;
        note.push(`${item.variantId} → ${target}`);
      } else {
        delete next.variantId;
        note.push(`${item.variantId} → невідомий, видалено`);
      }
    }
    if (next.qty == null && "qty" in next) {
      delete next.qty;
      note.push("qty:null → видалено");
    }
    if (note.length) {
      changed++;
      console.log(`  [${pkg.id}] #${idx + 1}: ${note.join("; ")}`);
    }
    return next;
  });
  return { ...pkg, items };
});

console.log(`Разом правок: ${changed}`);
if (!write) {
  console.log("(dry-run; запусти з --write для запису)");
  await client.close();
  process.exit(0);
}

await col.updateOne(
  { section: "packages" },
  { $set: { data: { ...pDoc.data, packages }, updatedAt: new Date() } },
);
console.log("Записано в БД.");
await client.close();
