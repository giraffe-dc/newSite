/* Мінімальний захист публічного POST /api/chat/message від спаму.
   In-memory на процес: на serverless це не гарантія між інстансами, але
   зупиняє найпростіший flood. Для повноцінного ліміту потрібен Redis/БД. */

const WINDOW_MS = 60_000;
const MAX_MESSAGES = 8;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkChatRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 2000) {
      for (const [id, item] of buckets) {
        if (now >= item.resetAt) buckets.delete(id);
      }
    }
    return true;
  }

  if (bucket.count >= MAX_MESSAGES) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
