import { createHash, timingSafeEqual } from "node:crypto";

/* Порівняння секретів без таймінг-вразливості.
   timingSafeEqual вимагає буфери однакової довжини, тому обидва
   значення спочатку хешуються sha256 (фіксована довжина 32 байти). */
export function safeEquals(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/** API-ключ зовнішньої інтеграції.
 *  Пріоритет: `Authorization: Bearer <key>` → `X-Api-Key` → `?key=` (застаріле).
 *  Query-рядок залишено для сумісності зі зовнішнім сервісом сповіщень,
 *  але ключ у URL потрапляє в логи проксі/Referer — використовувати заголовок. */
export function apiKeyFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const value = auth.slice(7).trim();
    if (value) return value;
  }

  const headerKey = req.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const queryKey = new URL(req.url).searchParams.get("key");
  if (queryKey) {
    console.warn(
      "API-ключ отримано в query-рядку (?key=) — застаріло, переходьте на Authorization: Bearer",
    );
  }
  return queryKey;
}

/** Безпечна перевірка ключа: і порожній expected, і порожній provided → false
 *  (fail-closed, як і раніше: без заданого NOTIFICATIONS_API_KEY доступу немає). */
export function isValidApiKey(
  provided: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || !provided) return false;
  return safeEquals(provided, expected);
}
