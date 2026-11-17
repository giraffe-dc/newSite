/* Журнал змін адмінки (ADM-01 «аудит змін»): колекція `audit_log`.

   Кожна мутуюча дія адмін-API (редагування секцій, новин, акцій, контактів)
   записує: хто, що, коли і які поля змінилися. Запис не має ламати основну
   операцію — помилка журналу лише логується в консоль.

   Перегляд: /admin/audit (GET /api/admin/audit, лише role=admin). */

import { getDb } from "@/lib/mongodb";

export interface AuditEntry {
  /** Хто виконав (username з JWT). */
  actor: string;
  /** Дія: create / update / delete / login-подібні. */
  action: "create" | "update" | "delete";
  /** Об'єкт: "section:calculator", "news", "offer", "contacts"… */
  entity: string;
  /** Ідентифікатор об'єкта (id документа або ключ секції). */
  entityId?: string;
  /** Короткий підсумок для списку (заголовок, назва секції). */
  summary?: string;
  /** Змінені поля: ім'я → {from, to} (перші N символів значення). */
  changes?: Record<string, { from?: string; to?: string }>;
  at: Date;
}

/** Максимальна кількість змінених полів у записі (захист від великих diff). */
const MAX_CHANGES = 30;
/** Максимальна довжина значення поля в записі. */
const MAX_VALUE_LEN = 200;

function fmt(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "null";
  if (typeof value === "string") {
    return value.length > MAX_VALUE_LEN
      ? `${value.slice(0, MAX_VALUE_LEN)}…`
      : value;
  }
  try {
    const json = JSON.stringify(value);
    if (json === undefined) return undefined;
    return json.length > MAX_VALUE_LEN
      ? `${json.slice(0, MAX_VALUE_LEN)}…`
      : json;
  } catch {
    return "[unserializable]";
  }
}

/**
 * Порівнює старий і новий стан об'єкта по верхніх ключах і повертає
 * лише ті, що реально змінилися (JSON-різниця).
 */
export function diffFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
): NonNullable<AuditEntry["changes"]> {
  const changes: NonNullable<AuditEntry["changes"]> = {};
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  for (const key of keys) {
    if (Object.keys(changes).length >= MAX_CHANGES) break;
    const from = fmt(before?.[key]);
    const to = fmt(after[key]);
    if (from !== to) {
      changes[key] = { from, to };
    }
  }
  return changes;
}

/** Запис у журнал. Ніколи не кидає виключення (щоб не ламати мутацію). */
export async function recordAudit(
  entry: Omit<AuditEntry, "at">,
): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("audit_log").insertOne({ ...entry, at: new Date() });
  } catch (error) {
    console.error("audit_log: не вдалося записати журнал", error);
  }
}

/** Останні записи журналу (для /api/admin/audit). */
export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const db = await getDb();
  return (await db
    .collection("audit_log")
    .find({})
    .sort({ at: -1 })
    .limit(Math.min(Math.max(limit, 1), 500))
    .toArray()) as unknown as AuditEntry[];
}
