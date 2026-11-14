/* Етап 3а плану docs/2026-11-12-chat-admin-telegram-plan.md:
   вихідна картка нового діалогу в чаті сайту.

   Окремий бот і група (рішення від 14.11.2026), щоб діалоги не змішувалися
   зі сповіщеннями про заявки. Якщо токен/чат не задані — тихо пропускаємо.

   Повертаємо message_id і зберігаємо його в повідомленні клієнта: у Етапі 3b
   за ним webhook знайде тред при «Відповісти» в Telegram.

   Текст обов'язково екранується (escapeTelegramHtml): у картку потрапляє
   введене користувачем повідомлення, а parse_mode:"HTML" без екранування
   ламає повідомлення цілком. */

import { escapeTelegramHtml } from "@/lib/utils";

/** Окремий бот «Чати сайту». Якщо не задані — картки не надсилаємо.
 *  Без fallback на TELEGRAM_CHAT_ID: діалоги не мають змішуватися зі
 *  сповіщеннями про заявки (рішення від 14.11.2026). */
function chatConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_CHAT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

export interface ChatCardInput {
  threadId: string;
  text: string;
  clientName?: string;
  clientPhone?: string;
  deviceId: string;
}

/** Надіслати картку діалогу й повернути message_id (для reply-to в 3b). */
export async function sendChatThreadCard(
  input: ChatCardInput,
): Promise<number | null> {
  const cfg = chatConfig();
  if (!cfg) {
    console.warn(
      "chatTelegram: TELEGRAM_CHAT_BOT_TOKEN / TELEGRAM_CHAT_CHAT_ID не задані — картку не надіслано",
    );
    return null;
  }

  const e = escapeTelegramHtml;
  const shortId = input.threadId.slice(0, 8);
  const who =
    input.clientName ||
    input.clientPhone ||
    `пристрій ${input.deviceId.slice(0, 16)}`;
  const time = new Date().toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = [
    "<b>💬 Нове повідомлення в чаті сайту</b>",
    `<b>#${e(shortId)}</b> · ${e(who)} · ${e(time)}`,
    "",
    e(input.text),
    "",
    "<i>Відповісти на це повідомлення, щоб написати клієнту.</i>",
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text: message.slice(0, 4096),
          parse_mode: "HTML",
        }),
      },
    );
    if (!res.ok) {
      console.error("chatTelegram: Bot API", res.status, await res.text());
      return null;
    }
    const data = (await res.json().catch(() => null)) as {
      result?: { message_id?: number };
    } | null;
    return data?.result?.message_id ?? null;
  } catch (error) {
    console.error("chatTelegram: не вдалося надіслати картку", error);
    return null;
  }
}
