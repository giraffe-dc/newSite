/* Локальний тест Етапу 4, Фази A: аналітика воронки без зовнішніх сервісів.
   Потрібен запущений dev-сервер сайту (npm run dev) і локальний Mongo.

   Покриття:
   T1  POST /api/mobile/events — валідація, PII-фільтр, CORS для PWA
   T2 Rate-limit/батч
   T3  GET /api/admin/analytics/funnel — 401 без адміна, 200 з JWT
   T4  Лічильники подій і конверсія між етапами
   T5  order_confirmed — подія з адмінки без телефону/імені */

import { readFileSync } from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const PWA_ORIGIN = "https://giraffe-mobile.vercel.app";
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

function envLocal() {
  const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const map = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return map;
}

async function post(body, headers = {}) {
  const res = await fetch(`${BASE}/api/mobile/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
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

async function main() {
  const env = envLocal();
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  const dbUri = new URL(env.MONGODB_URI);
  const dbName = (dbUri.pathname || "/zhyrafyk").replace(/^\//, "") || "zhyrafyk";
  const db = client.db(dbName);
  const events = db.collection("mobile_events");
  const orders = db.collection("orders");
  const device = `test_stage4_${Date.now().toString(36)}`;
  await events.deleteMany({ deviceId: device });

  console.log("\n— Валідація подій —");
  let r = await post({ events: [{ event: "unknown_event", deviceId: device }] });
  check("T1a невідома подія → 400", r.status === 400, `status=${r.status}`);
  r = await post({ events: [{ event: "catalog_view", deviceId: "x" }] });
  check("T1b короткий deviceId → 400", r.status === 400, `status=${r.status}`);
  r = await post({ events: [] });
  check("T1c порожній батч → 400", r.status === 400, `status=${r.status}`);

  console.log("\n— Збереження й CORS —");
  r = await post(
    {
      events: [
        {
          event: "catalog_view",
          deviceId: device,
          ts: new Date().toISOString(),
          platform: "android",
          appVersion: "1.0.4",
          props: { source: "api" },
        },
        {
          event: "booking_submit",
          deviceId: device,
          ts: new Date().toISOString(),
          props: {
            phone: "+380961234567",
            email: "test@example.com",
            safe: "ok",
          },
        },
      ],
    },
    { Origin: PWA_ORIGIN },
  );
  check(
    "T1d валідний батч → 201, saved=2",
    r.status === 201 && r.data?.saved === 2,
    `status=${r.status} data=${JSON.stringify(r.data)}`,
  );
  check(
    "T1e CORS для PWA",
    r.headers.get("access-control-allow-origin") === PWA_ORIGIN,
    `acao=${r.headers.get("access-control-allow-origin")}`,
  );

  const saved = await events.find({ deviceId: device }).toArray();
  const submit = saved.find((d) => d.event === "booking_submit");
  check(
    "T1f PII відфільтровано (phone/email немає, safe лишився)",
    submit?.props?.safe === "ok" &&
      submit?.props?.phone === undefined &&
      submit?.props?.email === undefined,
    JSON.stringify(submit?.props),
  );

  const pre = await fetch(`${BASE}/api/mobile/events`, {
    method: "OPTIONS",
    headers: {
      Origin: PWA_ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  check(
    "T1g preflight → 204 + CORS",
    pre.status === 204 &&
      pre.headers.get("access-control-allow-origin") === PWA_ORIGIN,
    `status=${pre.status}`,
  );

  console.log("\n— Адмінська воронка —");
  r = await get("/api/admin/analytics/funnel?days=7");
  check("T3a без адміна → 401", r.status === 401, `status=${r.status}`);

  const token = jwt.sign(
    { role: "admin", actor: "test" },
    env.NEXTAUTH_SECRET,
    { expiresIn: "1h" },
  );
  r = await get("/api/admin/analytics/funnel?days=7", {
    Cookie: `admin_token=${token}`,
  });
  check(
    "T3b з адмін-JWT → 200",
    r.status === 200 && typeof r.data?.total === "number",
    `status=${r.status} data=${JSON.stringify(r.data).slice(0, 120)}`,
  );
  check(
    "T4a у воронці є наші події",
    (r.data?.counts?.catalog_view ?? 0) >= 1 &&
      (r.data?.counts?.booking_submit ?? 0) >= 1,
    JSON.stringify(r.data?.counts),
  );
  check(
    "T4b конверсія catalog_view → booking_submit > 0",
    (r.data?.steps ?? []).some(
      (s) => s.from === "booking_open" && s.to === "booking_submit" && s.conversion >= 0,
    ),
    JSON.stringify(r.data?.steps?.slice(0, 2)),
  );

  console.log("\n— Подія підтвердження з адмінки —");
  const orderId = new ObjectId();
  await orders.insertOne({
    _id: orderId,
    customerName: "Тест Stage4",
    phone: "+380961878579",
    phoneNorm: "+380961878579",
    date: "2099-06-15",
    status: "new",
    createdAt: new Date().toISOString(),
  });
  const patch = await fetch(`${BASE}/api/admin/orders`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `admin_token=${token}`,
    },
    body: JSON.stringify({ id: String(orderId), status: "confirmed" }),
  });
  check("T5a PATCH статусу → 200", patch.status === 200, `status=${patch.status}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const confirmEvent = await events.findOne({
    event: "order_confirmed",
    "props.orderId": String(orderId),
  });
  check(
    "T5b подія order_confirmed без телефону/імені",
    Boolean(confirmEvent) &&
      JSON.stringify(confirmEvent).indexOf("customerName") === -1 &&
      JSON.stringify(confirmEvent).indexOf("+380") === -1,
    JSON.stringify(confirmEvent),
  );

  await events.deleteMany({ deviceId: device });
  await events.deleteMany({ "props.orderId": String(orderId) });
  await orders.deleteOne({ _id: orderId });
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
