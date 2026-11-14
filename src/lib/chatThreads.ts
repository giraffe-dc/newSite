/* Живі діалоги «Зв'язок із командою» (етапи 1–2 плану
   docs/2026-11-12-chat-admin-telegram-plan.md).

   chat_logs лишається append-only аудитом AI-діалогів; сюди пишемо тільки
   людську переписку. Ключ — довговічний threadId (crypto.randomUUID() у
   localStorage клієнта), а не sessionId із useRef, який змінювався на F5. */

import { randomUUID } from "node:crypto";
import type { ObjectId, UpdateFilter } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const CHAT_THREADS_COLLECTION = "chat_threads";

export type ChatChannel = "site" | "admin" | "telegram";
export type ThreadStatus = "open" | "closed" | "archived";
export type ChatRole = "client" | "operator";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  channel: ChatChannel;
  author?: string;
  /** ISO-рядки: лексикографне порівняння = порівняння за часом. */
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  /** Етап 3: мапінг reply-to та ідемпотентність Telegram-webhook. */
  telegramMessageId?: number;
  telegramUpdateId?: number;
}

export interface ChatThread {
  _id?: ObjectId;
  threadId: string;
  deviceId: string;
  deviceInfo?: Record<string, unknown>;
  ip?: string;
  clientName?: string;
  clientPhone?: string;
  status: ThreadStatus;
  unreadForAdmin: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatThreadSummary {
  _id: string;
  threadId: string;
  deviceId: string;
  clientName?: string;
  clientPhone?: string;
  status: ThreadStatus;
  unreadForAdmin: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}

let indexesPromise: Promise<void> | null = null;

/** Індекси створюємо один раз на процес; помилку не кешуємо. */
export function ensureChatIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const col = (await getDb()).collection<ChatThread>(
        CHAT_THREADS_COLLECTION,
      );
      await Promise.all([
        col.createIndex(
          { threadId: 1 },
          { unique: true, name: "chat_thread_id_unique" },
        ),
        col.createIndex(
          { status: 1, lastMessageAt: -1 },
          { name: "chat_status_last" },
        ),
        col.createIndex(
          { "messages.telegramMessageId": 1 },
          { sparse: true, name: "chat_tg_message" },
        ),
        // Етап 3: ідемпотентність webhook (повторний update_id не дає дубля).
        col.createIndex(
          { "messages.telegramUpdateId": 1 },
          { sparse: true, name: "chat_tg_update" },
        ),
        // Бейдж непрочитаних у сайдбарі / фільтр «Непрочитані».
        col.createIndex(
          { unreadForAdmin: 1 },
          { name: "chat_unread_admin" },
        ),
      ]);
    })().catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }
  return indexesPromise;
}

export function normalizeText(value: unknown, max = 2000): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/** threadId — водночас ідентифікатор і bearer-capability: вгадати UUID
 *  нереально, тому окремий токен для публічного читання не потрібен. */
export function isValidThreadId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,80}$/.test(value);
}

/** Старі клієнти (і легасі /api/admin/chat-logs/reply) знають лише deviceId. */
export function legacyThreadId(deviceId: unknown): string {
  const raw = String(deviceId ?? "unknown").replace(/[^A-Za-z0-9_-]/g, "");
  return `legacy_${raw.slice(0, 60) || "unknown"}`;
}

function preview(text: string): string {
  return text.replace(/\s+/g, " ").slice(0, 120);
}

function toIso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function toSummary(doc: ChatThread): ChatThreadSummary {
  return {
    _id: String(doc._id),
    threadId: doc.threadId,
    deviceId: doc.deviceId,
    clientName: doc.clientName,
    clientPhone: doc.clientPhone,
    status: doc.status,
    unreadForAdmin: doc.unreadForAdmin ?? 0,
    lastMessageAt: doc.lastMessageAt,
    lastMessagePreview: doc.lastMessagePreview ?? "",
    createdAt: doc.createdAt,
  };
}

export interface AppendClientInput {
  threadId: string;
  deviceId: string;
  text: string;
  deviceInfo?: Record<string, unknown>;
  ip?: string;
  clientName?: string;
  clientPhone?: string;
}

/** Повідомлення клієнта. Нове повідомлення знову відкриває закритий діалог
 *  і збільшує лічильник непрочитаних для адміна. */
export async function appendClientMessage(
  input: AppendClientInput,
): Promise<{ message: ChatMessage; isNew: boolean }> {
  await ensureChatIndexes();
  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: randomUUID(),
    role: "client",
    content: input.text,
    channel: "site",
    createdAt: now,
  };

  const set: Record<string, unknown> = {
    deviceId: input.deviceId,
    lastMessageAt: now,
    lastMessagePreview: preview(input.text),
    updatedAt: now,
    status: "open",
  };
  if (input.deviceInfo) set.deviceInfo = input.deviceInfo;
  if (input.ip) set.ip = input.ip;
  if (input.clientName) set.clientName = input.clientName;
  if (input.clientPhone) set.clientPhone = input.clientPhone;

  /* $setOnInsert не містить messages / unreadForAdmin / status — інакше
     конфлікт шляхів із $push / $inc / $set. Відсутнє поле $inc читає як 0. */
  const update = {
    $setOnInsert: { threadId: input.threadId, createdAt: now },
    $set: set,
    $inc: { unreadForAdmin: 1 },
    $push: { messages: message },
  } as unknown as UpdateFilter<ChatThread>;

  const result = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .updateOne({ threadId: input.threadId }, update, { upsert: true });

  return { message, isNew: result.upsertedCount > 0 };
}

export interface AppendOperatorInput {
  threadId: string;
  text: string;
  channel: "admin" | "telegram";
  author?: string;
  telegramMessageId?: number;
  telegramUpdateId?: number;
}

/** Відповідь із адмінки або з Telegram. Тред має існувати — інакше 404. */
export async function appendOperatorMessage(
  input: AppendOperatorInput,
): Promise<ChatMessage | null> {
  await ensureChatIndexes();
  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: randomUUID(),
    role: "operator",
    content: input.text,
    channel: input.channel,
    createdAt: now,
  };
  if (input.author) message.author = input.author;
  if (typeof input.telegramMessageId === "number") {
    message.telegramMessageId = input.telegramMessageId;
  }
  if (typeof input.telegramUpdateId === "number") {
    message.telegramUpdateId = input.telegramUpdateId;
  }

  const update = {
    $set: {
      lastMessageAt: now,
      lastMessagePreview: preview(input.text),
      updatedAt: now,
    },
    $push: { messages: message },
  } as unknown as UpdateFilter<ChatThread>;

  const result = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .updateOne({ threadId: input.threadId }, update);

  return result.matchedCount > 0 ? message : null;
}

/** Етап 3: прив'язати message_id у Telegram (картка клієнта або підтвердження
 *  webhook) до повідомлення треда — за ним «Відповісти» знайде тред. */
export async function setMessageTelegramId(
  threadId: string,
  messageId: string,
  telegramMessageId: number,
): Promise<boolean> {
  await ensureChatIndexes();
  const result = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .updateOne(
      { threadId, "messages.id": messageId },
      { $set: { "messages.$[elem].telegramMessageId": telegramMessageId } },
      {
        arrayFilters: [{ "elem.id": messageId }],
      },
    );
  return result.matchedCount > 0;
}

/** Етап 3b: знайти тред за message_id картки в Telegram («Відповісти»). */
export async function findThreadByTelegramMessageId(
  telegramMessageId: number,
): Promise<ChatThread | null> {
  await ensureChatIndexes();
  return (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .findOne({ "messages.telegramMessageId": telegramMessageId });
}

/** Етап 3b: ідемпотентність — повторний update_id вже оброблений. */
export async function findThreadByTelegramUpdateId(
  telegramUpdateId: number,
): Promise<ChatThread | null> {
  await ensureChatIndexes();
  return (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .findOne({ "messages.telegramUpdateId": telegramUpdateId });
}

/** Етап 3b: /reply <shortId> — пошук за префіксом threadId (перші 8 символів
 *  із картки). Префікс екранується від regex-спецсимволів. */
export async function findThreadByShortId(
  shortId: string,
): Promise<ChatThread | null> {
  const cleaned = shortId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  if (cleaned.length < 4) return null;
  await ensureChatIndexes();
  const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .findOne({ threadId: { $regex: `^${escaped}` } });
}

/** Невручені відповіді оператора + позначка deliveredAt однією операцією. */
export async function pollOperatorMessages(
  threadId: string,
): Promise<ChatMessage[]> {
  await ensureChatIndexes();
  const col = (await getDb()).collection<ChatThread>(CHAT_THREADS_COLLECTION);
  const doc = await col.findOne({ threadId }, { projection: { messages: 1 } });
  if (!doc?.messages?.length) return [];

  const pending = doc.messages.filter(
    (m) => m.role === "operator" && !m.deliveredAt,
  );
  if (pending.length === 0) return [];

  const now = new Date().toISOString();
  const update = {
    $set: { "messages.$[elem].deliveredAt": now },
  } as unknown as UpdateFilter<ChatThread>;
  await col.updateOne({ threadId }, update, {
    arrayFilters: [
      { "elem.role": "operator", "elem.deliveredAt": { $exists: false } },
    ],
  });
  return pending.map((m) => ({ ...m, deliveredAt: now }));
}

/** Історія для відновлення після F5. */
export async function getClientHistory(
  threadId: string,
  limit = 100,
): Promise<{
  status: ThreadStatus;
  clientName?: string;
  clientPhone?: string;
  messages: ChatMessage[];
} | null> {
  await ensureChatIndexes();
  const doc = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .findOne(
      { threadId },
      { projection: { messages: 1, status: 1, clientName: 1, clientPhone: 1 } },
    );
  if (!doc) return null;
  const messages = (doc.messages ?? []).slice(-Math.min(limit, 200));
  return {
    status: doc.status,
    clientName: doc.clientName,
    clientPhone: doc.clientPhone,
    messages,
  };
}

export async function listThreads(
  options: { status?: ThreadStatus | "all"; limit?: number } = {},
): Promise<ChatThreadSummary[]> {
  await ensureChatIndexes();
  const filter =
    options.status && options.status !== "all"
      ? { status: options.status }
      : {};
  const docs = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .find(filter, { projection: { messages: 0 } })
    .sort({ lastMessageAt: -1 })
    .limit(Math.min(options.limit ?? 50, 100))
    .toArray();
  return docs.map((doc) => toSummary(doc));
}

export async function getThread(threadId: string): Promise<ChatThread | null> {
  await ensureChatIndexes();
  return (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .findOne({ threadId });
}

/** Відкриття діалогу адміном скидає лічильник і позначає прочитані повідомлення. */
export async function markThreadRead(threadId: string): Promise<boolean> {
  await ensureChatIndexes();
  const now = new Date().toISOString();
  const update = {
    $set: {
      unreadForAdmin: 0,
      "messages.$[elem].readAt": now,
    },
  } as unknown as UpdateFilter<ChatThread>;
  const result = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .updateOne({ threadId }, update, {
      arrayFilters: [
        { "elem.role": "client", "elem.readAt": { $exists: false } },
      ],
    });
  return result.matchedCount > 0;
}

/** М'яка зміна стану: жодного видалення з бази. */
export async function setThreadStatus(
  threadId: string,
  status: ThreadStatus,
): Promise<boolean> {
  await ensureChatIndexes();
  const result = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .updateOne(
      { threadId },
      { $set: { status, updatedAt: new Date().toISOString() } },
    );
  return result.matchedCount > 0;
}

export async function getUnreadStats(): Promise<{
  threads: number;
  messages: number;
}> {
  await ensureChatIndexes();
  const rows = await (await getDb())
    .collection<ChatThread>(CHAT_THREADS_COLLECTION)
    .aggregate<{ _id: null; threads: number; messages: number }>([
      { $match: { unreadForAdmin: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          threads: { $sum: 1 },
          messages: { $sum: "$unreadForAdmin" },
        },
      },
    ])
    .toArray();
  return {
    threads: rows[0]?.threads ?? 0,
    messages: rows[0]?.messages ?? 0,
  };
}

/** Легасі /api/admin/chat-logs/reply працює з sessionId. Щоб зовнішні
 *  інтеграції не зламалися, створюємо тред із chat_logs на першу відповідь
 *  і далі пишемо в ту саму стрічку, що й адмінка. */
export async function getOrCreateLegacyThread(
  sessionId: string,
): Promise<string | null> {
  const db = await getDb();
  const log = await db.collection("chat_logs").findOne({ sessionId });
  if (!log) return null;

  const deviceId =
    typeof log.deviceId === "string" && log.deviceId ? log.deviceId : sessionId;
  const threadId = legacyThreadId(deviceId);
  const col = db.collection<ChatThread>(CHAT_THREADS_COLLECTION);
  if (await col.findOne({ threadId }, { projection: { _id: 1 } })) {
    return threadId;
  }

  const created = toIso(log.createdAt) ?? new Date().toISOString();
  const messages: ChatMessage[] = (
    Array.isArray(log.messages) ? log.messages : []
  )
    .filter(
      (m: { role?: string }) => m?.role === "user" || m?.role === "operator",
    )
    .map(
      (
        m: {
          role: string;
          content?: unknown;
          adminName?: unknown;
          timestamp?: unknown;
          delivered?: unknown;
        },
        i: number,
      ) => {
        const isOperator = m.role === "operator";
        const msg: ChatMessage = {
          id: `legacy_${i}_${randomUUID()}`,
          role: isOperator ? "operator" : "client",
          content: String(m.content ?? "").slice(0, 2000),
          channel: isOperator ? "admin" : "site",
          createdAt: toIso(m.timestamp) ?? created,
        };
        if (typeof m.adminName === "string") msg.author = m.adminName;
        if (m.delivered === true) msg.deliveredAt = msg.createdAt;
        return msg;
      },
    );

  const now = new Date().toISOString();
  const last = messages[messages.length - 1];
  await ensureChatIndexes();
  await col.updateOne(
    { threadId },
    {
      $setOnInsert: {
        threadId,
        deviceId,
        status: "open",
        unreadForAdmin: 0,
        lastMessageAt: last?.createdAt ?? created,
        lastMessagePreview: last ? preview(last.content) : "",
        createdAt: created,
        updatedAt: now,
        messages,
      },
    },
    { upsert: true },
  );
  return threadId;
}
