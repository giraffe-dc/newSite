/* Локальний тест Етапу 3: автентифікація кабінету (OTP) і заявки клієнта.
   Потрібен запущений dev-сервер (npm run dev) і локальний Mongo з .env.local.

   Покриття:
   T1  401 без токена / зіпсований токен
   T2  400 на некоректний телефон
   T3  перший вхід → deep link otp_<32hex>
   T4  verify без коду до підтвердження → 401
   T5  webhook /start otp_<id> → прив'язка (fake chat, реальних повідомлень немає)
   T6  verify без коду після підтвердження → токен
   T7  GET /api/mobile/orders: обидві гілки $or (phoneNorm + legacy $expr)
   T8  verify з хибним кодом → attemptsLeft, далі 429
   T9  код із Telegram: перебір хеша → verify з правильним кодом → токен
   T10 cookie client_token приймається (PWA-шлях)
   T11 CORS: дозволений origin ехо + credentials, чужий — без хедерів
   T12 webhook без секрета → 401

   Збір: node scripts/test-mobile-cabinet.mjs   (після npm run dev) */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const SECRET_HEADER = "x-telegram-bot-api-secret-token";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function readEnvLocal() {
  const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const map = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return map;
}

async function post(url, body, headers = {}) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* порожня відповідь */
  }
  return { status: res.status, data, headers: res.headers };
}

async function get(url, headers = {}) {
  const res = await fetch(`${BASE}${url}`, { headers });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, data, headers: res.headers };
}

/** Перебір 6-значного коду за хешем — перевіряє схему hashOtp з clientAuth. */
function crackCode(phone, codeHash, secret) {
  const prefix = `${phone}:`;
  for (let i = 0; i < 1_000_000; i += 1) {
    const code = String(i).padStart(6, "0");
    const h = createHash("sha256")
      .update(`${prefix}${code}:${secret}`)
      .digest("hex");
    if (h === codeHash) return code;
  }
  return null;
}

async function main() {
  const env = readEnvLocal();
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI не задано у .env.local");
  const dbUri = new URL(uri);
  const dbName = (dbUri.pathname || "/zhyrafyk").replace(/^\//, "") || "zhyrafyk";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const orders = db.collection("orders");
  const otps = db.collection("otp_codes");
  const bindings = db.collection("client_telegrams");
  const threads = db.collection("chat_threads");
  const THREAD_ID = `m_test_${Date.now().toString(36)}_mobiletest01`;

  // Чистимо за собою (тільки локальна БД). Телефони унікальні для кожного
  // прогону: rate-limit тримається в пам'яті dev-сервера між прогонами.
  const RUN = Date.now().toString().slice(-7);
  const N9 = `67${RUN}`.slice(0, 8); // 8 цифр; 9-та різниться у PHONE_A/B
  const PHONE_A = `+380${N9}1`; // шлях deep-link (перший вхід)
  const PHONE_B = `+380${N9}2`; // шлях коду з Telegram
  const LEGACY9 = `${N9}2`; // ті самі 9 цифр, що у PHONE_B
  // Старий формат запису, без phoneNorm: останні 9 цифр збігаються.
  const LEGACY_PHONE = `8 (${LEGACY9.slice(0, 3)}) ${LEGACY9.slice(3, 6)}-${LEGACY9.slice(6, 8)}-${LEGACY9.slice(8)}`;
  const BUSY_DATE = '2030-01-15'; // майбутня підтверджена дата для busy-dates
  await Promise.all([
    otps.deleteMany({ phone: { $in: [PHONE_A, PHONE_B] } }),
    bindings.deleteMany({ _id: { $in: [PHONE_A, PHONE_B] } }),
    orders.deleteMany({ phone: { $in: [PHONE_B, LEGACY_PHONE] } }),
  ]);

  // Тестові заявки: нова (phoneNorm) і легасі (старий формат, без phoneNorm).
  await orders.insertMany([
    {
      customerName: "Тест Новий",
      phone: PHONE_B,
      phoneNorm: PHONE_B,
      eventAddress: "с. Теплик",
      eventType: "День народження",
      status: "confirmed",
      createdAt: "2026-11-18T10:00:00.000Z",
    },
    {
      customerName: "Тест Легасі",
      phone: LEGACY_PHONE,
      eventAddress: "с. Теплик",
      eventType: "Виїзд",
      // без status і phoneNorm — як у старих заявок
      createdAt: "2026-11-10T09:00:00.000Z",
    },
    {
      customerName: "Тест Зайнята дата",
      phone: PHONE_B,
      phoneNorm: PHONE_B,
      date: BUSY_DATE,
      status: "confirmed",
      createdAt: "2026-11-19T09:00:00.000Z",
    },
  ]);

  console.log("\n— Auth: базові перевірки —");
  let r = await get("/api/mobile/orders");
  check("T1a GET orders без токена → 401", r.status === 401, `status=${r.status}`);
  r = await get("/api/mobile/orders", { Authorization: "Bearer garbage.token.here" });
  check("T1b зіпсований токен → 401", r.status === 401, `status=${r.status}`);

  r = await post("/api/mobile/auth/request-code", { phone: "12345" });
  check("T2 некоректний телефон → 400", r.status === 400, `status=${r.status}`);

  console.log("\n— Шлях 1: перший вхід через deep link —");
  r = await post("/api/mobile/auth/request-code", { phone: PHONE_A });
  check(
    "T3 request-code → delivery=link",
    r.status === 200 && r.data?.delivery === "link",
    `status=${r.status} data=${JSON.stringify(r.data)}`,
  );
  const otpId = String(r.data?.link ?? "").match(/otp_([a-f0-9]{32})$/i)?.[1];
  check("T3b link містить otp_<32 hex>", Boolean(otpId), r.data?.link);

  r = await post("/api/mobile/auth/verify", { phone: PHONE_A });
  check(
    "T4 verify без коду до підтвердження → 401",
    r.status === 401 && r.data?.error === "Confirmation required",
    `status=${r.status} data=${JSON.stringify(r.data)}`,
  );

  if (otpId) {
    // Секрет вебхука — з .env.local. Fake chatId: запит падає в Telegram
    // (чат не існує), прив'язка в БД при цьому створюється.
    const secret = env.TELEGRAM_WEBHOOK_SECRET;
    const FAKE_CHAT = 911911911;
    const update = {
      update_id: 77_700_001,
      message: {
        message_id: 77_001,
        text: `/start otp_${otpId}`,
        from: { id: 911911911, first_name: "Тест" },
        chat: { id: FAKE_CHAT, type: "private" },
      },
    };

    r = await post("/api/telegram/webhook", update, {
      [SECRET_HEADER]: "wrong-secret",
    });
    check("T12 webhook без секрета → 401", r.status === 401, `status=${r.status}`);

    r = await post("/api/telegram/webhook", update, {
      [SECRET_HEADER]: secret,
    });
    check(
      "T5 webhook /start otp_ → otp-confirmed",
      r.data?.action === "otp-confirmed",
      `status=${r.status} data=${JSON.stringify(r.data)}`,
    );

    const binding = await bindings.findOne({ _id: PHONE_A });
    check(
      "T5b прив'язка phone ↔ chatId створена",
      binding?.chatId === FAKE_CHAT,
      JSON.stringify(binding),
    );

    // Ідемпотентність: повторний /start того самого чату — без помилки.
    r = await post("/api/telegram/webhook", update, {
      [SECRET_HEADER]: secret,
    });
    check(
      "T5c повторний /start otp_ ідемпотентний",
      r.data?.action === "otp-confirmed",
      JSON.stringify(r.data),
    );

    r = await post("/api/mobile/auth/verify", { phone: PHONE_A });
    check(
      "T6 verify без коду після підтвердження → токен",
      r.status === 200 && typeof r.data?.token === "string",
      `status=${r.status} data=${JSON.stringify(r.data)}`,
    );
    const tokenA = r.data?.token;
    check(
      "T6b у відповіді role=user і cookie client_token",
      r.data?.role === "user" &&
        String(r.headers.get("set-cookie") ?? "").includes("client_token="),
      `set-cookie=${r.headers.get("set-cookie")}`,
    );

    if (tokenA) {
      console.log("\n— Заявки клієнта: ізоляція —");
      // Заявки належать PHONE_B і легасі-номеру; у PHONE_A їх немає —
      // це і є перевірка, що чужі заявки не потрапляють у кабінет.
      r = await get("/api/mobile/orders", {
        Authorization: `Bearer ${tokenA}`,
      });
      check(
        "T7a чужі заявки не видно (0 для PHONE_A)",
        r.status === 200 && (r.data?.orders?.length ?? -1) === 0,
        `status=${r.status} count=${r.data?.orders?.length}`,
      );

      // T10: той самий токен у cookie (PWA-шлях).
      r = await get("/api/mobile/orders", {
        Cookie: `client_token=${tokenA}`,
      });
      check(
        "T10 cookie client_token приймається",
        r.status === 200 && (r.data?.orders?.length ?? -1) === 0,
        `status=${r.status}`,
      );
    }
  }

  console.log("\n— Шлях 2: код із Telegram —");
  r = await post("/api/mobile/auth/request-code", { phone: PHONE_B });
  check(
    "T8a request-code для неприв'язаного номера → link",
    r.status === 200 && r.data?.delivery === "link",
    `status=${r.status} data=${JSON.stringify(r.data)}`,
  );
  // Номер ще не прив'язаний, тож код у Telegram не йде — витягуємо його з
  // хеша в БД (перебір) і перевіряємо verify з кодом по-справжньому.
  const otpDoc = await otps
    .find({ phone: PHONE_B })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
  check("T8b код створено в otp_codes", Boolean(otpDoc), "doc не знайдено");

  if (otpDoc) {
    const code = crackCode(PHONE_B, otpDoc.codeHash, env.NEXTAUTH_SECRET);
    check("T8c код відновлюється з хеша (перебір)", Boolean(code), "не знайдено");

    r = await post("/api/mobile/auth/verify", { phone: PHONE_B, code: "000000" });
    const wrongIsRight = code === "000000";
    check(
      "T8d хибний код → 401 з attemptsLeft",
      wrongIsRight ? r.status === 200 : r.status === 401,
      `status=${r.status} data=${JSON.stringify(r.data)}`,
    );

    if (!wrongIsRight) {
      // Вичерпуємо ліміт спроб (разом із попередньою) → 429.
      let last = null;
      for (let i = 0; i < 5; i += 1) {
        last = await post("/api/mobile/auth/verify", {
          phone: PHONE_B,
          code: "000000",
        });
        if (last.status === 429) break;
      }
      check(
        "T8e після 5 спроб → 429",
        last?.status === 429,
        `status=${last?.status}`,
      );

      // Новий код (ліміт request-code: 3/10 хв на номер — встигаємо).
      // Пауза, щоб createdAt нового коду точно був більшим за старий
      // (інакше findActiveOtp може повернути вичерпаний).
      await new Promise((resolve) => setTimeout(resolve, 30));
      r = await post("/api/mobile/auth/request-code", { phone: PHONE_B });
      check("T8f новий код після вичерпаних спроб", r.status === 200, `status=${r.status}`);
      const otp2 = await otps
        .find({ phone: PHONE_B })
        .sort({ createdAt: -1 })
        .limit(1)
        .next();
      const code2 = otp2
        ? crackCode(PHONE_B, otp2.codeHash, env.NEXTAUTH_SECRET)
        : null;
      check("T8g другий код відновлено", Boolean(code2), "не знайдено");

      if (code2) {
        r = await post("/api/mobile/auth/verify", {
          phone: PHONE_B,
          code: code2,
        });
        check(
          "T9 правильний код → токен",
          r.status === 200 && typeof r.data?.token === "string",
          `status=${r.status} data=${JSON.stringify(r.data)}`,
        );
        if (r.data?.token) {
          const r2 = await get("/api/mobile/orders", {
            Authorization: `Bearer ${r.data.token}`,
          });
          const list = r2.data?.orders ?? [];
          check(
            "T9b заявки кодового шляху → 3 (обидві гілки $or + зайнята дата)",
            r2.status === 200 && list.length === 3,
            `count=${list.length}`,
          );
          check(
            "T7b сортування за createdAt спадно",
            list.length === 3 && list[0]?.createdAt >= list[1]?.createdAt,
            JSON.stringify(list.map((o) => o.createdAt)),
          );
          const legacy = list.find((o) => o.customerName === "Тест Легасі");
          check(
            "T7c легасі-заявка (старий формат, без status) → new",
            Boolean(legacy?._id) && legacy?.status === "new",
            JSON.stringify(legacy),
          );
          const confirmed = list.find((o) => o.customerName === "Тест Новий");
          check(
            "T7d заявка з phoneNorm → свій статус confirmed",
            confirmed?.status === "confirmed",
            JSON.stringify(confirmed?.status),
          );
        }
      }
    }
  }

  console.log("\n— Зайняті дати —");
  r = await get("/api/mobile/busy-dates");
  check(
    "T13a busy-dates → публічний 200",
    r.status === 200 && Array.isArray(r.data?.dates),
    `status=${r.status} data=${JSON.stringify(r.data)}`,
  );
  check(
    "T13b підтверджена дата у списку",
    (r.data?.dates ?? []).includes(BUSY_DATE),
    JSON.stringify(r.data?.dates),
  );
  check(
    "T13c без персональних даних (лише дати)",
    JSON.stringify(r.data).indexOf("customerName") === -1 &&
      JSON.stringify(r.data).indexOf("phone") === -1,
    JSON.stringify(r.data),
  );

  console.log("\n— Чат із командою (CORS для PWA) —");
  await threads.insertOne({
    threadId: THREAD_ID,
    deviceId: `dev_${THREAD_ID}`,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${THREAD_ID}_1`,
        role: "client",
        content: "Тестове повідомлення клієнта",
        channel: "site",
        createdAt: new Date().toISOString(),
      },
      {
        id: `msg_${THREAD_ID}_2`,
        role: "operator",
        content: "Тестова відповідь оператора",
        author: "Тест",
        channel: "telegram",
        createdAt: new Date().toISOString(),
      },
    ],
  });
  const PWA_ORIGIN = "https://giraffe-mobile.vercel.app";
  r = await get(`/api/chat/history?threadId=${THREAD_ID}`, { Origin: PWA_ORIGIN });
  check(
    "T14a history → повідомлення + CORS для PWA",
    r.status === 200 &&
      (r.data?.messages?.length ?? 0) === 2 &&
      r.headers.get("access-control-allow-origin") === PWA_ORIGIN,
    `status=${r.status} count=${r.data?.messages?.length} acao=${r.headers.get("access-control-allow-origin")}`,
  );
  r = await get(`/api/chat/poll?threadId=${THREAD_ID}`, { Origin: PWA_ORIGIN });
  check(
    "T14b poll → відповідь оператора + CORS",
    r.status === 200 &&
      (r.data?.messages?.length ?? 0) === 1 &&
      r.headers.get("access-control-allow-credentials") === "true",
    `status=${r.status} count=${r.data?.messages?.length}`,
  );
  const pre = await fetch(`${BASE}/api/chat/message`, {
    method: "OPTIONS",
    headers: {
      Origin: PWA_ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  check(
    "T14c preflight POST /api/chat/message → 204 + CORS",
    pre.status === 204 &&
      pre.headers.get("access-control-allow-origin") === PWA_ORIGIN,
    `status=${pre.status}`,
  );

  console.log("\n— Опитування (CORS для PWA) —");
  for (const [label, url, method, hdr] of [
    ["submit", "/api/survey/submit", "POST", { "Access-Control-Request-Method": "POST" }],
    ["vote", "/api/survey/vote", "POST", { "Access-Control-Request-Method": "POST" }],
    ["results", "/api/survey/results?newsId=000000000000000000000000", "GET", {}],
  ]) {
    if (method === "POST") {
      const p = await fetch(`${BASE}${url}`, {
        method: "OPTIONS",
        headers: { Origin: PWA_ORIGIN, ...hdr },
      });
      check(
        `T15 preflight /api/survey/${label} → CORS`,
        p.status === 204 &&
          p.headers.get("access-control-allow-origin") === PWA_ORIGIN,
        `status=${p.status}`,
      );
    } else {
      const g = await get(url, { Origin: PWA_ORIGIN });
      check(
        `T15 GET /api/survey/${label} → CORS`,
        g.headers.get("access-control-allow-origin") === PWA_ORIGIN,
        `status=${g.status} acao=${g.headers.get("access-control-allow-origin")}`,
      );
    }
  }

  console.log("\n— CORS —");
  r = await get("/api/mobile/orders", {
    Origin: "https://giraffe-mobile.vercel.app",
    Authorization: "Bearer garbage",
  });
  check(
    "T11a дозволений origin → echo + credentials",
    r.headers.get("access-control-allow-origin") ===
      "https://giraffe-mobile.vercel.app" &&
      r.headers.get("access-control-allow-credentials") === "true",
    `acao=${r.headers.get("access-control-allow-origin")}`,
  );
  r = await get("/api/mobile/orders", {
    Origin: "https://evil.example.com",
    Authorization: "Bearer garbage",
  });
  check(
    "T11b чужий origin → без CORS-хедерів",
    r.headers.get("access-control-allow-origin") === null,
    `acao=${r.headers.get("access-control-allow-origin")}`,
  );

  // Прибираємо тестові дані.
  await Promise.all([
    otps.deleteMany({ phone: { $in: [PHONE_A, PHONE_B] } }),
    bindings.deleteMany({ _id: { $in: [PHONE_A, PHONE_B] } }),
    orders.deleteMany({ phone: { $in: [PHONE_B, LEGACY_PHONE] } }),
    threads.deleteOne({ threadId: THREAD_ID }),
  ]);
  await client.close();

  console.log(`\nРезультат: ${passed} PASS, ${failed} FAIL`);
  if (failed) {
    console.log(`Не пройшли:\n  - ${failures.join("\n  - ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Помилка тесту:", error);
  process.exitCode = 1;
});
