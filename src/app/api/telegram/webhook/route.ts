import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  appendOperatorMessage,
  findThreadByShortId,
  findThreadByTelegramMessageId,
  findThreadByTelegramUpdateId,
  normalizeText,
  setMessageTelegramId,
  setThreadStatus,
} from "@/lib/chatThreads";
import { sendChatBotMessage } from "@/lib/chatTelegram";

/* Етап 3b плану docs/2026-11-12-chat-admin-telegram-plan.md:
   вхідні оновлення Bot API окремого бота чату.

   Принцип «відповідь на повідомлення»: адмін у Telegram відповідає на картку
   діалогу → update.message.reply_to_message.message_id → тред шукається за
   messages.telegramMessageId (індекс є) → операторське повідомлення пишеться
   в chat_threads каналом "telegram" → клієнт підхоплює через /api/chat/poll.

   Обов'язкові перевірки (розділ «Вхідний webhook» плану):
   1. X-Telegram-Bot-Api-Secret-Token === TELEGRAM_WEBHOOK_SECRET, інакше 401.
   2. Allowlist: from.id у TELEGRAM_ADMIN_IDS або chat.id групи карток
      (TELEGRAM_CHAT_CHAT_ID). Ігноруємо мовчки (200), щоб Telegram не ретраїв.
      Картки йдуть у канал (type:"channel") — там пости приходять як channel_post,
      тому читаємо і message, і channel_post.
   3. Ігноруємо edited_message, повідомлення від ботів, без тексту.
   4. Ідемпотентність: update_id зберігається в повідомленні, повтор — без дубля.
   5. Обмеження 2000 символів (адмінський reply теж), відповіді — без parse_mode
      (наші тексти не містять розмітки, екранування не потрібне).
   6. Команди: /start, /help, /reply <shortId> <текст>, /close <shortId>. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TgUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

interface TgMessage {
  message_id: number;
  text?: string;
  from?: TgUser;
  chat: { id: number; type: string };
  reply_to_message?: TgMessage;
}

interface TgUpdate {
  update_id: number;
  /** Приватний чат / група. */
  message?: TgMessage;
  /** Канал (TELEGRAM_CHAT_CHAT_ID має type:"channel") — там пости це channel_post. */
  channel_post?: TgMessage;
  edited_message?: TgMessage;
  edited_channel_post?: TgMessage;
}

const HELP = [
  "Чат сайту «Жирафик»:",
  "/reply <id> <текст> — відповісти клієнту",
  "/close <id> — закрити діалог",
  "/help — це повідомлення",
  "",
  "Або просто відповідь на картку діалогу.",
].join("\n");

/** constant-time порівняння секрета (захист від timing-атак). */
function secretMatches(provided: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function adminIds(): number[] {
  return String(process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

/** Дозволені відправники: адмін (TELEGRAM_ADMIN_IDS) або група карток.
 *  /start від невідомого відповідає власним ID — єдиний спосіб дізнатися
 *  свій numeric ID для подальшого внесення в allowlist. */
function isAllowed(msg: TgMessage): boolean {
  const fromId = msg.from?.id;
  if (fromId && adminIds().includes(fromId)) return true;
  const group = Number.parseInt(process.env.TELEGRAM_CHAT_CHAT_ID ?? "", 10);
  return Number.isFinite(group) && msg.chat.id === group;
}

function authorOf(from?: TgUser): string {
  const name = [from?.first_name, from?.username ? `@${from.username}` : ""]
    .filter(Boolean)
    .join(" ");
  return name || "Оператор";
}

function shortIdOf(threadId: string): string {
  return threadId.slice(0, 8);
}

type HandleResult = { status: number; body: Record<string, unknown> };

async function handleCommand(
  update: TgUpdate,
  msg: TgMessage,
  cmd: string,
  rest: string,
): Promise<HandleResult> {
  const chatId = msg.chat.id;
  const replyTo = msg.message_id;

  if (cmd === "start" || cmd === "help") {
    if (!isAllowed(msg) && cmd === "start") {
      // Bootstrap: невідомому відповідаємо його ж ID (без інших даних).
      await sendChatBotMessage(
        chatId,
        `Твій numeric ID у Telegram: ${msg.from?.id ?? "?"}. Впиши його в TELEGRAM_ADMIN_IDS (через кому).`,
        replyTo,
      );
      return { status: 200, body: { ok: true, action: "bootstrap" } };
    }
    await sendChatBotMessage(chatId, HELP, replyTo);
    return { status: 200, body: { ok: true, action: "help" } };
  }

  if (cmd === "reply") {
    const match = rest.match(/^(\S+)\s+([\s\S]+)$/);
    if (!match) {
      await sendChatBotMessage(
        chatId,
        "Формат: /reply <id> <текст>. Із картки діалогу — наприклад /reply da4b4e09 Привіт!",
        replyTo,
      );
      return { status: 200, body: { ok: true, action: "usage" } };
    }
    const thread = await findThreadByShortId(match[1]);
    if (!thread) {
      await sendChatBotMessage(
        chatId,
        `Діалог #${match[1]} не знайдено.`,
        replyTo,
      );
      return { status: 200, body: { ok: true, action: "not-found" } };
    }
    return appendAndConfirm(update, msg, thread.threadId, match[2]);
  }

  if (cmd === "close") {
    const shortId = rest.trim();
    const thread = await findThreadByShortId(shortId);
    if (!thread) {
      await sendChatBotMessage(
        chatId,
        `Діалог #${shortId} не знайдено.`,
        replyTo,
      );
      return { status: 200, body: { ok: true, action: "not-found" } };
    }
    await setThreadStatus(thread.threadId, "closed");
    await sendChatBotMessage(
      chatId,
      `🔒 Діалог #${shortIdOf(thread.threadId)} закрито.`,
      replyTo,
    );
    return { status: 200, body: { ok: true, action: "closed" } };
  }

  await sendChatBotMessage(chatId, `Невідома команда. /help`, replyTo);
  return { status: 200, body: { ok: true, action: "unknown-command" } };
}

/** Спільний шлях для «Відповісти» на картку і /reply: запис у БД, потім
 *  підтвердження в Telegram. Підтвердження прив'язується до повідомлення
 *  оператора — наступна відповідь на нього теж знайде тред. */
async function appendAndConfirm(
  update: TgUpdate,
  msg: TgMessage,
  threadId: string,
  rawText: string,
): Promise<HandleResult> {
  const text = normalizeText(rawText, 2000);
  if (!text) {
    await sendChatBotMessage(
      msg.chat.id,
      "Повідомлення порожнє.",
      msg.message_id,
    );
    return { status: 200, body: { ok: true, action: "empty" } };
  }

  const saved = await appendOperatorMessage({
    threadId,
    text,
    channel: "telegram",
    author: authorOf(msg.from),
    telegramUpdateId: update.update_id,
  });
  if (!saved) {
    await sendChatBotMessage(
      msg.chat.id,
      `Діалог #${shortIdOf(threadId)} не знайдено.`,
      msg.message_id,
    );
    return { status: 200, body: { ok: true, action: "not-found" } };
  }

  const confirmId = await sendChatBotMessage(
    msg.chat.id,
    `✅ Відповідь надіслана клієнту (#${shortIdOf(threadId)}).`,
    msg.message_id,
  );
  if (confirmId != null) {
    await setMessageTelegramId(threadId, saved.id, confirmId).catch(
      (error) => {
        console.error("telegram/webhook: не прив'язано підтвердження", error);
      },
    );
  }
  return { status: 200, body: { ok: true, action: "replied", threadId } };
}

async function handleMessage(update: TgUpdate, msg: TgMessage): Promise<HandleResult> {
  const text = (msg.text ?? "").trim();
  if (!text) {
    return { status: 200, body: { ok: true, action: "no-text" } };
  }
  if (msg.from?.is_bot) {
    return { status: 200, body: { ok: true, action: "bot" } };
  }

  const command = text.match(/^\/([A-Za-z0-9_]+)(?:@\w+)?(?:\s+([\s\S]+))?$/);
  if (command) {
    // Команди поза allowlist обробляємо тільки bootstrap-/start (див. isAllowed).
    if (!isAllowed(msg) && !/^start$/i.test(command[1])) {
      return { status: 200, body: { ok: true, action: "ignored" } };
    }
    // Ідемпотентність і для /reply: Telegram ретраїть при не-200.
    if (!/^start$/i.test(command[1])) {
      const seen = await findThreadByTelegramUpdateId(update.update_id);
      if (seen) {
        return { status: 200, body: { ok: true, action: "duplicate" } };
      }
    }
    return handleCommand(
      update,
      msg,
      command[1].toLowerCase(),
      command[2] ?? "",
    );
  }

  if (!isAllowed(msg)) {
    return { status: 200, body: { ok: true, action: "ignored" } };
  }

  const seen = await findThreadByTelegramUpdateId(update.update_id);
  if (seen) {
    return { status: 200, body: { ok: true, action: "duplicate" } };
  }

  const replyTo = msg.reply_to_message;
  if (replyTo) {
    const thread = await findThreadByTelegramMessageId(replyTo.message_id);
    if (!thread) {
      await sendChatBotMessage(
        msg.chat.id,
        "Не вдалося знайти діалог для цієї відповіді. Використай /reply <id> <текст> — id є в картці.",
        msg.message_id,
      );
      return { status: 200, body: { ok: true, action: "no-thread" } };
    }
    return appendAndConfirm(update, msg, thread.threadId, text);
  }

  await sendChatBotMessage(
    msg.chat.id,
    "Це повідомлення не є відповіддю на картку діалогу. Відповідай на картку або використовуй /reply <id> <текст>. /help — довідка.",
    msg.message_id,
  );
  return { status: 200, body: { ok: true, action: "hint" } };
}

export async function POST(req: NextRequest) {
  if (!secretMatches(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update || typeof update.update_id !== "number") {
    return NextResponse.json({ ok: true, action: "invalid" });
  }
  if (update.edited_message || update.edited_channel_post) {
    return NextResponse.json({ ok: true, action: "edited" });
  }

  const msg = update.message ?? update.channel_post;
  if (!msg || typeof msg.chat?.id !== "number") {
    return NextResponse.json({ ok: true, action: "ignored" });
  }

  try {
    const result = await handleMessage(update, msg);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    // 500 → Telegram ретраїть; ідемпотентність за update_id не дасть дубля.
    console.error("telegram/webhook: помилка обробки", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
