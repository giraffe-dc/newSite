/* Допоміжний скрипт: показати ID чатів, з якими взаємодіяв бот.

   Використання:
     node scripts/telegram-chat-id.mjs

   1. Переконайся, що бот доданий у канал/групу (у приватному каналі —
      зроби його адміністратором).
   2. Напиши в каналі будь-яке повідомлення.
   3. Запусти скрипт — він надрукує chat.id, який треба вписати
      в .env.local як TELEGRAM_CHAT_CHAT_ID.

   Працює з тим самим ботом, що й чат-картки (TELEGRAM_CHAT_BOT_TOKEN);
   якщо його немає — бере TELEGRAM_BOT_TOKEN. */

import { readFileSync } from "node:fs";

function env(name) {
  const m = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${name}=`));
  return m ? m.slice(name.length + 1).trim() : "";
}

const token = env("TELEGRAM_CHAT_BOT_TOKEN") || env("TELEGRAM_BOT_TOKEN");
if (!token) {
  console.error("Не знайдено TELEGRAM_CHAT_BOT_TOKEN / TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();

if (!data.ok) {
  console.error("Помилка Bot API:", data.description);
  process.exit(1);
}

const updates = data.result ?? [];
if (updates.length === 0) {
  console.log(
    "Оновлень немає. Напиши повідомлення в каналі/групі й запусти скрипт ще раз.",
  );
  console.log(
    "(Якщо бот у приватному каналі — він має бути адміністратором, інакше повідомлення не потрапить у getUpdates.)",
  );
  process.exit(0);
}

const seen = new Set();
for (const u of updates) {
  const chat = u.message?.chat ?? u.channel_post?.chat;
  if (!chat?.id || seen.has(chat.id)) continue;
  seen.add(chat.id);
  console.log(`chat.id = ${chat.id}`);
  console.log(`  тип   : ${chat.type}`);
  console.log(`  назва : ${chat.title || chat.username || chat.first_name || "—"}`);
  console.log(`  приклад: ${chat.id < 0 ? "-100" + String(chat.id).slice(4) : chat.id}`);
  console.log("");
}
console.log("Впиши потрібний chat.id у .env.local → TELEGRAM_CHAT_CHAT_ID");
