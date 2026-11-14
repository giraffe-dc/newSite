/* Одноразова реєстрація webhook для бота чату (Етап 3b плану
   docs/2026-11-12-chat-admin-telegram-plan.md).

   Використання:
     node --env-file=.env.local scripts/telegram-set-webhook.mjs           # встановити
     node --env-file=.env.local scripts/telegram-set-webhook.mjs --delete  # видалити
     node --env-file=.env.local scripts/telegram-set-webhook.mjs --info    # показати поточний

   Адреса: https://giraffe-teplyk.vercel.app/api/telegram/webhook
   (змінити можна TELEGRAM_WEBHOOK_URL у .env.local, напр. для тунелю
   локальної розробки).

   Важливо: webhook працює лише після деплою коду на Vercel — раніше
   реєструвати нічого (Telegram не дістанеться до localhost). */

import { readFileSync } from "node:fs";

function env(name) {
  const m = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${name}=`));
  return m ? m.slice(name.length + 1).trim() : "";
}

const token = env("TELEGRAM_CHAT_BOT_TOKEN");
const secret = env("TELEGRAM_WEBHOOK_SECRET");
if (!token) {
  console.error("Не знайдено TELEGRAM_CHAT_BOT_TOKEN");
  process.exit(1);
}
if (!secret) {
  console.error(
    "Не знайдено TELEGRAM_WEBHOOK_SECRET — webhook без секрета небезпечний, не реєструємо.",
  );
  process.exit(1);
}

const arg = process.argv[2] ?? "";
const baseUrl =
  env("TELEGRAM_WEBHOOK_URL") || "https://giraffe-teplyk.vercel.app";
const url = `${baseUrl.replace(/\/+$/, "")}/api/telegram/webhook`;

if (arg === "--info") {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  );
  const data = await res.json();
  console.log(JSON.stringify(data.result, null, 2));
  process.exit(data.ok ? 0 : 1);
}

const body =
  arg === "--delete"
    ? {}
    : {
        url,
        secret_token: secret,
        // channel_post — обов'язково: картки йдуть у канал (type:"channel"),
        // де повідомлення приходять не як message.
        allowed_updates: ["message", "channel_post"],
        drop_pending_updates: false,
      };
const method = arg === "--delete" ? "deleteWebhook" : "setWebhook";

const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await res.json();

if (!data.ok) {
  console.error(`Помилка Bot API (${method}):`, data.description);
  process.exit(1);
}

if (method === "setWebhook") {
  console.log(`✅ Webhook встановлено: ${url}`);
  console.log(
    "   secret_token: задано, allowed_updates: [message, channel_post]",
  );
  console.log("   Перевір: node scripts/telegram-set-webhook.mjs --info");
} else {
  console.log("✅ Webhook видалено");
}
