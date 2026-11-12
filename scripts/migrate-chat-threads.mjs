/* Одноразова міграція людських діалогів із chat_logs у chat_threads.
   Запуск: node scripts/migrate-chat-threads.mjs
   Ідемпотентна: існуючі chat_threads не перезаписуються ($setOnInsert).
   chat_logs лишається недоторканою — це аудит AI-діалогів. */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const env = {};
for (const path of [".env", ".env.local"]) {
  let content = "";
  try {
    content = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
}

if (!env.MONGODB_URI) {
  console.error("MONGODB_URI не задано");
  process.exit(1);
}

const DB_NAME = "zhyrafyk";
const COLLECTION = "chat_threads";

function legacyThreadId(deviceId) {
  const raw = String(deviceId ?? "unknown").replace(/[^A-Za-z0-9_-]/g, "");
  return `legacy_${raw.slice(0, 60) || "unknown"}`;
}

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return null;
}

function preview(text) {
  return String(text).replace(/\s+/g, " ").slice(0, 120);
}

const client = new MongoClient(env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db(DB_NAME);
  const logs = db.collection("chat_logs");
  const threads = db.collection(COLLECTION);

  await Promise.all([
    threads.createIndex(
      { threadId: 1 },
      { unique: true, name: "chat_thread_id_unique" },
    ),
    threads.createIndex(
      { status: 1, lastMessageAt: -1 },
      { name: "chat_status_last" },
    ),
    threads.createIndex(
      { "messages.telegramMessageId": 1 },
      { sparse: true, name: "chat_tg_message" },
    ),
  ]);

  const docs = await logs
    .find({
      $or: [{ mode: "admin" }, { "messages.role": "operator" }],
    })
    .toArray();

  const groups = new Map();
  for (const doc of docs) {
    const deviceId =
      typeof doc.deviceId === "string" && doc.deviceId
        ? doc.deviceId
        : String(doc.sessionId ?? "unknown");
    const key = legacyThreadId(deviceId);
    if (!groups.has(key)) {
      groups.set(key, { deviceId, docs: [], createdAt: null });
    }
    const group = groups.get(key);
    group.docs.push(doc);
    const created = toIso(doc.createdAt);
    if (created && (!group.createdAt || created < group.createdAt)) {
      group.createdAt = created;
    }
  }

  let created = 0;
  let skipped = 0;
  for (const [threadId, group] of groups) {
    if (await threads.findOne({ threadId }, { projection: { _id: 1 } })) {
      skipped += 1;
      continue;
    }

    const messages = group.docs
      .flatMap((doc) =>
        (Array.isArray(doc.messages) ? doc.messages : []).map((m) => ({
          role: m?.role,
          content: m?.content,
          adminName: m?.adminName,
          timestamp: m?.timestamp,
          delivered: m?.delivered,
        })),
      )
      .filter((m) => m.role === "user" || m.role === "operator")
      .map((m) => {
        const createdAt =
          toIso(m.timestamp) ?? group.createdAt ?? new Date().toISOString();
        return {
          id: `mig_${randomUUID()}`,
          role: m.role === "operator" ? "operator" : "client",
          content: String(m.content ?? "").slice(0, 2000),
          channel: m.role === "operator" ? "admin" : "site",
          createdAt,
          ...(typeof m.adminName === "string" ? { author: m.adminName } : {}),
          ...(m.delivered === true ? { deliveredAt: createdAt } : {}),
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    if (messages.length === 0) continue;

    const first = group.createdAt ?? messages[0].createdAt;
    const last = messages[messages.length - 1];
    await threads.updateOne(
      { threadId },
      {
        $setOnInsert: {
          threadId,
          deviceId: group.deviceId,
          status: "open",
          unreadForAdmin: 0,
          lastMessageAt: last.createdAt,
          lastMessagePreview: preview(last.content),
          createdAt: first,
          updatedAt: new Date().toISOString(),
          messages,
        },
      },
      { upsert: true },
    );
    created += 1;
    console.log(
      `+ ${threadId}: ${messages.length} повідомлень, останнє ${last.createdAt}`,
    );
  }

  console.log(
    `Готово. Джерел chat_logs: ${docs.length}, створено тредів: ${created}, пропущено існуючих: ${skipped}. chat_logs не змінено.`,
  );
} catch (error) {
  console.error("Помилка міграції:", error);
  process.exitCode = 1;
} finally {
  await client.close();
}
