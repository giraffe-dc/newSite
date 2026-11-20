// Тест /api/mobile/version на локальному dev-сервері (localhost:3000).
import fs from "node:fs";

const BASE = "http://localhost:3000";
const key = fs
  .readFileSync(".env.local", "utf8")
  .match(/^MOBILE_RELEASE_KEY=(.+)$/m)?.[1]
  ?.trim();

if (!key) {
  console.error("MOBILE_RELEASE_KEY не знайдено в .env.local");
  process.exit(1);
}

const manifest = {
  versionName: "9.9.9",
  versionCode: 999,
  changelog: ["Тест БД"],
  publishedAt: "2026-11-20",
  sha256: "A".repeat(64),
  apkUrl: "https://example.com/x.apk",
};

const results = [];
function check(name, actual, expected) {
  const ok =
    typeof expected === "function" ? expected(actual) : actual === expected;
  results.push(`${ok ? "PASS" : "FAIL"} ${name} -> ${actual}`);
  return ok;
}

// 1) GET до публікації — fallback на файл (у БД ще немає або є старе)
const get1 = await fetch(`${BASE}/api/mobile/version`);
const body1 = await get1.json();
check("GET before status", get1.status, 200);
check("GET before versionName is string", typeof body1.versionName, "string");

// 2) POST без ключа → 401
const postNoKey = await fetch(`${BASE}/api/mobile/version`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(manifest),
});
check("POST no key", postNoKey.status, 401);

// 3) POST з хибним ключем → 401
const postBadKey = await fetch(`${BASE}/api/mobile/version`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer wrong-key",
  },
  body: JSON.stringify(manifest),
});
check("POST bad key", postBadKey.status, 401);

// 4) POST валідний, але битий маніфест → 400
const postInvalid = await fetch(`${BASE}/api/mobile/version`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({ foo: 1 }),
});
check("POST invalid manifest", postInvalid.status, 400);

// 5) POST валідний маніфест → 201
const postOk = await fetch(`${BASE}/api/mobile/version`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify(manifest),
});
check("POST valid", postOk.status, 201);

// 6) GET після публікації — версія вже з БД
const get2 = await fetch(`${BASE}/api/mobile/version`);
const body2 = await get2.json();
check("GET after versionName", body2.versionName, "9.9.9");
check("GET after versionCode", body2.versionCode, 999);
check(
  "GET after apkUrl passthrough",
  body2.apkUrl,
  "https://example.com/x.apk",
);

// 7) OPTIONS → 204 + CORS
const opt = await fetch(`${BASE}/api/mobile/version`, { method: "OPTIONS" });
check("OPTIONS status", opt.status, 204);
check(
  "OPTIONS CORS header",
  opt.headers.get("access-control-allow-origin"),
  "*",
);

// 8) Сторінка /app віддає 200 і містить версію з БД
const page = await fetch(`${BASE}/app`);
const html = await page.text();
check("GET /app status", page.status, 200);
check("GET /app shows DB version", html.includes("9.9.9"), true);

// Повертаємо стан назад (v1.0.3 з файлу), щоб локальна БД не лишилась з тестом.
const restore = {
  versionName: "1.0.3",
  versionCode: 4,
  changelog: [
    "Додано перевірку нових версій прямо в додатку",
    "Каталог послуг і пакетів, бронювання, контакти",
  ],
  publishedAt: "2026-11-19",
  sha256: "2C6CA653262E61A77E628217680A489154C1762321772487363FC89EBE6C80D4",
  apkUrl:
    "https://github.com/giraffe-dc/newSite/releases/download/v1.0.3/giraffe-mobile-1.0.3-b4.apk",
};
const postRestore = await fetch(`${BASE}/api/mobile/version`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify(restore),
});
check("POST restore", postRestore.status, 201);

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
