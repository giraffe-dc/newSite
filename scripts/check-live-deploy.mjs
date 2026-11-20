/* Перевірка живих деплоїв (без записів у БД і без Telegram-повідомлень). */
const SITE = "https://giraffe-teplyk.vercel.app";
const PWA = "https://giraffe-mobile.vercel.app";
const ORIGIN = PWA;

async function probe(name, url, options = {}) {
  try {
    const res = await fetch(url, { ...options, redirect: "manual" });
    const acao = res.headers.get("access-control-allow-origin");
    const cached = res.headers.get("x-vercel-cache");
    const body = await res.text();
    console.log(
      `${res.status} ${name} | acao=${acao ?? "-"} | cache=${cached ?? "-"} | len=${body.length}`,
    );
    if (res.status >= 400) console.log(`   body: ${body.slice(0, 160)}`);
  } catch (e) {
    console.log(`ERR  ${name}: ${e.message}`);
  }
}

await probe("site /api/mobile/version", `${SITE}/api/mobile/version`);
await probe("site /api/mobile/busy-dates", `${SITE}/api/mobile/busy-dates`);
await probe(
  "site request-code (невалідний телефон → 400, ендпоінт існує)",
  `${SITE}/api/mobile/auth/request-code`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ phone: "12345" }),
  },
);
await probe("site /api/mobile/orders без токена → 401", `${SITE}/api/mobile/orders`);
await probe(
  "site chat/history CORS",
  `${SITE}/api/chat/history?threadId=m_probe_0000000000_live`,
  { headers: { Origin: ORIGIN } },
);
await probe("site survey results options", `${SITE}/api/survey/results`, {
  method: "OPTIONS",
  headers: { Origin: ORIGIN, "Access-Control-Request-Method": "GET" },
});
await probe("PWA /", `${PWA}/`);
await probe("PWA /chat", `${PWA}/chat`);
await probe("PWA /cabinet", `${PWA}/cabinet`);
