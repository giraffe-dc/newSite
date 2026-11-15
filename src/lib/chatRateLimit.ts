/* Мінімальний захист публічних POST-ендпоінтів від спаму і брутфорсу.
   In-memory на процес: на serverless це не гарантія між інстансами, але
   зупиняє найпростіший flood. Для повноцінного ліміту потрібен Redis/БД. */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Універсальний ліміт: `key` — не більше `max` подій за `windowMs`.
 *  Повертає true, якщо запит дозволено. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [id, item] of buckets) {
        if (now >= item.resetAt) buckets.delete(id);
      }
    }
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

const CHAT_WINDOW_MS = 60_000;
const CHAT_MAX_MESSAGES = 8;

export function checkChatRateLimit(key: string): boolean {
  return rateLimit(key, CHAT_MAX_MESSAGES, CHAT_WINDOW_MS);
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
