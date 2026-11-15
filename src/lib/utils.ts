export interface TelegramConfig {
  botToken: string;
  chatId: string | string[];
}

/** Екранування тексту для parse_mode:"HTML" (Bot API).
 *  Без нього `<`, `>` або `&` у введеному користувачем тексті ламає
 *  повідомлення цілком (400 від Telegram) — разом із карткою діалогу
 *  чи сповіщенням про заявку. Рядки з нашими тегами (<b>, \n) не чіпаємо:
 *  екранувати треба саме підставні значення. */
export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Telegram обмежує повідомлення 4096 символами: довше → 400, і сповіщення
 *  (заявка, голосування) не приходить узагалі. Ріжемо так, щоб не лишити
 *  незакритий тег і не розрізати екрановану сутність (`&amp;`) посередині —
 *  інакше той самий 400 отримаємо вже від розмітки. */
function truncateForTelegram(message: string): string {
  const MAX = 4096;
  if (message.length <= MAX) return message;

  // Збалансованість тегів + цілісність хвоста (`<b` без `>`, `&am` без `;`).
  const isSafeCut = (s: string): boolean => {
    if (/<[^>]*$/.test(s)) return false; // незавершений тег наприкінці
    if (/&[a-zA-Z#0-9]*$/.test(s)) return false; // незавершена сутність
    const stack: string[] = [];
    for (const m of s.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)>/g)) {
      const tag = m[2].toLowerCase();
      if (m[1] === "/") {
        const idx = stack.lastIndexOf(tag);
        if (idx === -1) return false; // зайве закриття
        stack.splice(idx, 1);
      } else {
        stack.push(tag);
      }
    }
    return stack.length === 0; // усі відкриті теги закриті
  };

  for (let i = MAX; i > MAX - 1000 && i > 0; i--) {
    const slice = message.slice(0, i);
    if (isSafeCut(slice)) {
      if (i < MAX) {
        console.warn(
          `Telegram: повідомлення ${message.length} символів обрізано до ${i}`,
        );
      }
      return slice;
    }
  }
  console.warn(
    `Telegram: не вдалося підібрати межу обрізки для ${message.length} символів`,
  );
  return message.slice(0, MAX);
}

export async function sendTelegramMessage(
  message: string,
  config?: Partial<TelegramConfig>,
) {
  const botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const provided = config?.chatId;
  const envList = (process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single1 = process.env.TELEGRAM_CHAT_ID;
  const single2 = process.env.TELEGRAM_CHAT_ID_2;
  const single3 = process.env.TELEGRAM_CHAT_ID_3;

  const chatIds: string[] = Array.isArray(provided)
    ? provided
    : [
        ...(provided ? [String(provided)] : []),
        ...envList,
        ...(single1 ? [single1] : []),
        ...(single2 ? [single2] : []),
        ...(single3 ? [single3] : []),
      ];

  if (!botToken || chatIds.length === 0) {
    console.warn(
      "Telegram not configured: missing TELEGRAM_BOT_TOKEN or chat ids (TELEGRAM_CHAT_ID(S))",
    );
    return { ok: false, skipped: true };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const safeText = truncateForTelegram(message);
  let allOk = true;
  for (const id of [...new Set(chatIds)]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: safeText,
          parse_mode: "HTML",
        }),
      });
      // console.log('Telegram response:', res)
      if (!res.ok) {
        allOk = false;
        const text = await res.text();
        console.error("Telegram error:", id, res.status, text);
      }
    } catch (err) {
      allOk = false;
      console.error("Telegram fetch error:", id, err);
    }
  }
  return { ok: allOk };
}

export async function sendTelegramMessageSurvey(
  message: string,
  config?: Partial<TelegramConfig>,
) {
  const botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN_SURVEY;
  const provided = config?.chatId;
  const envList = (process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single1 = process.env.TELEGRAM_CHAT_ID;
  const single2 = process.env.TELEGRAM_CHAT_ID_2;

  const chatIds: string[] = Array.isArray(provided)
    ? provided
    : [
        ...(provided ? [String(provided)] : []),
        ...envList,
        ...(single1 ? [single1] : []),
        ...(single2 ? [single2] : []),
      ];

  if (!botToken || chatIds.length === 0) {
    console.warn(
      "Telegram not configured: missing TELEGRAM_BOT_TOKEN or chat ids (TELEGRAM_CHAT_ID(S))",
    );
    return { ok: false, skipped: true };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const safeText = truncateForTelegram(message);
  let allOk = true;
  for (const id of [...new Set(chatIds)]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: safeText,
          parse_mode: "HTML",
        }),
      });
      console.log("Telegram response:", res);
      if (!res.ok) {
        allOk = false;
        const text = await res.text();
        console.error("Telegram error:", id, res.status, text);
      }
    } catch (err) {
      allOk = false;
      console.error("Telegram fetch error:", id, err);
    }
  }
  return { ok: allOk };
}

import { type ClassValue, clsx } from "clsx";
// import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
